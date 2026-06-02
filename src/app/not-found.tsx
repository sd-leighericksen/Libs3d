import { PillLink } from "@/components/ui/Pill";

export default function NotFound() {
  return (
    <div className="container-content py-xxl max-w-2xl text-center page-header mx-auto">
      <div className="eyebrow">Hmm</div>
      <h1>We can&rsquo;t find that page.</h1>
      <p className="lede">
        It might have moved, or maybe never existed. Either way — back to the
        shop?
      </p>
      <div className="mt-xl">
        <PillLink href="/">Back to the shop</PillLink>
      </div>
    </div>
  );
}
