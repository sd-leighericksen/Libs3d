import Link from "next/link";
import { PillLink } from "@/components/ui/Pill";
import { CartBadge } from "@/components/CartBadge";
import { Magnetic } from "@/components/motion/Magnetic";
import { HeaderShell } from "@/components/motion/HeaderShell";
import { prisma } from "@/lib/db";

export async function TopNav() {
  const categories = await prisma.category.findMany({
    where: { archivedAt: null },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });

  return (
    <HeaderShell>
      <Link href="/" aria-label="Libs3d home" className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Libs3d" className="h-16 w-auto" />
      </Link>

      <nav className="hidden md:flex items-center gap-xs text-body-sm">
        {categories.slice(0, 4).map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="pill-ghost">
            {c.name}
          </Link>
        ))}
        <Link href="/how-it-works" className="pill-ghost">
          How it works
        </Link>
      </nav>

      <div className="flex items-center gap-sm">
        <CartBadge />
        <Magnetic className="hidden sm:inline-flex" strength={0.5}>
          <PillLink href="/" variant="primary">
            Shop
          </PillLink>
        </Magnetic>
      </div>
    </HeaderShell>
  );
}
