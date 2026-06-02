// Ensures the Postgres database in DATABASE_URL exists; if not, creates it.
// Lets `npm run dev` succeed on a fresh machine without manual psql steps.
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  for (const f of [".env.local", ".env"]) {
    if (existsSync(f)) {
      const text = readFileSync(f, "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
      }
    }
  }
}

loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Copy .env.example to .env first.");
  process.exit(1);
}

// psql rejects Prisma-flavored query params like ?schema=public — strip them.
function cleanForPsql(u) {
  const parsed = new URL(u);
  parsed.search = "";
  return parsed.toString();
}

const parsed = new URL(url);
const dbName = parsed.pathname.replace(/^\//, "");
const admin = new URL(url);
admin.pathname = "/postgres";

function psql(targetUrl, sql) {
  return execSync(`psql "${cleanForPsql(targetUrl)}" -tAc "${sql.replace(/"/g, '\\"')}"`, {
    stdio: ["ignore", "pipe", "pipe"],
  })
    .toString()
    .trim();
}

try {
  // Probe target DB.
  psql(url, "SELECT 1");
  process.exit(0);
} catch {
  // Try to create.
  try {
    const exists = psql(admin.toString(), `SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
    if (!exists) {
      console.log(`Creating database "${dbName}"…`);
      psql(admin.toString(), `CREATE DATABASE "${dbName}"`);
    }
    process.exit(0);
  } catch (err) {
    console.error("\nCould not connect to Postgres or create the database.");
    console.error("Make sure Postgres is running and DATABASE_URL is correct.");
    console.error("Tried:", url);
    console.error(String(err));
    process.exit(1);
  }
}
