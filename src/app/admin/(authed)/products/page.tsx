import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatAud } from "@/lib/money";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ archivedAt: "asc" }, { createdAt: "desc" }],
    include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  return (
    <div className="stack-section">
      <section className="flex items-end justify-between">
        <div>
          <div className="eyebrow mb-md">Products</div>
          <h1 className="text-display-lg">Things on the shelves</h1>
        </div>
        <Link href="/admin/products/new" className="pill-primary">
          Add a product
        </Link>
      </section>

      <section>
        <ul className="divide-y divide-hairline-soft border-y border-hairline-soft">
          {products.map((p) => (
            <li key={p.id} className="py-md flex items-center gap-md">
              <div className="w-16 h-16 rounded-md bg-surface-soft overflow-hidden border border-hairline shrink-0">
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-body font-semibold">
                  {p.title}
                  {!p.available && (
                    <span className="caption ml-sm text-ink/60">unavailable</span>
                  )}
                  {p.archivedAt && (
                    <span className="caption ml-sm text-ink/60">archived</span>
                  )}
                </div>
                <div className="text-body-sm text-ink/70">
                  {p.category.name} · {formatAud(p.priceCents)}
                  {!p.productionStlKey && (
                    <span className="ml-sm text-accent-magenta">
                      — no production STL!
                    </span>
                  )}
                  {p.productionStlKey && !p.previewStlUrl && (
                    <span className="ml-sm text-accent-magenta">
                      — production file only, viewer hidden
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/admin/products/${p.id}`} className="text-body-sm underline">
                Edit
              </Link>
            </li>
          ))}
          {products.length === 0 && (
            <li className="py-md text-body">
              Nothing yet. Try{" "}
              <Link href="/admin/products/new" className="underline">
                adding a product
              </Link>
              .
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
