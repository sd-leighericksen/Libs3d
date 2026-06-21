import type {
  Category,
  ColorOption,
  Product,
  ProductImage,
  ProductOption,
} from "@prisma/client";

type OptionWithColors = ProductOption & { allowedColors: ColorOption[] };

type Props = {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  product?: Product & { images: ProductImage[] };
  options?: OptionWithColors[];
  /** Full available colour palette, for the per-option allow-list. */
  palette?: ColorOption[];
  archiveAction?: (formData: FormData) => Promise<void>;
  unarchiveAction?: (formData: FormData) => Promise<void>;
  deleteImageAction?: (formData: FormData) => Promise<void>;
  addOptionAction?: (formData: FormData) => Promise<void>;
  deleteOptionAction?: (formData: FormData) => Promise<void>;
  setOptionColorsAction?: (formData: FormData) => Promise<void>;
  /** Admin-only hard delete; omit for shopkeepers. */
  deleteAction?: (formData: FormData) => Promise<void>;
};

export function ProductForm({
  action,
  categories,
  product,
  options = [],
  palette = [],
  archiveAction,
  unarchiveAction,
  deleteImageAction,
  addOptionAction,
  deleteOptionAction,
  setOptionColorsAction,
  deleteAction,
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

          {addOptionAction && deleteOptionAction && (
            <section>
              <h3 className="text-headline mb-xs">Product options</h3>
              <p className="field-help mb-md">
                Buyer-chosen colours, picked from the shared{" "}
                <a href="/admin/colors" className="underline">
                  Colours palette
                </a>
                . Use <strong>slots</strong> for repeated picks — e.g. a
                keystone-colours option with 9 slots shows nine colour pickers.
              </p>

              {options.length > 0 && (
                <ul className="divide-y divide-hairline-soft border-y border-hairline-soft mb-md">
                  {options.map((o) => {
                    const allowedIds = new Set(o.allowedColors.map((c) => c.id));
                    return (
                      <li key={o.id} className="py-md flex flex-col gap-sm">
                        <div className="flex items-center justify-between gap-md">
                          <div>
                            <span className="text-body font-semibold">{o.label}</span>
                            <span className="text-body-sm text-ink/60">
                              {" "}
                              · {o.slots} {o.slots === 1 ? "slot" : "slots"} ·{" "}
                              {o.required ? "required" : "optional"} ·{" "}
                              {allowedIds.size === 0
                                ? "all colours"
                                : `${allowedIds.size} colour${allowedIds.size === 1 ? "" : "s"}`}
                            </span>
                          </div>
                          <form action={deleteOptionAction}>
                            <input type="hidden" name="id" value={o.id} />
                            <button type="submit" className="text-body-sm underline">
                              Remove
                            </button>
                          </form>
                        </div>

                        {setOptionColorsAction && palette.length > 0 && (
                          <details className="text-body-sm">
                            <summary className="cursor-pointer text-ink/70">
                              Limit colours
                            </summary>
                            <form
                              action={setOptionColorsAction}
                              className="mt-sm flex flex-col gap-sm"
                            >
                              <input type="hidden" name="optionId" value={o.id} />
                              <PaletteChecks
                                palette={palette}
                                selectedIds={allowedIds}
                              />
                              <p className="field-help">
                                None ticked = every available colour is allowed.
                              </p>
                              <div>
                                <button
                                  type="submit"
                                  className="pill-secondary text-body-sm"
                                >
                                  Save colours
                                </button>
                              </div>
                            </form>
                          </details>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <form
                action={addOptionAction}
                className="flex flex-col gap-md border-t border-hairline-soft pt-md"
              >
                <input type="hidden" name="productId" value={product.id} />
                <div className="grid sm:grid-cols-4 gap-md items-end">
                  <div className="sm:col-span-2">
                    <label className="field-label">Label</label>
                    <input
                      name="label"
                      required
                      placeholder="Base colour"
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">Slots</label>
                    <input
                      name="slots"
                      type="number"
                      min={1}
                      max={20}
                      defaultValue={1}
                      className="field-input"
                    />
                  </div>
                  <label className="inline-flex items-center gap-sm h-[46px]">
                    <input
                      type="checkbox"
                      name="required"
                      value="true"
                      defaultChecked
                      className="h-5 w-5"
                    />
                    <span className="text-body-sm">Required</span>
                  </label>
                </div>
                {palette.length > 0 && (
                  <div>
                    <label className="field-label">Allowed colours</label>
                    <PaletteChecks palette={palette} selectedIds={new Set()} />
                    <p className="field-help">
                      Leave all unticked to allow every colour.
                    </p>
                  </div>
                )}
                <div>
                  <button type="submit" className="pill-secondary text-body-sm">
                    Add option
                  </button>
                </div>
              </form>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-md border-t border-hairline pt-lg">
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
            {deleteAction && (
              <form action={deleteAction} className="flex items-center gap-sm">
                <input type="hidden" name="id" value={product.id} />
                <button
                  type="submit"
                  className="pill text-canvas bg-accent-magenta px-lg py-[10px] text-body-sm"
                >
                  Delete permanently
                </button>
                <span className="field-help">
                  Can&rsquo;t be undone. Blocked if it&rsquo;s on past orders —
                  archive those instead.
                </span>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Checkbox grid of palette colours; ticked ones are pre-selected. */
function PaletteChecks({
  palette,
  selectedIds,
}: {
  palette: ColorOption[];
  selectedIds: Set<string>;
}) {
  return (
    <div className="mt-xs grid grid-cols-2 sm:grid-cols-3 gap-x-md gap-y-xs">
      {palette.map((c) => (
        <label key={c.id} className="inline-flex items-center gap-xs text-body-sm">
          <input
            type="checkbox"
            name="allowedColorIds"
            value={c.id}
            defaultChecked={selectedIds.has(c.id)}
            className="h-4 w-4"
          />
          <span
            aria-hidden
            className="inline-block h-3 w-3 rounded-full border border-hairline"
            style={{ background: c.hex }}
          />
          {c.name}
        </label>
      ))}
    </div>
  );
}
