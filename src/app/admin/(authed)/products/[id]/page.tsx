import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  updateProduct,
  archiveProduct,
  unarchiveProduct,
  deleteProductImage,
  addProductOption,
  deleteProductOption,
  setOptionColors,
  deleteProduct,
} from "@/lib/product-actions";
import { requireRole } from "@/lib/auth";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, palette] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        options: {
          orderBy: { sortOrder: "asc" },
          include: { allowedColors: true },
        },
      },
    }),
    prisma.category.findMany({
      where: { archivedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.colorOption.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  if (!product) notFound();

  const isAdmin = (await requireRole("admin")) !== null;

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
        options={product.options}
        palette={palette}
        archiveAction={archiveProduct}
        unarchiveAction={unarchiveProduct}
        deleteImageAction={deleteProductImage}
        addOptionAction={addProductOption}
        deleteOptionAction={deleteProductOption}
        setOptionColorsAction={setOptionColors}
        deleteAction={isAdmin ? deleteProduct : undefined}
      />
    </div>
  );
}
