import Link from "next/link";
import { getCart, setQuantity, removeFromCart } from "@/lib/cart";
import { formatAud } from "@/lib/money";
import { PillLink } from "@/components/ui/Pill";
import { getCartLimits, effectivePerItemMax } from "@/lib/limits";

export default async function CartPage() {
  const cart = await getCart();
  const limits = await getCartLimits();
  const items = cart?.items ?? [];
  const total = items.reduce(
    (s, i) => s + i.product.priceCents * i.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <div className="container-content py-xxl max-w-2xl page-header">
        <div className="eyebrow">Cart</div>
        <h1>Your cart&rsquo;s empty.</h1>
        <p className="lede">Find something cool first.</p>
        <PillLink href="/" className="mt-lg">
          Back to the shop
        </PillLink>
      </div>
    );
  }

  return (
    <div className="container-content py-xxl grid md:grid-cols-3 gap-xl">
      <div className="md:col-span-2">
        <div className="page-header mb-lg">
          <div className="eyebrow">Cart</div>
          <h1>Your stuff so far</h1>
        </div>

        <ul className="divide-y divide-hairline border-y border-hairline">
          {items.map((item) => {
            const cap = effectivePerItemMax(
              limits.maxQtyPerLineItem,
              item.product.maxQtyPerOrder,
            );
            return (
              <li key={item.id} className="py-md flex flex-wrap items-center gap-md">
                <Link
                  href={`/product/${item.product.slug}`}
                  className="text-body font-semibold flex-1 min-w-[12ch]"
                >
                  {item.product.title}
                </Link>
                <div className="text-body-sm text-ink/60 whitespace-nowrap">
                  {formatAud(item.product.priceCents)} each
                </div>
                <form action={setQuantity} className="flex items-center gap-xs">
                  <input type="hidden" name="productId" value={item.productId} />
                  <input
                    name="quantity"
                    type="number"
                    min={0}
                    max={cap}
                    defaultValue={item.quantity}
                    className="field-input w-20"
                  />
                  <button className="pill-secondary text-body-sm" type="submit">
                    Update
                  </button>
                </form>
                <form action={removeFromCart}>
                  <input type="hidden" name="productId" value={item.productId} />
                  <button className="text-body-sm text-ink/60 underline" type="submit">
                    Remove
                  </button>
                </form>
              </li>
            );
          })}
        </ul>

        <p className="text-body-sm text-ink/60 mt-md">
          Up to {limits.maxQtyPerLineItem} of each thing, and{" "}
          {limits.maxDistinctItemsPerOrder} different things per order.
        </p>
      </div>

      <aside>
        <div className="card">
          <div className="caption text-ink/60 mb-sm">Summary</div>
          <div className="flex justify-between items-baseline">
            <span className="text-body">Total</span>
            <span className="text-[28px] font-semibold text-accent-magenta">
              {formatAud(total)}
            </span>
          </div>
          <p className="text-body-sm text-ink/60 mt-xs">
            AUD. No GST. Not charged yet.
          </p>
          <div className="mt-lg flex flex-col gap-xs">
            <PillLink href="/checkout">Checkout</PillLink>
            <PillLink href="/" variant="secondary">
              Keep shopping
            </PillLink>
          </div>
        </div>
      </aside>
    </div>
  );
}
