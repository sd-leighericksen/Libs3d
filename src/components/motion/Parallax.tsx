"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Scroll-linked parallax. The child drifts vertically as the section scrolls
 * through the viewport, scrubbed 1:1 to the scrollbar. Use sparingly — one or
 * two on a page keeps it premium rather than gimmicky.
 */
export function Parallax({
  children,
  /** Total travel in px across the scroll range. Positive = slower than scroll. */
  amount = 60,
  className,
}: {
  children: ReactNode;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      gsap.fromTo(
        el,
        { y: -amount / 2 },
        {
          y: amount / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
