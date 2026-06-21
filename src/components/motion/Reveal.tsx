"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion, EASE } from "@/lib/gsap";

type RevealProps = {
  children: ReactNode;
  /** Stagger direct children instead of the wrapper itself. */
  stagger?: boolean;
  /** Travel distance in px. */
  y?: number;
  /** Delay before the reveal kicks off. */
  delay?: number;
  /** Render element (default div). */
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-triggered reveal. By default it fades + lifts the wrapper into view.
 * With `stagger`, it instead reveals each direct child in sequence, which is
 * what we use for product / category grids.
 *
 * Honours prefers-reduced-motion: elements are simply shown, never hidden.
 */
export function Reveal({
  children,
  stagger = false,
  y = 28,
  delay = 0,
  as: Tag = "div",
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const targets = stagger
        ? Array.from(el.children)
        : [el];

      if (prefersReducedMotion()) {
        gsap.set(targets, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.set(targets, { autoAlpha: 0, y });
      gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        delay,
        ease: EASE,
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: ref },
  );

  return (
    // @ts-expect-error -- polymorphic ref across element types
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
