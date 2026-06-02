import { PillLink } from "@/components/ui/Pill";

export default function HowItWorks() {
  return (
    <div className="container-content py-xxl stack-section">
      <section className="page-header">
        <div className="eyebrow">How it works</div>
        <h1>You shop. Your grown-up says yes. Then we print.</h1>
        <p className="lede">
          This shop works a bit differently — because kids are buying from
          kids, a grown-up always approves and pays before any money moves and
          before anything is made.
        </p>
      </section>

      <section>
        <div className="section-head">
          <span className="tick">For kids</span>
          <h2>Five quick steps.</h2>
        </div>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-md">
          {[
            ["1", "Pick what you like and add it to your cart."],
            ["2", "At checkout, pop in your grown-up's email."],
            ["3", "We have a quick look at the order."],
            ["4", "Your grown-up gets an email to approve and pay."],
            ["5", "Once it's paid, we print it and get it to you."],
          ].map(([n, copy]) => (
            <li key={n} className="card">
              <div className="text-accent-magenta text-display-lg leading-none">
                {n}
              </div>
              <p className="text-body mt-sm">{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="grown-ups">
        <div className="section-head">
          <span className="tick">For grown-ups</span>
          <h2>Here&rsquo;s the deal, in plain English.</h2>
          <p>The unusual bits, kept short.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-md">
          <div className="card">
            <h3 className="text-headline">Kids can&rsquo;t spend on their own.</h3>
            <p className="text-body mt-xs">
              When your child checks out, you&rsquo;ll get an email with the
              exact order and total. No payment details are taken from them.
            </p>
          </div>
          <div className="card">
            <h3 className="text-headline">You approve, you pay.</h3>
            <p className="text-body mt-xs">
              The link in your email opens a secure Stripe checkout. We
              don&rsquo;t see your card details and there&rsquo;s no GST or
              surprise fee on top.
            </p>
          </div>
          <div className="card">
            <h3 className="text-headline">Nothing&rsquo;s printed until you do.</h3>
            <p className="text-body mt-xs">
              We only start the print after Stripe confirms your payment. If
              you don&rsquo;t pay, nothing happens — and nothing&rsquo;s owed.
            </p>
          </div>
        </div>
        <p className="text-body mt-lg max-w-[60ch] text-ink/70">
          The only thing we ever collect about your child is their first name.
          Everything else — your name, email, delivery address — belongs to
          you. The{" "}
          <a href="/privacy" className="text-accent-magenta underline">privacy notes</a>{" "}
          have the full story.
        </p>
      </section>

      <section className="card-accent">
        <span className="tick">Ready?</span>
        <h2 className="text-headline mt-xs">Have a look around.</h2>
        <p className="text-body text-ink/70 mt-xs">
          Pop a few things in your cart. We&rsquo;ll take care of the rest.
        </p>
        <div className="mt-md">
          <PillLink href="/">Take me to the shop</PillLink>
        </div>
      </section>
    </div>
  );
}
