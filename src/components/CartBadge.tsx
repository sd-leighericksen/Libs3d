import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";

export async function CartBadge() {
  const sid = await getSessionId();
  let count = 0;
  if (sid) {
    const cart = await prisma.cart.findUnique({
      where: { sessionId: sid },
      include: { items: true },
    });
    count = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  }
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className="relative inline-flex items-center gap-xs rounded-pill border border-hairline px-md py-xs hover:bg-surface-soft text-body-sm"
    >
      <span aria-hidden>🛒</span>
      <span>Cart</span>
      {count > 0 && (
        <span className="ml-xs bg-accent-magenta text-canvas text-caption rounded-full h-5 min-w-5 px-1 inline-flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
