import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatAud } from "@/lib/money";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { archivedAt: null, available: true },
        orderBy: { createdAt: "desc" },
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!category || category.archivedAt) notFound();

  return (
    <div className="container-content py-xxl stack-section">
      <section className="page-header">
        <div className="eyebrow">Category</div>
        <h1>{category.name}</h1>
        {category.description && <p className="lede">{category.description}</p>}
      </section>

      <section>
        {category.products.length === 0 ? (
          <p className="text-body">Nothing here yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
            {category.products.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="group block rounded-lg border border-hairline bg-canvas overflow-hidden hover:border-accent-magenta transition-colors"
              >
                <div className="aspect-square bg-surface-soft overflow-hidden">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt={p.images[0].alt}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    />
                  )}
                </div>
                <div className="p-md">
                  <div className="text-body font-semibold">{p.title}</div>
                  <div className="text-body-sm text-ink/70">
                    {formatAud(p.priceCents)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
