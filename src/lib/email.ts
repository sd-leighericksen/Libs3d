// Postmark when POSTMARK_SERVER_TOKEN is real; otherwise console-log every
// email so the whole flow works locally without configuring Postmark.
import { ServerClient } from "postmark";

const token = process.env.POSTMARK_SERVER_TOKEN;
const fromEmail = process.env.POSTMARK_FROM_EMAIL ?? "hello@example.com";
const enabled =
  !!token && !token.startsWith("your_") && process.env.EMAIL_BACKEND !== "log";

const client = enabled ? new ServerClient(token!) : null;

export type EmailPayload = {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  tag?: string;
};

export async function sendEmail(payload: EmailPayload) {
  if (!client) {
    const line = `\n────── ✉ EMAIL (${payload.tag ?? "untagged"}) ──────\nTo: ${payload.to}\nSubject: ${payload.subject}\n\n${payload.textBody}\n──────────────────────────\n`;
    console.log(line);
    return { ok: true as const, dev: true };
  }
  await client.sendEmail({
    From: fromEmail,
    To: payload.to,
    Subject: payload.subject,
    TextBody: payload.textBody,
    HtmlBody: payload.htmlBody ?? `<pre>${payload.textBody}</pre>`,
    Tag: payload.tag,
    MessageStream: "outbound",
  });
  return { ok: true as const, dev: false };
}

export function appBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000"
  );
}
