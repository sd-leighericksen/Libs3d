import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const username = session?.user?.username;
  if (!username) redirect("/admin/login");

  return (
    <div className="container-content py-xl">
      <nav className="flex flex-wrap items-center gap-md mb-xl pb-md border-b border-hairline">
        <Link href="/admin" className="caption text-accent-magenta">
          Admin
        </Link>
        <Link href="/admin/orders" className="text-body-sm hover:text-accent-magenta">
          Orders
        </Link>
        <Link href="/admin/products" className="text-body-sm hover:text-accent-magenta">
          Products
        </Link>
        <Link href="/admin/categories" className="text-body-sm hover:text-accent-magenta">
          Categories
        </Link>
        <Link href="/admin/settings" className="text-body-sm hover:text-accent-magenta">
          Settings
        </Link>
        <div className="ml-auto flex items-center gap-md">
          <span className="caption text-ink/60">{username}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button className="pill-secondary text-body-sm" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      {children}
    </div>
  );
}
