import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { STATE_LABEL } from "@/lib/order-state";
import { formatAud } from "@/lib/money";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await prisma.order.findUnique({
    where: { token },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  const headline = {
    pending_review: "Your order is in the shop&rsquo;s inbox.",
    approved: "Now waiting on your grown-up to pay.",
    paid: "Paid — we&rsquo;re getting it ready.",
    in_production: "We&rsquo;re printing it now.",
    fulfilled:
      order.deliveryMethod === "collect"
        ? "Ready to collect at school."
        : "On its way to you.",
    completed: "All done. Thanks!",
    rejected: "This one couldn&rsquo;t go ahead.",
    cancelled: "This order was cancelled.",
    payment_failed: "The payment didn&rsquo;t go through.",
  }[order.state];

  const helper = {
    pending_review:
      "We'll check it and let your grown-up know when it's ready for them to say yes and pay. Come back to this page anytime.",
    approved:
      "We sent your grown-up an email with a link to approve and pay. Nothing's printed until they do.",
    paid: "Your grown-up paid — thanks! We've added it to the print queue.",
    in_production: "Currently being printed. Won't be long.",
    fulfilled: "Hope you love it!",
    completed: "Hope you love it! Come back anytime.",
    rejected:
      "We let your grown-up know why. If you'd like to try a different order, head back to the shop.",
    cancelled: "If that was a mistake, tell your grown-up to email the shop.",
    payment_failed:
      "We told your grown-up — they can try again from the same link.",
  }[order.state];

  return (
    <div className="container-content py-xxl stack-section max-w-3xl">
      <section className="page-header">
        <div className="eyebrow">Order for {order.buyerFirstName}</div>
        <h1 dangerouslySetInnerHTML={{ __html: headline }} />
        <p className="lede">{helper}</p>
      </section>

      <section className="card">
        <div className="caption text-ink/60 mb-sm">What you ordered</div>
        <ul className="divide-y divide-hairline-soft">
          {order.items.map((i) => (
            <li key={i.id} className="py-xs flex justify-between gap-md text-body">
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
      </section>

      <section>
        <div className="section-head">
          <span className="tick">Timeline</span>
          <h2>What&rsquo;s happened so far</h2>
        </div>
        <ul className="divide-y divide-hairline border-y border-hairline text-body-sm">
          {order.events.map((e) => (
            <li key={e.id} className="py-sm flex justify-between gap-md">
              <span className="font-medium">{STATE_LABEL[e.toState]}</span>
              <span className="text-ink/60">
                {new Date(e.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-body-sm text-ink/60 mt-md">
          Bookmark this page if you want — you can come back and check anytime.
        </p>
      </section>
    </div>
  );
}
