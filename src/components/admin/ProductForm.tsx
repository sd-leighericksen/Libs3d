import type { Category, Product, ProductImage } from "@prisma/client";

type Props = {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  product?: Product & { images: ProductImage[] };
  archiveAction?: (formData: FormData) => Promise<void>;
  unarchiveAction?: (formData: FormData) => Promise<void>;
  deleteImageAction?: (formData: FormData) => Promise<void>;
};

export function ProductForm({
  action,
  categories,
  product,
  archiveAction,
  unarchiveAction,
  deleteImageAction,
}: Props) {
  return (
    <div className="flex flex-col gap-xl">
      <form action={action} className="flex flex-col gap-md" encType="multipart/form-data">
        {product && <input type="hidden" name="id" value={product.id} />}

        <div className="grid md:grid-cols-2 gap-md">
          <div>
            <label className="field-label">Title</label>
            <input
              name="title"
              required
              defaultValue={product?.title}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Price (cents)</label>
            <input
              name="priceCents"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={product?.priceCents ?? 0}
              className="field-input"
            />
            <p className="field-help">
              Whole cents. e.g. <code>600</code> = $6.00 AUD.
            </p>
          </div>
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            name="description"
            defaultValue={product?.description}
            className="field-textarea"
            rows={6}
          />
          <p className="field-help">Markdown is fine.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-md">
          <div>
            <label className="field-label">Category</label>
            <select
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ""}
              className="field-input"
            >
              <option value="" disabled>
                Pick one…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Max per order (optional)</label>
            <input
              name="maxQtyPerOrder"
              type="number"
              min={1}
              defaultValue={product?.maxQtyPerOrder ?? ""}
              className="field-input"
            />
            <p className="field-help">Overrides the global per-item cap.</p>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-sm">
              <input
                type="checkbox"
                name="available"
                value="true"
                defaultChecked={product?.available ?? true}
                className="h-5 w-5"
              />
              <span className="text-body-sm">Available to buy</span>
            </label>
          </div>
        </div>

        <fieldset className="card-hairline">
          <legend className="px-xs caption">STL files</legend>
          <p className="text-body-sm">
            Upload a <strong>preview</strong> (low-poly, public, used by the
            viewer) <em>and</em> a <strong>production</strong> file (the real
            one, kept private). If you skip the preview, the viewer is hidden
            so nobody can scrape the production file.
          </p>
          <div className="grid md:grid-cols-2 gap-md mt-md">
            <div>
              <label className="field-label">Preview STL (public)</label>
              <input
                name="previewStl"
                type="file"
                accept=".stl"
                className="field-input"
              />
              {product?.previewStlUrl && (
                <p className="field-help">Current: {product.previewStlUrl}</p>
              )}
            </div>
            <div>
              <label className="field-label">Production STL (private)</label>
              <input
                name="productionStl"
                type="file"
                accept=".stl"
                className="field-input"
              />
              {product?.productionStlKey && (
                <p className="field-help">
                  Current key: <code>{product.productionStlKey}</code>
                </p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className="card-hairline">
          <legend className="px-xs caption">Images</legend>
          <input
            name="images"
            type="file"
            accept="image/*"
            multiple
            className="field-input"
          />
          <p className="field-help">First image is the hero.</p>
        </fieldset>

        <div>
          <button type="submit" className="pill-primary">
            {product ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>

      {product && (
        <>
          {product.images.length > 0 && deleteImageAction && (
            <section>
              <h3 className="text-headline mb-md">Current images</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-md">
                {product.images.map((img) => (
                  <div key={img.id} className="flex flex-col gap-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="aspect-square object-cover rounded-md border border-hairline"
                    />
                    <form action={deleteImageAction}>
                      <input type="hidden" name="id" value={img.id} />
                      <button className="text-body-sm underline" type="submit">
                        Remove
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          )}

          {archiveAction && unarchiveAction && (
            <form action={product.archivedAt ? unarchiveAction : archiveAction}>
              <input type="hidden" name="id" value={product.id} />
              <button
                type="submit"
                className="pill-secondary text-body-sm border border-hairline"
              >
                {product.archivedAt ? "Unarchive" : "Archive product"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
