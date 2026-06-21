import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

async function createCategory(formData: FormData) {
  "use server";
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) return;
  let slug = slugify(name);
  let i = 2;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${slugify(name)}-${i++}`;
  }
  await prisma.category.create({
    data: { name, slug, description },
  });
  await logActivity({
    actorId: me.id,
    actorName: me.username,
    action: "category.create",
    summary: `${me.username} created category "${name}"`,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

async function archiveCategory(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await prisma.category.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  revalidatePath("/admin/categories");
}

async function unarchiveCategory(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await prisma.category.update({ where: { id }, data: { archivedAt: null } });
  revalidatePath("/admin/categories");
}

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ archivedAt: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="stack-section">
      <section>
        <div className="eyebrow mb-md">Categories</div>
        <h1 className="text-display-lg">Sort the shelves</h1>
      </section>

      <section className="card-hairline">
        <h2 className="text-headline">Add a new category</h2>
        <form action={createCategory} className="grid sm:grid-cols-2 gap-md mt-md">
          <div>
            <label className="field-label" htmlFor="name">Name</label>
            <input id="name" name="name" required className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="description">Short description</label>
            <input id="description" name="description" className="field-input" />
          </div>
          <div className="sm:col-span-2">
            <button className="pill-primary" type="submit">Add category</button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-headline mb-md">Existing categories</h2>
        <ul className="divide-y divide-hairline-soft border-y border-hairline-soft">
          {categories.map((c) => (
            <li key={c.id} className="py-md flex items-center justify-between gap-md">
              <div>
                <div className="text-body font-semibold">
                  {c.name}{" "}
                  {c.archivedAt && (
                    <span className="caption ml-sm text-ink/60">archived</span>
                  )}
                </div>
                <div className="text-body-sm text-ink/70">
                  /{c.slug} · {c._count.products} product
                  {c._count.products === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex items-center gap-sm">
                <Link
                  href={`/admin/categories/${c.id}`}
                  className="text-body-sm underline"
                >
                  Edit
                </Link>
                <form action={c.archivedAt ? unarchiveCategory : archiveCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="text-body-sm underline">
                    {c.archivedAt ? "Unarchive" : "Archive"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
