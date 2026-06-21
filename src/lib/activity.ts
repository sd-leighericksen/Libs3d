import { prisma } from "./db";

type LogInput = {
  actorId?: string | null;
  actorName?: string;
  action: string;
  summary: string;
};

/**
 * Append an entry to the activity log. Best-effort: a logging failure must never
 * break the action being logged, so all errors are swallowed.
 */
export async function logActivity(input: LogInput) {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorName: input.actorName?.trim() || "system",
        action: input.action,
        summary: input.summary,
      },
    });
  } catch {
    // Intentionally ignored.
  }
}
