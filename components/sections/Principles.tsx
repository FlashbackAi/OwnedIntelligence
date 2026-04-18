"use client";

/**
 * Flashback Labs — § 04 Design Principles.
 *
 * Four circular "bubbles" arranged in a 2×2 bento. Variety comes from
 * diameter differences, not shape irregularity — the unevenness is the
 * size between bubbles. On scroll, each bubble's outline strokes in and
 * its accent fill draws from the center (scroll-scrubbed). On hover,
 * the bubble smoothly expands and reveals its description.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

// Squircle: mostly-square with generously rounded corners.
// Straight sides + ~25% corner radius — iOS-icon register.
const SQUIRCLE_PATH =
  "M 26 2 L 74 2 C 87 2, 98 13, 98 26 L 98 74 C 98 87, 87 98, 74 98 L 26 98 C 13 98, 2 87, 2 74 L 2 26 C 2 13, 13 2, 26 2 Z";

type Principle = {
  numeral: string;
  name: string;
  description: string;
  accentHex: string;
  // Side length in px — differs per bubble; that's where the bento variety lives.
  size: number;
  // Slight rotation (deg) — each bubble sits a touch off-axis.
  rotate: number;
  // Which grid cell it occupies + horizontal alignment inside its cell.
  gridArea: "a" | "b" | "c" | "d";
  align: "start" | "center" | "end";
};

const PRINCIPLES: Principle[] = [
  {
    numeral: "01",
    name: "Nonautonomous",
    description:
      "AI that asks, not one that acts without you. Every decision stays yours.",
    accentHex: "#0369A1",
    size: 420,
    rotate: -3,
    gridArea: "a",
    align: "end",
  },
  {
    numeral: "02",
    name: "Private by Default",
    description:
      "Your data lives on your devices, encrypted. We never see it, never sell it.",
    accentHex: "#8B6914",
    size: 340,
    rotate: 2.5,
    gridArea: "b",
    align: "start",
  },
  {
    numeral: "03",
    name: "User-Owned",
    description:
      "Keys, models, logs — all yours. No rented intelligence, no leased memory.",
    accentHex: "#B3111A",
    size: 360,
    rotate: 3,
    gridArea: "c",
    align: "end",
  },
  {
    numeral: "04",
    name: "Auditable",
    description:
      "Every action traceable. Nothing happens off-record. Open by construction.",
    accentHex: "#2E8B57",
    size: 500,
    rotate: -2,
    gridArea: "d",
    align: "start",
  },
];

export default function Principles() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Both desktop and mobile layouts are in the DOM (one hidden by media
     // query). Animate only the visible one — otherwise the hidden layout
     // holds its opacity:0/scale:0 initial state and the user sees blanks
     // when their viewport matches that layout.
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const activeBento = root.querySelector<HTMLElement>(
      isMobile ? ".principles-bento-mobile" : ".principles-bento-desktop",
    );
    const bubbles = activeBento
      ? Array.from(activeBento.querySelectorAll<HTMLElement>(".principle-bubble"))
      : [];
    const sectionMarker = root.querySelector<HTMLElement>(
      ".principles-section-marker",
    );
    const heading = root.querySelectorAll<HTMLElement>(".principles-heading");

    // Initialize each outline's dasharray so it can stroke in.
    const outlines = bubbles
      .map((b) => b.querySelector<SVGPathElement>(".principle-outline"))
      .filter(Boolean) as SVGPathElement[];
    outlines.forEach((path) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
    });

    if (prefersReducedMotion()) {
      gsap.set(
        [sectionMarker, ...heading, ...bubbles].filter(Boolean),
        { opacity: 1, y: 0 },
      );
      outlines.forEach((c) => (c.style.strokeDashoffset = "0"));
      bubbles.forEach((b) => {
        b.querySelectorAll<SVGElement | HTMLElement>(
          ".principle-fill, .principle-numeral, .principle-name, .principle-tag",
        ).forEach((el) => gsap.set(el, { opacity: 1 }));
      });
      return;
    }

    const triggers: ScrollTrigger[] = [];

    // Initial states for the header.
    gsap.set(sectionMarker, { opacity: 0, y: 8 });
    gsap.set(heading, { opacity: 0, y: 14 });

    // Initial states per bubble: outline hidden (dashoffset already set
    // above), fill scaled from 0 around its own center, text hidden.
    bubbles.forEach((b) => {
      const fill = b.querySelector<SVGPathElement>(".principle-fill");
      const numeral = b.querySelector<HTMLElement>(".principle-numeral");
      const name = b.querySelector<HTMLElement>(".principle-name");
      if (fill) {
        gsap.set(fill, {
          scale: 0,
          transformOrigin: "50% 50%",
          opacity: 1,
        });
      }
      if (numeral) gsap.set(numeral, { opacity: 0, y: 6 });
      if (name) gsap.set(name, { opacity: 0, y: 6 });
    });

    // Header fades in once on enter — not scrubbed.
    const header = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top 78%", once: true },
      defaults: { ease: "power3.out" },
    });
    header
      .to(sectionMarker, { opacity: 1, y: 0, duration: 0.5 }, 0)
      .to(heading, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.1);
    if (header.scrollTrigger)
      triggers.push(header.scrollTrigger as ScrollTrigger);

    // Per-bubble entry — fires once when each bubble enters the viewport.
    // Works identically for the desktop grid and the mobile stack; avoids
    // the scrub-progress edge cases that were leaving some tweens stuck
    // at their initial state.
    bubbles.forEach((b, i) => {
      const outline = outlines[i];
      const fill = b.querySelector<SVGPathElement>(".principle-fill");
      const numeral = b.querySelector<HTMLElement>(".principle-numeral");
      const name = b.querySelector<HTMLElement>(".principle-name");

      const tl = gsap.timeline({
        scrollTrigger: { trigger: b, start: "top 82%", once: true },
      });

      if (outline)
        tl.to(
          outline,
          { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" },
          0,
        );
      if (fill)
        tl.to(
          fill,
          { scale: 1, duration: 0.7, ease: "power2.out" },
          0.35,
        );
      if (numeral)
        tl.to(
          numeral,
          { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
          0.6,
        );
      if (name)
        tl.to(
          name,
          { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
          0.72,
        );

      if (tl.scrollTrigger) triggers.push(tl.scrollTrigger as ScrollTrigger);
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="principles"
      aria-labelledby="principles-heading"
      className="relative w-full bg-paper overflow-hidden"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 md:px-14 pt-16 md:pt-24 pb-24 md:pb-36">
        <div className="principles-section-marker flex items-center gap-4">
          <span className="block h-px w-14 bg-ink/50" aria-hidden="true" />
          <span className="font-mono text-[13px] tracking-[0.32em] uppercase text-ink">
            § 04 · PRINCIPLES
          </span>
        </div>

        <div className="mt-14 md:mt-20 max-w-[820px]">
          <span className="principles-heading block font-mono text-[10.5px] md:text-[11px] tracking-[0.3em] uppercase text-steel mb-5">
            Design principles // 01–04 // rules we won&rsquo;t break
          </span>
          <h2
            id="principles-heading"
            className="principles-heading font-display text-ink leading-[1.06] tracking-[-0.015em] text-[clamp(2rem,4.8vw,3.6rem)]"
          >
            Four rules we won&rsquo;t break.
          </h2>
          <p className="principles-heading mt-6 text-ink-soft text-[15px] md:text-[16px] max-w-[56ch] leading-[1.55]">
            The constants we design every product around. Hover a bubble to
            see it unpack.
          </p>
        </div>

        {/* Desktop: 2×2 bento. Variety lives in the bubble diameters. */}
        <div
          className="principles-bento-desktop hidden md:grid mt-20 mx-auto w-full"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "minmax(460px, auto) minmax(520px, auto)",
            gridTemplateAreas: `"a b" "c d"`,
            columnGap: "0",
            rowGap: "0",
          }}
        >
          {PRINCIPLES.map((p) => (
            <Bubble key={p.numeral} p={p} />
          ))}
        </div>

        {/* Mobile: stacked bubbles, centered. Description always visible. */}
        <div className="principles-bento-mobile md:hidden mt-14 flex flex-col items-center gap-10">
          {PRINCIPLES.map((p) => (
            <Bubble
              key={p.numeral}
              p={{ ...p, size: Math.min(Math.round(p.size * 0.72), 300) }}
              mobile
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   One bubble — circle, expands on hover.
   ─────────────────────────────────────────────── */

function Bubble({ p, mobile = false }: { p: Principle; mobile?: boolean }) {
  const alignClass =
    p.align === "start"
      ? "justify-self-start"
      : p.align === "end"
        ? "justify-self-end"
        : "justify-self-center";

  return (
    <article
      className={`principle-bubble group relative ${mobile ? "" : alignClass} self-center`}
      style={{
        gridArea: mobile ? undefined : p.gridArea,
        width: p.size,
        height: p.size,
        // Reserve space so hover scale doesn't knock neighbors.
        padding: p.size * 0.06,
        transform: mobile ? undefined : `rotate(${p.rotate}deg)`,
        transformOrigin: "50% 50%",
      }}
      tabIndex={0}
      aria-labelledby={`principle-${p.numeral}-name`}
    >
      <div className="relative w-full h-full transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08] group-focus:scale-[1.08]">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Squircle — subtle tinted fill on paper, not a solid accent block. */}
          <path
            className="principle-fill"
            d={SQUIRCLE_PATH}
            fill={p.accentHex}
            fillOpacity="0.16"
          />
          <path
            className="principle-outline"
            d={SQUIRCLE_PATH}
            fill="none"
            stroke={p.accentHex}
            strokeOpacity="0.55"
            strokeWidth="0.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Content — ink type reads against the soft tint. */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          style={{ borderRadius: "24%" }}
        >
          <span
            className="principle-numeral font-display leading-none text-ink"
            style={{
              fontSize: Math.round(p.size * 0.3),
              letterSpacing: "-0.02em",
            }}
            aria-hidden="true"
          >
            {p.numeral}
          </span>

          <h3
            id={`principle-${p.numeral}-name`}
            className="principle-name font-display text-ink mt-4 leading-[1.05] tracking-[-0.01em] px-2"
            style={{ fontSize: Math.max(16, p.size * 0.07) }}
          >
            {p.name}
          </h3>

          {/* Description — on desktop reveals on hover; on mobile always visible. */}
          <p
            className={`principle-desc mt-3 text-ink-soft leading-[1.55] transition-all duration-[380ms] ease-out ${
              mobile
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus:opacity-100 group-focus:translate-y-0"
            }`}
            style={{
              fontSize: Math.max(13, p.size * 0.045),
              maxWidth: p.size * 0.82,
            }}
          >
            {p.description}
          </p>
        </div>
      </div>
    </article>
  );
}
