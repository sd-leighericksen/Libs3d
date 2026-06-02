import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

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

export default async function EditCategory({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) notFound();

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
    </div>
  );
}
