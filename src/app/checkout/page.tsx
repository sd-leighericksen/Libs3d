import { redirect } from "next/navigation";
import { getCart } from "@/lib/cart";
import { submitCheckout } from "@/lib/order-actions";
import { formatAud } from "@/lib/money";
import { SelectionSummary } from "@/components/SelectionSummary";

export default async function CheckoutPage() {
  const cart = await getCart();
  if (!cart || cart.items.length === 0) redirect("/cart");

  const total = cart.items.reduce(
    (s, i) => s + i.product.priceCents * i.quantity,
    0,
  );

  return (
    <div className="container-content py-xxl grid md:grid-cols-3 gap-xl">
      <div className="md:col-span-2">
        <div className="page-header mb-xl">
          <div className="eyebrow">Checkout</div>
          <h1>Last bit — then over to your grown-up.</h1>
          <p className="lede">
            You won&rsquo;t pay anything here. We send the order to your
            grown-up for them to say yes and pay.
          </p>
        </div>

        <form action={submitCheckout} className="flex flex-col gap-lg">
          <fieldset className="card">
            <legend className="caption px-xs">About you</legend>
            <label className="field-label" htmlFor="buyerFirstName">
              Your first name
            </label>
            <input
              id="buyerFirstName"
              name="buyerFirstName"
              required
              maxLength={40}
              className="field-input"
            />
            <p className="field-help">
              We only need your first name — nothing else.
            </p>
          </fieldset>

          <fieldset className="card">
            <legend className="caption px-xs">Your grown-up</legend>
            <div className="grid sm:grid-cols-2 gap-md">
              <div>
                <label className="field-label" htmlFor="parentFirstName">
                  Their first name
                </label>
                <input
                  id="parentFirstName"
                  name="parentFirstName"
                  required
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="parentEmail">
                  Their email
                </label>
                <input
                  id="parentEmail"
                  name="parentEmail"
                  type="email"
                  required
                  className="field-input"
                />
                <p className="field-help">
                  This is the address we email to say yes and pay.
                </p>
              </div>
            </div>
          </fieldset>

          <fieldset className="card">
            <legend className="caption px-xs">Getting it to you</legend>
            <div className="flex items-start gap-sm text-body">
              <span className="mt-0.5 text-accent-magenta">📍</span>
              <div>
                <p className="font-semibold">Pickup only — Delacombe</p>
                <p className="text-body-sm text-ink/70 mt-xs">
                  Once your order is ready we&rsquo;ll send pickup instructions
                  to your grown-up&rsquo;s email.
                </p>
              </div>
            </div>
            {/* hidden so the server action still receives the field */}
            <input type="hidden" name="deliveryMethod" value="collect" />
          </fieldset>

          <fieldset className="card">
            <legend className="caption px-xs">Anything to tell us?</legend>
            <textarea
              name="note"
              className="field-textarea"
              rows={3}
              placeholder="Colour preferences, who it's for, anything else."
            />
          </fieldset>

          <div>
            <button className="pill-primary" type="submit">
              Send to my grown-up
            </button>
          </div>
        </form>
      </div>

      <aside>
        <div className="card">
          <div className="caption text-ink/60 mb-sm">Your order</div>
          <ul className="text-body-sm divide-y divide-hairline-soft">
            {cart.items.map((i) => (
              <li key={i.id} className="py-xs flex justify-between gap-md">
                <span>
                  {i.quantity} × {i.product.title}
                  <SelectionSummary
                    selections={i.selections}
                    className="mt-xxs flex flex-col gap-xxs"
                  />
                </span>
                <span className="whitespace-nowrap">
                  {formatAud(i.product.priceCents * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-md pt-md border-t border-hairline flex justify-between items-baseline">
            <span className="text-body">Total</span>
            <span className="text-[24px] font-semibold text-accent-magenta">
              {formatAud(total)}
            </span>
          </div>
          <p className="text-body-sm text-ink/60 mt-xs">
            AUD. Nothing&rsquo;s charged yet.
          </p>
        </div>
      </aside>
    </div>
  );
}
