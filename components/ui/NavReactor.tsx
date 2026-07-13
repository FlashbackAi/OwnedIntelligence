"use client";

/**
 * Flashback Labs — NavReactor.
 *
 * Right-edge reactor dial + curved HTML label arc on its left.
 *
 *   - The dial is purely the mechanical reactor (bezel, chrono ticks, hex
 *     bolts, gold arc, hud-cyan triangle core, scan line, ambient gear).
 *     No labels inside it.
 *
 *   - The labels live outside the dial as real HTML, positioned along a
 *     gentle arc that follows the dial's circumference. The active item
 *     sits at the active bearing (mid-vertical, far-left); other items
 *     fan out above/below it and curve INWARD toward the dial as they
 *     approach the arc's extremes — so when `home` is active, `get
 *     started` ends up at the bottom of the list, bent close to the rim
 *     ("the close at the end").
 *
 *   - Each label tilts subtly to suggest tangent-to-arc, giving the
 *     stack the "a little bendy" feel rather than a flat column.
 *
 *   - Hovering a label spins the wheel so that item's bolt lands at the
 *     bearing; hovering a bolt only highlights it (bolts ride the wheel,
 *     so letting them retarget the rotation would slide them out from
 *     under the cursor and set up a mouseenter/leave feedback loop).
 *     Click commits.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { animate, stagger, utils } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";

export type NavReactorItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  sectionId?: string | null;
};

type NavReactorProps = {
  items: NavReactorItem[];
  activeIndex: number;
  open: boolean;
  onClose: () => void;
  onSelect: (item: NavReactorItem, idx: number) => void;
};

/* ────────── geometry ────────── */

const CX = 0;
const CY = 0;
const R_OUTER = 210;
const R_BEZEL = 192;
const R_TICK_OUT = 186;
const R_TICK_IN = 178;
const R_ITEM = 152;
const R_INNER = 92;
const R_CORE = 30;
const ITEM_HIT_RADIUS = 30;
const ITEM_SPACING_DEG = 14;
const TRI_R = 18;
const ACTIVE_BEARING_DEG = 270;

/** Radius used to lay out HTML labels in viewport space. Larger than the
 *  outer rim so labels float just past the dial. */
const R_LABEL_PX = 260;
/** Angular step between adjacent labels in the HTML arc. */
const LABEL_STEP_DEG = 13;
/** How much each label tilts to suggest the arc tangent. 1.0 = full
 *  tangent (vertical at active); 0.3 = a hint of curve. */
const LABEL_TILT_FACTOR = 0.32;

function polar(deg: number, r: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  const x = Math.round((CX + r * Math.sin(rad)) * 1000) / 1000;
  const y = Math.round((CY - r * Math.cos(rad)) * 1000) / 1000;
  return [x, y];
}

function radialLine(deg: number, r1: number, r2: number): string {
  const [x1, y1] = polar(deg, r1);
  const [x2, y2] = polar(deg, r2);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function arcPath(startDeg: number, endDeg: number, r: number): string {
  const [x1, y1] = polar(startDeg, r);
  const [x2, y2] = polar(endDeg, r);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, j) => {
    const rad = (j * 60 * Math.PI) / 180;
    return `${(cx + r * Math.sin(rad)).toFixed(2)},${(cy - r * Math.cos(rad)).toFixed(2)}`;
  }).join(" ");
}

function isLeftSide(deg: number): boolean {
  const norm = ((deg % 360) + 360) % 360;
  return norm > 180 && norm < 360;
}

/* ────────── per-pass element specs ────────── */

const CHRONO_MINOR = Array.from({ length: 60 }, (_, i) => i * 6).filter(
  (d) => d % 30 !== 0,
);
const CHRONO_MAJOR = Array.from({ length: 12 }, (_, i) => i * 30);
const RIM_BOLT_ANGLES = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);
const GEAR_TEETH = Array.from({ length: 24 }, (_, i) => i * 15 + 7.5);

/* ────────── main component ────────── */

export default function NavReactor({
  items,
  activeIndex,
  open,
  onClose,
  onSelect,
}: NavReactorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<SVGGElement>(null);
  const bezelRef = useRef<SVGGElement>(null);
  const triRef = useRef<SVGGElement>(null);
  const scanRef = useRef<SVGGElement>(null);
  const gearRef = useRef<SVGGElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  /* Hover carries its source: labels are stationary HTML so they may
     retarget the wheel; bolts rotate WITH the wheel, so a bolt-driven
     retarget would move the hovered bolt away from the cursor and cause
     a mouseenter/leave oscillation loop. Bolt hover highlights only. */
  const [hovered, setHovered] = useState<{
    idx: number;
    source: "bolt" | "label";
  } | null>(null);
  const hoveredIndex = hovered?.idx ?? null;
  const focusedIndex =
    hovered !== null &&
    hovered.source === "label" &&
    hovered.idx >= 0 &&
    hovered.idx < items.length
      ? hovered.idx
      : activeIndex;

  /* Item home angles (used by the dial wheel). */
  const itemAngles = useMemo(() => {
    const n = items.length;
    const start = -((n - 1) * ITEM_SPACING_DEG) / 2;
    return items.map(
      (_, i) => ACTIVE_BEARING_DEG + start + i * ITEM_SPACING_DEG,
    );
  }, [items]);

  /* Wheel rotation snaps fully to the focused item's bolt. */
  const targetRotation =
    ACTIVE_BEARING_DEG - (itemAngles[focusedIndex] ?? ACTIVE_BEARING_DEG);
  const currentRotationRef = useRef(targetRotation);
  const rafRef = useRef<number>(0);

  const applyRotation = useCallback((rot: number) => {
    currentRotationRef.current = rot;
    const wheel = wheelRef.current;
    if (wheel) wheel.setAttribute("transform", `rotate(${rot.toFixed(3)})`);
  }, []);

  useLayoutEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (prefersReducedMotion()) {
      applyRotation(targetRotation);
      return;
    }
    const start = currentRotationRef.current;
    const end = targetRotation;
    applyRotation(start);
    if (Math.abs(end - start) < 0.05) {
      applyRotation(end);
      return;
    }
    /* t0 comes from the first frame's own timestamp: rAF timestamps are
       vsync-aligned and can precede a performance.now() captured here,
       which would make t negative and the outQuart ease kick the wheel
       AWAY from its target. */
    let t0 = -1;
    const dur = 700;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      applyRotation(start + (end - start) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetRotation, applyRotation]);

  /* Ambient scan + gear loops. */
  useEffect(() => {
    if (!open) return;
    if (prefersReducedMotion()) return;
    const scan = scanRef.current;
    const gear = gearRef.current;
    let scanAnim: ReturnType<typeof animate> | null = null;
    let gearAnim: ReturnType<typeof animate> | null = null;
    if (scan) {
      scan.style.transformOrigin = "0px 0px";
      scanAnim = animate(scan, {
        rotate: [0, 360],
        duration: 6500,
        ease: "linear",
        loop: true,
      });
    }
    if (gear) {
      gear.style.transformOrigin = "0px 0px";
      gearAnim = animate(gear, {
        rotate: [0, 360],
        duration: 80000,
        ease: "linear",
        loop: true,
      });
    }
    return () => {
      scanAnim?.pause();
      gearAnim?.pause();
    };
  }, [open]);

  /* Bezel pulse while hovering. */
  useEffect(() => {
    const bezel = bezelRef.current;
    if (!bezel) return;
    if (prefersReducedMotion()) return;
    animate(bezel, {
      scale: hoveredIndex !== null ? 1.018 : 1,
      duration: hoveredIndex !== null ? 280 : 360,
      ease: "outQuart",
    });
  }, [hoveredIndex]);

  /* Open / close bloom. */
  useLayoutEffect(() => {
    const root = rootRef.current;
    const bezel = bezelRef.current;
    const tri = triRef.current;
    const scrim = scrimRef.current;
    const labels = labelsRef.current;
    if (!root) return;

    const reduced = prefersReducedMotion();
    const bolts = root.querySelectorAll(".nr-bolt-group");
    const itemBolts = root.querySelectorAll(".nr-item-bolt-group");
    const goldArc = root.querySelector(".nr-gold-arc");
    const labelEls = labels?.querySelectorAll(".nr-label") ?? [];

    /* Kill any bloom still in flight from a previous open/close — leftover
       staggered tweens would keep driving bolts/labels after the reset
       below, making elements pop in out of order on rapid toggling. */
    utils.remove(
      [
        root,
        bezel,
        tri,
        scrim,
        labels,
        goldArc,
        ...Array.from(bolts),
        ...Array.from(itemBolts),
        ...Array.from(labelEls),
      ].filter(Boolean) as Element[],
    );

    /* Inactive labels rest at the class opacity (0.62); the bloom animates
       the inline value then releases it so CSS (incl. :hover) owns it. */
    const naturalOpacity = (el: unknown) =>
      (el as Element).classList.contains("nr-label-inactive") ? 0.62 : 1;
    const releaseLabelOpacity = () =>
      labelEls.forEach((el) => (el as HTMLElement).style.removeProperty("opacity"));

    if (open) {
      root.style.pointerEvents = "auto";
      if (scrim) scrim.style.pointerEvents = "auto";
      if (labels) labels.style.pointerEvents = "auto";

      if (reduced) {
        utils.set(root, { opacity: 1, translateX: 0 });
        utils.set([bezel, tri].filter(Boolean) as Element[], { scale: 1, opacity: 1 });
        utils.set(bolts, { scale: 1, rotate: 0, opacity: 1 });
        utils.set(itemBolts, { scale: 1, rotate: 0, opacity: 1 });
        if (goldArc) utils.set(goldArc, { opacity: 1 });
        if (scrim) utils.set(scrim, { opacity: 1 });
        if (labels) utils.set(labels, { opacity: 1 });
        releaseLabelOpacity();
        return;
      }
      utils.set(root, { opacity: 0, translateX: 32 });
      if (bezel) utils.set(bezel, { scale: 0.86, opacity: 0 });
      if (tri) utils.set(tri, { scale: 0, rotate: -180 });
      utils.set(bolts, { scale: 2.4, rotate: -720, opacity: 0 });
      utils.set(itemBolts, { scale: 0, rotate: -540, opacity: 0 });
      if (goldArc) utils.set(goldArc, { opacity: 0 });
      if (scrim) utils.set(scrim, { opacity: 0 });
      if (labels) utils.set(labels, { opacity: 0 });
      if (labelEls.length) utils.set(labelEls, { opacity: 0 });

      if (scrim) animate(scrim, { opacity: 1, duration: 320, ease: "outQuart" });
      animate(root, { opacity: 1, translateX: 0, duration: 480, ease: "outQuart" });
      if (bezel) animate(bezel, { scale: 1, opacity: 1, duration: 620, ease: "outExpo" });
      animate(bolts, {
        scale: 1, rotate: 0, opacity: 1,
        duration: 700, ease: "outQuart",
        delay: stagger(35, { start: 80 }),
      });
      animate(itemBolts, {
        scale: 1, rotate: 0, opacity: 1,
        duration: 600, ease: "outBack(1.3)",
        delay: stagger(45, { start: 180 }),
      });
      if (goldArc) animate(goldArc, { opacity: 1, duration: 600, ease: "outQuart", delay: 420 });
      if (tri) animate(tri, { scale: 1, rotate: 0, duration: 700, ease: "outBack(1.2)", delay: 320 });
      if (labels) animate(labels, { opacity: 1, duration: 360, ease: "outQuart", delay: 180 });
      if (labelEls.length) {
        animate(labelEls, {
          opacity: naturalOpacity,
          duration: 460,
          ease: "outQuart",
          delay: stagger(55, { start: 260 }),
          onComplete: releaseLabelOpacity,
        });
      }
    } else {
      root.style.pointerEvents = "none";
      if (scrim) scrim.style.pointerEvents = "none";
      if (labels) labels.style.pointerEvents = "none";
      if (reduced) {
        utils.set(root, { opacity: 0, translateX: 32 });
        if (scrim) utils.set(scrim, { opacity: 0 });
        if (labels) utils.set(labels, { opacity: 0 });
        return;
      }
      animate(root, { opacity: 0, translateX: 32, duration: 260, ease: "outQuart" });
      if (scrim) animate(scrim, { opacity: 0, duration: 260, ease: "outQuart" });
      if (labels) animate(labels, { opacity: 0, duration: 220, ease: "outQuart" });
    }
  }, [open]);

  /* Reset hover + wheel accumulator whenever the dial closes — otherwise
     stale hover would still drive focusedIndex on next open. */
  useEffect(() => {
    if (!open) {
      setHovered(null);
      wheelAccumRef.current = 0;
    }
  }, [open]);

  /* Esc + arrow keys. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        const next = Math.min(items.length - 1, activeIndex + 1);
        if (next !== activeIndex) onSelect(items[next], next);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        const prev = Math.max(0, activeIndex - 1);
        if (prev !== activeIndex) onSelect(items[prev], prev);
      } else if (e.key === "Enter") {
        const item = items[activeIndex];
        if (item) onSelect(item, activeIndex);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIndex, items, onClose, onSelect]);

  /* Wheel-step over the dial/labels. Attached natively with
     { passive: false } — React registers onWheel passively, so
     preventDefault() there is a no-op (console error) and the page
     scrolls behind the dial while it steps. */
  const wheelAccumRef = useRef(0);
  useEffect(() => {
    if (!open) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      wheelAccumRef.current += e.deltaY;
      const threshold = 60;
      if (wheelAccumRef.current > threshold) {
        wheelAccumRef.current = 0;
        const next = Math.min(items.length - 1, activeIndex + 1);
        if (next !== activeIndex) onSelect(items[next], next);
      } else if (wheelAccumRef.current < -threshold) {
        wheelAccumRef.current = 0;
        const prev = Math.max(0, activeIndex - 1);
        if (prev !== activeIndex) onSelect(items[prev], prev);
      }
    };
    const targets = [rootRef.current, labelsRef.current].filter(
      Boolean,
    ) as HTMLElement[];
    targets.forEach((t) =>
      t.addEventListener("wheel", onWheel, { passive: false }),
    );
    return () =>
      targets.forEach((t) => t.removeEventListener("wheel", onWheel));
  }, [open, items, activeIndex, onSelect]);

  const visibleChronoMinor = useMemo(() => CHRONO_MINOR.filter(isLeftSide), []);
  const visibleChronoMajor = useMemo(() => CHRONO_MAJOR.filter(isLeftSide), []);
  const visibleRimBolts = useMemo(() => RIM_BOLT_ANGLES.filter(isLeftSide), []);

  /* Label arc positions — driven by activeIndex, NOT focusedIndex.
     Hovering rotates the dial but leaves the label stack alone, so the
     hovered label never slides out from under the cursor (which would
     cause a mouseenter/leave oscillation loop). */
  const labelLayout = useMemo(() => {
    return items.map((_, idx) => {
      const relIdx = idx - activeIndex;
      const angle = ACTIVE_BEARING_DEG + relIdx * LABEL_STEP_DEG;
      const [x, y] = polar(angle, R_LABEL_PX);
      const tilt = (angle - ACTIVE_BEARING_DEG) * LABEL_TILT_FACTOR;
      return {
        rightPx: -x,
        topPx: y,
        tiltDeg: tilt,
      };
    });
  }, [items, activeIndex]);

  return (
    <>
      {/* Page blur scrim */}
      <div
        ref={scrimRef}
        className="fixed inset-0 z-1040"
        onClick={onClose}
        aria-hidden="true"
        style={{
          opacity: 0,
          pointerEvents: "none",
          backdropFilter: "blur(8px) saturate(0.92)",
          WebkitBackdropFilter: "blur(8px) saturate(0.92)",
          background: "rgba(246,246,243,0.42)",
          willChange: "opacity",
        }}
      />

      {/* CURVED LABEL ARC — HTML anchors fanned along a gentle arc that
          mirrors the dial's circumference. Each label sits at its own
          polar offset from the viewport's right-mid origin. */}
      <nav
        ref={labelsRef}
        aria-label="Section navigation"
        className="fixed top-1/2 z-1051 pointer-events-none select-none"
        style={{
          right: 0,
          width: 0,
          height: 0,
          transform: "translateY(0)",
          opacity: 0,
          willChange: "opacity",
        }}
      >
        <style>{`
          .nr-label {
            position: absolute;
            text-align: right;
            white-space: nowrap;
            cursor: pointer;
            text-decoration: none;
            transition:
              right 640ms cubic-bezier(0.16, 1, 0.3, 1),
              top 640ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 640ms cubic-bezier(0.16, 1, 0.3, 1),
              color 320ms ease,
              opacity 320ms ease;
            transform-origin: 100% 50%;
            will-change: right, top, transform;
          }
          .nr-label-active {
            font-family: var(--font-display);
            font-size: clamp(28px, 3.6vw, 44px);
            line-height: 1;
            letter-spacing: -0.02em;
            color: var(--color-ink);
            text-transform: lowercase;
          }
          .nr-label-inactive {
            font-family: var(--font-mono);
            font-size: 12.5px;
            line-height: 1.6;
            letter-spacing: 0.26em;
            color: var(--color-steel);
            text-transform: uppercase;
            opacity: 0.62;
          }
          .nr-label-inactive:hover,
          .nr-label-inactive.is-hovered {
            color: var(--color-ink);
            opacity: 1;
          }
          /* Zoom on hover. Scales an inner span because the outer
             anchor's transform is the inline arc placement (translate +
             tilt) and must not be overridden. Grows from the right edge,
             i.e. away from the dial. */
          .nr-label-text {
            display: inline-block;
            transform-origin: 100% 50%;
            transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
          }
          .nr-label-inactive:hover .nr-label-text,
          .nr-label-inactive.is-hovered .nr-label-text,
          .nr-label-inactive:focus-visible .nr-label-text {
            transform: scale(1.12);
          }
          .nr-label-num {
            display: block;
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: var(--color-steel);
            margin-bottom: 6px;
          }
          .nr-label-rule {
            display: block;
            height: 1px;
            background: var(--color-ink);
            opacity: 0.4;
            margin-top: 8px;
            margin-left: auto;
            transition: width 480ms cubic-bezier(0.16, 1, 0.3, 1);
          }
          .nr-label:focus-visible {
            outline: 1px solid var(--color-ink);
            outline-offset: 6px;
          }
        `}</style>

        {items.map((item, idx) => {
          const { rightPx, topPx, tiltDeg } = labelLayout[idx];
          const isActive = idx === activeIndex;
          const isHovered = idx === hoveredIndex;
          const transform = `translateY(-50%) rotate(${tiltDeg.toFixed(2)}deg)`;
          return (
            <a
              key={idx}
              className={
                "nr-label " +
                (isActive
                  ? "nr-label-active"
                  : "nr-label-inactive" + (isHovered ? " is-hovered" : ""))
              }
              href={item.href}
              role="menuitem"
              aria-current={isActive ? "true" : undefined}
              aria-label={item.ariaLabel || item.label}
              style={{
                right: `${rightPx.toFixed(2)}px`,
                top: `${topPx.toFixed(2)}px`,
                transform,
                opacity: 0,
              }}
              onMouseEnter={() => setHovered({ idx, source: "label" })}
              onMouseLeave={() =>
                setHovered((cur) =>
                  cur?.idx === idx && cur.source === "label" ? null : cur,
                )
              }
              onFocus={() => setHovered({ idx, source: "label" })}
              onBlur={() =>
                setHovered((cur) =>
                  cur?.idx === idx && cur.source === "label" ? null : cur,
                )
              }
              onClick={(e) => {
                e.preventDefault();
                onSelect(item, idx);
              }}
            >
              {isActive ? (
                <>
                  <span className="nr-label-num">
                    § {String(idx + 1).padStart(2, "0")} · ACTIVE
                  </span>
                  <span>{item.label}</span>
                  <span
                    className="nr-label-rule"
                    style={{
                      width: `${Math.max(56, item.label.length * 14)}px`,
                    }}
                  />
                </>
              ) : (
                <span className="nr-label-text">
                  {item.label.toUpperCase()}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* DIAL */}
      <div
        className="nav-reactor-anchor fixed top-1/2 z-1050 pointer-events-none"
        style={{
          right: "-210px",
          marginTop: "-280px",
        }}
      >
        <div
          ref={rootRef}
          className="nav-reactor pointer-events-none"
          style={{
            willChange: "transform, opacity",
            opacity: 0,
            transform: "translateX(32px)",
          }}
          role="dialog"
          aria-label="Reactor dial"
          aria-modal={false}
        >
          <style>{`
            .nav-reactor .nr-svg {
              display: block;
              overflow: visible;
              filter: drop-shadow(-18px 16px 28px rgba(11,13,16,0.16))
                      drop-shadow(-2px 4px 6px rgba(11,13,16,0.10));
            }
            .nav-reactor .nr-item-link { cursor: pointer; outline: none; }
            .nav-reactor .nr-item-hex {
              transition: fill 220ms ease, stroke 220ms ease, stroke-width 220ms ease;
            }
            .nav-reactor .nr-item-link:hover .nr-item-hex {
              fill: var(--color-paper-raised);
              stroke: var(--color-ink);
              stroke-width: 1.4;
            }
            .nav-reactor .nr-hit { fill: transparent; }
          `}</style>

          <svg
            className="nr-svg"
            viewBox="-220 -260 440 520"
            width="440"
            height="520"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="nr-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-gold-hi)" />
                <stop offset="60%" stopColor="var(--color-gold)" />
                <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.85" />
              </linearGradient>
              <radialGradient id="nr-paper-fade" cx="0.5" cy="0.5" r="0.55">
                <stop offset="0%" stopColor="var(--color-paper-raised)" stopOpacity="0.96" />
                <stop offset="60%" stopColor="var(--color-paper)" stopOpacity="0.88" />
                <stop offset="100%" stopColor="var(--color-paper)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nr-core-well" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="var(--color-ink)" stopOpacity="0" />
                <stop offset="70%" stopColor="var(--color-ink)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0.5" />
              </radialGradient>
              <linearGradient id="nr-bevel" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-paper-raised)" stopOpacity="0.55" />
                <stop offset="50%" stopColor="var(--color-ink)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="nr-scan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-hud)" stopOpacity="0.65" />
                <stop offset="55%" stopColor="var(--color-hud)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-hud)" stopOpacity="0" />
              </linearGradient>
              <clipPath id="nr-left-half">
                <rect x="-220" y="-260" width="222" height="520" />
              </clipPath>
            </defs>

            <g clipPath="url(#nr-left-half)">
              <circle cx={CX} cy={CY} r={R_OUTER + 16} fill="url(#nr-paper-fade)" />
            </g>

            <g ref={bezelRef} style={{ transformOrigin: "0px 0px" }}>
              <circle cx={CX} cy={CY} r={R_OUTER} stroke="url(#nr-bevel)" strokeWidth="3" fill="none" clipPath="url(#nr-left-half)" />
              <circle cx={CX} cy={CY} r={R_OUTER} stroke="var(--color-ink)" strokeWidth="1.1" fill="none" clipPath="url(#nr-left-half)" />
              <circle cx={CX} cy={CY} r={R_BEZEL} stroke="var(--color-hairline)" strokeWidth="0.7" fill="none" clipPath="url(#nr-left-half)" />

              <g stroke="var(--color-ink)" fill="none">
                {visibleChronoMinor.map((a, i) => (
                  <path key={`mn-${i}`} d={radialLine(a, R_TICK_IN, R_TICK_OUT)} strokeWidth="0.5" opacity="0.55" />
                ))}
                {visibleChronoMajor.map((a, i) => (
                  <path key={`mj-${i}`} d={radialLine(a, R_TICK_IN - 4, R_TICK_OUT + 2)} strokeWidth="1.1" />
                ))}
              </g>

              {visibleRimBolts.map((a, i) => {
                const [bx, by] = polar(a, R_BEZEL - 8);
                return (
                  <g key={`rb-${i}`} className="nr-bolt-group" style={{ transformOrigin: `${bx}px ${by}px` }}>
                    <polygon points={hexPoints(bx, by, 3.8)} fill="var(--color-paper-raised)" stroke="var(--color-ink)" strokeWidth="0.7" />
                    <line x1={bx - 2} y1={by} x2={bx + 2} y2={by} stroke="var(--color-ink)" strokeWidth="0.55" strokeLinecap="round" />
                    <line x1={bx} y1={by - 2} x2={bx} y2={by + 2} stroke="var(--color-ink)" strokeWidth="0.55" strokeLinecap="round" />
                  </g>
                );
              })}

              <g className="nr-gold-arc">
                <path d={arcPath(ACTIVE_BEARING_DEG - 10, ACTIVE_BEARING_DEG + 10, R_OUTER - 14)}
                  stroke="var(--color-gold)" strokeOpacity="0.32" strokeWidth="8" strokeLinecap="round" fill="none" />
                <path d={arcPath(ACTIVE_BEARING_DEG - 10, ACTIVE_BEARING_DEG + 10, R_OUTER - 14)}
                  stroke="url(#nr-gold)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
                <circle
                  cx={polar(ACTIVE_BEARING_DEG, R_OUTER - 14)[0]}
                  cy={polar(ACTIVE_BEARING_DEG, R_OUTER - 14)[1]}
                  r="2.4" fill="var(--color-gold-hi)" />
              </g>

              {/* Bearing highlight — gold ring + hud-cyan pip pinned to the
                  bezel at the active bearing. Always sits ON TOP of whatever
                  bolt is currently rotated under it, which avoids any
                  desync between the indicator and the rotating wheel. */}
              {(() => {
                const [px, py] = polar(ACTIVE_BEARING_DEG, R_ITEM);
                return (
                  <g>
                    <circle
                      cx={px}
                      cy={py}
                      r={14}
                      stroke="var(--color-gold)"
                      strokeWidth="0.9"
                      fill="none"
                      opacity="0.85"
                    />
                    <circle cx={px} cy={py} r={2.8} fill="var(--color-hud)" />
                  </g>
                );
              })()}

              <g ref={gearRef} style={{ transformOrigin: "0px 0px" }}>
                <g stroke="var(--color-ink)" strokeWidth="0.55" fill="none" opacity="0.7" clipPath="url(#nr-left-half)">
                  {GEAR_TEETH.map((a, i) => {
                    const w = 5;
                    const [x1, y1] = polar(a - w, R_INNER + 8);
                    const [x2, y2] = polar(a - w / 2, R_INNER + 14);
                    const [x3, y3] = polar(a + w / 2, R_INNER + 14);
                    const [x4, y4] = polar(a + w, R_INNER + 8);
                    return <path key={`gt-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4}`} />;
                  })}
                </g>
              </g>

              <circle cx={CX} cy={CY} r={R_INNER} stroke="var(--color-ink)" strokeWidth="0.7" fill="none" clipPath="url(#nr-left-half)" />
              <circle cx={CX} cy={CY} r={R_INNER - 16} stroke="var(--color-hairline)" strokeWidth="0.6" strokeDasharray="3 3" fill="none" clipPath="url(#nr-left-half)" />

              <g ref={scanRef} style={{ transformOrigin: "0px 0px" }} clipPath="url(#nr-left-half)">
                <line x1={CX} y1={CY} x2={CX} y2={CY - R_BEZEL + 6}
                  stroke="url(#nr-scan)" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
              </g>

              <circle cx={CX} cy={CY} r={R_CORE + 10} fill="url(#nr-core-well)" clipPath="url(#nr-left-half)" />
              <circle cx={CX} cy={CY} r={R_CORE + 6} fill="var(--color-hud)" opacity="0.18"
                style={{ filter: "blur(8px)" }} clipPath="url(#nr-left-half)" />
              <g ref={triRef} style={{ transformOrigin: "0px 0px" }} clipPath="url(#nr-left-half)">
                <polygon
                  points={`${polar(0, TRI_R).join(",")} ${polar(120, TRI_R).join(",")} ${polar(240, TRI_R).join(",")}`}
                  fill="var(--color-hud-deep)" />
                <polyline
                  points={`${polar(0, TRI_R).join(",")} ${polar(120, TRI_R).join(",")} ${polar(240, TRI_R).join(",")} ${polar(0, TRI_R).join(",")}`}
                  stroke="var(--color-ink)" strokeWidth="1.2" fill="none" />
                <circle cx={0} cy={0} r="1.5" fill="var(--color-paper-raised)" />
              </g>

              <text
                x={polar(225, R_INNER + 22)[0]}
                y={polar(225, R_INNER + 22)[1]}
                fontSize="9" fontFamily="var(--font-mono)" letterSpacing="2.4"
                fill="var(--color-steel)" opacity="0.75" textAnchor="middle"
              >
                § · NAV
              </text>
            </g>

            {/* WHEEL — hex bolts only */}
            <g ref={wheelRef} style={{ transformOrigin: "0px 0px" }}>
              {items.map((item, idx) => {
                const a = itemAngles[idx];
                const [bx, by] = polar(a, R_ITEM);
                const isActive = idx === activeIndex;
                const isHovered = idx === hoveredIndex;
                return (
                  <g
                    key={`bolt-${idx}`}
                    className="nr-item-link"
                    role="menuitem"
                    aria-label={item.ariaLabel || item.label}
                    aria-current={isActive ? "true" : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(item, idx);
                    }}
                    onMouseEnter={() => setHovered({ idx, source: "bolt" })}
                    onMouseLeave={() =>
                      setHovered((cur) =>
                        cur?.idx === idx && cur.source === "bolt" ? null : cur,
                      )
                    }
                    style={{ pointerEvents: "auto" }}
                  >
                    <circle className="nr-hit" cx={bx} cy={by} r={ITEM_HIT_RADIUS} />
                    <g
                      className="nr-item-bolt-group"
                      style={{ transformOrigin: `${bx}px ${by}px` }}
                    >
                      <polygon
                        className="nr-item-hex"
                        points={hexPoints(bx, by, isHovered ? 9 : 7.5)}
                        fill="var(--color-paper)"
                        stroke="var(--color-steel)"
                        strokeWidth="0.8"
                      />
                      {/* Active bolt — small persistent gold pip so the user
                          can spot what's really committed even while hovering
                          another item rotates a different bolt under the
                          bezel's bearing highlight. */}
                      {isActive && (
                        <circle cx={bx} cy={by} r={2.2} fill="var(--color-gold)" />
                      )}
                      {!isActive && (
                        <circle cx={bx} cy={by} r={1.6} fill="var(--color-steel)" />
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </>
  );
}
