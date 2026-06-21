import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

async function saveCategory(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  await prisma.category.update({
    where: { id },
    data: { name, description, sortOrder },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

async function deleteCategory(formData: FormData) {
  "use server";
  const me = await requireRole("admin");
  if (!me) throw new Error("Only admins can delete categories.");
  const id = String(formData.get("id"));
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error(
      "This category still has products. Move or delete them first, or archive the category.",
    );
  }
  const category = await prisma.category.findUnique({ where: { id } });
  await prisma.category.delete({ where: { id } });
  await logActivity({
    actorId: me.id,
    actorName: me.username,
    action: "category.delete",
    summary: `${me.username} deleted category "${category?.name ?? id}"`,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export default async function EditCategory({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!c) notFound();
  const isAdmin = (await requireRole("admin")) !== null;

  return (
    <div className="max-w-xl">
      <div className="eyebrow mb-md">Category</div>
      <h1 className="text-display-lg">Edit {c.name}</h1>
      <form action={saveCategory} className="mt-xl flex flex-col gap-md">
        <input type="hidden" name="id" value={c.id} />
        <div>
          <label className="field-label">Name</label>
          <input name="name" defaultValue={c.name} required className="field-input" />
        </div>
        <div>
          <label className="field-label">Description</label>
          <input name="description" defaultValue={c.description ?? ""} className="field-input" />
        </div>
        <div>
          <label className="field-label">Sort order</label>
          <input
            type="number"
            name="sortOrder"
            defaultValue={c.sortOrder}
            className="field-input"
          />
        </div>
        <div>
          <button className="pill-primary" type="submit">Save</button>
        </div>
      </form>

      {isAdmin && (
        <form
          action={deleteCategory}
          className="mt-xl border-t border-hairline pt-lg flex items-center gap-sm flex-wrap"
        >
          <input type="hidden" name="id" value={c.id} />
          <button
            type="submit"
            className="pill text-canvas bg-accent-magenta px-lg py-[10px] text-body-sm"
          >
            Delete category
          </button>
          <span className="field-help">
            {c._count.products > 0
              ? `Has ${c._count.products} product${c._count.products === 1 ? "" : "s"} — move or remove them first.`
              : "Permanent. Can’t be undone."}
          </span>
        </form>
      )}
    </div>
  );
}
