import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  updateProduct,
  archiveProduct,
  unarchiveProduct,
  deleteProductImage,
} from "@/lib/product-actions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({
      where: { archivedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="stack-section">
      <section>
        <div className="eyebrow mb-md">Editing</div>
        <h1 className="text-display-lg">{product.title}</h1>
      </section>
      <ProductForm
        action={updateProduct}
        categories={categories}
        product={product}
        archiveAction={archiveProduct}
        unarchiveAction={unarchiveProduct}
        deleteImageAction={deleteProductImage}
      />
    </div>
  );
}
