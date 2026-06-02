import { revalidatePath } from "next/cache";
import * as argon2 from "argon2";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/auth";

async function saveSettings(formData: FormData) {
  "use server";
  if (!(await requireAdmin())) throw new Error("Not authorized");
  await prisma.settings.update({
    where: { id: "singleton" },
    data: {
      maxQtyPerLineItem: Math.max(1, Number(formData.get("maxQtyPerLineItem") ?? 5)),
      maxDistinctItemsPerOrder: Math.max(
        1,
        Number(formData.get("maxDistinctItemsPerOrder") ?? 10),
      ),
      storeName: String(formData.get("storeName") ?? "").trim() || "Libs3d",
      storeContactEmail:
        String(formData.get("storeContactEmail") ?? "").trim() || "hello@example.com",
    },
  });
  revalidatePath("/admin/settings");
}

async function addAdmin(formData: FormData) {
  "use server";
  if (!(await requireAdmin())) throw new Error("Not authorized");
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || password.length < 8) {
    throw new Error("Username required and password must be 8+ chars.");
  }
  const hash = await argon2.hash(password);
  await prisma.adminUser.create({ data: { username, passwordHash: hash } });
  revalidatePath("/admin/settings");
}

async function removeAdmin(formData: FormData) {
  "use server";
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const id = String(formData.get("id"));
  const total = await prisma.adminUser.count();
  if (total <= 1) {
    throw new Error("Can't remove the last admin.");
  }
  if (id === me.id) {
    throw new Error("Can't remove yourself.");
  }
  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/settings");
}

async function changeMyPassword(formData: FormData) {
  "use server";
  const me = await requireAdmin();
  if (!me) throw new Error("Not authorized");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) throw new Error("Password must be 8+ chars.");
  const hash = await argon2.hash(password);
  await prisma.adminUser.update({
    where: { id: me.id },
    data: { passwordHash: hash },
  });
  revalidatePath("/admin/settings");
}

export default async function SettingsPage() {
  const me = await requireAdmin();
  const settings = await getSettings();
  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="stack-section">
      <section>
        <div className="eyebrow mb-md">Settings</div>
        <h1 className="text-display-lg">Shop knobs and dials</h1>
      </section>

      <section className="card-hairline">
        <h2 className="text-headline">Order limits</h2>
        <form action={saveSettings} className="grid sm:grid-cols-2 gap-md mt-md">
          <div>
            <label className="field-label">Max per line item</label>
            <input
              type="number"
              min={1}
              name="maxQtyPerLineItem"
              defaultValue={settings.maxQtyPerLineItem}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Max distinct items per order</label>
            <input
              type="number"
              min={1}
              name="maxDistinctItemsPerOrder"
              defaultValue={settings.maxDistinctItemsPerOrder}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Store name</label>
            <input
              name="storeName"
              defaultValue={settings.storeName}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Store contact email</label>
            <input
              type="email"
              name="storeContactEmail"
              defaultValue={settings.storeContactEmail}
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <button className="pill-primary" type="submit">Save settings</button>
          </div>
        </form>
      </section>

      <section className="card-hairline">
        <h2 className="text-headline">Admins</h2>
        <ul className="divide-y divide-hairline-soft mt-md">
          {admins.map((a) => (
            <li key={a.id} className="py-sm flex items-center justify-between gap-md">
              <div className="text-body-sm">
                {a.username}{" "}
                {a.id === me?.id && (
                  <span className="caption text-ink/60 ml-sm">you</span>
                )}
              </div>
              {a.id !== me?.id && (
                <form action={removeAdmin}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="text-body-sm underline">
                    Remove
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>

        <h3 className="text-card-title mt-lg">Add an admin</h3>
        <form action={addAdmin} className="grid sm:grid-cols-3 gap-md mt-md">
          <input
            name="username"
            placeholder="Username"
            required
            className="field-input"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (8+ chars)"
            required
            minLength={8}
            className="field-input"
          />
          <button type="submit" className="pill-primary">
            Add admin
          </button>
        </form>

        <h3 className="text-card-title mt-lg">Change my password</h3>
        <form action={changeMyPassword} className="grid sm:grid-cols-2 gap-md mt-md">
          <input
            name="password"
            type="password"
            placeholder="New password"
            required
            minLength={8}
            className="field-input"
          />
          <button type="submit" className="pill-secondary border border-hairline">
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
