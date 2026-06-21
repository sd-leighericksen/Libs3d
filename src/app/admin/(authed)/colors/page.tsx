import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

async function createColor(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const hex = String(formData.get("hex") ?? "").trim();
  if (!name || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const last = await prisma.colorOption.findFirst({
    orderBy: { sortOrder: "desc" },
  });
  await prisma.colorOption.create({
    data: { name, hex, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  revalidatePath("/admin/colors");
}

async function updateColor(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const hex = String(formData.get("hex") ?? "").trim();
  const available = formData.get("available") === "true";
  if (!name || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  await prisma.colorOption.update({
    where: { id },
    data: { name, hex, available },
  });
  revalidatePath("/admin/colors");
}

async function archiveColor(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await prisma.colorOption.update({
    where: { id },
    data: { archivedAt: new Date(), available: false },
  });
  revalidatePath("/admin/colors");
}

async function unarchiveColor(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await prisma.colorOption.update({
    where: { id },
    data: { archivedAt: null },
  });
  revalidatePath("/admin/colors");
}

export default async function ColorsPage() {
  const colors = await prisma.colorOption.findMany({
    orderBy: [{ archivedAt: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="stack-section">
      <section>
        <div className="eyebrow mb-md">Colours</div>
        <h1 className="text-display-lg">The filament shelf</h1>
        <p className="text-body text-ink/70 mt-sm max-w-[60ch]">
          One shared palette. Every product&rsquo;s colour option picks from the
          available colours here. Archiving a colour hides it from new orders but
          never changes colours already chosen on past orders.
        </p>
      </section>

      <section className="card-hairline">
        <h2 className="text-headline">Add a colour</h2>
        <form
          action={createColor}
          className="grid sm:grid-cols-[1fr_auto_auto] gap-md items-end mt-md"
        >
          <div>
            <label className="field-label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Galaxy Purple"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="hex">
              Colour
            </label>
            <input
              id="hex"
              name="hex"
              type="color"
              defaultValue="#ff2d6d"
              className="field-input h-[46px] w-20 p-1"
            />
          </div>
          <button className="pill-primary" type="submit">
            Add colour
          </button>
        </form>
        <p className="field-help mt-xs">Names must be unique.</p>
      </section>

      <section>
        <h2 className="text-headline mb-md">Palette</h2>
        {colors.length === 0 ? (
          <p className="text-body text-ink/70">No colours yet — add one above.</p>
        ) : (
          <ul className="divide-y divide-hairline-soft border-y border-hairline-soft">
            {colors.map((c) => (
              <li key={c.id} className="py-md flex flex-wrap items-center gap-md">
                <span
                  aria-hidden
                  className="inline-block h-8 w-8 rounded-md border border-hairline shrink-0"
                  style={{ background: c.hex }}
                />
                <form
                  action={updateColor}
                  className="flex flex-wrap items-center gap-sm flex-1 min-w-[16ch]"
                >
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    name="name"
                    defaultValue={c.name}
                    className="field-input w-40"
                  />
                  <input
                    name="hex"
                    type="color"
                    defaultValue={c.hex}
                    className="field-input h-[46px] w-16 p-1"
                  />
                  <label className="inline-flex items-center gap-xs text-body-sm">
                    <input
                      type="checkbox"
                      name="available"
                      value="true"
                      defaultChecked={c.available}
                      className="h-4 w-4"
                    />
                    Available
                  </label>
                  <button type="submit" className="pill-secondary text-body-sm">
                    Save
                  </button>
                </form>
                <div className="flex items-center gap-sm">
                  {c.archivedAt && (
                    <span className="caption text-ink/60">archived</span>
                  )}
                  <form action={c.archivedAt ? unarchiveColor : archiveColor}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-body-sm underline">
                      {c.archivedAt ? "Unarchive" : "Archive"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
