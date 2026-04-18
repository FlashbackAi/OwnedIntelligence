"use client";

/**
 * Flashback Labs — § 02 Manifesto.
 *
 * Editorial argument for personal, on-device AI. Three stanzas in an asymmetric
 * 12-col grid with per-stanza ScrollReveal (words opacity/blur/rotate-scrubbed).
 * A vertical hairline draws itself as you scroll the section.
 */

import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";
import ScrollReveal from "../ui/ScrollReveal";

gsap.registerPlugin(ScrollTrigger);

type Stanza = {
  numeral: string;
  label: string;
  body: ReactNode;
  colStart: 1 | 6;
};

const STANZAS: Stanza[] = [
  {
    numeral: "I",
    label: "THE CLAIM",
    body: (
      <>
        The AI they're building wants{" "}
        <span className="text-hud-deep">your life</span>. Your photos. Your
        messages. Your habits. Your attention. All of it, harvested to be sold
        back to you.
      </>
    ),
    colStart: 1,
  },
  {
    numeral: "II",
    label: "THE PROBLEM",
    body: (
      <>
        Memory is the raw material of{" "}
        <span className="text-hud-deep">agency</span>. When someone else owns
        the record of who you are, they own the terms of what you can become.
      </>
    ),
    colStart: 6,
  },
  {
    numeral: "III",
    label: "THE ANSWER",
    body: (
      <>
        A personal AI that runs entirely on{" "}
        <span className="text-hud-deep">your device</span>. No company server
        holds your memory — it lives encrypted on decentralized storage,
        anchored on-chain, owned by you. It answers to you alone, and leaves
        when you ask it to.
      </>
    ),
    colStart: 1,
  },
];

function Eyebrow({
  numeral,
  label,
  className = "",
}: {
  numeral: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="block h-px w-10 bg-ink/40" aria-hidden="true" />
      <span className="font-mono text-[10.5px] tracking-[0.28em] uppercase text-steel">
        {numeral} · {label}
      </span>
    </div>
  );
}

export default function Manifesto() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (prefersReducedMotion()) {
      const toShow = root.querySelectorAll<HTMLElement>(
        ".manifesto-section-marker, .manifesto-stanza-eyebrow",
      );
      gsap.set(toShow, { opacity: 1, y: 0 });
      const hairline = root.querySelector<HTMLElement>(".manifesto-hairline");
      if (hairline) {
        gsap.set(hairline, { transformOrigin: "top", scaleY: 1 });
      }
      return;
    }

    const triggers: ScrollTrigger[] = [];

    // Section marker — fires once on entry
    const marker = root.querySelector<HTMLElement>(".manifesto-section-marker");
    if (marker) {
      gsap.set(marker, { opacity: 0, y: 8 });
      const t = gsap.to(marker, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root,
          start: "top 85%",
          once: true,
        },
      });
      if (t.scrollTrigger) triggers.push(t.scrollTrigger as ScrollTrigger);
    }

    // Per-stanza eyebrows — fire once, slightly before each stanza's reveal
    const eyebrows = root.querySelectorAll<HTMLElement>(
      ".manifesto-stanza-eyebrow",
    );
    eyebrows.forEach((eb) => {
      const stanza = eb.closest<HTMLElement>(".manifesto-stanza") ?? eb;
      gsap.set(eb, { opacity: 0, y: 8 });
      const t = gsap.to(eb, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: stanza,
          start: "top bottom-=10%",
          once: true,
        },
      });
      if (t.scrollTrigger) triggers.push(t.scrollTrigger as ScrollTrigger);
    });

    // Vertical hairline — scrubbed scaleY draw
    const hairline = root.querySelector<HTMLElement>(".manifesto-hairline");
    if (hairline) {
      gsap.set(hairline, { transformOrigin: "top", scaleY: 0 });
      const t = gsap.fromTo(
        hairline,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );
      if (t.scrollTrigger) triggers.push(t.scrollTrigger as ScrollTrigger);
    }

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="manifesto"
      aria-labelledby="manifesto-heading"
      className="relative w-full bg-paper overflow-hidden"
      style={{ minHeight: "140vh" }}
    >
      <h2 id="manifesto-heading" className="sr-only">
        Manifesto
      </h2>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-grid-hairline opacity-[0.4] pointer-events-none"
      />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-14 pt-12 pb-24">
        <div className="manifesto-section-marker">
          <Eyebrow numeral="§ 02" label="MANIFESTO" />
        </div>

        <div
          aria-hidden="true"
          className="manifesto-hairline absolute top-0 bottom-0 w-px bg-ink/15 pointer-events-none hidden md:block"
          style={{ left: "50%" }}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-12 gap-x-10">
          {STANZAS.map((s, i) => (
            <div
              key={s.numeral}
              className={`manifesto-stanza col-span-1 md:col-span-7 ${
                s.colStart === 1 ? "md:col-start-1" : "md:col-start-6"
              }`}
              style={{ marginTop: i === 0 ? "18vh" : "22vh" }}
            >
              <Eyebrow
                numeral={s.numeral}
                label={s.label}
                className="manifesto-stanza-eyebrow mb-6"
              />
              <ScrollReveal
                baseOpacity={0.12}
                baseRotation={2}
                blurStrength={3}
                enableBlur
                containerClassName="my-0"
                textClassName="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1.35] tracking-[-0.01em] text-ink"
              >
                {s.body}
              </ScrollReveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
