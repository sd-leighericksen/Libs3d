import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatAud } from "@/lib/money";
import { startPayment } from "@/lib/payment-actions";
import { stripeEnabled } from "@/lib/stripe";
import { SelectionSummary } from "@/components/SelectionSummary";

export default async function PayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await prisma.order.findUnique({
    where: { paymentToken: token },
    include: { items: true },
  });
  if (!order) notFound();

  const expired =
    order.paymentLinkExpiresAt &&
    order.paymentLinkExpiresAt < new Date() &&
    !["paid", "in_production", "fulfilled", "completed"].includes(order.state);

  const paid = ["paid", "in_production", "fulfilled", "completed"].includes(
    order.state,
  );

  if (expired) {
    return (
      <div className="container-content py-xxl max-w-2xl page-header">
        <div className="eyebrow">Payment</div>
        <h1>This link has expired.</h1>
        <p className="lede">
          Payment links are good for 14 days. Reply to the original email and
          we&rsquo;ll send you a fresh one.
        </p>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="container-content py-xxl max-w-2xl page-header">
        <div className="eyebrow">Already paid</div>
        <h1>All sorted — thank you!</h1>
        <p className="lede">
          We&rsquo;ve received payment for {order.buyerFirstName}&rsquo;s order.
          A confirmation email is in your inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="container-content py-xxl grid md:grid-cols-3 gap-xl max-w-5xl">
      <div className="md:col-span-2">
        <div className="page-header mb-xl">
          <div className="eyebrow">Time to say yes</div>
          <h1>{order.buyerFirstName}&rsquo;s order is ready for your okay.</h1>
          <p className="lede">
            Hi {order.parentFirstName}. We&rsquo;ve checked the order and we
            can print it. Have a look — if it&rsquo;s right, hit pay. If
            anything&rsquo;s off, just reply to the email.
          </p>
        </div>

        <div className="card">
          <div className="caption text-ink/60 mb-sm">Delivery</div>
          <p className="text-body whitespace-pre-wrap">
            Pickup — Delacombe. We&rsquo;ll send pickup instructions once it&rsquo;s ready.
          </p>
        </div>

        <form action={startPayment} className="mt-lg flex flex-col gap-sm">
          <input type="hidden" name="paymentToken" value={order.paymentToken} />
          <button className="pill-primary self-start" type="submit">
            Pay {formatAud(order.totalCents)} with card
          </button>
          {!stripeEnabled() && (
            <p className="text-body-sm text-ink/60 max-w-[60ch]">
              (Dev mode: Stripe isn&rsquo;t configured, so clicking pay
              simulates a successful payment.)
            </p>
          )}
          <p className="text-body-sm text-ink/60 max-w-[60ch]">
            Payments are processed by Stripe. We don&rsquo;t see your card
            details. Nothing is printed until payment goes through.
          </p>
        </form>
      </div>

      <aside>
        <div className="card-accent">
          <div className="caption text-ink/60 mb-sm">Order summary</div>
          <ul className="text-body-sm divide-y divide-hairline-soft">
            {order.items.map((i) => (
              <li key={i.id} className="py-xs flex justify-between gap-md">
                <span>
                  {i.quantity} × {i.titleSnapshot}
                  <SelectionSummary
                    selections={i.selections}
                    className="mt-xxs flex flex-col gap-xxs"
                  />
                </span>
                <span className="whitespace-nowrap">
                  {formatAud(i.unitPriceCents * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-md pt-md border-t border-hairline flex justify-between items-baseline">
            <span className="text-body">Total (AUD)</span>
            <span className="text-[24px] font-semibold text-accent-magenta">
              {formatAud(order.totalCents)}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
