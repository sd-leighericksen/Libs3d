import Link from "next/link";
import { prisma } from "@/lib/db";
import { PillLink } from "@/components/ui/Pill";
import { formatAud } from "@/lib/money";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    prisma.product.findMany({
      where: { available: true, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    prisma.category.findMany({
      where: { archivedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="container-content py-xxl stack-section">
      {/* Hero */}
      <section className="grid md:grid-cols-12 gap-xl items-center">
        <div className="md:col-span-7 page-header">
          <div className="eyebrow">Libs3d</div>
          <h1>Small 3D-printed things, made by a kid.</h1>
          <p className="lede">
            Pick what you like. Your grown-up gets an email to say yes and pay.
            Then we print it.
          </p>
          <div className="flex flex-wrap gap-sm mt-lg">
            <PillLink href="#shop">Browse the shop</PillLink>
            <PillLink href="/how-it-works" variant="secondary">
              How it works
            </PillLink>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="card-soft aspect-[4/3] flex items-center justify-center">
            {featured[0]?.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured[0].images[0].url}
                alt={featured[0].images[0].alt}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="text-body-sm text-ink/60">Hero image</div>
            )}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section id="shop">
        <div className="section-head flex flex-wrap items-end justify-between gap-md">
          <div>
            <span className="tick">Shop</span>
            <h2>Latest stuff</h2>
            <p>Fresh out of the printer.</p>
          </div>
          {categories.length > 0 && (
            <Link
              href={`/category/${categories[0].slug}`}
              className="text-link text-accent-magenta underline-offset-4 hover:underline"
            >
              See all →
            </Link>
          )}
        </div>

        {featured.length === 0 ? (
          <p className="text-body">Nothing in the shop yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
            {featured.map((p) => (
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

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <div className="section-head">
            <span className="tick">Browse</span>
            <h2>By category</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-md">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="card flex items-center justify-between hover:border-accent-magenta transition-colors"
              >
                <div>
                  <div className="text-card-title">{c.name}</div>
                  {c.description && (
                    <div className="text-body-sm text-ink/70 mt-xs max-w-[28ch]">
                      {c.description}
                    </div>
                  )}
                </div>
                <span className="text-accent-magenta text-headline">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works strip */}
      <section className="card-accent">
        <span className="tick">How it works</span>
        <h2 className="text-headline mt-xs">
          Kids choose. Grown-ups say yes. Then we print.
        </h2>
        <p className="text-body text-ink/70 mt-xs max-w-[60ch]">
          Every order pauses for a grown-up&rsquo;s yes (and payment) before
          anything goes to the printer. No surprise bills, no surprise boxes.
        </p>
        <div className="mt-md">
          <PillLink href="/how-it-works" variant="primary">
            Read the short version
          </PillLink>
        </div>
      </section>
    </div>
  );
}
