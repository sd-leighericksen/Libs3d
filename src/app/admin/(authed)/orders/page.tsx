import Link from "next/link";
import { prisma } from "@/lib/db";
import { STATE_LABEL } from "@/lib/order-state";
import { formatAud } from "@/lib/money";
import type { OrderState } from "@prisma/client";

const STATES: OrderState[] = [
  "pending_review",
  "approved",
  "paid",
  "in_production",
  "fulfilled",
  "completed",
  "rejected",
  "cancelled",
  "payment_failed",
];

function toneFor(state: OrderState): "alert" | "info" | "ok" {
  if (state === "pending_review") return "alert";
  if (state === "completed" || state === "fulfilled" || state === "paid")
    return "ok";
  return "info";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const sp = await searchParams;
  const state = (STATES as string[]).includes(sp.state ?? "")
    ? (sp.state as OrderState)
    : null;

  const orders = await prisma.order.findMany({
    where: state ? { state } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  return (
    <div className="stack-section">
      <section className="page-header">
        <div className="eyebrow">Orders</div>
        <h1>{state ? STATE_LABEL[state] : "All orders"}</h1>
      </section>

      <nav className="flex flex-wrap gap-xs">
        <Link
          href="/admin/orders"
          className="pill-tab"
          aria-selected={state === null}
        >
          All
        </Link>
        {STATES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?state=${s}`}
            className="pill-tab"
            aria-selected={state === s}
          >
            {STATE_LABEL[s]}
          </Link>
        ))}
      </nav>

      <section>
        {orders.length === 0 ? (
          <p className="text-body">Nothing here.</p>
        ) : (
          <ul className="divide-y divide-hairline border-y border-hairline">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="py-md px-sm flex items-center gap-md hover:bg-surface-soft"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-body font-semibold truncate">
                      {o.buyerFirstName}{" "}
                      <span className="text-ink/60 text-body-sm font-normal">
                        · {o.items.length} item{o.items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="text-body-sm text-ink/60 truncate">
                      Grown-up: {o.parentFirstName} &lt;{o.parentEmail}&gt; ·{" "}
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="status" data-tone={toneFor(o.state)}>
                    {STATE_LABEL[o.state]}
                  </span>
                  <div className="text-body-sm font-semibold w-24 text-right">
                    {formatAud(o.totalCents)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
