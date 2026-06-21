"use client";

import { useRef, type ElementType } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, prefersReducedMotion, EASE } from "@/lib/gsap";

type AnimatedHeadlineProps = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Reveal granularity. Words reads calmer; chars feels more kinetic. */
  by?: "words" | "chars";
  delay?: number;
};

/**
 * Kinetic typography reveal. Splits the headline and clips each line so the
 * words/chars rise out from behind a mask — a single, deliberate motion rather
 * than the infinite-loop micro-animation the skill warns against.
 *
 * Reduced motion → static text, no split.
 */
export function AnimatedHeadline({
  text,
  as: Tag = "h1",
  className,
  by = "words",
  delay = 0.1,
}: AnimatedHeadlineProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      const split = new SplitText(el, {
        type: "lines,words,chars",
        linesClass: "overflow-hidden",
      });

      const units = by === "chars" ? split.chars : split.words;
      gsap.from(units, {
        yPercent: 120,
        opacity: 0,
        duration: 0.85,
        delay,
        ease: EASE,
        stagger: by === "chars" ? 0.018 : 0.06,
      });

      return () => split.revert();
    },
    { scope: ref },
  );

  return (
    // @ts-expect-error -- polymorphic ref across element types
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
