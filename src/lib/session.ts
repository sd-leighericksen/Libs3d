// Anonymous cart session id, kept in an httpOnly cookie.
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

const COOKIE = "kfk_sid";

export async function getOrCreateSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;
  const id = randomBytes(24).toString("base64url");
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return id;
}

export async function getSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}
