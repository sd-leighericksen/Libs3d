import Link from "next/link";
import { prisma } from "@/lib/db";
import { PillLink } from "@/components/ui/Pill";
import { formatAud } from "@/lib/money";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Hero } from "@/components/Hero";

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
    <>
      {/* Full-bleed GSAP hero */}
      <Hero />

      <div className="container-content py-section stack-section">
      {/* Featured products */}
      <section id="shop" className="scroll-mt-28">
        {categories.length > 0 && (
          <div className="mb-lg flex justify-end">
            <Link
              href={`/category/${categories[0].slug}`}
              className="text-link text-accent-magenta underline-offset-4 hover:underline"
            >
              See all →
            </Link>
          </div>
        )}

        {featured.length === 0 ? (
          <p className="text-body">Nothing in the shop yet — check back soon.</p>
        ) : (
          <Reveal stagger as="div" className="grid grid-cols-2 md:grid-cols-3 gap-md">
            {featured.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="group block rounded-lg border border-hairline bg-canvas overflow-hidden transition-colors transition-transform duration-300 hover:border-accent-magenta hover:-translate-y-1"
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
          </Reveal>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <div className="section-head">
            <span className="tick">Browse</span>
            <h2>By category</h2>
          </div>
          <Reveal stagger as="div" className="grid sm:grid-cols-2 md:grid-cols-3 gap-md">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="card group flex items-center justify-between transition-colors hover:border-accent-magenta"
              >
                <div>
                  <div className="text-card-title">{c.name}</div>
                  {c.description && (
                    <div className="text-body-sm text-ink/70 mt-xs max-w-[28ch]">
                      {c.description}
                    </div>
                  )}
                </div>
                <span className="text-accent-magenta text-headline transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ))}
          </Reveal>
        </section>
      )}

      {/* How it works strip */}
      <Reveal as="section" className="card-accent">
        <span className="tick">How it works</span>
        <h2 className="text-headline mt-xs">
          Kids choose. Grown-ups say yes. Then we print.
        </h2>
        <p className="text-body text-ink/70 mt-xs max-w-[60ch]">
          Every order pauses for a grown-up&rsquo;s yes (and payment) before
          anything goes to the printer. No surprise bills, no surprise boxes.
        </p>
        <div className="mt-md">
          <Magnetic strength={0.4}>
            <PillLink href="/how-it-works" variant="primary">
              Read the short version
            </PillLink>
          </Magnetic>
        </div>
      </Reveal>
      </div>
    </>
  );
}
