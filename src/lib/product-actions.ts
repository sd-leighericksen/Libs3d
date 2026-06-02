"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "./db";
import { slugify } from "./slug";
import { putObject } from "./storage";
import { makeToken } from "./tokens";
import { requireAdmin } from "./auth";

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
  if (!(await requireAdmin())) throw new Error("Not authorized");

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

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(formData: FormData) {
  if (!(await requireAdmin())) throw new Error("Not authorized");

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

  revalidatePath("/admin/products");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/");
}

export async function archiveProduct(formData: FormData) {
  if (!(await requireAdmin())) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  await prisma.product.update({
    where: { id },
    data: { archivedAt: new Date(), available: false },
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

export async function deleteProductImage(formData: FormData) {
  if (!(await requireAdmin())) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  await prisma.productImage.delete({ where: { id } });
  revalidatePath("/admin/products");
}
