import { revalidatePath } from "next/cache";
import * as argon2 from "argon2";
import type { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { requireAdmin, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

async function saveSettings(formData: FormData) {
  "use server";
  const me = await requireRole("admin");
  if (!me) throw new Error("Only admins can change store settings.");
  const accentRaw = String(formData.get("accentColor") ?? "").trim();
  const accentColor = /^#[0-9a-fA-F]{6}$/.test(accentRaw) ? accentRaw : "#ff2d6d";
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
      accentColor,
    },
  });
  await logActivity({
    actorId: me.id,
    actorName: me.username,
    action: "settings.update",
    summary: `${me.username} updated store settings`,
  });
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

async function addAdmin(formData: FormData) {
  "use server";
  const me = await requireRole("admin");
  if (!me) throw new Error("Only admins can add users.");
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role: AdminRole =
    formData.get("role") === "shopkeeper" ? "shopkeeper" : "admin";
  if (!username || password.length < 8) {
    throw new Error("Username required and password must be 8+ chars.");
  }
  const hash = await argon2.hash(password);
  await prisma.adminUser.create({
    data: { username, passwordHash: hash, role },
  });
  await logActivity({
    actorId: me.id,
    actorName: me.username,
    action: "user.create",
    summary: `${me.username} added ${role} "${username}"`,
  });
  revalidatePath("/admin/settings");
}

async function removeAdmin(formData: FormData) {
  "use server";
  const me = await requireRole("admin");
  if (!me) throw new Error("Only admins can remove users.");
  const id = String(formData.get("id"));
  // Never strip the last admin (would lock everyone out of user management).
  const adminCount = await prisma.adminUser.count({ where: { role: "admin" } });
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return;
  if (target.role === "admin" && adminCount <= 1) {
    throw new Error("Can't remove the last admin.");
  }
  if (id === me.id) {
    throw new Error("Can't remove yourself.");
  }
  await prisma.adminUser.delete({ where: { id } });
  await logActivity({
    actorId: me.id,
    actorName: me.username,
    action: "user.delete",
    summary: `${me.username} removed user "${target.username}"`,
  });
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
  const isAdmin = me?.role === "admin";
  const settings = await getSettings();
  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="stack-section">
      <section>
        <div className="eyebrow mb-md">Settings</div>
        <h1 className="text-display-lg">Shop knobs and dials</h1>
        {!isAdmin && (
          <p className="text-body-sm text-ink/60 mt-sm">
            You&rsquo;re signed in as a shopkeeper — store settings and users are
            admin-only. You can still change your own password below.
          </p>
        )}
      </section>

      {isAdmin && (
      <section className="card-hairline">
        <h2 className="text-headline">Store &amp; appearance</h2>
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
          <div>
            <label className="field-label">Accent colour</label>
            <div className="flex items-center gap-sm">
              <input
                type="color"
                name="accentColor"
                defaultValue={settings.accentColor}
                className="field-input h-[46px] w-20 p-1"
              />
              <code className="text-body-sm text-ink/60">
                {settings.accentColor}
              </code>
            </div>
            <p className="field-help">
              Recolours the magenta used across the whole site.
            </p>
          </div>
          <div className="sm:col-span-2">
            <button className="pill-primary" type="submit">Save settings</button>
          </div>
        </form>
      </section>
      )}

      {isAdmin && (
      <section className="card-hairline">
        <h2 className="text-headline">Users</h2>
        <p className="field-help mt-xs">
          <strong>Admins</strong> manage users, settings and can delete things.
          <strong> Shopkeepers</strong> manage products, categories, colours and
          orders.
        </p>
        <ul className="divide-y divide-hairline-soft mt-md">
          {admins.map((a) => (
            <li key={a.id} className="py-sm flex items-center justify-between gap-md">
              <div className="text-body-sm">
                {a.username}{" "}
                <span className="status" data-tone={a.role === "admin" ? "ok" : "info"}>
                  {a.role}
                </span>
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

        <h3 className="text-card-title mt-lg">Add a user</h3>
        <form action={addAdmin} className="grid sm:grid-cols-4 gap-md mt-md">
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
          <select name="role" defaultValue="shopkeeper" className="field-input">
            <option value="shopkeeper">Shopkeeper</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="pill-primary">
            Add user
          </button>
        </form>
      </section>
      )}

      <section className="card-hairline">
        <h3 className="text-card-title">Change my password</h3>
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
