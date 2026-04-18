"use client";

/**
 * Flashback Labs — § 03 Thesis / Position.
 *
 * The amplification-zone diagram IS the section. Manifesto made the argument;
 * this locates Flashback on the spectrum. Track + zones reveal on entry;
 * the HUD marker scrubs with scroll toward its 30% rest-position and then
 * breathes in place.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Zone = {
  key: "assist" | "amplify" | "automate" | "replace";
  label: string;
  caption: string;
  start: number;
  end: number;
  tint: "hairline" | "hud" | "hotrod";
};

const ZONES: Zone[] = [
  {
    key: "assist",
    label: "ASSIST",
    caption: "tools that do a task for you",
    start: 0,
    end: 25,
    tint: "hairline",
  },
  {
    key: "amplify",
    label: "AMPLIFY",
    caption: "tools that make you better at a task",
    start: 25,
    end: 50,
    tint: "hud",
  },
  {
    key: "automate",
    label: "AUTOMATE",
    caption: "tools that do the task without you",
    start: 50,
    end: 80,
    tint: "hairline",
  },
  {
    key: "replace",
    label: "REPLACE",
    caption: "tools that don't need you at all",
    start: 80,
    end: 100,
    tint: "hotrod",
  },
];

const MARKER_REST = 30;
const MARKER_START = 4;

const TINT_FILL: Record<Zone["tint"], string> = {
  hairline: "rgba(216, 213, 206, 0.32)",
  hud: "rgba(8, 145, 178, 0.14)",
  hotrod: "rgba(179, 17, 26, 0.08)",
};

export default function Thesis() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const marker = root.querySelector<HTMLElement>(".thesis-marker");
    const markerHalo = root.querySelector<HTMLElement>(".thesis-marker-halo");
    const markerReadout = root.querySelector<HTMLElement>(
      ".thesis-marker-readout",
    );
    const track = root.querySelector<HTMLElement>(".thesis-track-fill");
    const zoneBands = root.querySelectorAll<HTMLElement>(".thesis-zone-band");
    const zoneLabels = root.querySelectorAll<HTMLElement>(".thesis-zone-label");
    const zoneCaptions = root.querySelectorAll<HTMLElement>(
      ".thesis-zone-caption",
    );
    const guides = root.querySelectorAll<HTMLElement>(".thesis-guide");
    const ticks = root.querySelectorAll<HTMLElement>(".thesis-tick");
    const endpoints = root.querySelectorAll<HTMLElement>(".thesis-endpoint");
    const leader = root.querySelector<HTMLElement>(".thesis-leader");
    const callout = root.querySelector<HTMLElement>(".thesis-callout");
    const sectionMarker = root.querySelector<HTMLElement>(
      ".thesis-section-marker",
    );
    const headline = root.querySelectorAll<HTMLElement>(".thesis-headline-line");
    const subline = root.querySelector<HTMLElement>(".thesis-subline");
    const dimension = root.querySelector<HTMLElement>(".thesis-dimension");
    const titleBlock = root.querySelector<HTMLElement>(".thesis-title-block");
    const axisTop = root.querySelector<HTMLElement>(".thesis-axis-top");

    const setMarker = (percent: number) => {
      if (marker) marker.style.left = `${percent}%`;
      if (markerHalo) markerHalo.style.left = `${percent}%`;
      if (leader) leader.style.left = `${percent}%`;
      if (markerReadout) {
        const zone = ZONES.find((z) => percent >= z.start && percent <= z.end);
        markerReadout.textContent = `${percent.toFixed(0)}% · ${
          zone?.label ?? "AMPLIFY"
        }`;
      }
    };

    if (prefersReducedMotion()) {
      gsap.set(
        [
          sectionMarker,
          ...headline,
          subline,
          ...zoneBands,
          ...zoneLabels,
          ...zoneCaptions,
          ...guides,
          ...ticks,
          ...endpoints,
          callout,
          leader,
          marker,
          markerHalo,
          markerReadout,
          dimension,
          titleBlock,
          axisTop,
        ].filter(Boolean),
        { opacity: 1, y: 0, scaleX: 1, transformOrigin: "left center" },
      );
      if (track) gsap.set(track, { transformOrigin: "left center", scaleX: 1 });
      if (markerHalo) {
        gsap.set(markerHalo, {
          xPercent: -50,
          yPercent: -50,
          transformOrigin: "50% 50%",
          opacity: 0.35,
          scale: 1,
        });
      }
      setMarker(MARKER_REST);
      return;
    }

    const triggers: ScrollTrigger[] = [];

    gsap.set(sectionMarker, { opacity: 0, y: 8 });
    gsap.set(headline, { opacity: 0, y: 18 });
    gsap.set(subline, { opacity: 0, y: 8 });
    gsap.set(track, { transformOrigin: "left center", scaleX: 0 });
    gsap.set(zoneBands, { opacity: 0 });
    gsap.set(zoneLabels, { opacity: 0, y: 6 });
    gsap.set(zoneCaptions, { opacity: 0, y: 6 });
    gsap.set(guides, { opacity: 0, scaleY: 0, transformOrigin: "top" });
    gsap.set(ticks, { opacity: 0 });
    gsap.set(endpoints, { opacity: 0 });
    gsap.set(callout, { opacity: 0, y: -6 });
    gsap.set(leader, { opacity: 0, scaleY: 0, transformOrigin: "top" });
    gsap.set(marker, { opacity: 0, scale: 0.6 });
    gsap.set(markerHalo, {
      opacity: 0,
      scale: 0.6,
      xPercent: -50,
      yPercent: -50,
      transformOrigin: "50% 50%",
    });
    gsap.set(markerReadout, { opacity: 0 });
    gsap.set(dimension, { opacity: 0 });
    gsap.set(titleBlock, { opacity: 0, y: 6 });
    gsap.set(axisTop, { opacity: 0 });
    setMarker(MARKER_START);

    const entry = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top 75%", once: true },
      defaults: { ease: "power3.out" },
      onComplete: () => {
        // Ambient breathing ping on the marker halo once the diagram has settled.
        gsap.fromTo(
          markerHalo,
          { scale: 1, opacity: 0.5 },
          {
            scale: 2.2,
            opacity: 0,
            duration: 2.0,
            ease: "power2.out",
            repeat: -1,
            repeatDelay: 0.2,
          },
        );
      },
    });

    entry
      .to(sectionMarker, { opacity: 1, y: 0, duration: 0.5 }, 0)
      .to(headline, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.1)
      .to(subline, { opacity: 1, y: 0, duration: 0.5 }, 0.35)
      .to(axisTop, { opacity: 1, duration: 0.4 }, 0.55)
      .to(track, { scaleX: 1, duration: 0.9, ease: "power2.out" }, 0.45)
      .to(ticks, { opacity: 1, duration: 0.3, stagger: 0.04 }, 0.9)
      .to(endpoints, { opacity: 1, duration: 0.35, stagger: 0.05 }, 1.0)
      .to(guides, { opacity: 1, scaleY: 1, duration: 0.5, stagger: 0.05 }, 1.05)
      .to(zoneBands, { opacity: 1, duration: 0.45, stagger: 0.08 }, 1.15)
      .to(zoneLabels, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }, 1.2)
      .to(zoneCaptions, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }, 1.28)
      .to(dimension, { opacity: 1, duration: 0.35 }, 1.3)
      .to(
        marker,
        { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" },
        1.5,
      )
      .to(markerHalo, { opacity: 0.35, scale: 1, duration: 0.5 }, 1.5)
      .to(markerReadout, { opacity: 1, duration: 0.35 }, 1.7)
      .to(titleBlock, { opacity: 1, y: 0, duration: 0.5 }, 1.85);

    if (entry.scrollTrigger) triggers.push(entry.scrollTrigger as ScrollTrigger);

    let calloutVisible = false;
    const showCallout = () => {
      if (calloutVisible) return;
      calloutVisible = true;
      gsap.to([leader, callout], {
        opacity: 1,
        y: 0,
        scaleY: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
      });
    };
    const hideCallout = () => {
      if (!calloutVisible) return;
      calloutVisible = false;
      gsap.to([callout, leader], {
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
      });
    };

    const scrub = ScrollTrigger.create({
      trigger: root,
      start: "top 60%",
      end: "center 45%",
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        if (p >= 0.98) showCallout();
        else if (p < 0.9) hideCallout();
        const value = MARKER_START + (MARKER_REST - MARKER_START) * p;
        setMarker(value);
      },
    });
    triggers.push(scrub);

    return () => {
      triggers.forEach((t) => t.kill());
      gsap.killTweensOf(markerHalo);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="thesis"
      aria-labelledby="thesis-heading"
      className="relative w-full bg-paper overflow-hidden md:min-h-[130vh]"
    >
      <h2 id="thesis-heading" className="sr-only">
        The Amplification Zone
      </h2>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-grid-hairline opacity-[0.35] pointer-events-none"
      />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-14 pt-16 md:pt-24 pb-24">
        <div className="thesis-section-marker flex items-center gap-4">
          <span className="block h-px w-14 bg-ink/50" aria-hidden="true" />
          <span className="font-mono text-[13px] tracking-[0.32em] uppercase text-ink">
            § 03 · POSITION
          </span>
        </div>

        <div className="mt-16 md:mt-24 flex flex-col items-center text-center">
          <span className="thesis-subline font-mono text-[10.5px] md:text-[11px] tracking-[0.3em] uppercase text-steel mb-6">
            Amplification Zone // a position, not a promise
          </span>
          <h3 className="font-display text-ink leading-[1.08] tracking-[-0.015em] text-[clamp(1.9rem,4.6vw,3.4rem)]">
            <span className="thesis-headline-line block">
              There is a zone where AI makes you more.
            </span>
            <span className="thesis-headline-line block mt-1">
              We <span className="text-hotrod">live</span> in it.
            </span>
          </h3>
        </div>

        {/* Desktop: horizontal blueprint plate */}
        <div className="hidden md:block mt-48 md:mt-56 mx-auto w-full max-w-[1040px]">
          <Diagram />
        </div>

        {/* Mobile: vertical stacked diagram */}
        <div className="md:hidden mt-20 mx-auto w-full">
          <MobileDiagram />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   Amplification-zone diagram — plate-style.
   ─────────────────────────────────────────────── */

function Diagram() {
  return (
    <div className="relative" aria-hidden="true">
      <CornerMarks />

      {/* Top axis label — the conceptual axis above the bands */}
      <div className="thesis-axis-top flex items-center justify-between mb-4 px-1">
        <span className="flex items-center gap-2">
          <span className="block h-px w-8 bg-ink/40" />
          <span className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-steel">
            human agency — max
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-steel">
            ai autonomy — max
          </span>
          <span className="block h-px w-8 bg-ink/40" />
        </span>
      </div>

      {/* Zone tinted bands */}
      <div className="relative h-[108px] border-t border-b border-ink/15">
        {ZONES.map((z) => (
          <div
            key={z.key}
            className="thesis-zone-band absolute top-0 bottom-0"
            style={{
              left: `${z.start}%`,
              width: `${z.end - z.start}%`,
              background: TINT_FILL[z.tint],
              borderLeft:
                z.start === 0 ? "none" : "1px dashed rgba(11, 13, 16, 0.2)",
            }}
          >
            {/* AMPLIFY gets a hatched overlay to mark "our" zone */}
            {z.key === "amplify" && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, rgba(3,105,161,0.18) 0px, rgba(3,105,161,0.18) 1px, transparent 1px, transparent 9px)",
                }}
              />
            )}
          </div>
        ))}

        {/* Zone labels + captions inside bands */}
        {ZONES.map((z) => {
          const mid = (z.start + z.end) / 2;
          const isAmplify = z.key === "amplify";
          return (
            <div
              key={`${z.key}-text`}
              className="absolute top-0 bottom-0 flex flex-col items-center justify-center -translate-x-1/2 text-center px-2"
              style={{ left: `${mid}%`, width: `${z.end - z.start}%` }}
            >
              <span
                className={`thesis-zone-label font-mono text-[11px] md:text-[12px] tracking-[0.3em] uppercase ${
                  isAmplify ? "text-hud-deep" : "text-steel"
                }`}
              >
                {z.label}
              </span>
              <span
                className={`thesis-zone-caption mt-2 font-mono text-[9.5px] tracking-[0.15em] uppercase leading-tight max-w-[180px] ${
                  isAmplify ? "text-ink-soft" : "text-steel/80"
                }`}
              >
                {z.caption}
              </span>
            </div>
          );
        })}
      </div>

      {/* Track line + ticks */}
      <div className="relative h-px mt-0">
        <div className="thesis-track-fill absolute inset-0 bg-ink" style={{ height: "1px" }} />
        {[0, 25, 50, 80, 100].map((p) => (
          <span
            key={p}
            className="thesis-tick absolute -translate-x-1/2 w-px bg-ink"
            style={{ left: `${p}%`, top: "-5px", height: "11px" }}
          />
        ))}
      </div>

      {/* Dashed vertical zone-boundary guides — span from band-top through tick */}
      <div className="relative">
        {[25, 50, 80].map((p) => (
          <span
            key={p}
            className="thesis-guide absolute -translate-x-1/2 w-px"
            style={{
              left: `${p}%`,
              height: "132px",
              top: "-130px",
              borderLeft: "1px dashed rgba(11, 13, 16, 0.18)",
            }}
          />
        ))}
      </div>

      {/* Endpoints */}
      <div className="relative mt-3 h-5">
        <div className="thesis-endpoint absolute left-0 flex items-center gap-2">
          <span className="block h-[7px] w-[7px] border border-ink" />
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-steel">
            0.0 · ASSIST
          </span>
        </div>
        <div className="thesis-endpoint absolute right-0 flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-steel">
            REPLACE · 1.0
          </span>
          <span className="block h-[7px] w-[7px] bg-hotrod" />
        </div>
      </div>

      {/* Dimension rule */}
      <div className="thesis-dimension mt-8 flex items-center justify-center gap-3">
        <span className="block h-px w-20 bg-ink/30" />
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-steel">
          ai autonomy — 0.0 → 1.0
        </span>
        <span className="block h-px w-20 bg-ink/30" />
      </div>

      {/* DETAIL callout above the marker — structured like a blueprint detail box */}
      <div
        className="thesis-callout absolute -translate-x-1/2 bg-paper-raised border border-ink/70 px-4 py-3 min-w-[220px] max-w-[260px]"
        style={{ left: `${MARKER_REST}%`, top: "-168px" }}
      >
        <div className="flex items-center justify-between border-b border-ink/25 pb-1.5 mb-2">
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-steel">
            DETAIL A
          </span>
          <span className="flex items-center gap-1.5">
            <span className="block h-[6px] w-[6px] bg-hud-deep rotate-45" />
            <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-ink">
              FLASHBACK
            </span>
          </span>
        </div>
        <ul className="space-y-1">
          <li className="flex items-baseline gap-2">
            <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-steel">
              01
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ink-soft">
              private by default
            </span>
          </li>
          <li className="flex items-baseline gap-2">
            <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-steel">
              02
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ink-soft">
              on-device
            </span>
          </li>
          <li className="flex items-baseline gap-2">
            <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-steel">
              03
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ink-soft">
              nonautonomous — you stay in control
            </span>
          </li>
        </ul>
      </div>

      {/* Vertical leader from callout bottom down to track */}
      <span
        className="thesis-leader absolute -translate-x-1/2 w-px bg-ink"
        style={{
          left: `${MARKER_REST}%`,
          top: "-48px",
          height: "194px",
        }}
      />

      {/* Marker halo (pulse) — behind the diamond, centered on track */}
      <span
        className="thesis-marker-halo absolute rounded-full pointer-events-none"
        style={{
          left: `${MARKER_REST}%`,
          top: "146px",
          width: "26px",
          height: "26px",
          background: "rgba(3, 105, 161, 0.35)",
        }}
      />

      {/* Marker diamond — sits on the track */}
      <span
        className="thesis-marker absolute -translate-x-1/2 rotate-45 bg-hud-deep"
        style={{
          left: `${MARKER_REST}%`,
          top: "140px",
          width: "12px",
          height: "12px",
        }}
      />

      {/* Readout caption — below the track */}
      <span
        className="thesis-marker-readout absolute -translate-x-1/2 font-mono text-[10px] tracking-[0.28em] uppercase text-hud-deep whitespace-nowrap"
        style={{ left: `${MARKER_REST}%`, top: "172px" }}
      >
        30% · AMPLIFY
      </span>

      {/* Engineering title block — bottom-right */}
      <div className="thesis-title-block mt-14 ml-auto w-fit border border-ink/60">
        <div className="grid grid-cols-[auto_1fr] text-[9.5px] font-mono uppercase tracking-[0.22em]">
          <div className="border-r border-b border-ink/30 px-3 py-1.5 text-steel">
            drawing
          </div>
          <div className="border-b border-ink/30 px-3 py-1.5 text-ink">
            03 · amplification zone
          </div>
          <div className="border-r border-b border-ink/30 px-3 py-1.5 text-steel">
            rev
          </div>
          <div className="border-b border-ink/30 px-3 py-1.5 text-ink">
            04.2026 · 1.0
          </div>
          <div className="border-r border-ink/30 px-3 py-1.5 text-steel">
            by
          </div>
          <div className="px-3 py-1.5 text-ink">flashback labs · thesis</div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Mobile: vertical blueprint plate.
   The desktop horizontal concept rotated 90°.
   Display-font zone names, heavy blueprint annotations,
   vertical hairline axis, DETAIL callout on AMPLIFY.
   ─────────────────────────────────────────────── */

const MOBILE_ZONES = [
  {
    key: "assist",
    numeral: "I",
    label: "Assist",
    caption: "tools that do a task for you",
    range: "0.00 — 0.25",
    exampleCount: "01",
  },
  {
    key: "amplify",
    numeral: "II",
    label: "Amplify",
    caption: "tools that make you better at a task",
    range: "0.25 — 0.50",
    exampleCount: "02",
  },
  {
    key: "automate",
    numeral: "III",
    label: "Automate",
    caption: "tools that do the task without you",
    range: "0.50 — 0.80",
    exampleCount: "03",
  },
  {
    key: "replace",
    numeral: "IV",
    label: "Replace",
    caption: "tools that don't need you at all",
    range: "0.80 — 1.00",
    exampleCount: "04",
  },
] as const;

function MobileDiagram() {
  return (
    <div className="relative" aria-hidden="true">
      <ol className="border-t border-ink/40">
        {MOBILE_ZONES.map((z) => {
          const isAmplify = z.key === "amplify";
          return (
            <li
              key={z.key}
              className="relative border-b border-ink/20 py-7"
              style={
                isAmplify
                  ? {
                      backgroundImage:
                        "repeating-linear-gradient(-45deg, rgba(3,105,161,0.1) 0px, rgba(3,105,161,0.1) 1px, transparent 1px, transparent 9px), linear-gradient(rgba(8,145,178,0.07), rgba(8,145,178,0.07))",
                    }
                  : undefined
              }
            >
              {/* Range + optional FLASHBACK pill */}
              <div className="flex items-center justify-between gap-2 px-1">
                <span
                  className={`font-mono text-[9.5px] tracking-[0.3em] uppercase ${
                    isAmplify ? "text-hud-deep" : "text-steel"
                  }`}
                >
                  {z.range}
                </span>
                {isAmplify && (
                  <span className="flex items-center gap-1.5 bg-hud-deep text-paper-raised px-2.5 py-[5px] font-mono text-[9px] tracking-[0.32em] uppercase">
                    <span className="block h-[6px] w-[6px] bg-paper-raised rotate-45" />
                    Flashback
                  </span>
                )}
              </div>

              {/* Display label */}
              <div
                className={`font-display text-[44px] leading-[1.02] mt-2 px-1 ${
                  isAmplify ? "text-ink" : "text-ink-soft"
                }`}
              >
                {z.label}
              </div>

              {/* Caption */}
              <p
                className={`mt-3 px-1 font-mono text-[10.5px] leading-[1.6] tracking-[0.06em] uppercase max-w-[34ch] ${
                  isAmplify ? "text-ink-soft" : "text-steel/85"
                }`}
              >
                {z.caption}
              </p>

              {/* AMPLIFY: three principles, no box — just inline numbered list */}
              {isAmplify && (
                <ul className="mt-5 px-1 space-y-2 border-l border-hud-deep pl-4">
                  {[
                    "Private by default",
                    "On-device",
                    "Nonautonomous — you stay in control",
                  ].map((text, i) => (
                    <li key={i} className="flex items-baseline gap-3">
                      <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-hud-deep shrink-0">
                        0{i + 1}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ink leading-[1.45]">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CornerMarks() {
  const base =
    "absolute w-[12px] h-[12px] pointer-events-none";
  const corners = [
    { cls: "-top-10 -left-4" },
    { cls: "-top-10 -right-4" },
    { cls: "top-[168px] -left-4" },
    { cls: "top-[168px] -right-4" },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <span key={i} className={`${base} ${c.cls}`} aria-hidden="true">
          <span className="absolute top-1/2 left-0 right-0 h-px bg-ink/60" />
          <span className="absolute left-1/2 top-0 bottom-0 w-px bg-ink/60" />
        </span>
      ))}
    </>
  );
}
