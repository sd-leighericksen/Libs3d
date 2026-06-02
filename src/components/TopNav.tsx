import Link from "next/link";
import { PillLink } from "@/components/ui/Pill";
import { CartBadge } from "@/components/CartBadge";
import { prisma } from "@/lib/db";

export async function TopNav() {
  const categories = await prisma.category.findMany({
    where: { archivedAt: null },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });

  return (
    <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur border-b border-hairline">
      <div className="container-content h-16 flex items-center justify-between gap-lg">
        <Link href="/" aria-label="Libs3d home" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Libs3d" className="h-8 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-xs text-body-sm">
          {categories.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="pill-ghost"
            >
              {c.name}
            </Link>
          ))}
          <Link href="/how-it-works" className="pill-ghost">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-sm">
          <CartBadge />
          <PillLink href="/" variant="primary" className="hidden sm:inline-flex">
            Shop
          </PillLink>
        </div>
      </div>
    </header>
  );
}
