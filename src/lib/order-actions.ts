"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getSessionId } from "./session";
import { getCartLimits, effectivePerItemMax } from "./limits";
import { getSettings } from "./settings";
import { makeToken } from "./tokens";
import { sendEmail } from "./email";
import { adminNewOrder, parentOrderReceived } from "./emails/templates";

const checkoutSchema = z.object({
  buyerFirstName: z.string().min(1).max(40),
  parentFirstName: z.string().min(1).max(60),
  parentEmail: z.string().email().max(120),
  deliveryMethod: z.enum(["collect", "deliver"]),
  deliveryAddress: z.string().max(400).optional().or(z.literal("")),
  note: z.string().max(800).optional().or(z.literal("")),
});

export async function submitCheckout(formData: FormData) {
  const sid = await getSessionId();
  if (!sid) throw new Error("Your cart's gone — head back to the shop.");
  const cart = await prisma.cart.findUnique({
    where: { sessionId: sid },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const parsed = checkoutSchema.parse(Object.fromEntries(formData));
  if (parsed.deliveryMethod === "deliver" && !parsed.deliveryAddress) {
    throw new Error("Pop in a delivery address, please.");
  }

  const limits = await getCartLimits();
  const settings = await getSettings();

  // Server-side re-validation of every limit. Never trust the cart.
  if (cart.items.length > limits.maxDistinctItemsPerOrder) {
    throw new Error("Too many different things in the cart.");
  }
  for (const item of cart.items) {
    if (!item.product.available || item.product.archivedAt) {
      throw new Error(`Sorry — "${item.product.title}" isn't available anymore.`);
    }
    const cap = effectivePerItemMax(
      limits.maxQtyPerLineItem,
      item.product.maxQtyPerOrder,
    );
    if (item.quantity < 1 || item.quantity > cap) {
      throw new Error(`Quantity for "${item.product.title}" is out of range.`);
    }
  }

  // Pricing is server-side, in cents.
  const items = cart.items.map((i) => ({
    productId: i.productId,
    titleSnapshot: i.product.title,
    unitPriceCents: i.product.priceCents,
    quantity: i.quantity,
  }));
  const totalCents = items.reduce(
    (s, i) => s + i.unitPriceCents * i.quantity,
    0,
  );

  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const o = await tx.order.create({
      data: {
        token: makeToken(),
        paymentToken: makeToken(),
        state: "pending_review",
        buyerFirstName: parsed.buyerFirstName,
        parentFirstName: parsed.parentFirstName,
        parentEmail: parsed.parentEmail,
        deliveryMethod: parsed.deliveryMethod,
        deliveryAddress: parsed.deliveryAddress || null,
        note: parsed.note || null,
        totalCents,
        items: { create: items },
        events: {
          create: { toState: "pending_review" },
        },
      },
      include: { items: true },
    });
    // Clear the cart.
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return o;
  });

  // Fire emails. Use settled so a single send failure doesn't break the flow.
  const storeName = settings.storeName;
  await Promise.allSettled([
    sendEmail({ to: order.parentEmail, ...parentOrderReceived(order, storeName) }),
    sendEmail({
      to: settings.storeContactEmail,
      ...adminNewOrder(order, storeName),
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/cart");
  redirect(`/order/${order.token}`);
}
