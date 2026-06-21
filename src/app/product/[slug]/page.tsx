import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { prisma } from "@/lib/db";
import { formatAud } from "@/lib/money";
import { addToCart } from "@/lib/cart";
import { StlViewerLoader } from "@/components/StlViewerLoader";
import { Reveal } from "@/components/motion/Reveal";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { ColorChips } from "@/components/ColorChips";
import { optionFieldName } from "@/lib/product-options";

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
      options: {
        orderBy: { sortOrder: "asc" },
        include: {
          allowedColors: {
            where: { available: true, archivedAt: null },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      },
    },
  });
  if (!product || product.archivedAt) notFound();

  // Full available palette — used as the fallback for options that don't
  // restrict their colours.
  const allColors =
    product.options.length > 0
      ? await prisma.colorOption.findMany({
          where: { available: true, archivedAt: null },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        })
      : [];


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
        <Reveal as="div" className="md:col-span-5" y={20}>
          <div className="caption text-ink/60 mb-xs">{product.category.name}</div>
          <AnimatedHeadline
            text={product.title}
            by="words"
            delay={0.05}
            className="text-[36px] md:text-[44px] leading-tight font-semibold tracking-tight"
          />
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
            <form action={addToCart} className="mt-xl card flex flex-col gap-lg">
              <input type="hidden" name="productId" value={product.id} />

              {product.options.map((option) => {
                // Restricted palette for this option, or the whole one.
                const optColors =
                  option.allowedColors.length > 0
                    ? option.allowedColors
                    : allColors;
                return (
                  <fieldset key={option.id} className="flex flex-col gap-sm">
                    <legend className="field-label mb-xs">
                      {option.label}
                      {option.required && (
                        <span className="text-accent-magenta"> *</span>
                      )}
                    </legend>
                    <div className="flex flex-col gap-md">
                      {Array.from({ length: option.slots }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-xs">
                          {option.slots > 1 && (
                            <span className="caption text-ink/60">
                              {option.label} {i + 1}
                            </span>
                          )}
                          <ColorChips
                            name={optionFieldName(option.id, i)}
                            colors={optColors}
                            required={option.required}
                          />
                        </div>
                      ))}
                    </div>
                  </fieldset>
                );
              })}

              {/* Quantity is always 1 here; adjust in the cart if needed. */}
              <div>
                <button type="submit" className="pill-primary">
                  Add to cart
                </button>
              </div>
            </form>
          )}

          <div className="mt-lg card-accent">
            <div className="caption mb-xs">Before anything is printed</div>
            <p className="text-body-sm">
              Your grown-up gets an email after checkout. They say yes and
              pay. Nothing is asked, charged, or made until they have.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
