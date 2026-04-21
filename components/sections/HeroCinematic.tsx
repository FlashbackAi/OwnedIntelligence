"use client";

/**
 * Flashback Labs — Hero (cinematic variant).
 *
 * Alt layout of Hero for A/B selection. Center-stacked; reactor sits behind
 * the headline. On mount: black viewport, oversized reactor boots, scales
 * down, background crossfades to paper, text reveals on top. Scroll drifts
 * reactor down and text up at different rates.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { createTimeline, stagger, utils } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";
import ArcReactor from "../svg/ArcReactor";

const HEADLINE_LINES = [
  ["In", "a", "world", "where", "AI", "does", "everything,"],
  ["what's", "left"],
  ["for", "you ?"],
];

export default function HeroCinematic() {
  const rootRef = useRef<HTMLElement>(null);
  const reactorParallaxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = prefersReducedMotion();

    const headlineWords = root.querySelectorAll(".heroc-word");
    const byline = root.querySelector(".heroc-byline");
    const sub = root.querySelector(".heroc-sub");
    const ctaRow = root.querySelector(".heroc-cta-row");
    const underline = root.querySelector(".heroc-underline");
    const reactorScale = root.querySelector(".heroc-reactor-scale");
    const paperLayer = root.querySelector(".heroc-paper-layer");
    const gridLayer = root.querySelector(".heroc-grid-layer");
    const scaffold = Array.from(
      root.querySelectorAll(".heroc-scaffold"),
    ) as HTMLElement[];

    if (reduced) {
      utils.set(Array.from(headlineWords), { opacity: 1, translateY: 0 });
      utils.set(
        [byline, sub, ctaRow].filter(Boolean) as Element[],
        { opacity: 1, translateY: 0 },
      );
      if (underline) utils.set(underline, { opacity: 1, scaleX: 1 });
      if (reactorScale) {
        utils.set(reactorScale, { scale: 1 });
        (reactorScale as HTMLElement).removeAttribute("data-phase");
      }
      if (paperLayer) utils.set(paperLayer, { opacity: 1 });
      if (gridLayer) utils.set(gridLayer, { opacity: 0.55 });
      if (scaffold.length) utils.set(scaffold, { opacity: 1 });
      return;
    }

    // Schedule the light→dark stroke switch to begin with the paper fade.
    // CSS transition on --color-ink / --color-steel (650ms) handles the blend.
    const phaseSwap = window.setTimeout(() => {
      if (reactorScale)
        (reactorScale as HTMLElement).removeAttribute("data-phase");
    }, 3300);

    const tl = createTimeline({
      defaults: { ease: "outQuart" },
      autoplay: true,
    });

    // Reactor scales down from oversize → rest (boot is still playing inside)
    if (reactorScale) {
      tl.add(
        reactorScale,
        {
          scale: [1.15, 1],
          duration: 1000,
          ease: "outExpo",
        },
        3000,
      );
    }

    // Background crossfade ink → paper, grid fades in with it
    if (paperLayer) {
      tl.add(
        paperLayer,
        { opacity: [0, 1], duration: 650, ease: "outQuart" },
        3300,
      );
    }
    if (gridLayer) {
      tl.add(
        gridLayer,
        { opacity: [0, 0.55], duration: 650, ease: "outQuart" },
        3400,
      );
    }

    // Scaffolding layers (halo, rings, corners, gutter text, register ticks)
    if (scaffold.length) {
      tl.add(
        scaffold,
        {
          opacity: [0, 1],
          duration: 2000, // change this to 700 if needed
          ease: "outQuart",
          delay: stagger(50),
        },
        3500,
      );
    }

    // Byline
    if (byline) {
      tl.add(
        byline,
        {
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 600,
          ease: "outExpo",
        },
        3800,
      );
    }

    // Headline word stagger
    tl.add(
      headlineWords,
      {
        translateY: [36, 0],
        opacity: [0, 1],
        duration: 950,
        ease: "outExpo",
        delay: stagger(42),
      },
      3900,
    );

    // HUD underline draws under "you."
    if (underline) {
      tl.add(
        underline,
        {
          scaleX: [0, 1],
          opacity: [0, 1],
          duration: 600,
          ease: "outExpo",
        },
        5100,
      );
    }

    // Sub
    if (sub) {
      tl.add(
        sub,
        {
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 700,
          ease: "outQuart",
        },
        5250,
      );
    }
    // CTAs
    if (ctaRow) {
      tl.add(
        ctaRow,
        {
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 700,
          ease: "outQuart",
        },
        5400,
      );
    }

    return () => {
      tl.pause();
      window.clearTimeout(phaseSwap);
    };
  }, []);

  // Scroll parallax — reactor recedes, text comes forward.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const reactorEl = reactorParallaxRef.current;
    const textEl = textRef.current;
    const subEl = subRef.current;
    const root = rootRef.current;
    if (!reactorEl || !textEl || !root) return;

    let raf = 0;
    let pending = false;

    const apply = () => {
      pending = false;
      const y = window.scrollY;
      const rootBottom = root.offsetTop + root.offsetHeight;
      if (y > rootBottom + 200) return; // off-screen below
      reactorEl.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      textEl.style.transform = `translate3d(0, ${y * -0.15}px, 0)`;
      if (subEl) subEl.style.transform = `translate3d(0, ${y * -0.08}px, 0)`;
    };

    const onScroll = () => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative w-full min-h-screen overflow-hidden"
      aria-label="Flashback Labs"
    >
      {/* Black base layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink pointer-events-none"
      />
      {/* Paper layer — crossfades on top of black */}
      <div
        aria-hidden="true"
        className="heroc-paper-layer absolute inset-0 bg-paper pointer-events-none"
        style={{ opacity: 0 }}
      />
      {/* Hairline dotted grid — fades in with paper */}
      <div
        aria-hidden="true"
        className="heroc-grid-layer absolute inset-0 bg-grid-hairline pointer-events-none"
        style={{ opacity: 0 }}
      />

      {/* Faint concentric rings — extend scale past the reactor */}
      <svg
        aria-hidden="true"
        className="heroc-scaffold absolute inset-0 z-8 pointer-events-none"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0 }}
      >
        <g
          fill="none"
          stroke="var(--color-hairline)"
          transform="translate(800 500)"
        >
          <circle r="380" strokeWidth="0.8" />
          <circle r="470" strokeWidth="0.6" strokeOpacity="0.7" />
          <circle
            r="560"
            strokeWidth="0.5"
            strokeOpacity="0.4"
            strokeDasharray="3 8"
          />
          <circle
            r="650"
            strokeWidth="0.4"
            strokeOpacity="0.25"
            strokeDasharray="2 12"
          />
        </g>
      </svg>

      {/* Reactor — absolute-centered, behind text */}
      <div
        ref={reactorParallaxRef}
        aria-hidden="true"
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none will-change-transform"
      >
        <div className="scale-65 md:scale-120" style={{ transformOrigin: "center center" }}>
          <div
            className="heroc-reactor-scale"
            data-phase="black"
            style={{ transform: "scale(1.15)", transformOrigin: "center center" }}
          >
            <ArcReactor size={640} />
          </div>
        </div>
      </div>

      {/* Legibility halo — paper-colored radial that dims reactor behind text */}
      <div
        aria-hidden="true"
        className="heroc-scaffold absolute inset-0 z-15 pointer-events-none"
        style={{
          opacity: 0,
          background:
            "radial-gradient(ellipse 42% 38% at 50% 52%, var(--color-paper) 0%, var(--color-paper) 35%, rgba(246,246,243,0.6) 60%, transparent 82%)",
        }}
      />

      {/* HUD corner brackets */}
      <div
        aria-hidden="true"
        className="heroc-scaffold absolute inset-0 z-16 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <span className="absolute top-6 left-6 w-5 h-5 border-t border-l border-ink/40" />
        <span className="absolute top-6 right-6 w-5 h-5 border-t border-r border-ink/40" />
        <span className="absolute bottom-6 left-6 w-5 h-5 border-b border-l border-ink/40" />
        <span className="absolute bottom-6 right-6 w-5 h-5 border-b border-r border-ink/40" />
      </div>

      {/* Register ticks — top and bottom center */}
      <div
        aria-hidden="true"
        className="heroc-scaffold absolute inset-x-0 top-20 flex items-center justify-center gap-4 z-16 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <span className="block h-px w-10 bg-ink/30" />
        <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-steel/80">
          FL · V0.1
        </span>
        <span className="block h-px w-10 bg-ink/30" />
      </div>
      <div
        aria-hidden="true"
        className="heroc-scaffold absolute inset-x-0 bottom-10 flex items-center justify-center gap-4 z-16 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <span className="block h-px w-10 bg-ink/30" />
        <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-steel/80">
          EST · 2024
        </span>
        <span className="block h-px w-10 bg-ink/30" />
      </div>

      {/* Gutter scaffolding — vertical labels left + right */}
      <div
        aria-hidden="true"
        className="heroc-scaffold absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3 z-16 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <span className="block w-px h-14 bg-ink/20" />
        <span
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-steel/70"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          CORE · F-01
        </span>
        <span className="block w-px h-14 bg-ink/20" />
      </div>
      <div
        aria-hidden="true"
        className="heroc-scaffold absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3 z-16 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <span className="block w-px h-14 bg-ink/20" />
        <span
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-steel/70"
          style={{ writingMode: "vertical-rl" }}
        >
          AI · YOURS
        </span>
        <span className="block w-px h-14 bg-ink/20" />
      </div>

      {/* Text stack — centered column, above reactor */}
      <div className="relative z-20 mx-auto max-w-[1280px] px-6 md:px-14 pt-28 md:pt-32">
        <div
          ref={textRef}
          className="flex flex-col items-center text-center min-h-[calc(100vh-160px)] justify-center will-change-transform"
        >
          {/* Byline */}
          <div
            className="heroc-byline flex items-center gap-4 mb-8 md:mb-10"
            style={{ opacity: 0 }}
          >
            <span className="block h-px w-10 bg-ink/40" aria-hidden="true" />
            <span className="font-mono text-[10.5px] tracking-[0.28em] uppercase text-steel">
              Flashback Labs
            </span>
            <span className="block h-px w-10 bg-ink/40" aria-hidden="true" />
          </div>

          {/* Headline */}
          <h1 className="font-display text-ink leading-[1.06] tracking-[-0.02em] text-[clamp(2.4rem,5.5vw,4.5rem)] max-w-[900px]">
            {HEADLINE_LINES.map((line, lineIdx) => (
              <span key={lineIdx} className="block">
                {line.map((word, wordIdx) => {
                  const isYou =
                    lineIdx === HEADLINE_LINES.length - 1 &&
                    wordIdx === line.length - 1;
                  return (
                    <span
                      key={`${lineIdx}-${wordIdx}`}
                      className="heroc-word inline-block mr-[0.25em] align-baseline relative"
                      style={{ opacity: 0, transform: "translateY(36px)" }}
                    >
                      {isYou ? (
                        <span className="text-hotrod relative">
                          {word}
                          <span
                            aria-hidden="true"
                            className="heroc-underline absolute left-0 right-[0.2em] -bottom-[0.08em] h-[3px] bg-hud origin-left"
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

          {/* Sub + CTAs — parallax shifts these slightly less than headline */}
          <div ref={subRef} className="will-change-transform">
            <p
              className="heroc-sub mt-10 md:mt-12 max-w-xl mx-auto text-[17px] md:text-[18px] leading-[1.55] text-ink-soft"
              style={{ opacity: 0 }}
            >
              Building the personal AI —{" "}
              <span className="text-ink">owned by you</span>, remembering your
              life, working for you alone.
            </p>

            <div
              className="heroc-cta-row flex flex-col sm:flex-row gap-4 mt-8 md:mt-10 justify-center pointer-events-auto"
              style={{ opacity: 0 }}
            >
              <a
                href="https://flashbackai.com"
                className="group relative inline-flex items-center justify-center px-8 py-3.5 bg-hotrod text-paper-raised font-mono text-[11px] tracking-[0.22em] uppercase overflow-hidden transition-colors duration-200 hover:bg-hotrod-deep"
                style={{ clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)" }}
              >
                <span aria-hidden="true" className="absolute top-0 right-0 w-2 h-2 border-t border-r border-paper-raised/40 pointer-events-none" />
                <span style={{ display: "inline-block" }}>Meet Flashback AI →</span>
              </a>

              <a
                href="/manifesto"
                className="group relative inline-flex items-center justify-center px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] uppercase overflow-hidden transition-colors duration-200 text-ink hover:text-paper-raised"
                style={{ clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)" }}
              >
                <span aria-hidden="true" className="absolute inset-0 border border-ink transition-colors duration-200 group-hover:border-ink pointer-events-none" style={{ clipPath: "inherit" }} />
                <span aria-hidden="true" className="absolute inset-0 bg-ink translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300 ease-out pointer-events-none" />
                <span className="relative z-10">Read the Thesis</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
