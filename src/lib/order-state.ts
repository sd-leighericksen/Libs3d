import type { OrderState } from "@prisma/client";

// Allowed forward transitions. Anything outside this map throws.
const ALLOWED: Record<OrderState, OrderState[]> = {
  pending_review: ["approved", "rejected", "cancelled"],
  approved: ["paid", "payment_failed", "cancelled"],
  paid: ["in_production", "cancelled"],
  in_production: ["fulfilled", "cancelled"],
  fulfilled: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
  payment_failed: ["approved", "cancelled"],
};

export function canTransition(from: OrderState, to: OrderState): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderState, to: OrderState) {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal order transition: ${from} → ${to}`);
  }
}

export const STATE_LABEL: Record<OrderState, string> = {
  pending_review: "Waiting for shop check",
  approved: "Waiting on grown-up payment",
  paid: "Paid",
  in_production: "Being printed",
  fulfilled: "Ready / on its way",
  completed: "Done",
  rejected: "Can't go ahead",
  cancelled: "Cancelled",
  payment_failed: "Payment didn't work",
};
