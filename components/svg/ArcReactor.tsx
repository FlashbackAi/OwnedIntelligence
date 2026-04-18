"use client";

/**
 * Flashback Labs — Arc Reactor (SVG, anime.js v4).
 *
 * A single, richly detailed engineering-blueprint SVG of a reactor core,
 * constructed from ~160 primitive elements across 7 concentric layers and
 * animated in with anime.js v4's `svg.createDrawable` path-draw utility.
 *
 * Layer stack (outer → inner):
 *   L0  Callout crosshairs   — 4 long hairlines extending past the ring
 *                               at N / E / S / W, each terminated with a pin
 *   L1  Outer bezel          — 3 concentric rings (r=170/155/135) of varying
 *                               weight, the outermost carrying 60+12+4 chrono
 *                               ticks and 4 cardinal pin-dots
 *   L2  Gold arc ensemble    — 3 top-quarter arcs with a wider blurred halo
 *                               tube drawn behind each
 *   L3  Gear band            — 24 small trapezoidal teeth around r=140
 *   L4  Radial arms          — 3 twin-rail arms (30° / 150° / 270°) carrying
 *                               cross-struts and rivets, linking bezel to
 *                               mid mechanism
 *   L5  Mid mechanism        — dashed ring (r=80), solid ring (r=110),
 *                               6 hex tooth arcs with rivet dots
 *   L6  Coil assembly        — r=70 + r=50 rings, 6 gold coil windings at
 *                               r=60, curved micro-text between them
 *   L7  Triangle core        — halo disc (blurred) + equilateral triangle
 *                               fill + edge outline + inner wire triangle
 *                               + 3 vertex dots + center dot
 *   L8  Scan line            — single radial line rotating continuously
 *
 * Motion:
 *   Boot (~4s)     — each layer draws in / pops in via a stacked timeline.
 *   Ambient        — triangle halo breathes, triangle fill breathes, scan
 *                    line rotates infinitely.
 *   Parallax       — whole SVG rotates subtly toward pointer (3D-ish depth).
 *   Reduced-motion — snaps to final state, skips loops.
 */

import { forwardRef, useLayoutEffect, useRef } from "react";
import {
  animate,
  createTimeline,
  stagger,
  svg,
  utils,
} from "animejs";
import { prefersReducedMotion } from "@/lib/motion";

/* ────────── geometry helpers ────────── */

const CX = 200;
const CY = 200;

function polar(deg: number, r: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
}

function arcPath(startDeg: number, endDeg: number, r: number): string {
  const [x1, y1] = polar(startDeg, r);
  const [x2, y2] = polar(endDeg, r);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${large} ${sweep} ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

function radialLine(deg: number, r1: number, r2: number): string {
  const [x1, y1] = polar(deg, r1);
  const [x2, y2] = polar(deg, r2);
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} L ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

/* ────────── per-layer element specs ────────── */

// 60 minor chrono ticks every 6°, minus where medium/major overlap
const CHRONO_MINOR = Array.from({ length: 60 }, (_, i) => i * 6).filter(
  (d) => d % 30 !== 0,
);
// 12 medium ticks every 30°, minus where major lives
const CHRONO_MEDIUM = Array.from({ length: 12 }, (_, i) => i * 30).filter(
  (d) => d % 90 !== 0,
);
const CHRONO_MAJOR = [0, 90, 180, 270];
const GEAR_TEETH = Array.from({ length: 24 }, (_, i) => i * 15 + 7.5);
const HEX_SECTORS = [30, 90, 150, 210, 270, 330];
const COIL_POS = [30, 90, 150, 210, 270, 330];
const ARM_ANGLES = [30, 150, 270];
const CARDINAL_ANGLES = [0, 90, 180, 270];

/* ────────── main component ────────── */

type ArcReactorProps = {
  /** Maximum width in px; SVG is responsive up to this cap. */
  size?: number;
  className?: string;
};

const ArcReactor = forwardRef<SVGSVGElement, ArcReactorProps>(
  function ArcReactor({ size = 420, className }, ref) {
    const internalRef = useRef<SVGSVGElement>(null);
    const svgRef =
      (ref as React.MutableRefObject<SVGSVGElement | null>) ?? internalRef;

    // === Boot timeline ===
    useLayoutEffect(() => {
      const root = (svgRef as React.RefObject<SVGSVGElement>).current;
      if (!root) return;
      const reduced = prefersReducedMotion();

      const q = (sel: string): NodeListOf<Element> =>
        root.querySelectorAll(sel);

      // Create drawable proxies per group — all start at "0 0" (invisible).
      const drawables = {
        callout: svg.createDrawable(q(".ar-callout"), 0, 0),
        outer3: svg.createDrawable(q(".ar-outer-3"), 0, 0),
        outer2: svg.createDrawable(q(".ar-outer-2"), 0, 0),
        outer1: svg.createDrawable(q(".ar-outer-1"), 0, 0),
        chronoMinor: svg.createDrawable(q(".ar-chrono-minor"), 0, 0),
        chronoMedium: svg.createDrawable(q(".ar-chrono-medium"), 0, 0),
        chronoMajor: svg.createDrawable(q(".ar-chrono-major"), 0, 0),
        goldArc: svg.createDrawable(q(".ar-gold-arc"), 0, 0),
        gearTooth: svg.createDrawable(q(".ar-gear-tooth"), 0, 0),
        armRail: svg.createDrawable(q(".ar-arm-rail"), 0, 0),
        armStrut: svg.createDrawable(q(".ar-arm-strut"), 0, 0),
        midSolid: svg.createDrawable(q(".ar-mid-solid"), 0, 0),
        midDashed: svg.createDrawable(q(".ar-mid-dashed"), 0, 0),
        hexTooth: svg.createDrawable(q(".ar-hex-tooth"), 0, 0),
        coilRing2: svg.createDrawable(q(".ar-coil-ring-2"), 0, 0),
        coilWinding: svg.createDrawable(q(".ar-coil-winding"), 0, 0),
        coilRing1: svg.createDrawable(q(".ar-coil-ring-1"), 0, 0),
        triEdge: svg.createDrawable(q(".ar-tri-edge"), 0, 0),
        triInner: svg.createDrawable(q(".ar-tri-inner"), 0, 0),
      };

      // Opacity-fade targets
      const fadeTargets = [
        ...q(".ar-pin-dot"),
        ...q(".ar-hex-rivet"),
        ...q(".ar-arm-rivet"),
        ...q(".ar-tri-fill"),
        ...q(".ar-tri-vertex"),
        ...q(".ar-tri-center"),
        ...q(".ar-tri-halo"),
        ...q(".ar-coil-text"),
        ...q(".ar-callout-tip"),
        ...q(".ar-gold-glow"),
      ];
      utils.set(fadeTargets, { opacity: 0 });

      // HTML dim labels
      const dimLabels = Array.from(document.querySelectorAll(".ar-dim"));
      utils.set(dimLabels, { opacity: 0 });

      // Scan line — hidden until boot completes
      const scanLine = q(".ar-scan")[0] as SVGElement | undefined;
      if (scanLine) utils.set(scanLine, { opacity: 0 });

      // Triangle group — start scaled to 0 with a slight rotation for settle
      const triGroup = q(".ar-tri-group")[0] as SVGElement | undefined;
      if (triGroup) {
        utils.set(triGroup, {
          scale: 0,
          rotate: "-22deg",
          transformOrigin: `${CX}px ${CY}px`,
        });
      }

      if (reduced) {
        // Snap all drawables to full
        Object.values(drawables).forEach((d) =>
          utils.set(d, { draw: "0 1" }),
        );
        utils.set(fadeTargets, { opacity: 1 });
        utils.set(q(".ar-gold-glow"), { opacity: 0.4 });
        utils.set(q(".ar-tri-halo"), { opacity: 0.55 });
        utils.set(q(".ar-coil-text"), { opacity: 0.7 });
        utils.set(dimLabels, { opacity: 1 });
        if (triGroup) utils.set(triGroup, { scale: 1, rotate: "0deg" });
        if (scanLine) utils.set(scanLine, { opacity: 0.35 });
        return;
      }

      const tl = createTimeline({
        defaults: { ease: "outQuart" },
        autoplay: true,
      });

      // ─── PHASE 1 (200ms): callout crosshairs establish the canvas ───
      tl.add(
        drawables.callout,
        {
          draw: ["0 0", "0 1"],
          duration: 700,
          ease: "outExpo",
          delay: stagger(90),
        },
        200,
      );
      tl.add(
        q(".ar-callout-tip"),
        {
          opacity: [0, 1],
          duration: 300,
          delay: stagger(80, { start: 400 }),
        },
        200,
      );

      // ─── PHASE 2 (500ms): outer ring sweeps in ───
      tl.add(
        drawables.outer3,
        { draw: ["0 0", "0 1"], duration: 900, ease: "outExpo" },
        500,
      );

      // ─── PHASE 3 (800ms): cardinal pin dots pop ───
      tl.add(
        q(".ar-pin-dot"),
        {
          opacity: [0, 1],
          scale: [0, 1],
          transformOrigin: "center",
          duration: 350,
          ease: "outBack(1.8)",
          delay: stagger(70),
        },
        800,
      );

      // ─── PHASE 4 (1000ms): chrono ticks — minor → medium → major ───
      tl.add(
        drawables.chronoMinor,
        {
          draw: ["0 0", "0 1"],
          duration: 260,
          ease: "outExpo",
          delay: stagger(8),
        },
        1000,
      );
      tl.add(
        drawables.chronoMedium,
        {
          draw: ["0 0", "0 1"],
          duration: 320,
          ease: "outExpo",
          delay: stagger(22),
        },
        1150,
      );
      tl.add(
        drawables.chronoMajor,
        {
          draw: ["0 0", "0 1"],
          duration: 450,
          ease: "outExpo",
          delay: stagger(70),
        },
        1300,
      );

      // ─── PHASE 5 (1400ms): middle bezel ring ───
      tl.add(
        drawables.outer2,
        { draw: ["0 0", "0 1"], duration: 700, ease: "outExpo" },
        1400,
      );

      // ─── PHASE 6 (1500ms): gold glow halos fade in ───
      tl.add(
        q(".ar-gold-glow"),
        { opacity: [0, 0.4], duration: 750, ease: "outQuart" },
        1500,
      );

      // ─── PHASE 7 (1550ms): gold arcs draw across the top ───
      tl.add(
        drawables.goldArc,
        {
          draw: ["0 0", "0 1"],
          duration: 850,
          ease: "outExpo",
          delay: stagger(130),
        },
        1550,
      );

      // ─── PHASE 8 (1800ms): inner bezel ring (r=135) ───
      tl.add(
        drawables.outer1,
        { draw: ["0 0", "0 1"], duration: 700, ease: "outExpo" },
        1800,
      );

      // ─── PHASE 9 (1950ms): gear teeth stagger-draw ───
      tl.add(
        drawables.gearTooth,
        {
          draw: ["0 0", "0 1"],
          duration: 260,
          ease: "outQuart",
          delay: stagger(16),
        },
        1950,
      );

      // ─── PHASE 10 (2200ms): radial arms — rails → struts → rivets ───
      tl.add(
        drawables.armRail,
        {
          draw: ["0 0", "0 1"],
          duration: 500,
          ease: "outExpo",
          delay: stagger(45),
        },
        2200,
      );
      tl.add(
        drawables.armStrut,
        {
          draw: ["0 0", "0 1"],
          duration: 280,
          ease: "outExpo",
          delay: stagger(25),
        },
        2350,
      );
      tl.add(
        q(".ar-arm-rivet"),
        {
          opacity: [0, 1],
          scale: [0, 1],
          transformOrigin: "center",
          duration: 260,
          ease: "outBack(1.6)",
          delay: stagger(25),
        },
        2450,
      );

      // ─── PHASE 11 (2550ms): mid mechanism rings + hex teeth ───
      tl.add(
        drawables.midSolid,
        { draw: ["0 0", "0 1"], duration: 550, ease: "outExpo" },
        2550,
      );
      tl.add(
        drawables.midDashed,
        { draw: ["0 0", "0 1"], duration: 550, ease: "outExpo" },
        2650,
      );
      tl.add(
        drawables.hexTooth,
        {
          draw: ["0 0", "0 1"],
          duration: 320,
          ease: "outExpo",
          delay: stagger(35),
        },
        2750,
      );
      tl.add(
        q(".ar-hex-rivet"),
        {
          opacity: [0, 1],
          scale: [0, 1],
          transformOrigin: "center",
          duration: 250,
          ease: "outBack(1.6)",
          delay: stagger(35),
        },
        2850,
      );

      // ─── PHASE 12 (2950ms): coil assembly ───
      tl.add(
        drawables.coilRing2,
        { draw: ["0 0", "0 1"], duration: 500, ease: "outExpo" },
        2950,
      );
      tl.add(
        drawables.coilWinding,
        {
          draw: ["0 0", "0 1"],
          duration: 320,
          ease: "outExpo",
          delay: stagger(35),
        },
        3050,
      );
      tl.add(
        drawables.coilRing1,
        { draw: ["0 0", "0 1"], duration: 450, ease: "outExpo" },
        3150,
      );
      tl.add(
        q(".ar-coil-text"),
        { opacity: [0, 0.7], duration: 600, ease: "outQuart" },
        3200,
      );

      // ─── PHASE 13 (3250ms): triangle halo + edge + scale-settle + fill + details ───
      tl.add(
        q(".ar-tri-halo"),
        { opacity: [0, 0.55], duration: 900, ease: "outQuart" },
        3250,
      );
      tl.add(
        drawables.triEdge,
        { draw: ["0 0", "0 1"], duration: 600, ease: "outExpo" },
        3350,
      );
      if (triGroup) {
        tl.add(
          triGroup,
          {
            scale: [0, 1],
            rotate: ["-22deg", "0deg"],
            duration: 700,
            ease: "outBack(1.6)",
          },
          3400,
        );
      }
      tl.add(
        drawables.triInner,
        { draw: ["0 0", "0 1"], duration: 500, ease: "outExpo" },
        3600,
      );
      tl.add(
        q(".ar-tri-fill"),
        { opacity: [0, 1], duration: 450, ease: "outQuart" },
        3650,
      );
      tl.add(
        q(".ar-tri-vertex"),
        {
          opacity: [0, 1],
          scale: [0, 1],
          transformOrigin: "center",
          duration: 300,
          ease: "outBack(2)",
          delay: stagger(80),
        },
        3750,
      );
      tl.add(
        q(".ar-tri-center"),
        { opacity: [0, 1], duration: 300 },
        4000,
      );

      // ─── PHASE 14 (3800ms): dimension labels ───
      tl.add(
        dimLabels,
        {
          opacity: [0, 1],
          duration: 500,
          ease: "outQuart",
          delay: stagger(110),
        },
        3800,
      );

      // ─── PHASE 15 (4100ms): scan line fades in ───
      if (scanLine) {
        tl.add(scanLine, { opacity: [0, 0.35], duration: 600 }, 4100);
      }

      return () => {
        tl.pause();
      };
    }, [svgRef]);

    // === Ambient loops (scan rotation, halo breath, pointer parallax) ===
    useLayoutEffect(() => {
      const root = (svgRef as React.RefObject<SVGSVGElement>).current;
      if (!root) return;
      if (prefersReducedMotion()) return;

      const q = (sel: string): NodeListOf<Element> =>
        root.querySelectorAll(sel);

      // Scan line — continuous rotation around centre
      const scanGroup = q(".ar-scan-group")[0] as SVGElement | undefined;
      let scanAnim: ReturnType<typeof animate> | null = null;
      if (scanGroup) {
        utils.set(scanGroup, { transformOrigin: `${CX}px ${CY}px` });
        scanAnim = animate(scanGroup, {
          rotate: [0, 360],
          duration: 8500,
          ease: "linear",
          loop: true,
        });
      }

      // Halo + triangle breath — start AFTER boot (delay ~5s)
      const halo = q(".ar-tri-halo")[0] as SVGElement | undefined;
      let haloAnim: ReturnType<typeof animate> | null = null;
      if (halo) {
        haloAnim = animate(halo, {
          opacity: [0.45, 0.65, 0.45],
          duration: 3800,
          ease: "inOutSine",
          loop: true,
          delay: 5000,
        });
      }
      const triGroup = q(".ar-tri-group")[0] as SVGElement | undefined;
      let triAnim: ReturnType<typeof animate> | null = null;
      if (triGroup) {
        triAnim = animate(triGroup, {
          scale: [1, 1.035, 1],
          duration: 3800,
          ease: "inOutSine",
          loop: true,
          delay: 5000,
        });
      }

      // Pointer parallax — lerp rotateX/Y on root SVG toward pointer
      let targetX = 0;
      let targetY = 0;
      let curX = 0;
      let curY = 0;
      let rafId = 0;
      const tick = () => {
        curX += (targetX - curX) * 0.06;
        curY += (targetY - curY) * 0.06;
        root.style.transform = `perspective(900px) rotateY(${curX.toFixed(3)}deg) rotateX(${(-curY).toFixed(3)}deg)`;
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      const onMove = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        const px = (e.clientX - (r.left + r.width / 2)) / r.width;
        const py = (e.clientY - (r.top + r.height / 2)) / r.height;
        targetX = utils.clamp(px * 14, -14, 14);
        targetY = utils.clamp(py * 10, -10, 10);
      };
      window.addEventListener("pointermove", onMove);

      return () => {
        scanAnim?.pause();
        haloAnim?.pause();
        triAnim?.pause();
        cancelAnimationFrame(rafId);
        window.removeEventListener("pointermove", onMove);
      };
    }, [svgRef]);

    // === Triangle geometry (computed once for JSX) ===
    const TRI_R = 30;
    const TRI_R_INNER = 18;
    const triTop = polar(0, TRI_R);
    const triRight = polar(120, TRI_R);
    const triLeft = polar(240, TRI_R);
    const triInnerTop = polar(0, TRI_R_INNER);
    const triInnerRight = polar(120, TRI_R_INNER);
    const triInnerLeft = polar(240, TRI_R_INNER);

    return (
      <div
        className={className}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          maxWidth: size,
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            overflow: "visible",
          }}
          aria-hidden="true"
        >
          <defs>
            <filter id="ar-halo-blur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" />
            </filter>
            <filter id="ar-gold-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            <path
              id="ar-coil-text-path"
              d="M 138,200 A 62,62 0 1,1 262,200 A 62,62 0 1,1 138,200"
              fill="none"
            />
            <linearGradient id="ar-scan-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.7" />
              <stop offset="65%" stopColor="#0891b2" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* ═══ L0 — CALLOUT CROSSHAIRS ═══ */}
          <g stroke="var(--color-steel)" strokeWidth="0.6" fill="none">
            {CARDINAL_ANGLES.map((a, i) => {
              const [tipX, tipY] = polar(a, 198);
              return (
                <g key={i}>
                  <path
                    className="ar-callout"
                    d={radialLine(a, 178, 198)}
                    strokeDasharray="3 2"
                  />
                  <circle
                    className="ar-callout-tip"
                    cx={tipX}
                    cy={tipY}
                    r="1.4"
                    fill="var(--color-steel)"
                  />
                </g>
              );
            })}
          </g>

          {/* ═══ L1 — OUTER BEZEL ═══ */}
          <g stroke="var(--color-ink)" fill="none">
            <circle
              className="ar-outer-3"
              cx={CX}
              cy={CY}
              r={170}
              strokeWidth="1.2"
            />
            <circle
              className="ar-outer-2"
              cx={CX}
              cy={CY}
              r={155}
              strokeWidth="0.8"
            />
            <circle
              className="ar-outer-1"
              cx={CX}
              cy={CY}
              r={135}
              strokeWidth="0.6"
            />
          </g>

          {/* Cardinal pin dots on outermost ring */}
          <g fill="var(--color-ink)">
            {CARDINAL_ANGLES.map((a, i) => {
              const [x, y] = polar(a, 170);
              return (
                <circle
                  key={i}
                  className="ar-pin-dot"
                  cx={x}
                  cy={y}
                  r="2.5"
                />
              );
            })}
          </g>

          {/* ═══ L1b — CHRONOGRAPH TICKS ═══ */}
          <g stroke="var(--color-ink)" fill="none">
            {CHRONO_MINOR.map((a, i) => (
              <path
                key={`cmn-${i}`}
                className="ar-chrono-minor"
                d={radialLine(a, 161, 168)}
                strokeWidth="0.5"
              />
            ))}
            {CHRONO_MEDIUM.map((a, i) => (
              <path
                key={`cmd-${i}`}
                className="ar-chrono-medium"
                d={radialLine(a, 158, 168)}
                strokeWidth="0.9"
              />
            ))}
            {CHRONO_MAJOR.map((a, i) => (
              <path
                key={`cmj-${i}`}
                className="ar-chrono-major"
                d={radialLine(a, 150, 170)}
                strokeWidth="1.4"
              />
            ))}
          </g>

          {/* ═══ L2 — GOLD ARC ENSEMBLE ═══ */}
          <g fill="none" filter="url(#ar-gold-blur)">
            <path
              className="ar-gold-glow"
              d={arcPath(-60, -28, 164)}
              stroke="var(--color-gold-hi)"
              strokeWidth="5.5"
              opacity="0"
            />
            <path
              className="ar-gold-glow"
              d={arcPath(-12, 12, 164)}
              stroke="var(--color-gold-hi)"
              strokeWidth="5.5"
              opacity="0"
            />
            <path
              className="ar-gold-glow"
              d={arcPath(28, 60, 164)}
              stroke="var(--color-gold-hi)"
              strokeWidth="5.5"
              opacity="0"
            />
          </g>
          <g
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="2.6"
            strokeLinecap="round"
          >
            <path className="ar-gold-arc" d={arcPath(-60, -28, 164)} />
            <path className="ar-gold-arc" d={arcPath(-12, 12, 164)} />
            <path className="ar-gold-arc" d={arcPath(28, 60, 164)} />
          </g>

          {/* ═══ L3 — GEAR BAND (24 trapezoidal teeth) ═══ */}
          <g stroke="var(--color-ink)" strokeWidth="0.6" fill="none">
            {GEAR_TEETH.map((a, i) => {
              const w = 5;
              const [x1, y1] = polar(a - w, 137);
              const [x2, y2] = polar(a - w / 2, 144);
              const [x3, y3] = polar(a + w / 2, 144);
              const [x4, y4] = polar(a + w, 137);
              return (
                <path
                  key={i}
                  className="ar-gear-tooth"
                  d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} L ${x4.toFixed(2)} ${y4.toFixed(2)}`}
                />
              );
            })}
          </g>

          {/* ═══ L4 — RADIAL ARMS (3 × twin rails + struts + rivets) ═══ */}
          <g stroke="var(--color-ink)" fill="none">
            {ARM_ANGLES.flatMap((a, armIdx) => {
              const rInner = 78;
              const rOuter = 130;
              const dOff = 2.4;
              const rails = [a - dOff, a + dOff].map((ang, railIdx) => (
                <path
                  key={`rail-${armIdx}-${railIdx}`}
                  className="ar-arm-rail"
                  d={radialLine(ang, rInner, rOuter)}
                  strokeWidth="0.7"
                />
              ));
              const struts = [0.33, 0.66].map((t, sIdx) => {
                const rMid = rInner + (rOuter - rInner) * t;
                const [sx1, sy1] = polar(a - dOff, rMid);
                const [sx2, sy2] = polar(a + dOff, rMid);
                return (
                  <path
                    key={`strut-${armIdx}-${sIdx}`}
                    className="ar-arm-strut"
                    d={`M ${sx1.toFixed(2)} ${sy1.toFixed(2)} L ${sx2.toFixed(2)} ${sy2.toFixed(2)}`}
                    strokeWidth="0.6"
                  />
                );
              });
              return [...rails, ...struts];
            })}
          </g>
          <g fill="var(--color-ink)">
            {ARM_ANGLES.flatMap((a, armIdx) =>
              [0.33, 0.66].flatMap((t, sIdx) => {
                const rMid = 78 + (130 - 78) * t;
                return [-2.4, 2.4].map((off, oIdx) => {
                  const [cx, cy] = polar(a + off, rMid);
                  return (
                    <circle
                      key={`rivet-${armIdx}-${sIdx}-${oIdx}`}
                      className="ar-arm-rivet"
                      cx={cx}
                      cy={cy}
                      r="1.4"
                    />
                  );
                });
              }),
            )}
          </g>

          {/* ═══ L5 — MID MECHANISM ═══ */}
          <g stroke="var(--color-ink)" fill="none">
            <circle
              className="ar-mid-solid"
              cx={CX}
              cy={CY}
              r={110}
              strokeWidth="0.8"
            />
            <circle
              className="ar-mid-dashed"
              cx={CX}
              cy={CY}
              r={80}
              strokeWidth="0.6"
              strokeDasharray="2 2.5"
            />
          </g>
          <g
            stroke="var(--color-ink)"
            strokeWidth="0.9"
            fill="none"
            strokeLinecap="round"
          >
            {HEX_SECTORS.map((a, i) => (
              <path
                key={i}
                className="ar-hex-tooth"
                d={arcPath(a - 14, a + 14, 94)}
              />
            ))}
          </g>
          <g fill="var(--color-ink)">
            {HEX_SECTORS.map((a, i) => {
              const [cx, cy] = polar(a, 110);
              return (
                <circle
                  key={i}
                  className="ar-hex-rivet"
                  cx={cx}
                  cy={cy}
                  r="1.8"
                />
              );
            })}
          </g>

          {/* ═══ L6 — COIL ASSEMBLY ═══ */}
          <g stroke="var(--color-ink)" fill="none">
            <circle
              className="ar-coil-ring-2"
              cx={CX}
              cy={CY}
              r={70}
              strokeWidth="0.7"
            />
            <circle
              className="ar-coil-ring-1"
              cx={CX}
              cy={CY}
              r={50}
              strokeWidth="0.6"
            />
          </g>
          <g
            stroke="var(--color-gold)"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          >
            {COIL_POS.map((a, i) => (
              <path
                key={i}
                className="ar-coil-winding"
                d={arcPath(a - 14, a + 14, 60)}
              />
            ))}
          </g>
          <text
            className="ar-coil-text"
            fill="var(--color-steel)"
            fontSize="5.5"
            fontFamily="var(--font-mono)"
            letterSpacing="2.4"
          >
            <textPath href="#ar-coil-text-path" startOffset="0%">
              FLASHBACK · CORE · SERIES·F-01 · PERSONAL AI · OWNED BY YOU ·
            </textPath>
          </text>

          {/* ═══ SCAN LINE (rotates forever) ═══ */}
          <g
            className="ar-scan-group"
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          >
            <line
              className="ar-scan"
              x1={CX}
              y1={CY}
              x2={CX}
              y2={CY - 152}
              stroke="url(#ar-scan-grad)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>

          {/* ═══ L7 — TRIANGLE CORE ═══ */}
          <circle
            className="ar-tri-halo"
            cx={CX}
            cy={CY}
            r={44}
            fill="var(--color-hud)"
            filter="url(#ar-halo-blur)"
          />
          <g
            className="ar-tri-group"
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          >
            <polygon
              className="ar-tri-fill"
              points={`${triTop.join(",")} ${triRight.join(",")} ${triLeft.join(",")}`}
              fill="var(--color-hud-deep)"
            />
            <polyline
              className="ar-tri-edge"
              points={`${triTop.join(",")} ${triRight.join(",")} ${triLeft.join(",")} ${triTop.join(",")}`}
              stroke="var(--color-ink)"
              strokeWidth="1.4"
              fill="none"
              strokeLinejoin="miter"
            />
            <polyline
              className="ar-tri-inner"
              points={`${triInnerTop.join(",")} ${triInnerRight.join(",")} ${triInnerLeft.join(",")} ${triInnerTop.join(",")}`}
              stroke="var(--color-paper-raised)"
              strokeWidth="0.8"
              fill="none"
              strokeLinejoin="miter"
              opacity="0.85"
            />
            <circle
              className="ar-tri-vertex"
              cx={triTop[0]}
              cy={triTop[1]}
              r="2.2"
              fill="var(--color-paper-raised)"
            />
            <circle
              className="ar-tri-vertex"
              cx={triRight[0]}
              cy={triRight[1]}
              r="2.2"
              fill="var(--color-paper-raised)"
            />
            <circle
              className="ar-tri-vertex"
              cx={triLeft[0]}
              cy={triLeft[1]}
              r="2.2"
              fill="var(--color-paper-raised)"
            />
            <circle
              className="ar-tri-center"
              cx={CX}
              cy={CY}
              r="1.6"
              fill="var(--color-paper-raised)"
            />
          </g>
        </svg>

        {/* HTML dimension labels — percentage-based so they scale with the SVG */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {[
            {
              label: "FL · v0.1",
              pos: { top: "-5.5%", left: "50%", transform: "translateX(-50%)" },
            },
            {
              label: "MEM · ∞",
              pos: { top: "50%", right: "-20%", transform: "translateY(-50%)" },
            },
            {
              label: "EST · 2024",
              pos: { bottom: "-5.5%", left: "50%", transform: "translateX(-50%)" },
            },
            {
              label: "AI · YOURS",
              pos: { top: "50%", left: "-20%", transform: "translateY(-50%)" },
            },
          ].map((l, i) => (
            <span
              key={i}
              className="ar-dim"
              style={{
                position: "absolute",
                fontSize: "clamp(7px, 0.75vw, 9.5px)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--color-steel)",
                fontFamily: "var(--font-mono)",
                opacity: 0,
                whiteSpace: "nowrap",
                ...(l.pos as React.CSSProperties),
              }}
            >
              {l.label}
            </span>
          ))}
        </div>
      </div>
    );
  },
);

export default ArcReactor;
