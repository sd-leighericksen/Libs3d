"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import {
  ScrollTrigger,
  ScrollSmoother,
  prefersReducedMotion,
} from "@/lib/gsap";

/**
 * App-wide GSAP ScrollSmoother. Wraps page content in the required
 * #smooth-wrapper / #smooth-content structure and drives momentum scrolling
 * with a heavy lag (smooth: 2). `effects` enables [data-speed] / [data-lag]
 * parallax on any element inside the content.
 *
 * IMPORTANT: ScrollSmoother transforms #smooth-content, which breaks
 * position: sticky/fixed *inside* it — so the nav, progress bar and any other
 * pinned chrome must be rendered OUTSIDE this component (siblings in layout).
 *
 * Reduced motion → no smoother is created; the browser scrolls natively.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const smoother = ScrollSmoother.create({
        wrapper: wrapperRef.current!,
        content: contentRef.current!,
        smooth: 1.2, // momentum, kept snappy
        smoothTouch: 0.1, // light touch smoothing so mobile stays usable
        effects: true,
        ease: "power3.out",
      });

      return () => smoother.kill();
    },
    { scope: wrapperRef },
  );

  // On client navigation the content height changes — jump to top and let
  // ScrollTrigger recalculate all start/end positions for the new page.
  useEffect(() => {
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(0, false);
      ScrollTrigger.refresh();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <div id="smooth-wrapper" ref={wrapperRef}>
      <div
        id="smooth-content"
        ref={contentRef}
        className="flex min-h-dvh flex-col"
      >
        {children}
      </div>
    </div>
  );
}
