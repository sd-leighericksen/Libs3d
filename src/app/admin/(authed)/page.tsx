import Link from "next/link";
import { prisma } from "@/lib/db";
import { STATE_LABEL } from "@/lib/order-state";

export default async function AdminDashboard() {
  const grouped = await prisma.order.groupBy({
    by: ["state"],
    _count: { _all: true },
  });
  const counts = Object.fromEntries(
    grouped.map((g) => [g.state, g._count._all]),
  ) as Record<string, number>;

  const pending = counts.pending_review ?? 0;
  const approved = counts.approved ?? 0;
  const inProduction = counts.in_production ?? 0;

  return (
    <div className="stack-section">
      <section className="page-header">
        <div className="eyebrow">Dashboard</div>
        <h1>What needs you</h1>
      </section>

      <section>
        <div className="grid sm:grid-cols-3 gap-md">
          <Tile label="Needs your check" count={pending} href="/admin/orders?state=pending_review" highlight />
          <Tile label="Waiting on grown-up payment" count={approved} href="/admin/orders?state=approved" />
          <Tile label="Being printed" count={inProduction} href="/admin/orders?state=in_production" />
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="tick">Everything else</span>
          <h2>All states</h2>
        </div>
        <ul className="flex flex-wrap gap-xs text-body-sm">
          {Object.entries(STATE_LABEL).map(([state, label]) => (
            <li key={state}>
              <Link
                href={`/admin/orders?state=${state}`}
                className="status hover:border-accent-magenta"
              >
                {label}{" "}
                <span className="text-ink/60">({counts[state] ?? 0})</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Tile({
  label,
  count,
  href,
  highlight,
}: {
  label: string;
  count: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg p-lg border transition-colors ${
        highlight
          ? "bg-accent-magenta text-canvas border-transparent hover:opacity-95"
          : "bg-canvas border-hairline hover:border-accent-magenta"
      }`}
    >
      <div className={`caption ${highlight ? "text-canvas/80" : "text-ink/60"}`}>
        {label}
      </div>
      <div className="text-[44px] mt-sm leading-none font-semibold tracking-tight">
        {count}
      </div>
    </Link>
  );
}
