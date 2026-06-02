import { NextResponse } from "next/server";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import {
  markOrderPaidIdempotent,
  markOrderPaymentFailed,
} from "@/lib/payment-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!stripeEnabled()) {
    return new NextResponse("Stripe not configured", { status: 503 });
  }
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret || secret.startsWith("whsec_your")) {
    return new NextResponse("Webhook secret not configured", { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return new NextResponse(`Webhook signature failed: ${(err as Error).message}`, {
      status: 400,
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      const orderId = (s.metadata?.orderId as string) ?? s.client_reference_id;
      if (orderId) {
        await markOrderPaidIdempotent(orderId, {
          sessionId: s.id,
          paymentIntentId:
            typeof s.payment_intent === "string"
              ? s.payment_intent
              : (s.payment_intent?.id ?? undefined),
        });
      }
      break;
    }
    case "checkout.session.async_payment_failed":
    case "payment_intent.payment_failed": {
      const obj = event.data.object as { metadata?: { orderId?: string } };
      const orderId = obj.metadata?.orderId;
      if (orderId) await markOrderPaymentFailed(orderId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
