"use client";

// Central GSAP setup. Registers the plugins we use once, on the client only,
// and exposes a reduced-motion flag so every animation can degrade gracefully.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
}

/** True when the visitor has asked the OS to minimise motion. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// House easing — a soft, slightly-overshooting curve that matches the
// playful-but-tidy Libs3d voice without feeling bouncy.
export const EASE = "power3.out";
export const EASE_SOFT = "power2.out";

export { gsap, ScrollTrigger, ScrollSmoother, SplitText };
