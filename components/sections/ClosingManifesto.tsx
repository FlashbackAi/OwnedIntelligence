"use client";

/**
 * Flashback Labs — § 10 Closing Manifesto.
 *
 * Full-viewport editorial closer. Words are pre-split into spans (same
 * structure as v1) and animated with the scroll-scrubbed blur + opacity
 * reveal from § 02 (ScrollReveal). After the text is fully scrolled in a
 * one-shot ScrollTrigger fires:
 *   - "obsolete." flickers to GlitchGoblin for ~80ms, then a hotrod
 *     strikethrough line draws across it (scaleX 0→1).
 *   - "more capable." simultaneously transitions to gold.
 * Sign-off and CTAs fade in on section entry.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const S1_WORDS   = ["We", "are", "not", "building", "a", "future", "where", "humans", "become"];
const OBSOLETE   = "obsolete.";
const S2_WORDS   = ["We", "are", "building", "a", "future", "where", "humans", "become"];
const GOLD_WORDS = ["more", "capable."];

export default function ClosingManifesto() {
  const rootRef    = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const signoffRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root    = rootRef.current;
    const heading = headingRef.current;
    const signoff = signoffRef.current;
    if (!root || !heading || !signoff) return;

    const allWords   = root.querySelectorAll<HTMLElement>(".cm-word");
    const obsoleteEl = root.querySelector<HTMLElement>(".cm-obsolete");
    const strikeEl   = root.querySelector<HTMLElement>(".cm-strike");
    const goldEl     = root.querySelector<HTMLElement>(".cm-gold");

    const reduced = prefersReducedMotion();

    if (reduced) {
      gsap.set(allWords, { opacity: 1, filter: "blur(0px)" });
      gsap.set(heading,  { rotate: 0 });
      gsap.set(signoff,  { opacity: 1, y: 0 });
      if (strikeEl) gsap.set(strikeEl, { scaleX: 1 });
      if (goldEl)   gsap.set(goldEl,   { color: "#8b6914" });
      return;
    }

    const triggers: ScrollTrigger[] = [];

    // ── 1. Container rotation — scrubbed, matches ScrollReveal ──────
    const rotTween = gsap.fromTo(
      heading,
      { transformOrigin: "0% 50%", rotate: 2 },
      {
        ease: "none",
        rotate: 0,
        scrollTrigger: {
          trigger: heading,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      },
    );
    if (rotTween.scrollTrigger) triggers.push(rotTween.scrollTrigger as ScrollTrigger);

    // ── 2. Per-word opacity — scrubbed ───────────────────────────────
    const opTween = gsap.fromTo(
      allWords,
      { opacity: 0.12, willChange: "opacity" },
      {
        ease: "none",
        opacity: 1,
        stagger: 0.05,
        scrollTrigger: {
          trigger: heading,
          start: "top bottom-=20%",
          end: "bottom bottom",
          scrub: true,
        },
      },
    );
    if (opTween.scrollTrigger) triggers.push(opTween.scrollTrigger as ScrollTrigger);

    // ── 3. Per-word blur — scrubbed ──────────────────────────────────
    const blurTween = gsap.fromTo(
      allWords,
      { filter: "blur(3px)" },
      {
        ease: "none",
        filter: "blur(0px)",
        stagger: 0.05,
        scrollTrigger: {
          trigger: heading,
          start: "top bottom-=20%",
          end: "bottom bottom",
          scrub: true,
        },
      },
    );
    if (blurTween.scrollTrigger) triggers.push(blurTween.scrollTrigger as ScrollTrigger);

    // ── 4. Sign-off fades in on section entry ────────────────────────
    gsap.set(signoff, { opacity: 0, y: 12 });
    const entryTl = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top 75%", once: true },
    });
    entryTl.to(signoff, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" });
    if (entryTl.scrollTrigger) triggers.push(entryTl.scrollTrigger as ScrollTrigger);

    // ── 5. Post-reveal: strikethrough + glitch + gold ────────────────
    // Fires once when section centre hits mid-viewport — reliable for
    // min-h-screen sections where "bottom 80%" would arrive too late.
    if (strikeEl) gsap.set(strikeEl, { scaleX: 0, transformOrigin: "left center" });

    const effectTl = gsap.timeline({
      scrollTrigger: { trigger: root, start: "center 65%", once: true },
    });

    effectTl.call(() => {
      if (!obsoleteEl) return;
      obsoleteEl.style.fontFamily = "var(--font-accent), monospace";
      const id = setTimeout(() => {
        if (obsoleteEl) obsoleteEl.style.fontFamily = "";
      }, 80);
      (obsoleteEl as HTMLElement & { _gt?: ReturnType<typeof setTimeout> })._gt = id;
    });

    if (strikeEl) {
      effectTl.to(strikeEl, { scaleX: 1, duration: 0.45, ease: "power2.inOut" }, 0.08);
    }

    if (goldEl) {
      // Use hex directly — GSAP cannot interpolate CSS custom properties in color.
      effectTl.to(goldEl, { color: "#8b6914", duration: 0.55, ease: "power2.out" }, 0.08);
    }

    if (effectTl.scrollTrigger) triggers.push(effectTl.scrollTrigger as ScrollTrigger);

    return () => {
      triggers.forEach((t) => t.kill());
      const el = obsoleteEl as (HTMLElement & { _gt?: ReturnType<typeof setTimeout> }) | null;
      if (el?._gt) clearTimeout(el._gt);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="closing"
      aria-labelledby="closing-heading"
      className="relative w-full bg-paper min-h-screen flex items-center justify-center"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-grid-hairline opacity-[0.3] pointer-events-none"
      />
      <div aria-hidden="true" className="absolute top-0 inset-x-0 h-px bg-hairline" />

      <div className="relative mx-auto max-w-180 px-6 md:px-10 py-24 text-center">

        {/* Section marker */}
        <div className="flex items-center justify-center gap-4 mb-20">
          <span className="block h-px w-10 bg-ink/40" aria-hidden="true" />
          <span className="font-mono text-[10.5px] tracking-[0.28em] uppercase text-steel">
            § 10 · CLOSING
          </span>
          <span className="block h-px w-10 bg-ink/40" aria-hidden="true" />
        </div>

        {/* Editorial headline */}
        <h2
          id="closing-heading"
          ref={headingRef}
          className="font-display text-ink leading-[1.28] tracking-[-0.015em] text-[clamp(1.9rem,4.2vw,3.1rem)]"
          aria-label="We are not building a future where humans become obsolete. We are building a future where humans become more capable."
        >
          {/* Sentence 1 */}
          <span className="block mb-[0.5em]" aria-hidden="true">
            {S1_WORDS.map((word, i) => (
              <span key={`s1-${i}`} className="cm-word inline-block mr-[0.28em]">
                {word}
              </span>
            ))}
            <span className="cm-word cm-obsolete relative inline-block">
              {OBSOLETE}
              <span
                className="cm-strike absolute left-0 right-0 bg-hotrod pointer-events-none"
                aria-hidden="true"
                style={{ top: "55%", height: "2px" }}
              />
            </span>
          </span>

          {/* Sentence 2 */}
          <span className="block" aria-hidden="true">
            {S2_WORDS.map((word, i) => (
              <span key={`s2-${i}`} className="cm-word inline-block mr-[0.28em]">
                {word}
              </span>
            ))}
            <span className="cm-gold">
              {GOLD_WORDS.map((word, i) => (
                <span
                  key={`gold-${i}`}
                  className={`cm-word inline-block${i < GOLD_WORDS.length - 1 ? " mr-[0.28em]" : ""}`}
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
        </h2>

        {/* Sign-off + CTAs */}
        <div ref={signoffRef} className="mt-16">
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-steel">
            — FLASHBACK LABS
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a
              href="#"
              className="inline-flex items-center justify-center px-7 py-3 rounded-[4px] bg-hotrod text-paper-raised font-mono text-[12px] tracking-[0.12em] uppercase hover:bg-hotrod-deep transition-colors duration-220"
            >
              Get Flashback AI
            </a>
            <a
              href="mailto:contact@flashbacklabs.com"
              className="font-mono text-[12px] tracking-[0.12em] text-steel hover:text-ink transition-colors duration-220"
            >
              contact@flashbacklabs.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
