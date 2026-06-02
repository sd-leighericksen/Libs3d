import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone =
  | "lime"
  | "lilac"
  | "cream"
  | "mint"
  | "pink"
  | "coral"
  | "navy";

const TONE_CLASS: Record<Tone, string> = {
  lime: "bg-block-lime text-ink",
  lilac: "bg-block-lilac text-ink",
  cream: "bg-block-cream text-ink",
  mint: "bg-block-mint text-ink",
  pink: "bg-block-pink text-ink",
  coral: "bg-block-coral text-ink",
  navy: "bg-block-navy text-canvas",
};

export function ColorBlock({
  tone,
  className,
  children,
}: {
  tone: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("color-block", TONE_CLASS[tone], className)}>
      {children}
    </section>
  );
}
