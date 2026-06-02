import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/admin";
  const error = sp.error;

  async function action(formData: FormData) {
    "use server";
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    try {
      await signIn("credentials", {
        username,
        password,
        redirectTo: next,
      });
    } catch (e) {
      if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT"))
        throw e;
      redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
    }
  }

  return (
    <div className="container-content py-xxl max-w-md">
      <div className="page-header">
        <div className="eyebrow">Shopkeeper</div>
        <h1>Sign in</h1>
        <p className="lede">
          Only the shopkeepers come in here. Shoppers, head back to{" "}
          <a href="/" className="underline text-accent-magenta">
            the shop
          </a>
          .
        </p>
      </div>

      <form action={action} className="mt-xl flex flex-col gap-md">
        <div>
          <label className="field-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            required
            autoComplete="username"
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field-input"
          />
        </div>
        {error && (
          <p className="field-error">
            That didn&rsquo;t work. Check your username and password.
          </p>
        )}
        <div>
          <button className="pill-primary" type="submit">
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}
