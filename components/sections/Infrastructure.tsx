"use client";

/**
 * Flashback Labs — § 06 Infrastructure.
 *
 * Centered isometric stack. Four transparent layers bottom → top:
 *   01 Data  →  02 Infrastructure  →  03 Intelligence  →  04 Verification
 *
 * The tower is always visible as a translucent wire-frame construction.
 * Internal modules are hidden by default; hovering (or tapping) a slab
 * slowly reveals that layer's sub-system pattern AND fades in a detail
 * panel beneath the tower. Leaving resets state. Each layer has a
 * distinct internal signature so the section reads as a system diagram,
 * not just four stacked boxes.
 */

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { animate, svg, utils } from "animejs";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type LayerKind = "data" | "infra" | "intelligence" | "verify";

type Layer = {
  idx: number; // 0 = bottom, 3 = top
  numeral: string;
  name: string;
  short: string; // drafting-style abbreviation for on-diagram callout
  kind: LayerKind;
  thesis: string;
  modules: string[];
  spec: string;
};

const LAYERS: Layer[] = [
  {
    idx: 0,
    numeral: "01",
    name: "Data",
    short: "DATA",
    kind: "data",
    thesis: "Encrypted personal memory — yours, portable, permanent.",
    modules: ["Vault", "On-device store", "E2E sync"],
    spec: "AES-256 · per-user keys · offline-first",
  },
  {
    idx: 1,
    numeral: "02",
    name: "Infrastructure",
    short: "INFRA",
    kind: "infra",
    thesis: "Compute that runs beside you, not behind a curtain.",
    modules: ["Edge runtime", "Sync fabric", "Local models"],
    spec: "on-device inference · bandwidth-aware",
  },
  {
    idx: 2,
    numeral: "03",
    name: "Intelligence",
    short: "INTEL",
    kind: "intelligence",
    thesis: "A Jarvis that thinks in context, not in tokens.",
    modules: ["Retrieval", "Reasoning", "Memory graph"],
    spec: "personal model · stateful recall",
  },
  {
    idx: 3,
    numeral: "04",
    name: "Verification",
    short: "VERIFY",
    kind: "verify",
    thesis: "Proof that what thinks for you answers to you.",
    modules: ["Attestation", "zk-proofs", "Audit trail"],
    spec: "signed outputs · third-party verifiable",
  },
];

/* ────── Geometry ────── */

const CX = 500;
const TOP_Y = 110;
const GAP = 18;

// Dramatic step-pyramid — each layer has its own width, depth, and height.
type Size = { hw: number; hd: number; thickness: number };
const LAYER_SIZES: Size[] = [
  { hw: 180, hd: 82, thickness: 78 }, // 01 Data — heaviest foundation
  { hw: 148, hd: 66, thickness: 64 }, // 02 Infrastructure
  { hw: 120, hd: 54, thickness: 54 }, // 03 Intelligence
  { hw: 92,  hd: 42, thickness: 46 }, // 04 Verification — slim cap
];

// Envelope maxima — used by tower-wide ornaments (ground, cables, bus).
// HW/HD/THICKNESS aliases preserve call sites that reason about the outer envelope
// (widest slab at bottom of the stack).
const HW = LAYER_SIZES[0].hw;
const HD = LAYER_SIZES[0].hd;
const THICKNESS = LAYER_SIZES[0].thickness;

function layerDims(idx: number): Size {
  return LAYER_SIZES[idx] ?? LAYER_SIZES[0];
}

/** y-position of a layer's TOP face, accumulating per-layer thickness from the top down. */
function topFaceY(idx: number) {
  let y = TOP_Y;
  for (let i = 3; i > idx; i--) {
    y += LAYER_SIZES[i].thickness + GAP;
  }
  return y;
}

function topDiamond(yc: number, hw: number, hd: number) {
  return {
    F: [CX, yc + hd] as const,
    R: [CX + hw, yc] as const,
    B: [CX, yc - hd] as const,
    L: [CX - hw, yc] as const,
  };
}

/* ────── Component ────── */

export default function Infrastructure() {
  const rootRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number>(-1); // -1 = nothing hovered
  const [locked, setLocked] = useState(false); // touch devices
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Header + scroll-in reveal.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const svgEl = svgRef.current;
    if (!root || !svgEl) return;

    const marker = root.querySelector<HTMLElement>(".infra-section-marker");
    const eyebrow = root.querySelector<HTMLElement>(".infra-eyebrow");
    const headline = root.querySelectorAll<HTMLElement>(".infra-headline-line");
    const hint = root.querySelector<HTMLElement>(".infra-hint");

    const leaders = svgEl.querySelectorAll<SVGPathElement>(".infra-leader");
    const slabGroups = svgEl.querySelectorAll<SVGGElement>(".infra-slab");
    const spine = svgEl.querySelector<SVGPathElement>(".infra-spine");

    if (prefersReducedMotion()) {
      gsap.set([marker, eyebrow, ...headline, hint].filter(Boolean), {
        opacity: 1,
        y: 0,
      });
      leaders.forEach((l) => l.setAttribute("stroke-dashoffset", "0"));
      slabGroups.forEach((g) => {
        (g as SVGGElement).style.opacity = "1";
        (g as SVGGElement).style.transform = "translate(0,0)";
      });
      if (spine) spine.setAttribute("stroke-dashoffset", "0");
      return;
    }

    const triggers: ScrollTrigger[] = [];

    gsap.set(marker, { opacity: 0, y: 8 });
    gsap.set(eyebrow, { opacity: 0, y: 8 });
    gsap.set(headline, { opacity: 0, y: 18 });
    gsap.set(hint, { opacity: 0, y: 10 });

    const header = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top 78%", once: true },
      defaults: { ease: "power3.out" },
    });
    header
      .to(marker, { opacity: 1, y: 0, duration: 0.5 }, 0)
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
      .to(headline, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.15);
    if (header.scrollTrigger) triggers.push(header.scrollTrigger as ScrollTrigger);

    // Initial slab states — hidden, slight y offset.
    slabGroups.forEach((g) => {
      utils.set(g, { opacity: 0, translateY: 22 });
    });
    const leaderDrawables = svg.createDrawable(".infra-leader");
    const spineDrawable = spine ? svg.createDrawable(".infra-spine") : [];

    const enterST = ScrollTrigger.create({
      trigger: svgEl,
      start: "top 80%",
      once: true,
      onEnter: () => {
        animate(slabGroups, {
          opacity: 1,
          translateY: 0,
          duration: 850,
          ease: "outQuart",
          delay: (_el, i) => i * 140,
        });
        animate(leaderDrawables, {
          draw: "0 1",
          duration: 700,
          ease: "inOutQuad",
          delay: (_el, i) => 600 + i * 110,
        });
        if (spineDrawable.length) {
          animate(spineDrawable, {
            draw: "0 1",
            duration: 1200,
            ease: "inOutQuad",
            delay: 300,
          });
        }
        animate(".infra-hint", {
          opacity: 1,
          translateY: 0,
          duration: 600,
          ease: "outQuad",
          delay: 1000,
        });
      },
    });
    triggers.push(enterST);

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  // Active-layer cross-fade — slab strokes, washes, labels, modules.
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const washes = svgEl.querySelectorAll<SVGElement>(".infra-wash");
    washes.forEach((w) => {
      const isActive = Number(w.dataset.idx) === active;
      animate(w, {
        opacity: isActive ? 0.28 : 0.06,
        duration: 500,
        ease: "outQuad",
      });
    });

    const strokes = svgEl.querySelectorAll<SVGElement>(".infra-slab-stroke");
    strokes.forEach((s) => {
      const isActive = Number(s.dataset.idx) === active;
      animate(s, {
        opacity: isActive ? 1 : 0.5,
        duration: 500,
        ease: "outQuad",
      });
    });

    const labels = svgEl.querySelectorAll<SVGElement>(".infra-label");
    labels.forEach((l) => {
      const isActive = Number(l.dataset.idx) === active;
      animate(l, {
        opacity: isActive ? 1 : 0.32,
        duration: 420,
        ease: "outQuad",
      });
    });

    // Per-layer inner module reveal — slow, staggered, only on active.
    LAYERS.forEach((layer) => {
      const group = svgEl.querySelector<SVGGElement>(
        `.infra-modules[data-idx="${layer.idx}"]`,
      );
      if (!group) return;
      const items = group.querySelectorAll<SVGElement>(".infra-module-item");
      const isActive = active === layer.idx;
      animate(items, {
        opacity: isActive ? 1 : 0,
        scale: isActive ? 1 : 0.86,
        duration: isActive ? 700 : 340,
        ease: isActive ? "outBack(1.2)" : "outQuad",
        delay: isActive ? (_el, i) => i * 90 : 0,
      });
    });
  }, [active]);

  const activeLayer = active >= 0 ? LAYERS[active] : null;

  const handleEnter = (idx: number) => {
    if (locked) return;
    setActive(idx);
  };
  const handleLeaveAll = () => {
    if (locked) return;
    setActive(-1);
  };
  const handleTap = (idx: number) => {
    if (active === idx && locked) {
      setActive(-1);
      setLocked(false);
      return;
    }
    setActive(idx);
    setLocked(true);
  };

  return (
    <section
      ref={rootRef}
      id="infrastructure"
      aria-labelledby="infra-heading"
      className="relative w-full bg-paper"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 md:px-14 pt-16 md:pt-24 pb-105 md:pb-100">
        {/* Section marker */}
        <div className="infra-section-marker flex items-center gap-4">
          <span className="block h-px w-14 bg-ink/50" aria-hidden="true" />
          <span className="font-mono text-[13px] tracking-[0.32em] uppercase text-ink">
            § 06 · INFRASTRUCTURE
          </span>
        </div>

        {/* Header */}
        <div className="mt-14 md:mt-20 max-w-[900px]">
          <span className="infra-eyebrow block font-mono text-[10.5px] md:text-[11px] tracking-[0.3em] uppercase text-steel mb-5">
            Stack // 01–04 // data → verification
          </span>
          <h2
            id="infra-heading"
            className="font-display text-ink leading-[1.06] tracking-[-0.015em] text-[clamp(2rem,4.8vw,3.6rem)]"
          >
            <span className="infra-headline-line block">
              A stack that remembers.
            </span>
            <span className="infra-headline-line block">
              From data to <span className="text-hotrod">proof</span>.
            </span>
          </h2>
        </div>

        {/* Tower + panel */}
        <div
          className="mt-16 md:mt-24 lg:mt-32 relative"
          onMouseLeave={handleLeaveAll}
        >
          {/* Status bar */}
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-steel whitespace-nowrap">
              <span className="hidden sm:inline">stack · isometric · </span>01 → 04
            </span>
            <span className="block h-px flex-1 bg-ink/20" aria-hidden="true" />
            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-steel whitespace-nowrap">
              {active === -1 ? "idle" : `active · ${LAYERS[active].numeral}`}
            </span>
          </div>

          {/* Tap / hover prompt */}
          <div
            className="relative h-7 mb-6 md:mb-10 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <HoverPrompt visible={active === -1} isMobile={!isDesktop} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-10 items-start">
            {/* Tower — desktop: scale 2→1.2 + slide left. Mobile: scale(1.5) fixed, no slide */}
            <div
              className="relative"
              style={
                isDesktop
                  ? {
                      transform:
                        active === -1
                          ? "translateX(45%) scale(2)"
                          : "translateX(0) scale(1.2)",
                      transformOrigin: "center top",
                      transition:
                        "transform 780ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                    }
                  : {
                      transform: "scale(1.5)",
                      transformOrigin: "center top",
                      marginBottom: "64px",
                    }
              }
            >
              <TowerSVG
                ref={svgRef}
                active={active}
                onEnter={handleEnter}
                onLeaveAll={handleLeaveAll}
                onTap={handleTap}
              />
            </div>

            {/* Panel — desktop: slides in from right. Mobile: slides in from below */}
            <div
              className="relative"
              style={{
                opacity: active === -1 ? 0 : 1,
                transform: active === -1
                  ? isDesktop ? "translateX(20px)" : "translateY(16px)"
                  : "translate(0,0)",
                transition:
                  "opacity 520ms ease-out, transform 640ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                pointerEvents: active === -1 ? "none" : "auto",
              }}
            >
              <DetailPanel layer={activeLayer} />
            </div>
          </div>

          {/* Hint — only shown when a layer is active (prompt handles the idle state) */}
          {active !== -1 && (
            <p className="infra-hint mt-8 font-mono text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-steel text-center">
              <span className="inline-flex items-center gap-3">
                <span className="block h-px w-10 bg-ink/30" />
                {isDesktop ? "move off the stack to reset" : "tap again to reset"}
                <span className="block h-px w-10 bg-ink/30" />
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   Detail panel — slow fade-in on hover/activation
   ─────────────────────────────────────────────── */

function DetailPanel({ layer }: { layer: Layer | null }) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Animate whenever layer identity changes (including null → hide).
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (!layer) {
      animate(el, {
        opacity: 0,
        translateY: 10,
        duration: 280,
        ease: "outQuad",
      });
      return;
    }
    const items = el.querySelectorAll<HTMLElement>(".infra-panel-item");
    animate(el, {
      opacity: 1,
      translateY: 0,
      duration: 500,
      ease: "outQuart",
    });
    animate(items, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 700,
      ease: "outQuart",
      delay: (_el, i) => 80 + i * 90,
    });
  }, [layer?.idx, layer]);

  return (
    <div
      ref={panelRef}
      className="infra-panel-root w-full"
      style={{ opacity: 0, transform: "translateY(10px)" }}
      aria-live="polite"
    >
      {layer ? (
        <div className="relative overflow-hidden bg-paper-raised border border-ink/20"
          style={{
            backgroundImage: "radial-gradient(circle, #D8D5CE 0.8px, transparent 0.8px)",
            backgroundSize: "18px 18px",
          }}
        >
          {/* Hotrod left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-hotrod" />

          {/* Scan-line sweep (single pass on mount via CSS animation) */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background: "linear-gradient(to bottom, transparent 0%, rgba(179,17,26,0.06) 50%, transparent 100%)",
              backgroundSize: "100% 60px",
              animation: "scanSweep 2s ease-out forwards",
            }}
          />

          {/* Ghost numeral watermark — hidden on mobile to save space */}
          <div
            className="hidden sm:block absolute right-4 top-3 font-display leading-none tracking-[-0.04em] select-none pointer-events-none"
            style={{ fontSize: "clamp(3rem,8vw,7rem)", color: "rgba(11,13,16,0.06)" }}
            aria-hidden="true"
          >
            {layer.numeral}
          </div>

          <div className="relative p-4 sm:p-5 md:p-6 pl-6 sm:pl-7 md:pl-9">
            {/* Top row */}
            <div className="infra-panel-item flex items-center gap-2">
              <span className="block h-[6px] w-[6px] rounded-full bg-hotrod shrink-0" />
              <span className="font-mono text-[8px] tracking-[0.34em] uppercase text-hotrod">
                {layer.numeral} · ACTIVE
              </span>
              <span className="block h-px flex-1 bg-hotrod/30" />
              <span className="font-mono text-[8px] tracking-[0.26em] uppercase text-steel">
                {layer.kind.toUpperCase()}
              </span>
            </div>

            {/* Name */}
            <h3
              className="infra-panel-item mt-3 font-display text-ink leading-[1.02] tracking-[-0.02em]"
              style={{ fontSize: "clamp(1.4rem,3vw,2.2rem)" }}
            >
              {layer.name}
            </h3>
            <div className="infra-panel-item mt-1.5 flex items-center gap-2">
              <span className="block h-[2px] w-8 bg-hotrod" />
              <span className="block h-[2px] w-2 bg-hotrod/40" />
            </div>

            {/* Thesis */}
            <p className="infra-panel-item mt-3 text-ink-soft text-[13px] leading-[1.55]">
              {layer.thesis}
            </p>

            {/* Modules */}
            <div className="infra-panel-item mt-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[8px] tracking-[0.34em] uppercase text-steel">
                  MODULES
                </span>
                <span className="block h-px flex-1 bg-ink/15" />
                <span className="font-mono text-[8px] tracking-[0.26em] uppercase text-steel">
                  03
                </span>
              </div>
              <ul className="grid grid-cols-3 gap-1.5">
                {layer.modules.map((m, i) => (
                  <li key={m} className="relative bg-paper border border-ink/20 p-2">
                    <span className="absolute top-0 left-0 w-[4px] h-[4px] border-t border-l border-hotrod/60" />
                    <span className="absolute bottom-0 right-0 w-[4px] h-[4px] border-b border-r border-hotrod/60" />
                    <span className="block font-mono text-[7.5px] tracking-[0.28em] uppercase text-hotrod/80">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="block mt-0.5 font-display text-ink text-[11px] leading-[1.25] tracking-[-0.01em]">
                      {m}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Spec block */}
            <div className="infra-panel-item mt-4 bg-paper border border-ink/20 px-3 py-2 flex items-center gap-2">
              <span className="block w-[5px] h-[5px] bg-hotrod shrink-0" />
              <span className="font-mono text-[8.5px] tracking-[0.26em] uppercase text-ink/70">
                {layer.spec}
              </span>
            </div>

            {/* Bottom meta row */}
            <div className="infra-panel-item mt-3 flex items-center justify-between">
              <span className="font-mono text-[8.5px] tracking-[0.32em] uppercase text-steel">
                flashback · stack · {layer.numeral}/04
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="block h-[5px] rounded-full"
                    style={{
                      width: i <= layer.idx ? "18px" : "6px",
                      background: i <= layer.idx ? "#B3111A" : "rgba(11,13,16,0.2)",
                      transition: "all 300ms",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Outer corner marks */}
          <PanelCornerMarks />
        </div>
      ) : null}
    </div>
  );
}

/* ────── Hover prompt — visible only in idle state ────── */

function HoverPrompt({ visible, isMobile = false }: { visible: boolean; isMobile?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-2 whitespace-nowrap"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? "0" : "-4px"})`,
        transition: "opacity 420ms ease-out, transform 420ms ease-out",
      }}
    >
      <span className="block h-[7px] w-[7px] rounded-full bg-hotrod" />
      <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-hotrod">
        {isMobile ? "tap a layer" : "hover a layer"}
      </span>
      <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-ink">
        ↓
      </span>
    </div>
  );
}

function PanelCornerMarks() {
  const base = "absolute w-[10px] h-[10px] pointer-events-none";
  const corners = [
    "-top-1.5 -left-1.5",
    "-top-1.5 -right-1.5",
    "-bottom-1.5 -left-1.5",
    "-bottom-1.5 -right-1.5",
  ];
  return (
    <>
      {corners.map((c, i) => (
        <span key={i} className={`${base} ${c}`} aria-hidden="true">
          <span className="absolute top-1/2 left-0 right-0 h-px bg-ink/60" />
          <span className="absolute left-1/2 top-0 bottom-0 w-px bg-ink/60" />
        </span>
      ))}
    </>
  );
}

/* ───────────────────────────────────────────────
   Tower SVG — centered, transparent, complex
   ─────────────────────────────────────────────── */

type TowerProps = {
  active: number;
  onEnter: (idx: number) => void;
  onLeaveAll: () => void;
  onTap: (idx: number) => void;
};

const TowerSVG = forwardRef<SVGSVGElement, TowerProps>(function TowerSVG(
  { active, onEnter, onLeaveAll, onTap },
  ref,
) {
  const VB_W = 1000;
  const VB_H = 640;

  // Spine path — runs through center of every top face + extends into ground.
  const spineTop = topFaceY(3) - HD - 16;
  const spineBottom = topFaceY(0) + THICKNESS + HD + 40;
  const spineD = `M ${CX} ${spineTop} L ${CX} ${spineBottom}`;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="w-full h-auto max-w-none sm:max-w-[520px] lg:max-w-[600px] mx-auto block"
      aria-label="Flashback stack — four layers, bottom to top: data, infrastructure, intelligence, verification"
      onMouseLeave={onLeaveAll}
    >
      <defs>
        {/* dotted drafting grid */}
        <pattern
          id="infra-dots"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="0.7" fill="#D8D5CE" />
        </pattern>
      </defs>

      <rect
        x="0"
        y="0"
        width={VB_W}
        height={VB_H}
        fill="url(#infra-dots)"
        opacity="0.55"
      />

      {/* Ground diamond */}
      <GroundDiamond />

      {/* Spine — vertical axis passing through all slab centers */}
      <path
        className="infra-spine"
        d={spineD}
        fill="none"
        stroke="#0B0D10"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      {/* Service cables + junctions (behind slabs so they show through translucent walls) */}
      <TowerInfrastructure />

      {/* Slabs (bottom → top) */}
      {LAYERS.map((layer) => (
        <SlabGroup
          key={layer.idx}
          layer={layer}
          active={active === layer.idx}
          onEnter={() => onEnter(layer.idx)}
          onTap={() => onTap(layer.idx)}
        />
      ))}

      {/* Antenna + intake — rendered AFTER slabs so they read as attached */}
      <TowerAntenna />
      <TowerIntakePort />
      <PowerBus />

      {/* Leader lines + labels — alternating sides for balance */}
      {LAYERS.map((layer) => (
        <Leader
          key={`lead-${layer.idx}`}
          layer={layer}
          active={active === layer.idx}
          side={layer.idx % 2 === 0 ? "right" : "left"}
        />
      ))}
    </svg>
  );
});

function GroundDiamond() {
  const yc = topFaceY(0) + THICKNESS + 34;
  const hw = HW + 78;
  const hd = HD + 34;
  const d = `M ${CX} ${yc - hd} L ${CX + hw} ${yc} L ${CX} ${yc + hd} L ${CX - hw} ${yc} Z`;
  // Secondary smaller diamond for double-outline "platform" read
  const hw2 = HW + 38;
  const hd2 = HD + 18;
  const d2 = `M ${CX} ${yc - hd2} L ${CX + hw2} ${yc} L ${CX} ${yc + hd2} L ${CX - hw2} ${yc} Z`;
  return (
    <g aria-hidden="true">
      <path d={d} fill="none" stroke="#D8D5CE" strokeWidth="1" strokeDasharray="2 5" />
      <path d={d2} fill="none" stroke="#D8D5CE" strokeWidth="1" />
      <circle cx={CX} cy={yc} r="2" fill="#5A6470" />
      {/* tiny cardinal ticks */}
      {[
        [CX + hw, yc],
        [CX - hw, yc],
        [CX, yc + hd],
        [CX, yc - hd],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill="#5A6470" />
      ))}
    </g>
  );
}

function DimensionRail() {
  // Vertical rail on the LEFT of the tower showing layer heights as drafting dimensions.
  const x = CX - HW - 110;
  const topY = topFaceY(3) - HD;
  const botY = topFaceY(0) + THICKNESS + HD;
  return (
    <g aria-hidden="true" opacity="0.7">
      {/* Main rail */}
      <line x1={x} y1={topY} x2={x} y2={botY} stroke="#0B0D10" strokeOpacity="0.35" strokeWidth="1" />
      {/* End caps */}
      <line x1={x - 5} y1={topY} x2={x + 5} y2={topY} stroke="#0B0D10" strokeOpacity="0.45" strokeWidth="1" />
      <line x1={x - 5} y1={botY} x2={x + 5} y2={botY} stroke="#0B0D10" strokeOpacity="0.45" strokeWidth="1" />
      {/* Layer ticks */}
      {LAYERS.map((l) => {
        const y = topFaceY(l.idx);
        return (
          <g key={l.idx}>
            <line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke="#0B0D10" strokeOpacity="0.5" strokeWidth="1" />
            <text
              x={x - 10}
              y={y + 3}
              textAnchor="end"
              fontFamily="var(--font-mono, ui-monospace, monospace)"
              fontSize="8.5"
              letterSpacing="1.5"
              fill="#5A6470"
            >
              {l.numeral}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ────── Slab ────── */

function SlabGroup({
  layer,
  active,
  onEnter,
  onTap,
}: {
  layer: Layer;
  active: boolean;
  onEnter: () => void;
  onTap: () => void;
}) {
  const yc = topFaceY(layer.idx);
  const { hw, hd, thickness } = layerDims(layer.idx);
  const yb = yc + thickness;
  const top = topDiamond(yc, hw, hd);
  const bot = topDiamond(yb, hw, hd);

  const topFace = `${top.F[0]},${top.F[1]} ${top.R[0]},${top.R[1]} ${top.B[0]},${top.B[1]} ${top.L[0]},${top.L[1]}`;
  const rightFace = `${top.F[0]},${top.F[1]} ${top.R[0]},${top.R[1]} ${bot.R[0]},${bot.R[1]} ${bot.F[0]},${bot.F[1]}`;
  const leftFace = `${top.L[0]},${top.L[1]} ${top.F[0]},${top.F[1]} ${bot.F[0]},${bot.F[1]} ${bot.L[0]},${bot.L[1]}`;

  return (
    <g
      className="infra-slab cursor-pointer"
      data-idx={layer.idx}
      onMouseEnter={onEnter}
      onClick={onTap}
      style={{ transformOrigin: `${CX}px ${yc}px` }}
    >
      {/* Right wall — very transparent fill */}
      <polygon
        points={rightFace}
        fill="#0B0D10"
        fillOpacity="0.04"
        stroke="#0B0D10"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      {/* Left wall */}
      <polygon
        points={leftFace}
        fill="#0B0D10"
        fillOpacity="0.015"
        stroke="#0B0D10"
        strokeOpacity="0.4"
        strokeWidth="1"
      />

      {/* Back edges (hidden-line hint) — dashed diagonals from back corner of top */}
      <line
        x1={top.B[0]}
        y1={top.B[1]}
        x2={bot.F[0] - 0} /* invisible node; we only use back-top to back-bottom */
        y2={top.B[1] + thickness}
        stroke="#0B0D10"
        strokeOpacity="0.18"
        strokeWidth="0.85"
        strokeDasharray="2 3"
      />

      {/* Hotrod wash on top face */}
      <polygon
        className="infra-wash"
        data-idx={layer.idx}
        points={topFace}
        fill="#B3111A"
        opacity="0.06"
        style={{ pointerEvents: "none" }}
      />

      {/* Top face stroke (clickable surface) */}
      <polygon
        className="infra-slab-stroke"
        data-idx={layer.idx}
        points={topFace}
        fill="#FFFFFF"
        fillOpacity="0.35"
        stroke="#0B0D10"
        strokeOpacity={active ? 1 : 0.55}
        strokeWidth="1.2"
      />

      {/* Corner brackets on top face — drafting cue */}
      <TopFaceBrackets top={top} />

      {/* Always-visible wall detail: ribs + mid-band + port row */}
      <SlabWallDetails top={top} bot={bot} thickness={thickness} />

      {/* Always-visible top-face decor: scan-grid + bolts + inset frame + label */}
      <SlabTopDecor top={top} layer={layer} active={active} />

      {/* Front-edge inside tick */}
      <line
        x1={top.F[0]}
        y1={top.F[1]}
        x2={top.F[0]}
        y2={top.F[1] + 5}
        stroke="#0B0D10"
        strokeOpacity="0.7"
        strokeWidth="1"
      />

      {/* Inner module pattern — revealed on hover */}
      <ModulePattern layer={layer} yc={yc} />
    </g>
  );
}

/* ────── Wall details: vertical ribs, mid-band, port row ────── */

function SlabWallDetails({
  top,
  bot,
  thickness,
}: {
  top: ReturnType<typeof topDiamond>;
  bot: ReturnType<typeof topDiamond>;
  thickness: number;
}) {
  const lerp = (a: readonly number[], b: readonly number[], t: number) => [
    a[0] + t * (b[0] - a[0]),
    a[1] + t * (b[1] - a[1]),
  ];

  // Right-wall vertical ribs (from top.F→top.R edge down to bot.F→bot.R edge)
  const rightRibs = [0.28, 0.52, 0.76].map((t) => ({
    t,
    t1: lerp(top.F, top.R, t),
    t2: lerp(bot.F, bot.R, t),
  }));
  // Left-wall vertical ribs
  const leftRibs = [0.28, 0.52, 0.76].map((t) => ({
    t,
    t1: lerp(top.L, top.F, t),
    t2: lerp(bot.L, bot.F, t),
  }));
  // Mid-band: horizontal dashed line midway down each wall
  const mid = (p: readonly number[]) => [p[0], p[1] + thickness / 2];
  const rightMid = { a: mid(top.F), b: mid(top.R) };
  const leftMid = { a: mid(top.L), b: mid(top.F) };
  // Port row: 7 tiny square ports along each bottom edge, inset up by 6
  const ports = (a: readonly number[], b: readonly number[]) =>
    Array.from({ length: 7 }, (_, i) => {
      const t = (i + 1) / 8;
      const [x, y] = lerp(a, b, t);
      return { x: x - 1.5, y: y - 6 };
    });
  const rightPorts = ports(bot.F, bot.R);
  const leftPorts = ports(bot.L, bot.F);

  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      {rightRibs.map((r, i) => (
        <line
          key={`rr${i}`}
          x1={r.t1[0]}
          y1={r.t1[1]}
          x2={r.t2[0]}
          y2={r.t2[1]}
          stroke="#0B0D10"
          strokeOpacity="0.22"
          strokeWidth="0.7"
        />
      ))}
      {leftRibs.map((r, i) => (
        <line
          key={`lr${i}`}
          x1={r.t1[0]}
          y1={r.t1[1]}
          x2={r.t2[0]}
          y2={r.t2[1]}
          stroke="#0B0D10"
          strokeOpacity="0.22"
          strokeWidth="0.7"
        />
      ))}
      <line
        x1={rightMid.a[0]}
        y1={rightMid.a[1]}
        x2={rightMid.b[0]}
        y2={rightMid.b[1]}
        stroke="#0B0D10"
        strokeOpacity="0.3"
        strokeWidth="0.8"
        strokeDasharray="3 2"
      />
      <line
        x1={leftMid.a[0]}
        y1={leftMid.a[1]}
        x2={leftMid.b[0]}
        y2={leftMid.b[1]}
        stroke="#0B0D10"
        strokeOpacity="0.3"
        strokeWidth="0.8"
        strokeDasharray="3 2"
      />
      {rightPorts.map((p, i) => (
        <rect
          key={`pr${i}`}
          x={p.x}
          y={p.y}
          width="3"
          height="3"
          fill="#FFFFFF"
          stroke="#0B0D10"
          strokeOpacity="0.55"
          strokeWidth="0.7"
        />
      ))}
      {leftPorts.map((p, i) => (
        <rect
          key={`pl${i}`}
          x={p.x}
          y={p.y}
          width="3"
          height="3"
          fill="#FFFFFF"
          stroke="#0B0D10"
          strokeOpacity="0.55"
          strokeWidth="0.7"
        />
      ))}
    </g>
  );
}

/* ────── Top-face decor: scan grid + corner bolts + inset frame + label ────── */

function SlabTopDecor({
  top,
  layer,
  active,
}: {
  top: ReturnType<typeof topDiamond>;
  layer: Layer;
  active: boolean;
}) {
  const lerp = (a: readonly number[], b: readonly number[], t: number) => [
    a[0] + t * (b[0] - a[0]),
    a[1] + t * (b[1] - a[1]),
  ];

  // Scan grid — 3 hairlines parallel to F-R edge, 3 parallel to L-F edge
  const frLines = [0.25, 0.5, 0.75].map((t) => ({
    a: lerp(top.L, top.F, t),
    b: lerp(top.B, top.R, t),
  }));
  const lfLines = [0.25, 0.5, 0.75].map((t) => ({
    a: lerp(top.F, top.R, t),
    b: lerp(top.L, top.B, t),
  }));

  // Inset frame — diamond at 82% of the full top face
  const s = 0.82;
  const cx = top.F[0];
  const cy = (top.F[1] + top.B[1]) / 2;
  const ix = (p: readonly number[]) => [
    cx + s * (p[0] - cx),
    cy + s * (p[1] - cy),
  ];
  const iF = ix(top.F);
  const iR = ix(top.R);
  const iB = ix(top.B);
  const iL = ix(top.L);

  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      {/* Scan grid */}
      {frLines.map((l, i) => (
        <line
          key={`fr${i}`}
          x1={l.a[0]}
          y1={l.a[1]}
          x2={l.b[0]}
          y2={l.b[1]}
          stroke="#0B0D10"
          strokeOpacity="0.13"
          strokeWidth="0.6"
        />
      ))}
      {lfLines.map((l, i) => (
        <line
          key={`lf${i}`}
          x1={l.a[0]}
          y1={l.a[1]}
          x2={l.b[0]}
          y2={l.b[1]}
          stroke="#0B0D10"
          strokeOpacity="0.13"
          strokeWidth="0.6"
        />
      ))}
      {/* Inset frame */}
      <polygon
        points={`${iF[0]},${iF[1]} ${iR[0]},${iR[1]} ${iB[0]},${iB[1]} ${iL[0]},${iL[1]}`}
        fill="none"
        stroke="#0B0D10"
        strokeOpacity="0.32"
        strokeWidth="0.75"
        strokeDasharray="2 2"
      />
      {/* Corner bolts at the 4 top-face corners */}
      {[top.F, top.R, top.B, top.L].map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r="2"
          fill="#FFFFFF"
          stroke="#0B0D10"
          strokeOpacity="0.7"
          strokeWidth="0.85"
        />
      ))}
      {/* Mono label near back corner */}
      <text
        x={top.B[0]}
        y={top.B[1] + 11}
        textAnchor="middle"
        fontFamily="var(--font-mono, ui-monospace, monospace)"
        fontSize="7"
        letterSpacing="2"
        fill={active ? "#B3111A" : "#5A6470"}
        opacity={active ? 1 : 0.7}
        style={{ textTransform: "uppercase" }}
      >
        LYR · {layer.numeral} · {layer.name.slice(0, 3)}
      </text>
    </g>
  );
}

/* ────── Tower-wide infrastructure: cables + gap junctions ────── */

function TowerInfrastructure() {
  const topY = topFaceY(3) - HD - 4;
  const botY = topFaceY(0) + THICKNESS + HD + 24;
  // Cables — paired offsets from spine, both with dashed stroke.
  const cables = [-28, 28];
  // Gap junction boxes — one per gap per side, 3 gaps × 2 sides = 6
  const junctions: { x: number; y: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const y = topFaceY(i) - GAP / 2;
    junctions.push({ x: CX + HW - 34, y });
    junctions.push({ x: CX - HW + 34, y });
  }

  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      {cables.map((dx, i) => (
        <path
          key={`c${i}`}
          d={`M ${CX + dx} ${topY} L ${CX + dx} ${botY}`}
          fill="none"
          stroke="#0B0D10"
          strokeOpacity="0.28"
          strokeWidth="0.85"
          strokeDasharray="3 3"
        />
      ))}
      {junctions.map((j, i) => (
        <g key={`j${i}`}>
          <rect
            x={j.x - 3}
            y={j.y - 3}
            width="6"
            height="6"
            fill="#FFFFFF"
            stroke="#0B0D10"
            strokeOpacity="0.6"
            strokeWidth="0.85"
          />
          <circle cx={j.x} cy={j.y} r="0.9" fill="#0B0D10" fillOpacity="0.7" />
        </g>
      ))}
    </g>
  );
}

/* ────── Antenna above layer 04 ────── */

function TowerAntenna() {
  const base = topFaceY(3) - HD - 2;
  const tip = base - 56;
  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      {/* main mast */}
      <line
        x1={CX}
        y1={base}
        x2={CX}
        y2={tip}
        stroke="#0B0D10"
        strokeOpacity="0.65"
        strokeWidth="0.9"
      />
      {/* cross-bar elements */}
      <line x1={CX - 12} y1={tip + 16} x2={CX + 12} y2={tip + 16} stroke="#0B0D10" strokeOpacity="0.55" strokeWidth="0.85" />
      <line x1={CX - 8} y1={tip + 26} x2={CX + 8} y2={tip + 26} stroke="#0B0D10" strokeOpacity="0.55" strokeWidth="0.85" />
      <line x1={CX - 5} y1={tip + 34} x2={CX + 5} y2={tip + 34} stroke="#0B0D10" strokeOpacity="0.55" strokeWidth="0.85" />
      {/* base mount cube */}
      <rect x={CX - 5} y={base - 6} width="10" height="6" fill="#FFFFFF" stroke="#0B0D10" strokeOpacity="0.6" strokeWidth="0.85" />
      {/* tip beacon */}
      <circle cx={CX} cy={tip} r="2.4" fill="#B3111A" />
      <circle cx={CX} cy={tip} r="5" fill="none" stroke="#B3111A" strokeOpacity="0.35" strokeWidth="0.7" />
    </g>
  );
}

/* ────── Intake port on layer 01 ────── */

function TowerIntakePort() {
  // A small duct jutting out from the front face of layer 01 toward the viewer.
  const yc = topFaceY(0);
  const fx = CX;
  const fy = yc + HD;
  const bx = fx;
  const by = fy + 22; // front ground point
  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      {/* two rails */}
      <line x1={fx - 8} y1={fy + 4} x2={bx - 10} y2={by} stroke="#0B0D10" strokeOpacity="0.5" strokeWidth="0.85" />
      <line x1={fx + 8} y1={fy + 4} x2={bx + 10} y2={by} stroke="#0B0D10" strokeOpacity="0.5" strokeWidth="0.85" />
      {/* port mouth */}
      <line x1={bx - 10} y1={by} x2={bx + 10} y2={by} stroke="#0B0D10" strokeOpacity="0.7" strokeWidth="0.85" />
      {/* cross struts */}
      <line x1={bx - 5} y1={by - 5} x2={bx + 5} y2={by - 5} stroke="#0B0D10" strokeOpacity="0.35" strokeWidth="0.7" strokeDasharray="2 2" />
      {/* pin */}
      <circle cx={bx} cy={by} r="2" fill="#0B0D10" fillOpacity="0.8" />
    </g>
  );
}

/* ────── Power bus rail on right side of tower ────── */

function PowerBus() {
  const x = CX + HW + 34;
  const topY = topFaceY(3) - HD;
  const botY = topFaceY(0) + THICKNESS + HD;
  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }} opacity="0.75">
      {/* two parallel rails */}
      <line x1={x} y1={topY} x2={x} y2={botY} stroke="#0B0D10" strokeOpacity="0.4" strokeWidth="0.9" />
      <line x1={x + 4} y1={topY} x2={x + 4} y2={botY} stroke="#0B0D10" strokeOpacity="0.4" strokeWidth="0.9" />
      {/* caps */}
      <line x1={x - 2} y1={topY} x2={x + 6} y2={topY} stroke="#0B0D10" strokeOpacity="0.5" strokeWidth="0.9" />
      <line x1={x - 2} y1={botY} x2={x + 6} y2={botY} stroke="#0B0D10" strokeOpacity="0.5" strokeWidth="0.9" />
      {/* layer tap-ins */}
      {LAYERS.map((l) => {
        const y = topFaceY(l.idx);
        return (
          <g key={l.idx}>
            <line x1={CX + HW - 4} y1={y} x2={x} y2={y} stroke="#0B0D10" strokeOpacity="0.28" strokeWidth="0.7" strokeDasharray="2 2" />
            <circle cx={x} cy={y} r="1.6" fill="#FFFFFF" stroke="#0B0D10" strokeOpacity="0.55" strokeWidth="0.7" />
            <circle cx={x + 4} cy={y} r="1.6" fill="#FFFFFF" stroke="#0B0D10" strokeOpacity="0.55" strokeWidth="0.7" />
          </g>
        );
      })}
    </g>
  );
}

function TopFaceBrackets({
  top,
}: {
  top: ReturnType<typeof topDiamond>;
}) {
  // Tiny L-brackets inset from each of the 4 corners of the top diamond.
  const inset = 10;
  const legLen = 6;

  const pts = [
    { p: top.F, dx: 0, dy: -1 },
    { p: top.R, dx: -1, dy: 0 },
    { p: top.B, dx: 0, dy: 1 },
    { p: top.L, dx: 1, dy: 0 },
  ];

  return (
    <g aria-hidden="true">
      {pts.map(({ p, dx, dy }, i) => {
        const [x, y] = p;
        const cx = x + dx * inset;
        const cy = y + dy * inset;
        return (
          <g key={i}>
            <line
              x1={cx - legLen * 0.5}
              y1={cy}
              x2={cx + legLen * 0.5}
              y2={cy}
              stroke="#0B0D10"
              strokeOpacity="0.5"
              strokeWidth="0.9"
            />
            <line
              x1={cx}
              y1={cy - legLen * 0.35}
              x2={cx}
              y2={cy + legLen * 0.35}
              stroke="#0B0D10"
              strokeOpacity="0.5"
              strokeWidth="0.9"
            />
          </g>
        );
      })}
    </g>
  );
}

/* ────── Module patterns (revealed on hover) ────── */

function ModulePattern({ layer, yc }: { layer: Layer; yc: number }) {
  return (
    <g
      className="infra-modules"
      data-idx={layer.idx}
      style={{ pointerEvents: "none" }}
    >
      {layer.kind === "data" && <DataPattern yc={yc} />}
      {layer.kind === "infra" && <InfraPattern yc={yc} />}
      {layer.kind === "intelligence" && <IntelligencePattern yc={yc} />}
      {layer.kind === "verify" && <VerifyPattern yc={yc} />}
    </g>
  );
}

const MOD_ITEM_STYLE: React.CSSProperties = {
  opacity: 0,
  transformOrigin: "center",
  transformBox: "fill-box",
};

/** 01 Data — 3×2 grid of small iso storage blocks, some hotrod-tinted. */
function DataPattern({ yc }: { yc: number }) {
  const blocks: Array<{ dx: number; dz: number; hot: boolean }> = [
    { dx: -60, dz: -18, hot: false },
    { dx: -20, dz: -28, hot: true },
    { dx: 20, dz: -38, hot: false },
    { dx: -40, dz: 14, hot: false },
    { dx: 0, dz: 4, hot: false },
    { dx: 40, dz: -6, hot: true },
  ];
  return (
    <>
      {blocks.map((b, i) => (
        <g className="infra-module-item" style={MOD_ITEM_STYLE} key={i}>
          <TinyCube
            cx={CX + b.dx}
            cy={yc + b.dz * 0.5}
            w={11}
            d={5}
            h={8}
            hot={b.hot}
          />
        </g>
      ))}
    </>
  );
}

/** 02 Infrastructure — central hub + 4 satellites with hairline links. */
function InfraPattern({ yc }: { yc: number }) {
  const hub = { dx: 0, dz: 0 };
  const sats = [
    { dx: -52, dz: -16 },
    { dx: 52, dz: -16 },
    { dx: -52, dz: 20 },
    { dx: 52, dz: 20 },
  ];

  const hubCx = CX + hub.dx;
  const hubCy = yc + hub.dz * 0.5;

  return (
    <>
      {/* Links (animated with satellites) */}
      {sats.map((s, i) => {
        const sx = CX + s.dx;
        const sy = yc + s.dz * 0.5;
        return (
          <g className="infra-module-item" style={MOD_ITEM_STYLE} key={`l${i}`}>
            <line
              x1={hubCx}
              y1={hubCy - 4}
              x2={sx}
              y2={sy - 4}
              stroke="#0B0D10"
              strokeOpacity="0.45"
              strokeWidth="0.85"
              strokeDasharray="2 2"
            />
          </g>
        );
      })}
      {/* Hub */}
      <g className="infra-module-item" style={MOD_ITEM_STYLE}>
        <TinyCube cx={hubCx} cy={hubCy} w={14} d={7} h={14} hot={true} />
      </g>
      {/* Satellites */}
      {sats.map((s, i) => (
        <g className="infra-module-item" style={MOD_ITEM_STYLE} key={`s${i}`}>
          <TinyCube
            cx={CX + s.dx}
            cy={yc + s.dz * 0.5}
            w={9}
            d={4.5}
            h={7}
            hot={false}
          />
        </g>
      ))}
    </>
  );
}

/** 03 Intelligence — concentric diamond rings + central node + radial ticks. */
function IntelligencePattern({ yc }: { yc: number }) {
  const rings = [
    { hw: 88, hd: 38, op: 0.35 },
    { hw: 60, hd: 26, op: 0.55 },
    { hw: 34, hd: 15, op: 0.8 },
  ];
  const spokes = [0, 1, 2, 3].map((i) => i * 90);
  return (
    <>
      {rings.map((r, i) => {
        const d = `M ${CX} ${yc - r.hd} L ${CX + r.hw} ${yc} L ${CX} ${yc + r.hd} L ${CX - r.hw} ${yc} Z`;
        return (
          <g className="infra-module-item" style={MOD_ITEM_STYLE} key={`r${i}`}>
            <path
              d={d}
              fill="none"
              stroke="#0B0D10"
              strokeOpacity={r.op}
              strokeWidth="0.9"
              strokeDasharray={i === 0 ? "2 3" : undefined}
            />
          </g>
        );
      })}
      {/* Spokes — short dashed radiating from outer toward inner */}
      {spokes.map((deg, i) => {
        // Approximate iso spoke directions from center, half the outer ring.
        const dirs = [
          { x1: CX + 40, y1: yc, x2: CX + 88, y2: yc },
          { x1: CX, y1: yc - 18, x2: CX, y2: yc - 38 },
          { x1: CX - 40, y1: yc, x2: CX - 88, y2: yc },
          { x1: CX, y1: yc + 18, x2: CX, y2: yc + 38 },
        ];
        const d = dirs[i];
        return (
          <g className="infra-module-item" style={MOD_ITEM_STYLE} key={`sp${deg}`}>
            <line
              x1={d.x1}
              y1={d.y1}
              x2={d.x2}
              y2={d.y2}
              stroke="#0B0D10"
              strokeOpacity="0.5"
              strokeWidth="0.85"
              strokeDasharray="2 2"
            />
          </g>
        );
      })}
      {/* Central node */}
      <g className="infra-module-item" style={MOD_ITEM_STYLE}>
        <TinyCube cx={CX} cy={yc} w={10} d={5} h={14} hot={true} />
      </g>
    </>
  );
}

/** 04 Verification — 3 tall tower-cubes in a triangular arrangement. */
function VerifyPattern({ yc }: { yc: number }) {
  const towers = [
    { dx: -50, dz: -10, hot: true },
    { dx: 50, dz: -10, hot: false },
    { dx: 0, dz: 28, hot: false },
  ];
  // Triangle linking line (dashed) among the three bases
  return (
    <>
      {/* Triangle of dashed links */}
      {[
        [towers[0], towers[1]],
        [towers[1], towers[2]],
        [towers[2], towers[0]],
      ].map(([a, b], i) => (
        <g className="infra-module-item" style={MOD_ITEM_STYLE} key={`t${i}`}>
          <line
            x1={CX + a.dx}
            y1={yc + a.dz * 0.5}
            x2={CX + b.dx}
            y2={yc + b.dz * 0.5}
            stroke="#0B0D10"
            strokeOpacity="0.45"
            strokeWidth="0.85"
            strokeDasharray="2 2"
          />
        </g>
      ))}
      {towers.map((t, i) => (
        <g className="infra-module-item" style={MOD_ITEM_STYLE} key={`c${i}`}>
          <TinyCube
            cx={CX + t.dx}
            cy={yc + t.dz * 0.5}
            w={10}
            d={5}
            h={18}
            hot={t.hot}
          />
        </g>
      ))}
    </>
  );
}

/* ────── Tiny iso cube primitive ────── */

function TinyCube({
  cx,
  cy,
  w,
  d,
  h,
  hot,
}: {
  cx: number;
  cy: number;
  w: number;
  d: number;
  h: number;
  hot: boolean;
}) {
  const base = {
    F: [cx, cy + d],
    R: [cx + w, cy],
    B: [cx, cy - d],
    L: [cx - w, cy],
  };
  const top = {
    F: [base.F[0], base.F[1] - h],
    R: [base.R[0], base.R[1] - h],
    B: [base.B[0], base.B[1] - h],
    L: [base.L[0], base.L[1] - h],
  };
  const topFace = `${top.F[0]},${top.F[1]} ${top.R[0]},${top.R[1]} ${top.B[0]},${top.B[1]} ${top.L[0]},${top.L[1]}`;
  const rightFace = `${top.F[0]},${top.F[1]} ${top.R[0]},${top.R[1]} ${base.R[0]},${base.R[1]} ${base.F[0]},${base.F[1]}`;
  const leftFace = `${top.L[0]},${top.L[1]} ${top.F[0]},${top.F[1]} ${base.F[0]},${base.F[1]} ${base.L[0]},${base.L[1]}`;

  const topFill = hot ? "#B3111A" : "#FFFFFF";
  const topOp = hot ? 0.88 : 1;
  const strokeOp = hot ? 0.9 : 0.6;

  return (
    <g>
      <polygon
        points={rightFace}
        fill="#EEEEEA"
        fillOpacity="0.95"
        stroke="#0B0D10"
        strokeOpacity={strokeOp}
        strokeWidth="0.85"
      />
      <polygon
        points={leftFace}
        fill="#FFFFFF"
        stroke="#0B0D10"
        strokeOpacity={strokeOp}
        strokeWidth="0.85"
      />
      <polygon
        points={topFace}
        fill={topFill}
        fillOpacity={topOp}
        stroke="#0B0D10"
        strokeOpacity={strokeOp}
        strokeWidth="0.85"
      />
    </g>
  );
}

/* ────── Leader + label (alternating sides) ────── */

function Leader({
  layer,
  active,
  side,
}: {
  layer: Layer;
  active: boolean;
  side: "left" | "right";
}) {
  const yc = topFaceY(layer.idx);
  const { hw } = layerDims(layer.idx);

  // Anchor on the corresponding slab top corner
  const [ex, ey] =
    side === "right" ? [CX + hw, yc] : [CX - hw, yc];

  // Labels sit well OUTSIDE the widest slab envelope (CX ± HW_MAX = 320–680).
  const bx = side === "right" ? 810 : 190;
  const by = yc - 10;
  const lx = side === "right" ? 830 : 170;

  const d = `M ${ex} ${ey} L ${bx} ${by} L ${lx} ${by}`;

  const textAnchor = side === "right" ? "start" : "end";
  const textX = side === "right" ? lx + 4 : lx - 4;

  return (
    <g className="infra-label" data-idx={layer.idx} opacity={active ? 1 : 0.32}>
      <path
        className="infra-leader"
        d={d}
        fill="none"
        stroke="#0B0D10"
        strokeOpacity={active ? 0.85 : 0.5}
        strokeWidth="1"
      />
      <circle cx={ex} cy={ey} r="2.2" fill={active ? "#B3111A" : "#0B0D10"} fillOpacity="0.9" />
      <line
        x1={side === "right" ? lx - 2 : lx + 2}
        y1={by - 3}
        x2={side === "right" ? lx - 2 : lx + 2}
        y2={by + 3}
        stroke="#0B0D10"
        strokeOpacity="0.6"
        strokeWidth="1"
      />
      <text
        x={textX}
        y={by - 4}
        textAnchor={textAnchor}
        fontFamily="var(--font-mono, ui-monospace, monospace)"
        fontSize="9"
        letterSpacing="2"
        fill={active ? "#B3111A" : "#5A6470"}
        style={{ textTransform: "uppercase" }}
      >
        {layer.numeral}
      </text>
      <text
        x={textX}
        y={by + 12}
        textAnchor={textAnchor}
        fontFamily="var(--font-display, sans-serif)"
        fontSize="13"
        fill="#0B0D10"
        style={{ letterSpacing: "0.01em" }}
      >
        {layer.short}
      </text>
    </g>
  );
}
