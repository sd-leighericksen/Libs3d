import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { prisma } from "@/lib/db";
import { formatAud } from "@/lib/money";
import { addToCart } from "@/lib/cart";
import { getCartLimits, effectivePerItemMax } from "@/lib/limits";
import { StlViewerLoader } from "@/components/StlViewerLoader";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });
  if (!product || product.archivedAt) notFound();

  const limits = await getCartLimits();
  const cap = effectivePerItemMax(
    limits.maxQtyPerLineItem,
    product.maxQtyPerOrder,
  );

  return (
    <div className="container-content py-xxl">
      <nav className="text-body-sm text-ink/60 mb-lg flex gap-xs items-center">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-ink">{product.title}</span>
      </nav>

      <div className="grid md:grid-cols-12 gap-xl">
        {/* Media column */}
        <div className="md:col-span-7 flex flex-col gap-md">
          <div className="rounded-lg overflow-hidden bg-surface-soft aspect-square border border-hairline">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-body-sm text-ink/60">
                No image yet
              </div>
            )}
          </div>
          {product.previewStlUrl && (
            <StlViewerLoader
              url={product.previewStlUrl}
              posterUrl={product.images[0]?.url ?? null}
              className="aspect-video w-full"
            />
          )}
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-xs">
              {product.images.slice(1).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.alt}
                  className="aspect-square w-full object-cover rounded-sm bg-surface-soft border border-hairline"
                />
              ))}
            </div>
          )}
        </div>

        {/* Details column */}
        <div className="md:col-span-5">
          <div className="caption text-ink/60 mb-xs">{product.category.name}</div>
          <h1 className="text-[36px] md:text-[44px] leading-tight font-semibold tracking-tight">
            {product.title}
          </h1>
          <div className="mt-md flex items-baseline gap-sm">
            <span className="text-[28px] font-semibold text-accent-magenta">
              {formatAud(product.priceCents)}
            </span>
            <span className="text-body-sm text-ink/60">AUD</span>
          </div>

          {product.description && (
            <div className="prose prose-neutral mt-lg text-body max-w-none">
              <ReactMarkdown>{product.description}</ReactMarkdown>
            </div>
          )}

          {!product.available ? (
            <p className="card mt-lg text-body">
              This one&rsquo;s on a little break — back soon.
            </p>
          ) : (
            <form action={addToCart} className="mt-xl card flex flex-wrap items-end gap-md">
              <input type="hidden" name="productId" value={product.id} />
              <div>
                <label className="field-label" htmlFor="quantity">
                  How many?
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  defaultValue={1}
                  min={1}
                  max={cap}
                  className="field-input w-24"
                />
                <p className="field-help">Up to {cap} of this one.</p>
              </div>
              <button type="submit" className="pill-primary">
                Add to cart
              </button>
            </form>
          )}

          <div className="mt-lg card-accent">
            <div className="caption mb-xs">Before anything is printed</div>
            <p className="text-body-sm">
              Your grown-up gets an email after checkout. They say yes and
              pay. Nothing is asked, charged, or made until they have.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
