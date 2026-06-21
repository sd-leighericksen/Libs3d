// All transactional email copy lives here, in the voice from §11 of the brief.
import { appBaseUrl } from "../email";
import { formatAud } from "../money";
import { selectionsToText } from "../product-options";
import type { Order, OrderItem } from "@prisma/client";

type OrderForEmail = Order & { items: OrderItem[] };

const itemLines = (items: OrderItem[]) =>
  items
    .map((i) => {
      const opts = selectionsToText(i.selections);
      const main = `  • ${i.quantity} × ${i.titleSnapshot} — ${formatAud(i.unitPriceCents * i.quantity)}`;
      return opts ? `${main}\n      ${opts}` : main;
    })
    .join("\n");

export function parentOrderReceived(order: OrderForEmail, storeName: string) {
  const statusUrl = `${appBaseUrl()}/order/${order.token}`;
  return {
    subject: `${storeName}: ${order.buyerFirstName}'s order is on the way to being checked`,
    textBody: `Hi ${order.parentFirstName},

${order.buyerFirstName} just put together an order at ${storeName}.

Here's what's in it:
${itemLines(order.items)}

Total: ${formatAud(order.totalCents)}

We'll have a look at the order first to make sure everything's printable, then we'll send you a separate email with a link to approve it and pay. Nothing is printed or charged until you've said yes — that's a promise.

If anything looks off, you can see the order status here:
${statusUrl}

Thanks for letting them shop with us!
The ${storeName} team`,
    tag: "order-received-parent",
  };
}

export function adminNewOrder(order: OrderForEmail, storeName: string) {
  const adminUrl = `${appBaseUrl()}/admin/orders/${order.id}`;
  return {
    subject: `New order to check — ${order.buyerFirstName} (${formatAud(order.totalCents)})`,
    textBody: `New order needs your eyes.

Buyer: ${order.buyerFirstName}
Parent: ${order.parentFirstName} <${order.parentEmail}>
Delivery: Pickup — Delacombe (instructions sent when ready)

Items:
${itemLines(order.items)}

Total: ${formatAud(order.totalCents)}

Approve or reject here:
${adminUrl}`,
    tag: "order-admin-new",
  };
}

export function parentPaymentRequest(order: OrderForEmail, storeName: string) {
  const payUrl = `${appBaseUrl()}/pay/${order.paymentToken}`;
  const expires = order.paymentLinkExpiresAt?.toDateString() ?? "in 14 days";
  return {
    subject: `${storeName}: time to say yes (and pay) for ${order.buyerFirstName}'s order`,
    textBody: `Hi ${order.parentFirstName},

Good news — we've checked ${order.buyerFirstName}'s order and we're happy to print it. Now we need your okay.

Here's what's in the order:
${itemLines(order.items)}

Total: ${formatAud(order.totalCents)}

Have a look and pay here:
${payUrl}

(The link works until ${expires}. After that just reply and we'll send a fresh one.)

We don't print a thing until your payment goes through.

Thanks!
The ${storeName} team`,
    tag: "parent-payment-request",
  };
}

export function parentReject(order: OrderForEmail, reason: string, storeName: string) {
  return {
    subject: `${storeName}: about ${order.buyerFirstName}'s order`,
    textBody: `Hi ${order.parentFirstName},

We had a look at ${order.buyerFirstName}'s order and we're sorry — we can't go ahead with this one. Here's why:

${reason}

Nothing's been charged. If you'd like to try a different order, just send ${order.buyerFirstName} back to the shop.

Thanks for understanding,
The ${storeName} team`,
    tag: "parent-reject",
  };
}

export function parentPaymentConfirmed(order: OrderForEmail, storeName: string) {
  return {
    subject: `Thanks! ${order.buyerFirstName}'s order is paid`,
    textBody: `Hi ${order.parentFirstName},

Payment received — thank you. ${order.buyerFirstName}'s order is in our queue now.

Here's what we're making:
${itemLines(order.items)}

Total paid: ${formatAud(order.totalCents)}

We'll let you know when it's on its way.

The ${storeName} team`,
    tag: "parent-paid",
  };
}

export function parentReminder(order: OrderForEmail, storeName: string) {
  const payUrl = `${appBaseUrl()}/pay/${order.paymentToken}`;
  const expires = order.paymentLinkExpiresAt?.toDateString() ?? "soon";
  return {
    subject: `Friendly nudge: ${order.buyerFirstName}'s order is still waiting`,
    textBody: `Hi ${order.parentFirstName},

Just a quick nudge — ${order.buyerFirstName}'s order is still waiting for your okay and payment. The link is good until ${expires}:

${payUrl}

If you'd rather not go ahead, you can ignore this — nothing happens until you pay.

The ${storeName} team`,
    tag: "parent-reminder",
  };
}

export function parentFulfilled(order: OrderForEmail, storeName: string) {
  const note = "It's ready to collect in Delacombe. We'll send you the pickup instructions separately.";
  return {
    subject: `${order.buyerFirstName}'s order is ready!`,
    textBody: `Hi ${order.parentFirstName},

${note}

The ${storeName} team`,
    tag: "parent-fulfilled",
  };
}
