"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { getStripe, stripeEnabled } from "./stripe";
import { sendEmail, appBaseUrl } from "./email";
import { getSettings } from "./settings";
import { parentPaymentConfirmed } from "./emails/templates";

// Called from /pay/[token]. Creates a Stripe Checkout Session and redirects.
// If Stripe isn't configured (dev), simulate the webhook and go straight to paid.
export async function startPayment(formData: FormData) {
  const token = String(formData.get("paymentToken"));
  const order = await prisma.order.findUnique({
    where: { paymentToken: token },
    include: { items: true },
  });
  if (!order) throw new Error("Payment link not found.");
  if (order.state !== "approved" && order.state !== "payment_failed") {
    throw new Error("This order isn't ready for payment.");
  }
  if (order.paymentLinkExpiresAt && order.paymentLinkExpiresAt < new Date()) {
    throw new Error("This payment link has expired.");
  }

  const base = appBaseUrl();

  // Dev stub: no Stripe configured. Mark paid and redirect.
  if (!stripeEnabled()) {
    await markOrderPaidIdempotent(order.id, {
      sessionId: `stub_${Date.now()}`,
      paymentIntentId: `stub_pi_${Date.now()}`,
    });
    redirect(`/pay/${order.paymentToken}/done`);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: order.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: "aud",
        unit_amount: i.unitPriceCents,
        product_data: { name: i.titleSnapshot },
      },
    })),
    customer_email: order.parentEmail,
    success_url: `${base}/pay/${order.paymentToken}/done?cs={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/pay/${order.paymentToken}`,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  redirect(session.url!);
}

// Idempotent: safe to call from both webhook and dev stub regardless of duplicate deliveries.
export async function markOrderPaidIdempotent(
  orderId: string,
  ids: { sessionId: string; paymentIntentId?: string },
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (order.state === "paid" || order.state === "in_production" ||
      order.state === "fulfilled" || order.state === "completed") {
    return; // already at-or-past paid
  }
  if (order.state !== "approved" && order.state !== "payment_failed") {
    return; // illegal transition — ignore
  }

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.order.findUnique({ where: { id: orderId } });
    if (!fresh) return;
    if (fresh.state === "paid") return;
    await tx.order.update({
      where: { id: orderId },
      data: {
        state: "paid",
        stripeSessionId: ids.sessionId,
        stripePaymentIntentId: ids.paymentIntentId,
      },
    });
    await tx.orderEvent.create({
      data: {
        orderId,
        fromState: fresh.state,
        toState: "paid",
      },
    });
  });

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (updated) {
    const settings = await getSettings();
    await sendEmail({
      to: updated.parentEmail,
      ...parentPaymentConfirmed(updated, settings.storeName),
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/order/${order.token}`);
}

export async function markOrderPaymentFailed(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (order.state !== "approved") return;
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { state: "payment_failed" },
    });
    await tx.orderEvent.create({
      data: {
        orderId,
        fromState: "approved",
        toState: "payment_failed",
      },
    });
  });
  revalidatePath(`/admin/orders/${orderId}`);
}
