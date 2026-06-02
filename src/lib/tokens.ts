// Single random URL token. 32 bytes → ~43 char base64url.
import { randomBytes } from "node:crypto";

export function makeToken(bytes = 32): string {
  return randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
