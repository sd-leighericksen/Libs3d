"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Scroll-aware header chrome. Holds the sticky <header> and:
 *  - condenses (shorter bar, lifted shadow, more opaque) once scrolled past the hero,
 *  - hides on scroll-down and re-shows on scroll-up so the bar stays out of the way.
 * The nav content is passed in as children so data fetching stays in the RSC parent.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const header = headerRef.current;
      const bar = barRef.current;
      if (!header || !bar) return;

      if (prefersReducedMotion()) return;

      const showY = gsap.quickTo(header, "yPercent", {
        duration: 0.4,
        ease: "power3.out",
      });

      // Condense once we leave the very top of the page.
      const condense = gsap.to(bar, {
        height: 64,
        backgroundColor: "rgba(255,255,255,0.98)",
        boxShadow: "0 8px 24px -16px rgba(10,10,10,0.4)",
        duration: 0.3,
        ease: "power2.out",
        paused: true,
      });

      ScrollTrigger.create({
        start: "top -80",
        end: 99999,
        onUpdate: (self) => {
          if (self.scroll() > 80) condense.play();
          else condense.reverse();
          // Hide going down, reveal going up. Never hide near the top.
          if (self.direction === 1 && self.scroll() > 240) showY(-100);
          else showY(0);
        },
      });
    },
    { scope: headerRef },
  );

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-40 border-b border-hairline bg-canvas/95 backdrop-blur will-change-transform"
    >
      <div
        ref={barRef}
        className="container-content flex h-20 items-center justify-between gap-lg"
      >
        {children}
      </div>
    </header>
  );
}
