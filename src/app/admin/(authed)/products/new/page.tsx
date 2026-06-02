import { prisma } from "@/lib/db";
import { createProduct } from "@/lib/product-actions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { archivedAt: null },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="stack-section">
      <section>
        <div className="eyebrow mb-md">New product</div>
        <h1 className="text-display-lg">Pop something new on the shelf</h1>
      </section>
      <ProductForm action={createProduct} categories={categories} />
    </div>
  );
}
