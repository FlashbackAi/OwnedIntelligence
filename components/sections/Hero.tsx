"use client";

/**
 * Flashback Labs — Hero section.
 *
 * Copy is editorial, not code-commentary. Typography is meant to feel like
 * a distinctive publication masthead, not a dev-tool landing page.
 *
 * Owned animations:
 *   - Headline per-word reveal (translateY + opacity)
 *   - HUD-cyan underline draw under "you."
 *   - Sub fades in
 *
 * The Arc Reactor owns its own boot/ambient/parallax — Hero just embeds it.
 */

import { useLayoutEffect, useRef } from "react";
import { createTimeline, stagger, utils } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";
import ArcReactor from "../svg/ArcReactor";

const HEADLINE_LINES = [
  ["In", "a", "world", "where", "AI", "does", "everything,"],
  ["what's", "left"],
  ["for", "you."],
];

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = prefersReducedMotion();

    const headlineWords = root.querySelectorAll(".hero-word");
    const sub = root.querySelector(".hero-sub");
    const byline = root.querySelector(".hero-byline");
    const ctaRow = root.querySelector(".hero-cta-row");
    const hudUnderline = root.querySelector(".hero-hud-underline");

    if (reduced) {
      utils.set(Array.from(headlineWords), { opacity: 1, translateY: 0 });
      utils.set([sub, byline, ctaRow].filter(Boolean) as Element[], {
        opacity: 1,
        translateY: 0,
      });
      if (hudUnderline) utils.set(hudUnderline, { opacity: 1, scaleX: 1 });
      return;
    }

    const tl = createTimeline({
      defaults: { ease: "outQuart" },
      autoplay: true,
    });

    // Byline (small top eyebrow) fades in first — grounds the layout.
    if (byline) {
      tl.add(
        byline,
        {
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 600,
          ease: "outExpo",
        },
        250,
      );
    }

    // Headline word-stagger
    tl.add(
      headlineWords,
      {
        translateY: [36, 0],
        opacity: [0, 1],
        duration: 950,
        ease: "outExpo",
        delay: stagger(42),
      },
      600,
    );

    // HUD underline draws under "you." last
    if (hudUnderline) {
      tl.add(
        hudUnderline,
        {
          scaleX: [0, 1],
          opacity: [0, 1],
          duration: 600,
          ease: "outExpo",
        },
        1850,
      );
    }

    // Sub + CTAs
    if (sub) {
      tl.add(
        sub,
        {
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 700,
          ease: "outQuart",
        },
        2000,
      );
    }
    if (ctaRow) {
      tl.add(
        ctaRow,
        {
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 700,
          ease: "outQuart",
        },
        2200,
      );
    }

    return () => {
      tl.pause();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative w-full min-h-screen overflow-hidden bg-paper pt-28 md:pt-32"
      aria-label="Flashback Labs"
    >
      {/* Hairline dotted grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-grid-hairline opacity-[0.55] pointer-events-none"
      />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center min-h-[calc(100vh-160px)]">
          {/* ──── Left column ──── */}
          <div className="md:col-span-6 relative order-2 md:order-1">
            {/* Editorial eyebrow — replaces the `[ FLASHBACK // V1.0 ]` tag */}
            <div
              className="hero-byline flex items-center gap-4 mb-8 md:mb-10"
              style={{ opacity: 0 }}
            >
              <span className="block h-px w-10 bg-ink/40" aria-hidden="true" />
              <span className="font-mono text-[10.5px] tracking-[0.28em] uppercase text-steel">
                Flashback Labs
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-ink leading-[1.06] tracking-[-0.02em] text-[clamp(2.4rem,5.5vw,4.5rem)]">
              {HEADLINE_LINES.map((line, lineIdx) => (
                <span key={lineIdx} className="block">
                  {line.map((word, wordIdx) => {
                    const isYou =
                      lineIdx === HEADLINE_LINES.length - 1 &&
                      wordIdx === line.length - 1;
                    return (
                      <span
                        key={`${lineIdx}-${wordIdx}`}
                        className="hero-word inline-block mr-[0.25em] align-baseline relative"
                        style={{ opacity: 0, transform: "translateY(36px)" }}
                      >
                        {isYou ? (
                          <span className="text-hotrod relative">
                            {word}
                            <span
                              aria-hidden="true"
                              className="hero-hud-underline absolute left-0 right-[0.2em] -bottom-[0.08em] h-[3px] bg-hud origin-left"
                              style={{ opacity: 0, transform: "scaleX(0)" }}
                            />
                          </span>
                        ) : (
                          word
                        )}
                      </span>
                    );
                  })}
                </span>
              ))}
            </h1>

            {/* Sub — editorial, not code-commentary */}
            <p
              className="hero-sub mt-10 md:mt-12 max-w-xl text-[17px] md:text-[18px] leading-[1.55] text-ink-soft"
              style={{ opacity: 0 }}
            >
              Building the personal AI —{" "}
              <span className="text-ink">owned by you</span>, remembering your
              life, working for you alone.
            </p>

            {/* CTAs */}
            <div
              className="hero-cta-row flex flex-col sm:flex-row gap-4 mt-8 md:mt-10"
              style={{ opacity: 0 }}
            >
              {/* Primary — solid hotrod, skewed parallelogram */}
              <a
                href="https://flashbackai.com"
                className="group relative inline-flex items-center justify-center px-8 py-3.5 bg-hotrod text-paper-raised font-mono text-[11px] tracking-[0.22em] uppercase overflow-hidden transition-colors duration-200 hover:bg-hotrod-deep"
                style={{ clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)" }}
              >
                {/* HUD corner accent top-right */}
                <span aria-hidden="true" className="absolute top-0 right-0 w-2 h-2 border-t border-r border-paper-raised/40 pointer-events-none" />
                <span style={{ display: "inline-block" }}>Meet Flashback AI →</span>
              </a>

              {/* Secondary — outlined, skewed, ink fill on hover */}
              <a
                href="/manifesto"
                className="group relative inline-flex items-center justify-center px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] uppercase overflow-hidden transition-colors duration-200 text-ink hover:text-paper-raised"
                style={{ clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)" }}
              >
                {/* Inset border via box-shadow substitute using outline trick */}
                <span aria-hidden="true" className="absolute inset-0 border border-ink transition-colors duration-200 group-hover:border-ink pointer-events-none" style={{ clipPath: "inherit" }} />
                {/* Fill slide on hover */}
                <span aria-hidden="true" className="absolute inset-0 bg-ink translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300 ease-out pointer-events-none" />
                <span className="relative z-10">Read the Thesis</span>
              </a>
            </div>
          </div>

          {/* ──── Right column — Arc Reactor ──── */}
          <div className="md:col-span-6 relative order-1 md:order-2 flex items-center justify-center md:justify-end">
            <div className="relative w-full max-w-125 md:max-w-none flex justify-center md:justify-end">
              <ArcReactor size={520} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
