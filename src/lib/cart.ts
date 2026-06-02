"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getOrCreateSessionId, getSessionId } from "./session";
import { getCartLimits, effectivePerItemMax } from "./limits";

async function loadCart(sid: string) {
  return prisma.cart.findUnique({
    where: { sessionId: sid },
    include: { items: { include: { product: true } } },
  });
}

export async function getCart() {
  const sid = await getSessionId();
  if (!sid) return null;
  return loadCart(sid);
}

async function ensureCart() {
  const sid = await getOrCreateSessionId();
  const existing = await loadCart(sid);
  if (existing) return existing;
  return prisma.cart.create({
    data: { sessionId: sid },
    include: { items: { include: { product: true } } },
  });
}

export async function addToCart(formData: FormData) {
  const productId = String(formData.get("productId"));
  const qty = Math.max(1, Number(formData.get("quantity") ?? 1));
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.available || product.archivedAt) {
    throw new Error("That product isn't available.");
  }
  const limits = await getCartLimits();
  const cap = effectivePerItemMax(limits.maxQtyPerLineItem, product.maxQtyPerOrder);

  const cart = await ensureCart();
  const existing = cart.items.find((i) => i.productId === productId);
  const newQty = Math.min(cap, (existing?.quantity ?? 0) + qty);

  // Distinct-item cap.
  if (!existing && cart.items.length >= limits.maxDistinctItemsPerOrder) {
    throw new Error(
      `That's already ${limits.maxDistinctItemsPerOrder} different things — leave a bit for somebody else!`,
    );
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity: newQty },
    update: { quantity: newQty },
  });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  redirect("/cart");
}

export async function setQuantity(formData: FormData) {
  const productId = String(formData.get("productId"));
  const qty = Math.max(0, Number(formData.get("quantity") ?? 0));
  const sid = await getSessionId();
  if (!sid) return;
  const cart = await loadCart(sid);
  if (!cart) return;
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return;

  if (qty === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    const limits = await getCartLimits();
    const cap = effectivePerItemMax(
      limits.maxQtyPerLineItem,
      item.product.maxQtyPerOrder,
    );
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(cap, qty) },
    });
  }
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeFromCart(formData: FormData) {
  const productId = String(formData.get("productId"));
  const sid = await getSessionId();
  if (!sid) return;
  const cart = await loadCart(sid);
  if (!cart) return;
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function clearCart() {
  const sid = await getSessionId();
  if (!sid) return;
  const cart = await loadCart(sid);
  if (!cart) return;
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}
