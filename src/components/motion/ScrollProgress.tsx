"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Thin magenta page-progress bar pinned to the very top of the viewport,
 * scrubbed to total scroll. Quiet on mount (scaleX 0) and reduced-motion safe.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    gsap.set(el, { scaleX: 0, transformOrigin: "left center" });
    gsap.to(el, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        start: 0,
        end: () => ScrollTrigger.maxScroll(window),
        scrub: 0.3,
        invalidateOnRefresh: true,
      },
    });
  });

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-accent-magenta"
    />
  );
}
