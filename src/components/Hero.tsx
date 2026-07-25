"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion, EASE } from "@/lib/gsap";
import { PillLink } from "@/components/ui/Pill";
import { Magnetic } from "@/components/motion/Magnetic";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";

/**
 * Full-bleed, GSAP-driven hero. A full-width looping video sits behind a dark
 * scrim; the band reacts to pointer (parallax) and scroll (drift + scale),
 * while the headline rises in via SplitText. Reduced-motion safe.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const band = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const bandEl = band.current;
      if (!section || !bandEl) return;

      if (prefersReducedMotion()) {
        gsap.set(bandEl, { clearProps: "all" });
        return;
      }

      // Entrance: band wipes up from a clip.
      gsap.from(bandEl, {
        yPercent: 18,
        scale: 1.12,
        autoAlpha: 0,
        duration: 1.1,
        ease: EASE,
      });

      // Lede + CTAs rise in after the headline.
      gsap.from(".hero-fade", {
        y: 22,
        autoAlpha: 0,
        duration: 0.8,
        ease: EASE,
        delay: 0.35,
        stagger: 0.12,
      });

      // Pointer parallax — band shifts opposite the cursor.
      const xTo = gsap.quickTo(bandEl, "x", { duration: 0.8, ease: "power3.out" });
      const yTo = gsap.quickTo(bandEl, "y", { duration: 0.8, ease: "power3.out" });

      const onMove = (e: PointerEvent) => {
        const r = section.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        xTo(dx * -40);
        yTo(dy * -24);
      };
      section.addEventListener("pointermove", onMove);

      // Scroll drift + zoom on the whole band.
      const st = gsap.to(bandEl, {
        yPercent: 14,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      return () => {
        section.removeEventListener("pointermove", onMove);
        st.scrollTrigger?.kill();
        st.kill();
        ScrollTrigger.refresh();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-ink text-canvas"
    >
      {/* Video band */}
      <div
        ref={band}
        aria-hidden
        className="absolute inset-0 -z-10 will-change-transform"
        style={{ width: "112%", left: "-6%" }}
      >
        <video
          src="/hero-prod.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      </div>

      {/* Scrim for legibility */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/30"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-transparent to-ink/40"
      />

      {/* Foreground content */}
      <div className="container-content py-section">
        <div className="max-w-[44rem]">
          <div className="eyebrow mb-md text-accent-magenta">Libs3d</div>
          <AnimatedHeadline
            text="Small 3D-printed things, made by a kid."
            by="chars"
            className="text-[44px] sm:text-[64px] md:text-[78px] leading-[1.02] tracking-tight font-semibold"
          />
          <p className="hero-fade mt-lg max-w-[42ch] text-body-lg text-canvas/80">
            Pick what you like. Your grown-up gets an email to say yes and pay.
            Then we print it.
          </p>
          <div className="hero-fade mt-xl flex flex-wrap gap-sm">
            <Magnetic strength={0.4}>
              <PillLink href="#shop">Browse the shop</PillLink>
            </Magnetic>
            <Magnetic strength={0.3}>
              <PillLink
                href="/how-it-works"
                variant="secondary"
                className="bg-transparent text-canvas border-canvas/30 hover:bg-canvas/10"
              >
                How it works
              </PillLink>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Marquee strip */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 border-t border-canvas/15 bg-ink/40 py-sm backdrop-blur-sm"
      >
        <div className="container-content caption text-canvas/60">
          3D printed · made by a kid · grown-up approves · then we print
        </div>
      </div>
    </section>
  );
}
