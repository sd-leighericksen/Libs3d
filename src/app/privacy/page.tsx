export default function Privacy() {
  return (
    <div className="container-content py-xxl max-w-3xl">
      <div className="page-header">
        <div className="eyebrow">Privacy</div>
        <h1>What we keep, and what we don&rsquo;t.</h1>
        <p className="lede">
          We&rsquo;re a tiny shop and we try to keep as little information
          about you as possible — especially about kids.
        </p>
      </div>

      <div className="mt-xl card-accent">
        <span className="tick">About this platform</span>
        <p className="text-body mt-xs">
          This website was built by Baxter E with the help of his Dad and the
          team at Stoke Design Ballarat. Feel free to send any questions or
          enquiries in regards to how the platform works, its safety or how
          payment works to{" "}
          <a href="mailto:leigh@stokedesign.co" className="text-accent-magenta underline">
            leigh@stokedesign.co
          </a>{" "}
          — this is a closely monitored platform by adults to help a 10 year
          old start his first ecommerce store as safely as possible.
        </p>
      </div>

      <div className="mt-xl flex flex-col gap-lg text-body text-ink/80">
        <div>
          <h2 className="text-headline text-ink">About the buyer (the kid)</h2>
          <p className="mt-xs">
            We only ever ask for the buyer&rsquo;s <strong>first name</strong>.
            That&rsquo;s it. No email, no address, no phone, no school details,
            no birthdate. The first name is used only to label the order so the
            grown-up knows whose it is.
          </p>
        </div>

        <div>
          <h2 className="text-headline text-ink">About the grown-up</h2>
          <p className="mt-xs">
            We collect the grown-up&rsquo;s first name and email so we can ask
            them to approve and pay. If the order is being delivered, we also
            collect that address. We use this information only to fulfil the
            order and don&rsquo;t share it with anyone except our payment
            provider (Stripe) and email provider (Postmark).
          </p>
        </div>

        <div>
          <h2 className="text-headline text-ink">Payments</h2>
          <p className="mt-xs">
            Payments go through Stripe. We never see card numbers. Stripe
            stores a payment intent reference against the order so we can
            answer questions if something goes wrong.
          </p>
        </div>

        <div>
          <h2 className="text-headline text-ink">Cookies</h2>
          <p className="mt-xs">
            We set one small cookie to remember your cart. No tracking pixels,
            no analytics, no ad tech.
          </p>
        </div>

        <div>
          <h2 className="text-headline text-ink">If you want your data gone</h2>
          <p className="mt-xs">
            Email us and we&rsquo;ll delete it. We keep records of completed
            orders for a year so we can answer questions, but you can ask us
            to delete them sooner.
          </p>
        </div>

        <p className="text-body-sm text-ink/60">
          This is a plain-English summary, not legal advice. We&rsquo;re
          working on a longer policy that meets the Australian Privacy
          Principles. Get in touch if you&rsquo;d like a copy of the in-progress
          version.
        </p>
      </div>
    </div>
  );
}
