"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { requireAdmin } from "./auth";
import { assertTransition } from "./order-state";
import { sendEmail } from "./email";
import { makeToken } from "./tokens";
import { getSettings } from "./settings";
import {
  parentPaymentRequest,
  parentReject,
  parentFulfilled,
} from "./emails/templates";

const PAYMENT_LINK_DAYS = 14;

async function transition(
  orderId: string,
  toState: import("@prisma/client").OrderState,
  opts: {
    adminId: string;
    reason?: string;
    data?: Prisma.OrderUpdateInput;
  },
) {
  return prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId } });
    if (!o) throw new Error("Order not found");
    assertTransition(o.state, toState);
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { ...opts.data, state: toState },
      include: { items: true },
    });
    await tx.orderEvent.create({
      data: {
        orderId,
        fromState: o.state,
        toState,
        actorAdminId: opts.adminId,
        reason: opts.reason,
      },
    });
    return updated;
  });
}

export async function approveOrder(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const id = String(formData.get("id"));

  const updated = await transition(id, "approved", {
    adminId: me.id,
    data: {
      paymentToken: makeToken(),
      paymentLinkExpiresAt: new Date(
        Date.now() + PAYMENT_LINK_DAYS * 24 * 60 * 60 * 1000,
      ),
      reminderSentAt: null,
    },
  });

  const settings = await getSettings();
  await sendEmail({
    to: updated.parentEmail,
    ...parentPaymentRequest(updated, settings.storeName),
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/order/${updated.token}`);
}

export async function rejectOrder(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Reason required.");
  const updated = await transition(id, "rejected", {
    adminId: me.id,
    reason,
  });

  const settings = await getSettings();
  await sendEmail({
    to: updated.parentEmail,
    ...parentReject(updated, reason, settings.storeName),
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/order/${updated.token}`);
}

export async function markInProduction(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  await transition(id, "in_production", { adminId: me.id });
  revalidatePath(`/admin/orders/${id}`);
}

export async function markFulfilled(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  const updated = await transition(id, "fulfilled", { adminId: me.id });
  const settings = await getSettings();
  await sendEmail({
    to: updated.parentEmail,
    ...parentFulfilled(updated, settings.storeName),
  });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/order/${updated.token}`);
}

export async function markCompleted(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  await transition(id, "completed", { adminId: me.id });
  revalidatePath(`/admin/orders/${id}`);
}

export async function cancelOrder(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  await transition(id, "cancelled", { adminId: me.id });
  revalidatePath(`/admin/orders/${id}`);
}

// Re-issue a fresh paymentToken + push expiry out 14 days from now.
// Order must already be approved or payment_failed.
export async function regeneratePaymentLink(formData: FormData) {
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const id = String(formData.get("id"));

  const order = await prisma.order.update({
    where: { id },
    data: {
      paymentToken: makeToken(),
      paymentLinkExpiresAt: new Date(
        Date.now() + PAYMENT_LINK_DAYS * 24 * 60 * 60 * 1000,
      ),
      reminderSentAt: null,
    },
    include: { items: true },
  });

  await prisma.orderEvent.create({
    data: {
      orderId: id,
      fromState: order.state,
      toState: order.state,
      actorAdminId: me.id,
      reason: "Payment link regenerated",
    },
  });

  const settings = await getSettings();
  await sendEmail({
    to: order.parentEmail,
    ...parentPaymentRequest(order, settings.storeName),
  });

  revalidatePath(`/admin/orders/${id}`);
}
