import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatAud } from "@/lib/money";
import { STATE_LABEL } from "@/lib/order-state";
import {
  approveOrder,
  rejectOrder,
  markInProduction,
  markFulfilled,
  markCompleted,
  cancelOrder,
  regeneratePaymentLink,
} from "@/lib/admin-order-actions";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: {
        orderBy: { createdAt: "asc" },
        include: { actorAdmin: true },
      },
    },
  });
  if (!order) notFound();

  const buyerLink = `/order/${order.token}`;

  return (
    <div className="stack-section">
      <section className="page-header">
        <div className="eyebrow">Order</div>
        <h1>{order.buyerFirstName}&rsquo;s order</h1>
        <p className="lede">
          Currently:{" "}
          <span className="font-semibold text-accent-magenta">
            {STATE_LABEL[order.state]}
          </span>
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-lg">
        <div className="md:col-span-2 card">
          <div className="caption text-ink/60 mb-sm">What they ordered</div>
          <ul className="divide-y divide-hairline-soft">
            {order.items.map((i) => (
              <li key={i.id} className="py-sm flex justify-between gap-md text-body">
                <span>
                  {i.quantity} × {i.titleSnapshot}
                </span>
                <span>{formatAud(i.unitPriceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-md pt-md border-t border-hairline flex justify-between items-baseline">
            <span className="text-body">Total</span>
            <span className="text-[24px] font-semibold text-accent-magenta">
              {formatAud(order.totalCents)}
            </span>
          </div>
          {order.note && (
            <div className="mt-md pt-md border-t border-hairline">
              <div className="caption text-ink/60 mb-xs">Note from buyer</div>
              <p className="text-body-sm whitespace-pre-wrap">{order.note}</p>
            </div>
          )}
        </div>

        <aside className="card">
          <div className="caption text-ink/60 mb-xs">Grown-up</div>
          <p className="text-body-sm">
            {order.parentFirstName}
            <br />
            <a className="underline" href={`mailto:${order.parentEmail}`}>
              {order.parentEmail}
            </a>
          </p>
          <div className="caption text-ink/60 mt-md mb-xs">Delivery</div>
          <p className="text-body-sm whitespace-pre-wrap">
            {order.deliveryMethod === "collect"
              ? "Collect at school"
              : order.deliveryAddress || "(no address!)"}
          </p>
          <div className="caption text-ink/60 mt-md mb-xs">Buyer status link</div>
          <a className="text-body-sm underline break-all" href={buyerLink}>
            {buyerLink}
          </a>
        </aside>
      </section>

      <section>
        <div className="section-head">
          <span className="tick">Actions</span>
          <h2>What can happen next</h2>
        </div>
        <div className="flex flex-wrap gap-md items-start">
          {order.state === "pending_review" && (
            <>
              <form action={approveOrder}>
                <input type="hidden" name="id" value={order.id} />
                <button className="pill-primary" type="submit">
                  Approve &amp; email grown-up to pay
                </button>
              </form>
              <details className="card">
                <summary className="cursor-pointer text-body-sm font-medium">
                  Reject…
                </summary>
                <form action={rejectOrder} className="mt-md flex flex-col gap-sm">
                  <input type="hidden" name="id" value={order.id} />
                  <label className="field-label">Reason (sent to grown-up)</label>
                  <textarea
                    name="reason"
                    required
                    className="field-textarea"
                    rows={3}
                  />
                  <button className="pill-dark" type="submit">
                    Reject this order
                  </button>
                </form>
              </details>
            </>
          )}

          {(order.state === "approved" || order.state === "payment_failed") && (
            <form action={regeneratePaymentLink}>
              <input type="hidden" name="id" value={order.id} />
              <button className="pill-primary" type="submit">
                Resend payment link
              </button>
            </form>
          )}

          {order.state === "paid" && (
            <form action={markInProduction}>
              <input type="hidden" name="id" value={order.id} />
              <button className="pill-primary" type="submit">
                Mark in production
              </button>
            </form>
          )}

          {order.state === "in_production" && (
            <form action={markFulfilled}>
              <input type="hidden" name="id" value={order.id} />
              <button className="pill-primary" type="submit">
                Mark fulfilled
              </button>
            </form>
          )}

          {order.state === "fulfilled" && (
            <form action={markCompleted}>
              <input type="hidden" name="id" value={order.id} />
              <button className="pill-primary" type="submit">
                Mark completed
              </button>
            </form>
          )}

          {!["completed", "rejected", "cancelled"].includes(order.state) && (
            <form action={cancelOrder}>
              <input type="hidden" name="id" value={order.id} />
              <button className="text-body-sm text-ink/60 underline" type="submit">
                Cancel order
              </button>
            </form>
          )}
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="tick">History</span>
          <h2>State changes</h2>
        </div>
        <ul className="divide-y divide-hairline border-y border-hairline text-body-sm">
          {order.events.map((e) => (
            <li key={e.id} className="py-sm">
              <div className="flex items-center justify-between gap-md">
                <span>
                  {e.fromState ? `${STATE_LABEL[e.fromState]} → ` : ""}
                  <strong>{STATE_LABEL[e.toState]}</strong>
                </span>
                <span className="text-ink/60">
                  {new Date(e.createdAt).toLocaleString()}
                  {e.actorAdmin ? ` · ${e.actorAdmin.username}` : ""}
                </span>
              </div>
              {e.reason && (
                <p className="text-ink/70 mt-xs whitespace-pre-wrap">{e.reason}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
