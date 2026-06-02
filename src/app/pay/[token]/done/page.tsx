import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function PayDonePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await prisma.order.findUnique({
    where: { paymentToken: token },
  });
  if (!order) notFound();

  return (
    <div className="container-content py-xxl max-w-2xl page-header">
      <div className="eyebrow">Payment received</div>
      <h1>Thank you!</h1>
      <p className="lede">
        We&rsquo;ve got your payment for {order.buyerFirstName}&rsquo;s order
        and we&rsquo;re queuing it up. A confirmation email should arrive in a
        minute.
      </p>
      <p className="text-body mt-md">
        <Link
          href={`/order/${order.token}`}
          className="text-accent-magenta underline"
        >
          Order status page →
        </Link>
      </p>
    </div>
  );
}
