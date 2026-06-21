"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "./db";
import { slugify } from "./slug";
import { putObject } from "./storage";
import { makeToken } from "./tokens";
import { requireAdmin, requireRole } from "./auth";
import { logActivity } from "./activity";

const MAX_PREVIEW_STL = 4 * 1024 * 1024; // 4 MB
const MAX_PROD_STL = 80 * 1024 * 1024; // 80 MB
const MAX_IMAGE = 4 * 1024 * 1024;

const baseFields = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(8000).default(""),
  priceCents: z.coerce.number().int().min(0).max(100_000_00),
  categoryId: z.string().min(1),
  available: z.coerce.boolean().default(false),
  maxQtyPerOrder: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().min(1).max(100).nullable(),
  ),
});

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = slugify(base);
  let i = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === exceptId) return slug;
    slug = `${slugify(base)}-${i++}`;
  }
}

async function uploadIfPresent(
  file: FormDataEntryValue | null,
  visibility: "public" | "private",
  maxBytes: number,
  ext: string,
): Promise<{ key: string; url?: string } | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > maxBytes) {
    throw new Error(
      `File ${file.name} is too big (${(file.size / 1024 / 1024).toFixed(1)} MB; max ${(maxBytes / 1024 / 1024).toFixed(0)} MB).`,
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const key = `${visibility === "public" ? "products" : "products-prod"}/${makeToken(12)}.${ext}`;
  return putObject(key, buf, file.type || "application/octet-stream", visibility);
}

export async function createProduct(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");

  const parsed = baseFields.parse(Object.fromEntries(formData));

  const preview = await uploadIfPresent(
    formData.get("previewStl"),
    "public",
    MAX_PREVIEW_STL,
    "stl",
  );
  const production = await uploadIfPresent(
    formData.get("productionStl"),
    "private",
    MAX_PROD_STL,
    "stl",
  );

  const slug = await uniqueSlug(parsed.title);
  const product = await prisma.product.create({
    data: {
      slug,
      title: parsed.title,
      description: parsed.description,
      priceCents: parsed.priceCents,
      categoryId: parsed.categoryId,
      available: parsed.available,
      maxQtyPerOrder: parsed.maxQtyPerOrder,
      previewStlUrl: preview?.url ?? null,
      productionStlKey: production?.key ?? null,
    },
  });

  const images = formData.getAll("images");
  for (const [i, file] of images.entries()) {
    const uploaded = await uploadIfPresent(file, "public", MAX_IMAGE, "img");
    if (uploaded?.url) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: uploaded.url,
          alt: parsed.title,
          sortOrder: i,
        },
      });
    }
  }

  await logActivity({
    actorId: me.id,
    actorName: me.username,
    action: "product.create",
    summary: `${me.username} created product "${product.title}"`,
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");

  const id = String(formData.get("id"));
  const parsed = baseFields.parse(Object.fromEntries(formData));
  const slug = await uniqueSlug(parsed.title, id);

  const preview = await uploadIfPresent(
    formData.get("previewStl"),
    "public",
    MAX_PREVIEW_STL,
    "stl",
  );
  const production = await uploadIfPresent(
    formData.get("productionStl"),
    "private",
    MAX_PROD_STL,
    "stl",
  );

  await prisma.product.update({
    where: { id },
    data: {
      title: parsed.title,
      slug,
      description: parsed.description,
      priceCents: parsed.priceCents,
      categoryId: parsed.categoryId,
      available: parsed.available,
      maxQtyPerOrder: parsed.maxQtyPerOrder,
      previewStlUrl: preview?.url ?? undefined,
      productionStlKey: production?.key ?? undefined,
    },
  });

  const images = formData.getAll("images");
  for (const file of images) {
    const uploaded = await uploadIfPresent(file, "public", MAX_IMAGE, "img");
    if (uploaded?.url) {
      const last = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { sortOrder: "desc" },
      });
      await prisma.productImage.create({
        data: {
          productId: id,
          url: uploaded.url,
          alt: parsed.title,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
      });
    }
  }

  await logActivity({
    actorId: me.id,
    actorName: me.username,
    action: "product.update",
    summary: `${me.username} updated product "${parsed.title}"`,
  });

  revalidatePath("/admin/products");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/");
}

export async function archiveProduct(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  const product = await prisma.product.update({
    where: { id },
    data: { archivedAt: new Date(), available: false },
  });
  await logActivity({
    actorId: me.id,
    actorName: me.username,
    action: "product.archive",
    summary: `${me.username} archived product "${product.title}"`,
  });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function unarchiveProduct(formData: FormData) {
  if (!(await requireAdmin())) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  await prisma.product.update({
    where: { id },
    data: { archivedAt: null },
  });
  revalidatePath("/admin/products");
}

// Hard delete. Admin-only, and blocked when the product appears on past orders
// (those keep a title/price snapshot but still FK-reference the product).
export async function deleteProduct(formData: FormData) {
  const me = await requireRole("admin");
  if (!me) throw new Error("Only admins can delete products.");
  const id = String(formData.get("id"));

  const orderRefs = await prisma.orderItem.count({ where: { productId: id } });
  if (orderRefs > 0) {
    throw new Error(
      "This product is on past orders, so it can't be deleted. Archive it instead.",
    );
  }
  const product = await prisma.product.findUnique({ where: { id } });
  // Images + options cascade on delete; cart lines do not, so clear them first.
  await prisma.cartItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });

  await logActivity({
    actorId: me.id,
    actorName: me.username,
    action: "product.delete",
    summary: `${me.username} deleted product "${product?.title ?? id}"`,
  });
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProductImage(formData: FormData) {
  if (!(await requireAdmin())) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  await prisma.productImage.delete({ where: { id } });
  revalidatePath("/admin/products");
}

const optionSchema = z.object({
  productId: z.string().min(1),
  label: z.string().min(1).max(60),
  slots: z.coerce.number().int().min(1).max(20),
  required: z.coerce.boolean().default(false),
});

export async function addProductOption(formData: FormData) {
  if (!(await requireAdmin())) throw new Error("Not authorized");
  const parsed = optionSchema.parse(Object.fromEntries(formData));
  // Multi-value field: which palette colours are allowed (empty = all).
  const allowedColorIds = formData
    .getAll("allowedColorIds")
    .map(String)
    .filter(Boolean);
  const last = await prisma.productOption.findFirst({
    where: { productId: parsed.productId },
    orderBy: { sortOrder: "desc" },
  });
  await prisma.productOption.create({
    data: {
      productId: parsed.productId,
      label: parsed.label,
      slots: parsed.slots,
      required: parsed.required,
      type: "color",
      sortOrder: (last?.sortOrder ?? -1) + 1,
      allowedColors: { connect: allowedColorIds.map((id) => ({ id })) },
    },
  });
  const product = await prisma.product.findUnique({
    where: { id: parsed.productId },
  });
  revalidatePath(`/admin/products/${parsed.productId}`);
  if (product) revalidatePath(`/product/${product.slug}`);
}

// Replace an option's allowed-colours set (empty = all available colours).
export async function setOptionColors(formData: FormData) {
  if (!(await requireAdmin())) throw new Error("Not authorized");
  const optionId = String(formData.get("optionId"));
  const allowedColorIds = formData
    .getAll("allowedColorIds")
    .map(String)
    .filter(Boolean);
  const option = await prisma.productOption.update({
    where: { id: optionId },
    data: { allowedColors: { set: allowedColorIds.map((id) => ({ id })) } },
  });
  const product = await prisma.product.findUnique({
    where: { id: option.productId },
  });
  revalidatePath(`/admin/products/${option.productId}`);
  if (product) revalidatePath(`/product/${product.slug}`);
}

export async function deleteProductOption(formData: FormData) {
  if (!(await requireAdmin())) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  const option = await prisma.productOption.delete({ where: { id } });
  const product = await prisma.product.findUnique({
    where: { id: option.productId },
  });
  revalidatePath(`/admin/products/${option.productId}`);
  if (product) revalidatePath(`/product/${product.slug}`);
}
