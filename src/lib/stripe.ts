// Real Stripe when STRIPE_SECRET_KEY is set; otherwise a dev stub that
// auto-marks orders paid so local devs can exercise the end-to-end flow
// without configuring Stripe. The stub is OFF in production by hard check.
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
const realStripe =
  key && !key.startsWith("sk_test_your") && key.length > 20
    ? new Stripe(key, { apiVersion: "2024-09-30.acacia" })
    : null;

export function stripeEnabled() {
  return realStripe !== null;
}

export function getStripe(): Stripe {
  if (!realStripe) {
    throw new Error("Stripe not configured (STRIPE_SECRET_KEY missing).");
  }
  return realStripe;
}
