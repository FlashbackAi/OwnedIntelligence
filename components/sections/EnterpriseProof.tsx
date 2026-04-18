"use client";

/**
 * Flashback Labs — § 07 Enterprise Proof.
 *
 * Compact credibility strip. Mono headline + paper-sunk band with four
 * monogram-box placeholders (SA / IS / RQ / INK). On scroll entry each
 * box fades and translates in with a stagger; box border and monogram
 * transition from hairline/steel → ink.
 *
 * Placeholder boxes are designed to swap for real SVG logos with a
 * one-line change per client entry.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Client = {
  id: string;
  monogram: string;
  name: string;
};

const CLIENTS: Client[] = [
  { id: "stevie",       monogram: "SA",  name: "Stevie Awards" },
  { id: "imageshield",  monogram: "IS",  name: "ImageShield"   },
  { id: "reqsy",        monogram: "RQ",  name: "Reqsy"         },
  { id: "ink",          monogram: "INK", name: "Ink"           },
];

export default function EnterpriseProof() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sectionMarker = root.querySelector<HTMLElement>(".ep-marker");
    const headline      = root.querySelector<HTMLElement>(".ep-headline");
    const boxes         = root.querySelectorAll<HTMLElement>(".ep-box");
    const tagline       = root.querySelector<HTMLElement>(".ep-tagline");

    if (prefersReducedMotion()) {
      gsap.set([sectionMarker, headline, ...boxes, tagline].filter(Boolean), {
        opacity: 1,
        y: 0,
      });
      boxes.forEach((box) => {
        box.style.borderColor = "var(--color-ink)";
        const mono = box.querySelector<HTMLElement>(".ep-monogram");
        if (mono) mono.style.color = "var(--color-ink)";
      });
      return;
    }

    gsap.set(sectionMarker, { opacity: 0, y: 8 });
    gsap.set(headline,      { opacity: 0, y: 12 });
    gsap.set(boxes,         { opacity: 0, y: 16 });
    if (tagline) gsap.set(tagline,       { opacity: 0, y: 8 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top 78%", once: true },
      defaults: { ease: "power3.out" },
    });

    tl.to(sectionMarker, { opacity: 1, y: 0, duration: 0.45 }, 0)
      .to(headline,      { opacity: 1, y: 0, duration: 0.55 }, 0.1)
      .to(boxes, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
        }, 0.22)
      .to(tagline, { opacity: 1, y: 0, duration: 0.45 }, 0.62);

    boxes.forEach((box, i) => {
      const mono = box.querySelector<HTMLElement>(".ep-monogram");
      tl.to(
        box,
        { borderColor: "var(--color-ink)", duration: 0.35, ease: "power2.out" },
        0.32 + i * 0.1,
      );
      if (mono) {
        tl.to(
          mono,
          { color: "var(--color-ink)", duration: 0.35, ease: "power2.out" },
          0.32 + i * 0.1,
        );
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative py-24 md:py-36"
      aria-labelledby="enterprise-heading"
    >
      <div className="mx-auto max-w-[1240px] px-14">
        <p className="ep-marker font-mono text-[11px] uppercase tracking-widest text-[var(--color-steel)] mb-4">
          Enterprise // 07
        </p>

        <h2 id="enterprise-heading" className="ep-headline font-mono text-xl md:text-2xl tracking-widest text-[var(--color-ink)] uppercase mb-12">
          Paying Clients // No External Funding
        </h2>

        <div className="border-t border-b border-[var(--color-hairline)] bg-[var(--color-paper-sunk)] py-10 mb-10">
          <ul className="flex flex-wrap justify-center gap-8 sm:flex-nowrap sm:gap-6 md:gap-10 list-none p-0 m-0">
            {CLIENTS.map((client) => (
              <li key={client.id} className="basis-[calc(50%-1rem)] sm:basis-auto flex-shrink-0 flex justify-center">
                <div
                  className="ep-box flex flex-col items-center justify-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-paper-raised)] px-4 py-5"
                  style={{ width: 120, height: 96 }}
                >
                  <span
                    className="ep-monogram font-display text-[28px] leading-none text-[var(--color-steel)]"
                    aria-hidden="true"
                  >
                    {client.monogram}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-steel)] text-center leading-tight">
                    {client.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="ep-tagline text-center text-sm text-[var(--color-steel)]">
          Revenue-generating from day one. We build what people pay for.
        </p>
      </div>
    </section>
  );
}
