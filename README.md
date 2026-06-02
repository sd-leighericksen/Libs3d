# Kids for Kids — 3D Print Store

An ecommerce store selling 3D-printed items, powered by kids, for kids.
Every order goes through a two-gate flow: an admin approval, then a
**parent**'s explicit yes and payment via Stripe. Nothing is printed until
both gates have closed.

This README only covers running it locally. Containerization, public
Stripe webhook routing, and the MinIO swap are layered on later.

## Local quick start

Prereqs:

- **Node 20+** (24 tested)
- **PostgreSQL** running on `localhost:5432` (Homebrew `postgresql@16` or similar)

Then:

```bash
cp .env.example .env
# edit DATABASE_URL to use your local OS user, e.g. postgresql://$(whoami)@localhost:5432/kidsforkids_db
npm install
npm run dev
```

`npm run dev` will, on first boot:

1. Create the `kidsforkids_db` database if it doesn't exist.
2. Apply Prisma migrations.
3. Seed: a `singleton` settings row, an admin user, two categories, two
   demo products (with a tiny placeholder STL so the 3D viewer works).
4. Start Next.js at <http://localhost:3000>.

The seed prints the starter credentials. The default is:

```
username: admin
password: change-me-now
```

Change it after first login at **`/admin/settings`** (or set
`SEED_ADMIN_PASSWORD` in `.env` before the first seed).

## Local-mode defaults

The project ships with three swappable backends. Each falls back to a
local-only stub when its real provider isn't configured, so the whole
order lifecycle can be exercised on a laptop:

| Subsystem | Default in dev          | Production swap                              |
| --------- | ----------------------- | -------------------------------------------- |
| Storage   | `./storage/` filesystem | MinIO (set `MINIO_*` and unset `STORAGE_BACKEND=local`) |
| Email     | Console-log every email | Postmark (set a real `POSTMARK_SERVER_TOKEN`) |
| Payments  | "Stub" — clicking Pay marks the order paid immediately | Stripe Checkout + webhook |

You can opt into one without opting into all three. e.g. real Stripe but
console-logged emails is fine.

## Useful scripts

```bash
npm run dev              # check db, migrate, seed, then next dev
npm run build            # production build (Prisma generate + migrate deploy + next build)
npm run db:studio        # Prisma Studio at :5555
npm run db:reset         # drop & re-create the DB, re-seed
npm run create-admin -- alice 's0me-strong-pw'
```

## Hooking up Stripe (when you're ready)

1. Get test keys from <https://dashboard.stripe.com>.
2. Set `STRIPE_SECRET_KEY=sk_test_…` in `.env`.
3. In another terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` in `.env`.
5. Restart `npm run dev`.

Public production webhooks require a real HTTPS URL — that's the only
piece deployment will add (Caddy/Traefik or Cloudflare Tunnel in front
of the app). Document the webhook URL in the Stripe dashboard before
flipping the switch.

## Payment reminders

A day-7 reminder for unpaid approved orders is at
`/api/cron/payment-reminders`. Hit it daily from cron / a scheduled
task / wrangler / etc.

Optional: set `CRON_SECRET=…` and pass it as `x-cron-secret:` header to
protect the endpoint.

## Key routes

| Path                           | What                                       |
| ------------------------------ | ------------------------------------------ |
| `/`                            | Home, featured products                    |
| `/category/[slug]`             | Category browse                            |
| `/product/[slug]`              | Product detail + STL preview viewer        |
| `/cart`                        | Cart with quantity caps                    |
| `/checkout`                    | Buyer + parent details, no payment         |
| `/order/[token]`               | Buyer status page                          |
| `/pay/[token]`                 | Parent payment landing                     |
| `/pay/[token]/done`            | Post-payment confirmation                  |
| `/how-it-works`                | The two-gate flow explained                |
| `/admin/...`                   | Admin panel (Auth.js credentials)          |
| `/api/webhooks/stripe`         | Stripe webhook                             |
| `/api/cron/payment-reminders`  | Day-7 reminder cron endpoint               |

## Order state machine

```
pending_review
  ├─ approved
  │    ├─ paid → in_production → fulfilled → completed
  │    └─ payment_failed → (approved again on resend)
  ├─ rejected
  └─ cancelled
```

Forward transitions are enforced in `src/lib/order-state.ts` and every
admin action runs through `transition()` in
`src/lib/admin-order-actions.ts`. State changes log an `OrderEvent` row
with actor + timestamp.
