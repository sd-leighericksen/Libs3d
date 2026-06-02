import { getSettings } from "@/lib/settings";

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div className="container-content py-xxl max-w-3xl">
      <div className="page-header">
        <div className="eyebrow">Contact</div>
        <h1>Want to chat?</h1>
        <p className="lede">
          The shopkeeper is usually a grown-up. Drop a line and we&rsquo;ll
          get back to you.
        </p>
      </div>
      <div className="card-accent mt-xl">
        <div className="caption text-ink/60 mb-sm">Email</div>
        <a
          className="text-[28px] font-semibold text-accent-magenta underline break-all"
          href={`mailto:${settings.storeContactEmail}`}
        >
          {settings.storeContactEmail}
        </a>
      </div>
    </div>
  );
}
