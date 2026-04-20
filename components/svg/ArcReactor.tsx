"use client";

/**
 * Flashback Labs — Arc Reactor (SVG, anime.js v4).
 *
 * A 3D-feel, mechanically-assembled reactor core built from ~400 primitive
 * elements. During boot every ring literally rotates itself into place while
 * drawing in, and every screw spins down into its seat (scale-from-far +
 * rotate −900° → 0°) like a torque driver setting each fastener.
 *
 * Layer stack (outer → inner):
 *   L0  Callout crosshairs       — 4 hairlines + pin tips (N/E/S/W)
 *   L1  Outer bezel              — 3 concentric rings (r=170/155/135) each
 *                                   wrapped in its own screw group, each with
 *                                   a diagonal bevel-gradient companion ring
 *                                   for 3D depth. Outer carries chrono ticks
 *                                   (60 + 12 + 4), a curved serial-text band,
 *                                   120-tick knurl pattern, 4 panel dividers,
 *                                   and 4 cardinal pin-dots.
 *   L2  Gold arc ensemble        — bronze backplate + blurred halo + 3
 *                                   gradient-stroked gold arcs, all wrapped
 *                                   in a rotating screw group.
 *   L3  Gear band                — 24 trapezoidal teeth on a screw group
 *                                   that rotates −35° → 0° on boot and then
 *                                   drifts slowly forever.
 *   L3b Outer bolt ring          — 12 small hex screws at r=148 that spin
 *                                   themselves in.
 *   L3c Main bolt ring           — 6 hex screws at r=124 that spin in.
 *   L4  Radial arms              — 3 twin-rail arms (30° / 150° / 270°)
 *                                   carrying cross-struts + rivets.
 *   L4b Arm terminal bolts       — 6 hex flange screws (2 per arm) that spin.
 *   L5  Mid mechanism            — dashed ring (r=80), solid ring (r=110)
 *                                   with its own bevel, 6 hex sector arcs +
 *                                   rivets, 48-tooth fine gear band at r=103
 *                                   (counter-rotating), 3 sector vents.
 *   L5b Mid bolt ring            — 6 dot-slot screws at r=110 that spin in.
 *   L6  Coil assembly            — r=70 + r=50 rings, 6 gold coil windings
 *                                   at r=60 with 6 divider ticks between,
 *                                   all on a screw group. Curved micro-text
 *                                   between the rings.
 *   L6b Pilot ring               — dashed r=40 ring.
 *   L7  Triangle core            — radial core-well shadow, blurred halo,
 *                                   equilateral triangle (fill + edge +
 *                                   inner wire), 3 vertex dots, center dot.
 *   L7b Core plate bolts         — 3 tiny hex screws at r=36 around the
 *                                   triangle that spin into place last.
 *   L8  Scan line                — radial line rotating continuously.
 *
 * Motion:
 *   Boot (~4.8s) — rings rotate+draw+scale into place; bolts spin −900°→0°;
 *                  gear bands counter-rotate; triangle rotates −180°→0° while
 *                  scaling 0→1; halo + micro-text + dim labels fade in last.
 *   Ambient      — triangle halo breathes, triangle scales gently, scan line
 *                  rotates, main gear band rotates +360° / 120s, fine gear
 *                  band rotates −360° / 180s.
 *   3D           — default perspective(1100px) rotateX(9°) rotateY(5°), pointer
 *                  perturbs around that baseline so the core always sits in
 *                  3/4 view.
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

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, j) => {
    const rad = (j * 60 * Math.PI) / 180;
    return `${(cx + r * Math.sin(rad)).toFixed(2)},${(cy - r * Math.cos(rad)).toFixed(2)}`;
  }).join(" ");
}

/* ────────── per-layer element specs ────────── */

const CHRONO_MINOR = Array.from({ length: 60 }, (_, i) => i * 6).filter(
  (d) => d % 30 !== 0,
);
const CHRONO_MEDIUM = Array.from({ length: 12 }, (_, i) => i * 30).filter(
  (d) => d % 90 !== 0,
);
const CHRONO_MAJOR = [0, 90, 180, 270];
const GEAR_TEETH = Array.from({ length: 24 }, (_, i) => i * 15 + 7.5);
// Fine gear band sits just inside the hex sector arcs
const FINE_GEAR_TEETH = Array.from({ length: 48 }, (_, i) => i * 7.5 + 3.75);
const HEX_SECTORS = [30, 90, 150, 210, 270, 330];
const COIL_POS = [30, 90, 150, 210, 270, 330];
const COIL_DIVIDERS = [0, 60, 120, 180, 240, 300];
const ARM_ANGLES = [30, 150, 270];
const CARDINAL_ANGLES = [0, 90, 180, 270];
// Hex-head screws seated between the gear band and mid ring.
const BOLT_ANGLES = [0, 60, 120, 180, 240, 300];
// Secondary 12-bolt ring just outside the main bolt ring
const OUTER_BOLT_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30 + 15);
// Flange-plate tabs at each arm's outer and inner terminus
const ARM_TERMINI: { angle: number; r: number }[] = ARM_ANGLES.flatMap((a) => [
  { angle: a, r: 76 },
  { angle: a, r: 132 },
]);
// 3 tiny core-plate bolts seated between the triangle vertices (offset 60°)
const CORE_PLATE_BOLT_ANGLES = [60, 180, 300];
// Outer knurl — 120 micro-ticks for grip texture
const KNURL_ANGLES = Array.from({ length: 120 }, (_, i) => i * 3);
// 4 panel dividers between the two outer rings (at the diagonals)
const PANEL_DIVIDERS = [45, 135, 225, 315];
// 3 sector vents in the mid band at cardinal-ish positions (off-axis from arms)
const VENT_ANGLES = [0, 120, 240];

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
        outer3Bev: svg.createDrawable(q(".ar-outer-3-bev"), 0, 0),
        outer2: svg.createDrawable(q(".ar-outer-2"), 0, 0),
        outer2Bev: svg.createDrawable(q(".ar-outer-2-bev"), 0, 0),
        outer1: svg.createDrawable(q(".ar-outer-1"), 0, 0),
        outer1Bev: svg.createDrawable(q(".ar-outer-1-bev"), 0, 0),
        knurl: svg.createDrawable(q(".ar-knurl"), 0, 0),
        panelDiv: svg.createDrawable(q(".ar-panel-div"), 0, 0),
        chronoMinor: svg.createDrawable(q(".ar-chrono-minor"), 0, 0),
        chronoMedium: svg.createDrawable(q(".ar-chrono-medium"), 0, 0),
        chronoMajor: svg.createDrawable(q(".ar-chrono-major"), 0, 0),
        goldArc: svg.createDrawable(q(".ar-gold-arc"), 0, 0),
        gearTooth: svg.createDrawable(q(".ar-gear-tooth"), 0, 0),
        fineGear: svg.createDrawable(q(".ar-fine-gear-tooth"), 0, 0),
        armRail: svg.createDrawable(q(".ar-arm-rail"), 0, 0),
        armStrut: svg.createDrawable(q(".ar-arm-strut"), 0, 0),
        midSolid: svg.createDrawable(q(".ar-mid-solid"), 0, 0),
        midBev: svg.createDrawable(q(".ar-mid-bev"), 0, 0),
        midDashed: svg.createDrawable(q(".ar-mid-dashed"), 0, 0),
        hexTooth: svg.createDrawable(q(".ar-hex-tooth"), 0, 0),
        vent: svg.createDrawable(q(".ar-vent"), 0, 0),
        coilRing2: svg.createDrawable(q(".ar-coil-ring-2"), 0, 0),
        coilWinding: svg.createDrawable(q(".ar-coil-winding"), 0, 0),
        coilRing1: svg.createDrawable(q(".ar-coil-ring-1"), 0, 0),
        pilotRing: svg.createDrawable(q(".ar-pilot-ring"), 0, 0),
        triEdge: svg.createDrawable(q(".ar-tri-edge"), 0, 0),
        triInner: svg.createDrawable(q(".ar-tri-inner"), 0, 0),
      };

      // Opacity-fade targets (everything that pops in, EXCEPT bolts which are
      // handled via group screw-in animations below).
      const fadeTargets = [
        ...q(".ar-pin-dot"),
        ...q(".ar-hex-rivet"),
        ...q(".ar-arm-rivet"),
        ...q(".ar-tri-fill"),
        ...q(".ar-tri-vertex"),
        ...q(".ar-tri-center"),
        ...q(".ar-tri-halo"),
        ...q(".ar-coil-text"),
        ...q(".ar-outer-text"),
        ...q(".ar-callout-tip"),
        ...q(".ar-gold-glow"),
        ...q(".ar-gold-backplate"),
        ...q(".ar-coil-divider"),
      ];
      utils.set(fadeTargets, { opacity: 0 });

      // --- SCREW GROUPS (bolts) ---
      // Every bolt is wrapped in a <g class="ar-bolt-group ar-*-group"> with
      // its transform-origin pre-set (inline, to its own absolute SVG coords).
      // Initial: scale 2.8, rotate −900° — so it appears to drop in from far
      // away AND spin itself down into its seat.
      const boltGroups = q(".ar-bolt-group");
      utils.set(boltGroups, { opacity: 0, scale: 2.8, rotate: -900 });

      // --- RING SCREW GROUPS ---
      // Each major ring is wrapped in <g class="ar-ring-screw ar-ring-screw-*">
      // with transform-origin at the SVG center. Initial rotation offsets make
      // the ring visibly unscrew itself into place as it draws.
      const allRingScrew = q(".ar-ring-screw");
      allRingScrew.forEach((g) => {
        (g as SVGElement).style.transformOrigin = `${CX}px ${CY}px`;
      });
      utils.set(q(".ar-ring-screw-outer3"), { rotate: -180, scale: 1.14 });
      utils.set(q(".ar-ring-screw-outer2"), { rotate: 135, scale: 1.09 });
      utils.set(q(".ar-ring-screw-outer1"), { rotate: -90, scale: 1.07 });
      utils.set(q(".ar-ring-screw-gold"), { rotate: -22, scale: 1.05 });
      utils.set(q(".ar-ring-screw-gear"), { rotate: -35 });
      utils.set(q(".ar-ring-screw-fine"), { rotate: 25 });
      utils.set(q(".ar-ring-screw-mid"), { rotate: -18, scale: 1.04 });
      utils.set(q(".ar-ring-screw-hex"), { rotate: -30 });
      utils.set(q(".ar-ring-screw-coil"), { rotate: -45, scale: 1.06 });

      // HTML dim labels
      const dimLabels = Array.from(document.querySelectorAll(".ar-dim"));
      utils.set(dimLabels, { opacity: 0 });

      // Scan line hidden until boot completes
      const scanLine = q(".ar-scan")[0] as SVGElement | undefined;
      if (scanLine) utils.set(scanLine, { opacity: 0 });

      // Triangle group starts hidden, rotated back ~half a turn, scale 0
      const triGroup = q(".ar-tri-group")[0] as SVGElement | undefined;
      if (triGroup) {
        utils.set(triGroup, {
          scale: 0,
          rotate: -180,
          transformOrigin: `${CX}px ${CY}px`,
        });
      }

      if (reduced) {
        // Snap everything to final state
        Object.values(drawables).forEach((d) =>
          utils.set(d, { draw: "0 1" }),
        );
        utils.set(fadeTargets, { opacity: 1 });
        utils.set(boltGroups, { opacity: 1, scale: 1, rotate: 0 });
        utils.set(q(".ar-gold-glow"), { opacity: 0.4 });
        utils.set(q(".ar-gold-backplate"), { opacity: 1 });
        utils.set(q(".ar-tri-halo"), { opacity: 0.55 });
        utils.set(q(".ar-coil-text"), { opacity: 0.7 });
        utils.set(q(".ar-outer-text"), { opacity: 0.55 });
        utils.set(q(".ar-coil-divider"), { opacity: 0.6 });
        utils.set(dimLabels, { opacity: 1 });
        utils.set(allRingScrew, { rotate: 0, scale: 1 });
        if (triGroup) utils.set(triGroup, { scale: 1, rotate: 0 });
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

      // ─── PHASE 2 (500ms): outer bezel (r=170) screws itself into place ───
      tl.add(
        [drawables.outer3, drawables.outer3Bev],
        { draw: ["0 0", "0 1"], duration: 1100, ease: "outExpo" },
        500,
      );
      tl.add(
        q(".ar-ring-screw-outer3"),
        {
          rotate: [-180, 0],
          scale: [1.14, 1],
          duration: 1100,
          ease: "outQuart",
        },
        500,
      );

      // Knurl pattern — quick stagger, many short ticks
      tl.add(
        drawables.knurl,
        {
          draw: ["0 0", "0 1"],
          duration: 200,
          ease: "outExpo",
          delay: stagger(4),
        },
        900,
      );

      // Panel dividers between outer rings
      tl.add(
        drawables.panelDiv,
        {
          draw: ["0 0", "0 1"],
          duration: 400,
          ease: "outExpo",
          delay: stagger(60),
        },
        1000,
      );

      // ─── PHASE 3 (1050ms): cardinal pin dots pop ───
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
        1050,
      );

      // ─── PHASE 4 (1150ms): chrono ticks — minor → medium → major ───
      tl.add(
        drawables.chronoMinor,
        {
          draw: ["0 0", "0 1"],
          duration: 260,
          ease: "outExpo",
          delay: stagger(8),
        },
        1150,
      );
      tl.add(
        drawables.chronoMedium,
        {
          draw: ["0 0", "0 1"],
          duration: 320,
          ease: "outExpo",
          delay: stagger(22),
        },
        1300,
      );
      tl.add(
        drawables.chronoMajor,
        {
          draw: ["0 0", "0 1"],
          duration: 450,
          ease: "outExpo",
          delay: stagger(70),
        },
        1450,
      );

      // Outer serial-text ring fades in alongside the ticks
      tl.add(
        q(".ar-outer-text"),
        { opacity: [0, 0.55], duration: 700, ease: "outQuart" },
        1250,
      );

      // ─── PHASE 5 (1550ms): middle bezel (r=155) screws into place ───
      tl.add(
        [drawables.outer2, drawables.outer2Bev],
        { draw: ["0 0", "0 1"], duration: 800, ease: "outExpo" },
        1550,
      );
      tl.add(
        q(".ar-ring-screw-outer2"),
        {
          rotate: [135, 0],
          scale: [1.09, 1],
          duration: 800,
          ease: "outQuart",
        },
        1550,
      );

      // ─── PHASE 5b (1700ms): outer 12-bolt ring — screws spin themselves in ───
      tl.add(
        q(".ar-bolt-outer-group"),
        {
          opacity: [0, 1],
          scale: [2.8, 1],
          rotate: [-900, 0],
          duration: 900,
          ease: "outQuart",
          delay: stagger(45),
        },
        1700,
      );

      // ─── PHASE 6 (1750ms): gold arc ensemble ───
      tl.add(
        q(".ar-gold-backplate"),
        { opacity: [0, 1], duration: 500 },
        1750,
      );
      tl.add(
        q(".ar-gold-glow"),
        { opacity: [0, 0.4], duration: 750, ease: "outQuart" },
        1800,
      );
      tl.add(
        drawables.goldArc,
        {
          draw: ["0 0", "0 1"],
          duration: 850,
          ease: "outExpo",
          delay: stagger(130),
        },
        1850,
      );
      tl.add(
        q(".ar-ring-screw-gold"),
        {
          rotate: [-22, 0],
          scale: [1.05, 1],
          duration: 850,
          ease: "outQuart",
        },
        1850,
      );

      // ─── PHASE 7 (2050ms): inner bezel (r=135) screws in ───
      tl.add(
        [drawables.outer1, drawables.outer1Bev],
        { draw: ["0 0", "0 1"], duration: 750, ease: "outExpo" },
        2050,
      );
      tl.add(
        q(".ar-ring-screw-outer1"),
        {
          rotate: [-90, 0],
          scale: [1.07, 1],
          duration: 750,
          ease: "outQuart",
        },
        2050,
      );

      // ─── PHASE 8 (2200ms): gear teeth draw + band rotates into place ───
      tl.add(
        drawables.gearTooth,
        {
          draw: ["0 0", "0 1"],
          duration: 260,
          ease: "outQuart",
          delay: stagger(16),
        },
        2200,
      );
      tl.add(
        q(".ar-ring-screw-gear"),
        { rotate: [-35, 0], duration: 1100, ease: "outQuart" },
        2200,
      );

      // ─── PHASE 8b (2380ms): main 6-bolt ring — spins in ───
      tl.add(
        q(".ar-bolt-main-group"),
        {
          opacity: [0, 1],
          scale: [2.8, 1],
          rotate: [-900, 0],
          duration: 900,
          ease: "outQuart",
          delay: stagger(60),
        },
        2380,
      );

      // ─── PHASE 9 (2500ms): radial arms ───
      tl.add(
        drawables.armRail,
        {
          draw: ["0 0", "0 1"],
          duration: 500,
          ease: "outExpo",
          delay: stagger(45),
        },
        2500,
      );
      tl.add(
        drawables.armStrut,
        {
          draw: ["0 0", "0 1"],
          duration: 280,
          ease: "outExpo",
          delay: stagger(25),
        },
        2650,
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
        2750,
      );

      // Arm terminal flange bolts — spin in
      tl.add(
        q(".ar-bolt-term-group"),
        {
          opacity: [0, 1],
          scale: [2.5, 1],
          rotate: [-720, 0],
          duration: 750,
          ease: "outQuart",
          delay: stagger(30),
        },
        2820,
      );

      // ─── PHASE 10 (2900ms): mid mechanism ───
      tl.add(
        [drawables.midSolid, drawables.midBev],
        { draw: ["0 0", "0 1"], duration: 600, ease: "outExpo" },
        2900,
      );
      tl.add(
        q(".ar-ring-screw-mid"),
        {
          rotate: [-18, 0],
          scale: [1.04, 1],
          duration: 600,
          ease: "outQuart",
        },
        2900,
      );
      tl.add(
        drawables.midDashed,
        { draw: ["0 0", "0 1"], duration: 600, ease: "outExpo" },
        3000,
      );
      tl.add(
        drawables.hexTooth,
        {
          draw: ["0 0", "0 1"],
          duration: 320,
          ease: "outExpo",
          delay: stagger(35),
        },
        3100,
      );
      tl.add(
        q(".ar-ring-screw-hex"),
        { rotate: [-30, 0], duration: 700, ease: "outQuart" },
        3100,
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
        3200,
      );

      // Fine gear band (48 teeth, counter-rotating)
      tl.add(
        drawables.fineGear,
        {
          draw: ["0 0", "0 1"],
          duration: 200,
          ease: "outExpo",
          delay: stagger(8),
        },
        3150,
      );
      tl.add(
        q(".ar-ring-screw-fine"),
        { rotate: [25, 0], duration: 900, ease: "outQuart" },
        3150,
      );

      // Sector vents open
      tl.add(
        drawables.vent,
        {
          draw: ["0 0", "0 1"],
          duration: 450,
          ease: "outExpo",
          delay: stagger(80),
        },
        3300,
      );

      // Mid bolt ring — spin in
      tl.add(
        q(".ar-bolt-mid-group"),
        {
          opacity: [0, 1],
          scale: [2.5, 1],
          rotate: [-720, 0],
          duration: 750,
          ease: "outQuart",
          delay: stagger(40),
        },
        3350,
      );

      // ─── PHASE 11 (3450ms): coil assembly ───
      tl.add(
        drawables.coilRing2,
        { draw: ["0 0", "0 1"], duration: 550, ease: "outExpo" },
        3450,
      );
      tl.add(
        q(".ar-ring-screw-coil"),
        {
          rotate: [-45, 0],
          scale: [1.06, 1],
          duration: 900,
          ease: "outQuart",
        },
        3450,
      );
      tl.add(
        drawables.coilWinding,
        {
          draw: ["0 0", "0 1"],
          duration: 320,
          ease: "outExpo",
          delay: stagger(35),
        },
        3550,
      );
      tl.add(
        drawables.coilRing1,
        { draw: ["0 0", "0 1"], duration: 500, ease: "outExpo" },
        3650,
      );
      tl.add(
        q(".ar-coil-divider"),
        {
          opacity: [0, 0.6],
          duration: 400,
          delay: stagger(40),
        },
        3600,
      );
      tl.add(
        q(".ar-coil-text"),
        { opacity: [0, 0.7], duration: 600, ease: "outQuart" },
        3700,
      );

      // Pilot ring
      tl.add(
        drawables.pilotRing,
        { draw: ["0 0", "0 1"], duration: 450, ease: "outExpo" },
        3750,
      );

      // ─── PHASE 12 (3850ms): triangle core assembles + core-plate bolts ───
      tl.add(
        q(".ar-tri-halo"),
        { opacity: [0, 0.55], duration: 900, ease: "outQuart" },
        3850,
      );
      tl.add(
        q(".ar-bolt-core-group"),
        {
          opacity: [0, 1],
          scale: [2.5, 1],
          rotate: [-720, 0],
          duration: 700,
          ease: "outQuart",
          delay: stagger(50),
        },
        3850,
      );
      tl.add(
        drawables.triEdge,
        { draw: ["0 0", "0 1"], duration: 600, ease: "outExpo" },
        3950,
      );
      if (triGroup) {
        tl.add(
          triGroup,
          {
            scale: [0, 1],
            rotate: [-180, 0],
            duration: 900,
            ease: "outBack(1.3)",
          },
          4000,
        );
      }
      tl.add(
        drawables.triInner,
        { draw: ["0 0", "0 1"], duration: 500, ease: "outExpo" },
        4250,
      );
      tl.add(
        q(".ar-tri-fill"),
        { opacity: [0, 1], duration: 450, ease: "outQuart" },
        4300,
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
        4400,
      );
      tl.add(
        q(".ar-tri-center"),
        { opacity: [0, 1], duration: 300 },
        4650,
      );

      // ─── PHASE 13 (4450ms): dimension labels ───
      tl.add(
        dimLabels,
        {
          opacity: [0, 1],
          duration: 500,
          ease: "outQuart",
          delay: stagger(110),
        },
        4450,
      );

      // ─── PHASE 14 (4800ms): scan line fades in ───
      if (scanLine) {
        tl.add(scanLine, { opacity: [0, 0.35], duration: 600 }, 4800);
      }

      return () => {
        tl.pause();
      };
    }, [svgRef]);

    // === Ambient loops (scan, gear drift, halo breath, parallax) ===
    useLayoutEffect(() => {
      const root = (svgRef as React.RefObject<SVGSVGElement>).current;
      if (!root) return;
      if (prefersReducedMotion()) return;

      const q = (sel: string): NodeListOf<Element> =>
        root.querySelectorAll(sel);

      // Scan line — continuous rotation
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

      // Main gear band — very slow positive drift
      let gearAnim: ReturnType<typeof animate> | null = null;
      const gearGroup = q(".ar-ring-screw-gear")[0] as SVGElement | undefined;
      if (gearGroup) {
        gearAnim = animate(gearGroup, {
          rotate: [0, 360],
          duration: 120000,
          ease: "linear",
          loop: true,
          delay: 5200,
        });
      }

      // Fine gear band — counter-rotates
      let fineAnim: ReturnType<typeof animate> | null = null;
      const fineGroup = q(".ar-ring-screw-fine")[0] as SVGElement | undefined;
      if (fineGroup) {
        fineAnim = animate(fineGroup, {
          rotate: [0, -360],
          duration: 180000,
          ease: "linear",
          loop: true,
          delay: 5200,
        });
      }

      // Halo + triangle breath
      const halo = q(".ar-tri-halo")[0] as SVGElement | undefined;
      let haloAnim: ReturnType<typeof animate> | null = null;
      if (halo) {
        haloAnim = animate(halo, {
          opacity: [0.45, 0.65, 0.45],
          duration: 3800,
          ease: "inOutSine",
          loop: true,
          delay: 5200,
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
          delay: 5200,
        });
      }

      // 3D parallax — baseline tilt + pointer perturbation.
      // BASE_ROT_X (pitch) and BASE_ROT_Y (yaw) are baked in so the reactor
      // always renders in a 3/4 view even when the pointer is at rest.
      const BASE_ROT_X = -9; // negative = leaned back
      const BASE_ROT_Y = 5;
      let targetY = BASE_ROT_Y;
      let targetX = -BASE_ROT_X;
      let curY = BASE_ROT_Y;
      let curX = -BASE_ROT_X;
      let rafId = 0;
      const tick = () => {
        curY += (targetY - curY) * 0.06;
        curX += (targetX - curX) * 0.06;
        root.style.transform = `perspective(1100px) rotateY(${curY.toFixed(3)}deg) rotateX(${(-curX).toFixed(3)}deg)`;
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      const onMove = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        const px = (e.clientX - (r.left + r.width / 2)) / r.width;
        const py = (e.clientY - (r.top + r.height / 2)) / r.height;
        targetY = utils.clamp(BASE_ROT_Y + px * 14, -20, 20);
        targetX = utils.clamp(-BASE_ROT_X + py * 10, -18, 18);
      };
      window.addEventListener("pointermove", onMove);

      return () => {
        scanAnim?.pause();
        gearAnim?.pause();
        fineAnim?.pause();
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

    // Helper JSX builder for a single bolt. Draws polygon + slot lines in
    // absolute SVG coords, and sets transform-origin inline so CSS transforms
    // (rotate/scale applied by anime.js) pivot around the bolt's own center.
    const renderBolt = (
      bcx: number,
      bcy: number,
      radius: number,
      slotLen: number,
      extraGroupClass: string,
      strokeW: number,
      key: string | number,
      slotStyle: "cross" | "dot" = "cross",
    ) => (
      <g
        key={key}
        className={`ar-bolt-group ${extraGroupClass}`}
        style={{ transformOrigin: `${bcx}px ${bcy}px` }}
      >
        <polygon
          className="ar-bolt"
          points={hexPoints(bcx, bcy, radius)}
          fill="var(--color-paper-raised)"
          stroke="var(--color-ink)"
          strokeWidth={strokeW}
        />
        {slotStyle === "cross" ? (
          <>
            <line
              className="ar-bolt-slot"
              x1={bcx - slotLen}
              y1={bcy}
              x2={bcx + slotLen}
              y2={bcy}
              stroke="var(--color-ink)"
              strokeWidth={strokeW * 0.8}
              strokeLinecap="round"
            />
            <line
              className="ar-bolt-slot"
              x1={bcx}
              y1={bcy - slotLen}
              x2={bcx}
              y2={bcy + slotLen}
              stroke="var(--color-ink)"
              strokeWidth={strokeW * 0.8}
              strokeLinecap="round"
            />
          </>
        ) : (
          <circle
            className="ar-bolt-slot"
            cx={bcx}
            cy={bcy}
            r={slotLen * 0.55}
            fill="var(--color-ink)"
          />
        )}
      </g>
    );

    return (
      <div
        className={className}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          maxWidth: size,
          // Soft contact-shadow underneath so the reactor reads as elevated
          // off its container when it tilts.
          filter:
            "drop-shadow(0 22px 32px rgba(0,0,0,0.35)) drop-shadow(0 4px 10px rgba(0,0,0,0.25))",
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
            willChange: "transform",
            // The baseline tilt is applied by the RAF tick in the ambient
            // effect; this fallback keeps a 3/4 look before JS boots.
            transform: "perspective(1100px) rotateY(5deg) rotateX(9deg)",
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

            {/* Diagonal bevel — highlight top-left, shadow bottom-right.
                Applied as a stroke on a companion ring for each major ring
                to read as a chamfered metal edge. */}
            <linearGradient id="ar-bevel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-paper-raised)" stopOpacity="0" />
              <stop offset="18%" stopColor="var(--color-paper-raised)" stopOpacity="0.40" />
              <stop offset="50%" stopColor="var(--color-ink)" stopOpacity="0" />
              <stop offset="82%" stopColor="var(--color-ink)" stopOpacity="0.40" />
              <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ar-bevel-strong" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-paper-raised)" stopOpacity="0.60" />
              <stop offset="50%" stopColor="var(--color-ink)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0.55" />
            </linearGradient>

            {/* Gold arc gradient — bright rim at top, body in middle, slight
                underside darkening — reads as cylindrical brass. */}
            <linearGradient id="ar-gold-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-gold-hi)" />
              <stop offset="50%" stopColor="var(--color-gold)" />
              <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.85" />
            </linearGradient>

            {/* Core-well shadow — simulates the triangle sitting in a
                shallow circular depression at the reactor's center. */}
            <radialGradient id="ar-core-well" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="var(--color-ink)" stopOpacity="0" />
              <stop offset="70%" stopColor="var(--color-ink)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0.55" />
            </radialGradient>

            <path
              id="ar-coil-text-path"
              d="M 138,200 A 62,62 0 1,1 262,200 A 62,62 0 1,1 138,200"
              fill="none"
            />
            <path
              id="ar-outer-text-path"
              d="M 44,200 A 156,156 0 1,1 356,200 A 156,156 0 1,1 44,200"
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

          {/* ═══ L1 — OUTER BEZEL (r=170) — screws itself into place ═══ */}
          <g className="ar-ring-screw ar-ring-screw-outer3">
            {/* Bevel companion ring — thick stroke with diagonal gradient */}
            <circle
              className="ar-outer-3-bev"
              cx={CX}
              cy={CY}
              r={170}
              stroke="url(#ar-bevel-strong)"
              strokeWidth="3.6"
              fill="none"
            />
            {/* Ink line on top */}
            <circle
              className="ar-outer-3"
              cx={CX}
              cy={CY}
              r={170}
              stroke="var(--color-ink)"
              strokeWidth="1.2"
              fill="none"
            />
          </g>

          {/* Outer knurl pattern — 120 micro-ticks for grip texture */}
          <g stroke="var(--color-steel)" strokeWidth="0.35" fill="none" opacity="0.55">
            {KNURL_ANGLES.map((a, i) => (
              <path
                key={`kn-${i}`}
                className="ar-knurl"
                d={radialLine(a, 172, 174.5)}
              />
            ))}
          </g>

          {/* Curved outer serial-text */}
          <text
            className="ar-outer-text"
            fill="var(--color-steel)"
            fontSize="4.2"
            fontFamily="var(--font-mono)"
            letterSpacing="2"
            opacity="0"
          >
            <textPath href="#ar-outer-text-path" startOffset="0%">
              FLASHBACK·LABS · REACTOR·CORE · SERIES·F-01 · PERSONAL·AI · HUMAN·CONTROLLED · OWNED·BY·YOU · 
            </textPath>
          </text>

          {/* Panel dividers between outer rings */}
          <g stroke="var(--color-ink)" strokeWidth="0.5" fill="none" opacity="0.55">
            {PANEL_DIVIDERS.map((a, i) => (
              <path
                key={`pd-${i}`}
                className="ar-panel-div"
                d={radialLine(a, 155, 170)}
              />
            ))}
          </g>

          {/* Middle bezel (r=155) — screws into place */}
          <g className="ar-ring-screw ar-ring-screw-outer2">
            <circle
              className="ar-outer-2-bev"
              cx={CX}
              cy={CY}
              r={155}
              stroke="url(#ar-bevel)"
              strokeWidth="2.6"
              fill="none"
            />
            <circle
              className="ar-outer-2"
              cx={CX}
              cy={CY}
              r={155}
              stroke="var(--color-ink)"
              strokeWidth="0.8"
              fill="none"
            />
          </g>

          {/* Inner bezel (r=135) — screws into place */}
          <g className="ar-ring-screw ar-ring-screw-outer1">
            <circle
              className="ar-outer-1-bev"
              cx={CX}
              cy={CY}
              r={135}
              stroke="url(#ar-bevel)"
              strokeWidth="2.2"
              fill="none"
            />
            <circle
              className="ar-outer-1"
              cx={CX}
              cy={CY}
              r={135}
              stroke="var(--color-ink)"
              strokeWidth="0.6"
              fill="none"
            />
          </g>

          {/* Cardinal pin dots on outermost ring */}
          <g fill="var(--color-ink)">
            {CARDINAL_ANGLES.map((a, i) => {
              const [x, y] = polar(a, 170);
              return (
                <circle key={i} className="ar-pin-dot" cx={x} cy={y} r="2.5" />
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

          {/* Outer 12-bolt ring at r=148 — each screw spins itself in */}
          <g>
            {OUTER_BOLT_ANGLES.map((a, i) => {
              const [bcx, bcy] = polar(a, 148);
              return renderBolt(
                bcx,
                bcy,
                2.4,
                1.5,
                "ar-bolt-outer-group",
                0.6,
                `obolt-${i}`,
                "cross",
              );
            })}
          </g>

          {/* ═══ L2 — GOLD ARC ENSEMBLE ═══ */}
          <g className="ar-ring-screw ar-ring-screw-gold">
            {/* Bronze backplate — wider strokes behind the arcs for weight */}
            <g
              fill="none"
              stroke="var(--color-gold)"
              strokeOpacity="0.28"
              strokeWidth="8"
              strokeLinecap="round"
            >
              <path
                className="ar-gold-backplate"
                d={arcPath(-60, -28, 164)}
                opacity="0"
              />
              <path
                className="ar-gold-backplate"
                d={arcPath(-12, 12, 164)}
                opacity="0"
              />
              <path
                className="ar-gold-backplate"
                d={arcPath(28, 60, 164)}
                opacity="0"
              />
            </g>
            {/* Blurred halo */}
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
            {/* Gold arcs themselves — gradient stroke for rim-lit brass feel */}
            <g
              fill="none"
              stroke="url(#ar-gold-fill)"
              strokeWidth="2.6"
              strokeLinecap="round"
            >
              <path className="ar-gold-arc" d={arcPath(-60, -28, 164)} />
              <path className="ar-gold-arc" d={arcPath(-12, 12, 164)} />
              <path className="ar-gold-arc" d={arcPath(28, 60, 164)} />
            </g>
          </g>

          {/* ═══ L3 — GEAR BAND (24 teeth) — rotates into place + drifts ═══ */}
          <g className="ar-ring-screw ar-ring-screw-gear">
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
          </g>

          {/* Main 6-bolt ring at r=124 — screws itself in */}
          <g>
            {BOLT_ANGLES.map((a, i) => {
              const [bcx, bcy] = polar(a, 124);
              return renderBolt(
                bcx,
                bcy,
                3.4,
                2.2,
                "ar-bolt-main-group",
                0.7,
                `bolt-${i}`,
                "cross",
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

          {/* ═══ L4b — ARM TERMINAL FLANGE BOLTS — spin in ═══ */}
          <g>
            {ARM_TERMINI.map((t, i) => {
              const [fcx, fcy] = polar(t.angle, t.r);
              return renderBolt(
                fcx,
                fcy,
                2.8,
                1.8,
                "ar-bolt-term-group",
                0.6,
                `term-${i}`,
                "cross",
              );
            })}
          </g>

          {/* ═══ L5 — MID MECHANISM ═══ */}
          <g className="ar-ring-screw ar-ring-screw-mid">
            <circle
              className="ar-mid-bev"
              cx={CX}
              cy={CY}
              r={110}
              stroke="url(#ar-bevel)"
              strokeWidth="2.2"
              fill="none"
            />
            <circle
              className="ar-mid-solid"
              cx={CX}
              cy={CY}
              r={110}
              stroke="var(--color-ink)"
              strokeWidth="0.8"
              fill="none"
            />
          </g>
          <circle
            className="ar-mid-dashed"
            cx={CX}
            cy={CY}
            r={80}
            stroke="var(--color-ink)"
            strokeWidth="0.6"
            fill="none"
            strokeDasharray="2 2.5"
          />

          {/* Hex tooth arcs — 6 sector arcs that rotate into place */}
          <g className="ar-ring-screw ar-ring-screw-hex">
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

          {/* Fine gear band — 48 micro-teeth at r≈103 (counter-rotates) */}
          <g className="ar-ring-screw ar-ring-screw-fine">
            <g stroke="var(--color-ink)" strokeWidth="0.4" fill="none">
              {FINE_GEAR_TEETH.map((a, i) => (
                <path
                  key={`fg-${i}`}
                  className="ar-fine-gear-tooth"
                  d={radialLine(a, 101, 105)}
                />
              ))}
            </g>
          </g>

          {/* Mid bolt ring — dot-head screws spin in */}
          <g>
            {BOLT_ANGLES.map((a, i) => {
              const [bcx, bcy] = polar(a, 110);
              return renderBolt(
                bcx,
                bcy,
                2.2,
                1.3,
                "ar-bolt-mid-group",
                0.55,
                `mid-bolt-${i}`,
                "dot",
              );
            })}
          </g>

          {/* Sector vents — 3 curved slots in the mid band */}
          <g
            stroke="var(--color-ink)"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
            opacity="0.75"
          >
            {VENT_ANGLES.map((a, i) => (
              <path
                key={`vent-${i}`}
                className="ar-vent"
                d={arcPath(a - 9, a + 9, 88)}
              />
            ))}
          </g>

          {/* ═══ L6 — COIL ASSEMBLY ═══ */}
          <g className="ar-ring-screw ar-ring-screw-coil">
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
            {/* Divider ticks between coil windings */}
            <g
              stroke="var(--color-steel)"
              strokeWidth="0.35"
              fill="none"
              opacity="0"
            >
              {COIL_DIVIDERS.map((a, i) => (
                <path
                  key={`cd-${i}`}
                  className="ar-coil-divider"
                  d={radialLine(a, 54, 66)}
                />
              ))}
            </g>
            {/* Coil windings — gold */}
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
          </g>
          <text
            className="ar-coil-text"
            fill="var(--color-steel)"
            fontSize="5.5"
            fontFamily="var(--font-mono)"
            letterSpacing="2.4"
            opacity="0"
          >
            <textPath href="#ar-coil-text-path" startOffset="0%">
              FLASHBACK · CORE · SERIES·F-01 · PERSONAL AI · OWNED BY YOU ·
            </textPath>
          </text>

          {/* Pilot ring (r=40) — dashed guide between coil and triangle core */}
          <circle
            className="ar-pilot-ring"
            cx={CX}
            cy={CY}
            r={40}
            stroke="var(--color-ink)"
            strokeWidth="0.55"
            fill="none"
            strokeDasharray="3 3"
          />

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

          {/* Core-well shadow — implies the triangle sits in a depression */}
          <circle
            cx={CX}
            cy={CY}
            r={48}
            fill="url(#ar-core-well)"
            pointerEvents="none"
          />

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

          {/* Core plate bolts — 3 tiny screws seated between triangle vertices */}
          <g>
            {CORE_PLATE_BOLT_ANGLES.map((a, i) => {
              const [bcx, bcy] = polar(a, 36);
              return renderBolt(
                bcx,
                bcy,
                1.8,
                1.1,
                "ar-bolt-core-group",
                0.45,
                `cbolt-${i}`,
                "cross",
              );
            })}
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
