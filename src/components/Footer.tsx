import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-soft border-t border-hairline mt-section">
      <div className="container-content py-xxl grid sm:grid-cols-4 gap-xl">
        <div className="sm:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Libs3d" className="h-20 w-auto mb-md" />
          <p className="text-body-sm text-ink/70 max-w-[36ch]">
            A small 3D-print shop run by Baxter E. Every order goes
            through a grown-up before a thing gets printed.
          </p>
        </div>
        <FooterCol heading="Shop">
          <Link href="/">Home</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/contact">Contact</Link>
        </FooterCol>
        <FooterCol heading="The fine print">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/admin">Shopkeeper sign in</Link>
        </FooterCol>
      </div>
      <div className="container-content border-t border-hairline py-md flex justify-between text-caption text-ink/60">
        <span>© Libs3d</span>
        <span>Built by Baxter E</span>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="caption text-ink/60 mb-sm">{heading}</div>
      <div className="flex flex-col gap-xs text-body-sm">{children}</div>
    </div>
  );
}
