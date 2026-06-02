# Project Brief — Kids-for-Kids 3D Print Store

## 0. How to use this brief

This document is the functional and technical specification for the build. A separate `design.md` provides all visual direction (colours, typography, spacing, components, layout). Where this brief and `design.md` disagree on anything visual, `design.md` wins. Where they disagree on behaviour or data, this brief wins.

**You (the agent) are responsible for writing all user-facing copy** in the voice defined in §11. Do not leave lorem ipsum or placeholder text anywhere.

Build in vertical slices: get a single product through the entire flow (browse → cart → order → admin approval → parent payment → paid) before broadening. Do not build the admin panel and the storefront as two disconnected halves.

---

## 1. What this is

An ecommerce store selling 3D-printed items. It is **powered by kids, for kids**: the products are made by children, and the buyers are other children (classmates, friends at school). Because children are buying, **no order can be paid for until that child's parent or guardian approves and pays**.

The storefront should look and behave like a conventional ecommerce site — categories, products, cart, checkout. The difference is entirely in what happens *after* a child submits an order: a two-stage gate before any money changes hands.

### Why it works this way (context for the build)

The owner is the parent of the child running the store. The gating exists to prevent a child buyer adding a huge quantity and forcing an expensive print run, and to ensure no child spends money without their own parent's explicit yes. Both gates below serve that purpose.

### Confirmed parameters

1. **Buyer = a child.** They browse and build a cart but cannot pay.
2. **Verifying adult = the buyer's own parent/guardian**, whose email the child enters at checkout.
3. **Admin approval happens *before* the parent is asked to pay** (see §4).
4. **Products are made to order.** No inventory tracking. Each product has a simple available / unavailable toggle.
5. **Minimal data on children:** collect the buyer's **first name only**. All other contact details (name, email, delivery) belong to the parent.
6. **No GST.** Prices are final. No tax lines, no tax calculation.
7. Single currency: AUD.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Server components for storefront, server actions / route handlers for mutations |
| Styling | Tailwind CSS + shadcn/ui | Follow `design.md` for tokens |
| Database | PostgreSQL | Via Prisma ORM (schema-first, migrations) |
| Auth (admin) | Auth.js (NextAuth) — Credentials provider | Do **not** hand-roll auth. Hash with argon2id/bcrypt, server-side sessions |
| Payments | Stripe Checkout Sessions | Parent pays via a hosted Stripe link. Confirm via webhook, never client-side |
| Email | Postmark | Transactional only |
| 3D viewer | three.js via react-three-fiber + drei `STLLoader` | Renders a **preview** mesh only (see §6) |
| Object storage | MinIO (S3-compatible), self-hosted in the stack | Images + STL files. Production STL stored privately |
| Validation | Zod | Validate every form input and every webhook payload |

---

## 3. Deployment — Docker

The whole system runs in Docker, intended for self-hosting (homelab).

**`docker-compose` services:**
- `app` — the Next.js application (production build).
- `db` — PostgreSQL with a persistent volume.
- `storage` — MinIO with a persistent volume (buckets: `public-assets` for images and preview STLs, `private-stl` for production STLs).
- Optional `proxy` — Caddy or Traefik for HTTPS termination and routing.

**Configuration:** all secrets and connection strings via environment variables / `.env` (Stripe keys, Postmark token, DB URL, MinIO credentials, Auth.js secret). Provide a `.env.example`. Never commit real secrets.

**Critical deployment note — Stripe webhooks need a public HTTPS endpoint.** Stripe must be able to reach `/api/webhooks/stripe` from the public internet over HTTPS to confirm payments. Self-hosting therefore requires either a reverse proxy with a real domain + TLS (Caddy/Traefik) or a tunnel (e.g. Cloudflare Tunnel). Document the webhook URL the operator must register in the Stripe dashboard. For local development, instruct use of the Stripe CLI to forward webhooks.

Provide: `Dockerfile` (multi-stage, slim production image), `docker-compose.yml`, a migration/seed step on first boot, and a short `README` covering setup, env vars, the Stripe webhook registration step, and how to create the first admin user.

---

## 4. Order lifecycle (the core of the build)

The most important part of the spec. Implement it as an explicit state machine; do not set states ad hoc from scattered code.

```
pending_review                 buyer submitted; awaiting admin
   ├─ approved          →      admin approved; sends parent payment email
   │     ├─ paid        →      Stripe webhook confirmed payment
   │     │    ├─ in_production
   │     │    ├─ fulfilled
   │     │    └─ completed
   │     └─ payment_failed
   ├─ rejected                 admin declined (with reason)
   └─ cancelled
```

**The two gates, in order:**

1. **Gate 1 — Admin approval.** Every new order lands in `pending_review`. An admin must approve before anything else happens. Approving moves it to `approved` and **fires the payment-request email to the parent**. Rejecting moves it to `rejected` and emails the parent the reason.
2. **Gate 2 — Parent payment.** The parent receives the email, opens `/pay/[token]`, reviews the order, and pays via Stripe Checkout. The Stripe webhook `checkout.session.completed` moves the order to `paid`.

**Hard rule:** the parent is never asked to pay until an admin has approved. The approve action is the *only* thing that can send the payment email, and that email is the *only* thing that sends it. Keep that coupling explicit and one-directional.

**Tokens & links**
- Each order has a long random `token` (buyer status page) and a separate `paymentToken` (parent payment link). Unguessable, single-purpose.
- The payment link stays valid for **14 days**. A reminder email goes to the parent at **day 7** if still unpaid. After 14 days the link is dead and the parent is shown a "this link has expired, please contact the store" message; the order stays `approved` so an admin can resend a fresh link.
- Never put order ids, emails, or any personal data in URLs as plain query params. Only opaque tokens.

---

## 5. Quantity guardrails

To stop a buyer ordering an absurd quantity and forcing a large print run, enforce limits **at the cart and again on the server** (never trust the client alone):

- **Max quantity per line item** — configurable, default 5.
- **Max distinct items per order** — configurable, default 10.
- Optional per-product override of the per-line-item max.

These limits are the first line of defence; admin approval (§4) is the second. Limits live in an editable settings area (§7).

---

## 6. Product page & the 3D / STL viewer

**Product page shows:** title, description, price, image gallery, and an interactive 3D view.

**The 3D viewer — read carefully.**

The product *is* the printable file. If the page serves the real production STL, anyone can extract it from the browser and print it without paying. **The public 3D viewer must never load the sellable file, and the production STL must never be publicly downloadable.**

Two distinct files per product:
- **Preview STL (public):** a decimated / low-poly mesh, good enough to rotate and inspect, useless for production printing. The `STLLoader` viewer loads this from the public bucket.
- **Production STL (private):** the real file, in the private MinIO bucket, never exposed via a public URL, accessible only to authenticated admins. This is what the operation prints from.

The admin product form takes both uploads. If only a production file is provided, do **not** silently expose it — warn the admin that no public preview exists and keep the production file private.

**Viewer behaviour**
- Lazy-load the viewer; don't block product page render on a mesh download.
- Reject preview STL uploads over a small size cap (e.g. a few MB).
- Static poster image fallback for no-WebGL / slow connections.
- Sensible default camera, orbit controls, auto-centre and auto-scale the mesh.

---

## 7. Admin panel (backend)

Protected behind Auth.js.

**Admins**
- **Multiple admins, all equal** — one role, no hierarchy. Any admin can do anything, including managing other admins.
- An **admin management** area (in Settings) to add and remove admins.
- Passwords hashed (argon2id/bcrypt). Rate-limit login attempts. No public sign-up.
- Guardrail: the system must never be left with zero admins — block removal of the last remaining admin.
- The first admin is created via the seed/setup step documented in the README.

**Capabilities**
- **Products** — create, edit, archive. Fields: title, slug, description (rich text), price, category, images (multiple, ordered), preview STL upload, production STL upload (private), available toggle, optional per-product quantity cap.
- **Categories** — create, edit, reorder, archive.
- **Orders** — the operational heart:
  - List with filters by state, newest first, plus a prominent "needs your action" view (everything in `pending_review`).
  - Order detail: line items, buyer first name, parent details, delivery method, totals, full state history with timestamps and which admin acted.
  - **Approve** (→ sends parent payment email) and **Reject** (required reason) actions.
  - Post-payment: mark `in_production`, `fulfilled`, `completed`.
  - Resend / regenerate the payment link.
- **Settings** — quantity limits (§5), admin management, store details used in copy/emails.
- **Dashboard** — counts by state, especially orders awaiting approval.

Every state transition is logged with actor and timestamp.

---

## 8. Storefront (public)

Conventional ecommerce, styled per `design.md`.

**Pages / routes**
- `/` — home: featured products, categories, hero
- `/how-it-works` — explains the order → approval → parent payment process (see §11)
- `/category/[slug]` — products in a category, basic sort/filter
- `/product/[slug]` — product detail (§6)
- `/cart` — line items, quantities (respecting §5 limits), total
- `/checkout` — buyer + parent details, order submission (no payment here)
- `/order/[token]` — order status page the buyer revisits via a tokenised link
- `/pay/[token]` — the parent's payment landing page
- Standard: `/about`, `/contact`, terms, privacy

**Cart**
- Client cart persisted to a cookie/`localStorage` plus a server-side cart record keyed to an anonymous session id.
- Quantity adjust, remove, live total, enforced quantity limits.

**Checkout (order submission, not payment)**
The buyer provides:
- **Buyer first name** (only personal data collected about the child)
- **Parent/guardian first name**
- **Parent/guardian email** (required — the verifying adult)
- **Delivery method:** "Collect at school" (default) or "Deliver" → parent delivery address
- Optional order note

On submit: create an `Order` in `pending_review`. **No payment, no card details.** Redirect to `/order/[token]` ("Your order is waiting to be approved"). Email the admin and a confirmation to the parent (§9).

---

## 9. Email (Postmark)

All transactional. Each is a Postmark template, written in the voice in §11.

| Trigger | To | Purpose |
|---|---|---|
| Order submitted | Admin | "New order needs approving" + link to admin order |
| Order submitted | Parent | "We've got the order, it's being checked" |
| Admin approves | **Parent** | The payment request — link to `/pay/[token]`. The gated email. |
| Admin rejects | Parent | "This order can't go ahead" + reason |
| Payment succeeded (webhook) | Parent | Confirmation / receipt |
| Payment reminder (day 7) | Parent | Gentle nudge, link still live |
| Order fulfilled | Parent | Optional "it's ready / on its way" |

---

## 10. Payments (Stripe)

- Parent pays through a **Stripe Checkout Session** created server-side when they open `/pay/[token]`.
- The child never touches card fields. No card data hits our servers.
- **Source of truth is the Stripe webhook**, not the client redirect. Handle `checkout.session.completed` and `async_payment_failed`. Verify the webhook signature. Only the webhook moves an order to `paid`.
- Make transitions idempotent against duplicate webhook deliveries.
- Store the Stripe session / payment intent id against the order.
- Amounts stored as integer cents. No floats. No tax (§1.6).

---

## 11. Copy & voice (you write all of it)

Write every piece of user-facing text. No placeholders.

**Voice**
- Audience is school-age kids, so: friendly, warm, simple, encouraging. Short sentences, plain words, no jargon.
- Not babyish or condescending — these are capable kids, some are tweens.
- Parent-facing text (payment email, payment page, why-we-do-this) can be a touch more grown-up, but stays warm and plainly explains what's expected.
- Honest and clear about the unusual process: a kid orders, their grown-up gets an email, the grown-up says yes and pays, then it gets made.

**The "How it works" page must clearly cover:**
1. Pick what you like and add it to your cart.
2. At checkout, pop in your grown-up's email (a grown-up has to say yes first).
3. The shop checks your order.
4. Your grown-up gets an email to approve it and pay.
5. Once it's paid, we print it and get it to you.

Plus a short parent-facing section explaining *why*: kids can't spend money without a parent's okay, you approve and pay, nothing gets printed until payment is made. Reassuring, not legalistic.

**Also write:** product/category descriptions can be left to the admin, but all UI microcopy (buttons, empty states, form labels, error and success messages, the order status page, the payment page, confirmation screens) is yours to write in voice. Make the order-status and payment pages especially clear, since the flow is unfamiliar.

---

## 12. Legal / privacy — flag, do not assume solved

Even with minimal data, this involves children. The Australian Privacy Act / APPs apply, and a Children's Online Privacy Code is in development. Collecting only the child's first name and routing consent + payment through the parent is the right instinct and reduces exposure, but it is not legal sign-off. Provide a clear, plain-language privacy policy and get proper advice before launch. (Out of scope to *solve* in the build; just don't make it worse.)

---

## 13. Data model (starting point)

```
Category(id, slug, name, description, imageUrl, sortOrder, archivedAt)

Product(id, slug, title, description, priceCents, categoryId,
        previewStlUrl, productionStlKey /* private */,
        available, maxQtyPerOrder?, archivedAt)
ProductImage(id, productId, url, alt, sortOrder)

Cart(id, sessionId, createdAt)
CartItem(id, cartId, productId, quantity)

Order(id, token, paymentToken, state,
      buyerFirstName,
      parentFirstName, parentEmail,
      deliveryMethod /* collect | deliver */, deliveryAddress?,
      note, totalCents,
      stripeSessionId?, stripePaymentIntentId?,
      paymentLinkExpiresAt, createdAt, updatedAt)
OrderItem(id, orderId, productId, titleSnapshot, unitPriceCents, quantity)
OrderEvent(id, orderId, fromState, toState, actorAdminId?, reason?, createdAt)

AdminUser(id, username, passwordHash, createdAt)

Settings(id, maxQtyPerLineItem, maxDistinctItemsPerOrder,
         storeName, storeContactEmail, ...)
```

Snapshot product title and price onto `OrderItem` at order time so later edits don't rewrite historical orders.

---

## 14. Non-functional

- TypeScript strict mode. Zod-validate all inputs and webhook payloads.
- Server-authoritative pricing, quantity limits, and state transitions — never trust the client for money, limits, or state.
- Secrets via env vars only.
- Accessible: keyboard nav, focus states, alt text; the 3D viewer needs a non-WebGL fallback.
- Responsive, mobile-first (kids will be on phones).
- Rate limiting on checkout submission, admin login, and payment endpoints.
- Seed script: first admin user, a couple of categories, a couple of products (with a real preview STL) so the whole flow is testable immediately.

---

## 15. Build order (suggested)

1. Schema + migrations + seed; Docker compose (app, db, storage) up and running.
2. Admin auth + admin management + product/category CRUD (incl. dual STL upload).
3. Storefront browse → product page (preview-only 3D viewer) → cart (with quantity limits).
4. Checkout → create `Order` (`pending_review`) → admin + parent emails.
5. Admin order list + approve/reject → parent payment email on approval.
6. `/pay/[token]` → Stripe Checkout → webhook → `paid` → confirmation email.
7. Post-payment states, payment reminder + expiry, the How it works page, copy pass, polish.

Get one product through steps 1–6 end to end before widening scope.
