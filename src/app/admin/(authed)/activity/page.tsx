import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// Short human label per action prefix, used for the coloured tag.
function tone(action: string): "ok" | "alert" | "info" {
  if (action.startsWith("auth.")) return "ok";
  if (action.includes("delete")) return "alert";
  return "info";
}

export default async function ActivityPage() {
  // Admin-only: the audit trail can expose who did what.
  if (!(await requireRole("admin"))) redirect("/admin");

  const entries = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="stack-section">
      <section>
        <div className="eyebrow mb-md">Activity</div>
        <h1 className="text-display-lg">What&rsquo;s been happening</h1>
        <p className="text-body text-ink/70 mt-sm max-w-[60ch]">
          Logins, product and category changes, order moves and user changes —
          newest first, last 200 events.
        </p>
      </section>

      <section>
        {entries.length === 0 ? (
          <p className="text-body text-ink/70">Nothing logged yet.</p>
        ) : (
          <ul className="divide-y divide-hairline border-y border-hairline">
            {entries.map((e) => (
              <li key={e.id} className="py-sm flex items-center gap-md">
                <span className="status" data-tone={tone(e.action)}>
                  {e.action}
                </span>
                <span className="text-body-sm flex-1">{e.summary}</span>
                <span className="caption text-ink/50 whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
