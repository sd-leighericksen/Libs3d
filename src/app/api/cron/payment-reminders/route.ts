// Send day-7 nudge to parents on still-unpaid approved orders.
// Call with: `curl -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/payment-reminders`
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { parentReminder } from "@/lib/emails/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMINDER_AFTER_DAYS = 7;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const cutoff = new Date(Date.now() - REMINDER_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const due = await prisma.order.findMany({
    where: {
      state: "approved",
      reminderSentAt: null,
      updatedAt: { lte: cutoff },
      paymentLinkExpiresAt: { gt: new Date() },
    },
    include: { items: true },
  });

  const settings = await getSettings();
  let sent = 0;
  for (const o of due) {
    try {
      await sendEmail({
        to: o.parentEmail,
        ...parentReminder(o, settings.storeName),
      });
      await prisma.order.update({
        where: { id: o.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error("reminder failed for", o.id, err);
    }
  }

  return NextResponse.json({ sent, scanned: due.length });
}
