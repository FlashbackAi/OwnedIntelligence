# Manifesto Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build § 02 Manifesto section — three-stanza editorial argument with GSAP scroll-scrubbed reveals, asymmetric 12-col layout, and subtle HUD accents. Mounts after `<Hero />` in `app/page.tsx`.

**Architecture:** One section component (`Manifesto.tsx`) composed of three stanzas plus a scroll-drawn vertical hairline. Reuses React Bits `ScrollReveal` (extended to preserve inline span children) for per-word opacity/blur/rotation reveal. Eyebrows and hairline use separate one-shot / scrubbed GSAP ScrollTrigger animations. Respects `prefers-reduced-motion` by snapping to final state and skipping trigger registration.

**Tech Stack:** Next.js 16 (app dir), React 19, TypeScript, Tailwind v4, GSAP 3.15 + ScrollTrigger (already installed), existing `lib/motion.ts` reduced-motion helper.

**Spec reference:** [docs/superpowers/specs/2026-04-18-manifesto-section-design.md](../specs/2026-04-18-manifesto-section-design.md)

**Testing strategy:** This is a visual/motion feature. No unit tests — verification is manual via the Playwright MCP browser after each task: (a) load `http://localhost:3000`, (b) scroll into the section, (c) confirm the expected visual behavior. If Playwright MCP is unavailable, run `npm run dev` and verify in a browser manually.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `components/ui/ScrollReveal.tsx` (new) | Scroll-driven per-word opacity/blur/rotation reveal. Extended from React Bits to walk React children and preserve inline `<span>` elements (so HUD-accent spans survive word-splitting). |
| `components/sections/Manifesto.tsx` (new) | The section itself: section marker, three stanzas with eyebrows, vertical hairline, background grid. Owns eyebrow + hairline + marker GSAP animations. |
| `app/page.tsx` (modify) | Mount `<Manifesto />` after `<Hero />`. |

---

## Task 1: Create ScrollReveal component with React-children support

**Files:**
- Create: `components/ui/ScrollReveal.tsx`

- [ ] **Step 1: Create the component file**

Create `components/ui/ScrollReveal.tsx` with the following content. This extends the React Bits original: instead of `splitText` only handling `typeof children === 'string'`, it recursively walks React children and splits any string child into word-spans while preserving inline elements (e.g. `<span className="text-hud-deep">your life</span>`).

```tsx
"use client";

/**
 * Flashback Labs — ScrollReveal.
 *
 * Scroll-driven per-word reveal. Based on React Bits ScrollReveal, extended to
 * accept React children (not just strings). Inline elements like <span> are
 * preserved — their internal text is still split into word-spans, so the blur
 * + opacity + stagger animation applies to their words too, and the element's
 * own styling (e.g. text-hud-deep) is kept.
 */

import {
  useEffect,
  useRef,
  useMemo,
  Children,
  isValidElement,
  cloneElement,
  type ReactNode,
  type RefObject,
  type ReactElement,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

let wordKey = 0;
function splitStringToWords(text: string): ReactNode[] {
  return text.split(/(\s+)/).map((chunk) => {
    if (chunk.match(/^\s+$/)) return chunk;
    return (
      <span className="inline-block word" key={`w-${wordKey++}`}>
        {chunk}
      </span>
    );
  });
}

function splitChildren(node: ReactNode): ReactNode {
  if (typeof node === "string") return splitStringToWords(node);
  if (Array.isArray(node)) return node.map((c) => splitChildren(c));
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    return cloneElement(el, {
      children: splitChildren(el.props.children),
    });
  }
  return node;
}

export default function ScrollReveal({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = "",
  textClassName = "",
  rotationEnd = "bottom bottom",
  wordAnimationEnd = "bottom bottom",
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitContent = useMemo(() => splitChildren(children), [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      // Snap to final state
      gsap.set(el, { rotate: 0 });
      const words = el.querySelectorAll<HTMLElement>(".word");
      gsap.set(words, { opacity: 1, filter: "blur(0px)" });
      return;
    }

    const scroller =
      scrollContainerRef && scrollContainerRef.current
        ? scrollContainerRef.current
        : window;

    const triggers: ScrollTrigger[] = [];

    const rotationTween = gsap.fromTo(
      el,
      { transformOrigin: "0% 50%", rotate: baseRotation },
      {
        ease: "none",
        rotate: 0,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: "top bottom",
          end: rotationEnd,
          scrub: true,
        },
      },
    );
    if (rotationTween.scrollTrigger) triggers.push(rotationTween.scrollTrigger);

    const wordElements = el.querySelectorAll<HTMLElement>(".word");

    const opacityTween = gsap.fromTo(
      wordElements,
      { opacity: baseOpacity, willChange: "opacity" },
      {
        ease: "none",
        opacity: 1,
        stagger: 0.05,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: "top bottom-=20%",
          end: wordAnimationEnd,
          scrub: true,
        },
      },
    );
    if (opacityTween.scrollTrigger) triggers.push(opacityTween.scrollTrigger);

    if (enableBlur) {
      const blurTween = gsap.fromTo(
        wordElements,
        { filter: `blur(${blurStrength}px)` },
        {
          ease: "none",
          filter: "blur(0px)",
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: "top bottom-=20%",
            end: wordAnimationEnd,
            scrub: true,
          },
        },
      );
      if (blurTween.scrollTrigger) triggers.push(blurTween.scrollTrigger);
    }

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [
    scrollContainerRef,
    enableBlur,
    baseRotation,
    baseOpacity,
    rotationEnd,
    wordAnimationEnd,
    blurStrength,
  ]);

  return (
    <h2 ref={containerRef} className={containerClassName}>
      <p className={textClassName}>{splitContent}</p>
    </h2>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors referencing `components/ui/ScrollReveal.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/ScrollReveal.tsx
git commit -m "Add ScrollReveal with React-children support for inline spans"
```

---

## Task 2: Scaffold Manifesto section (static — no motion yet)

**Files:**
- Create: `components/sections/Manifesto.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create the static Manifesto component**

Create `components/sections/Manifesto.tsx`:

```tsx
"use client";

/**
 * Flashback Labs — § 02 Manifesto.
 *
 * Editorial argument for personal, on-device AI. Three stanzas in an asymmetric
 * 12-col grid with per-stanza ScrollReveal (words opacity/blur/rotate-scrubbed).
 * A vertical hairline draws itself as you scroll the section.
 */

import ScrollReveal from "../ui/ScrollReveal";

type Stanza = {
  numeral: string; // "I", "II", "III"
  label: string;   // "THE CLAIM"
  body: React.ReactNode;
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
  return (
    <section
      id="manifesto"
      aria-labelledby="manifesto-heading"
      className="relative w-full bg-paper overflow-hidden"
      style={{ minHeight: "140vh" }}
    >
      <h2 id="manifesto-heading" className="sr-only">
        Manifesto
      </h2>

      {/* Hairline dotted grid background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-grid-hairline opacity-[0.4] pointer-events-none"
      />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-14 pt-12 pb-24">
        {/* Section marker */}
        <div className="manifesto-section-marker">
          <Eyebrow numeral="§ 02" label="MANIFESTO" />
        </div>

        {/* Vertical hairline — positioned at the col-6/7 gutter */}
        <div
          aria-hidden="true"
          className="manifesto-hairline absolute top-0 bottom-0 w-px bg-ink/15 pointer-events-none hidden md:block"
          style={{ left: "50%" }}
        />

        {/* Stanzas */}
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
              <blockquote className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1.35] tracking-[-0.01em] text-ink">
                {s.body}
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Mount in app/page.tsx**

Edit `app/page.tsx`:

```tsx
import Nav from "@/components/ui/Nav";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Nav />
      <Hero />
      <Manifesto />
    </main>
  );
}
```

- [ ] **Step 3: Start dev server (if not already running)**

Run: `npm run dev`
Expected: Next.js starts on http://localhost:3000.

- [ ] **Step 4: Visual verification**

Open http://localhost:3000 (via Playwright MCP `browser_navigate` + `browser_snapshot`, or in a browser tab). Scroll past Hero.

Expected:
- Section marker `§ 02 · MANIFESTO` top-left inside a 1280px container.
- Three stanzas visible. Stanza I and III aligned left (col 1–7), stanza II offset right (col 6–12).
- Each stanza has a mono eyebrow `I · THE CLAIM` / `II · THE PROBLEM` / `III · THE ANSWER` above the display-font body.
- One phrase in each stanza (`your life` / `agency` / `your device`) renders in cyan (`#0369a1`).
- Faint dotted grid visible behind the section.
- Vertical 1px hairline at the horizontal center, running the section height.

If anything is off (misalignment, missing HUD accent, wrong color), fix before moving on.

- [ ] **Step 5: Commit**

```bash
git add components/sections/Manifesto.tsx app/page.tsx
git commit -m "Scaffold § 02 Manifesto section (static layout)"
```

---

## Task 3: Wire ScrollReveal into the stanzas

**Files:**
- Modify: `components/sections/Manifesto.tsx`

- [ ] **Step 1: Replace the static `<blockquote>` with ScrollReveal**

Change the stanza rendering block in `components/sections/Manifesto.tsx`. Replace:

```tsx
<blockquote className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1.35] tracking-[-0.01em] text-ink">
  {s.body}
</blockquote>
```

With:

```tsx
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
```

(ScrollReveal renders an `<h2>` + `<p>`. We already have a visually-hidden `<h2 id="manifesto-heading">` at the section level; a second non-hidden `<h2>` per stanza is acceptable semantically as each stanza *is* a distinct heading-less quote block, but for stricter semantics we accept it as a heading-labeled reveal wrapper. No change needed.)

- [ ] **Step 2: Visual verification**

Refresh http://localhost:3000. Scroll into § 02.

Expected:
- Each stanza starts faint (`opacity: 0.12`), slightly blurred, slightly rotated (2°).
- As the stanza enters viewport and you keep scrolling, words de-blur and gain opacity in a left-to-right stagger.
- By the time the stanza's bottom hits the viewport bottom, all words are fully visible, unblurred, and the stanza has rotated to 0°.
- Scrolling back up reverses the effect (scrubbed behavior).

- [ ] **Step 3: Commit**

```bash
git add components/sections/Manifesto.tsx
git commit -m "Wire ScrollReveal into Manifesto stanzas"
```

---

## Task 4: Animate eyebrows and section marker

**Files:**
- Modify: `components/sections/Manifesto.tsx`

- [ ] **Step 1: Add GSAP eyebrow + section-marker animations**

Add imports at the top of `components/sections/Manifesto.tsx`:

```tsx
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);
```

Inside `export default function Manifesto()`, before the `return`, add:

```tsx
const rootRef = useRef<HTMLElement>(null);

useLayoutEffect(() => {
  const root = rootRef.current;
  if (!root) return;

  if (prefersReducedMotion()) {
    // Snap all driven elements to final state
    const toShow = root.querySelectorAll<HTMLElement>(
      ".manifesto-section-marker, .manifesto-stanza-eyebrow",
    );
    gsap.set(toShow, { opacity: 1, y: 0 });
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
    if (t.scrollTrigger) triggers.push(t.scrollTrigger);
  }

  // Per-stanza eyebrows — fire once, slightly before the stanza reveal
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
    if (t.scrollTrigger) triggers.push(t.scrollTrigger);
  });

  return () => {
    triggers.forEach((t) => t.kill());
  };
}, []);
```

Attach the ref to the section: change `<section ...>` to `<section ref={rootRef} ...>`.

- [ ] **Step 2: Visual verification**

Refresh the page. Scroll slowly into § 02.

Expected:
- Section marker `§ 02 · MANIFESTO` starts invisible, fades + slides up into place when the section is ~85% into view.
- Each stanza eyebrow starts invisible, fades + slides up just before that stanza's words begin to reveal.
- Scrolling back up and down again does NOT replay the fade (once: true). The words still scrub (that's ScrollReveal, not this).

- [ ] **Step 3: Commit**

```bash
git add components/sections/Manifesto.tsx
git commit -m "Add entry animations for Manifesto marker + eyebrows"
```

---

## Task 5: Draw the vertical hairline on scroll

**Files:**
- Modify: `components/sections/Manifesto.tsx`

- [ ] **Step 1: Add the hairline ScrollTrigger**

In the same `useLayoutEffect` inside `components/sections/Manifesto.tsx`, before the `return () => …` cleanup, add:

```tsx
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
  if (t.scrollTrigger) triggers.push(t.scrollTrigger);
}
```

Also update the reduced-motion branch to snap the hairline:

```tsx
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
```

- [ ] **Step 2: Visual verification**

Refresh. Scroll slowly through the entire section.

Expected:
- Hairline starts at height 0 (invisible) when the section top is below the viewport bottom.
- As you scroll, the hairline grows downward (transform-origin top) in direct proportion to scroll position.
- At the moment the section's bottom hits the viewport bottom, the hairline is at full height.
- Scrolling back up retracts it (scrubbed).

- [ ] **Step 3: Commit**

```bash
git add components/sections/Manifesto.tsx
git commit -m "Scroll-scrubbed draw for Manifesto vertical hairline"
```

---

## Task 6: Reduced-motion verification

**Files:** (no code changes — verification only)

- [ ] **Step 1: Enable reduced motion in the browser**

In DevTools → Rendering panel → "Emulate CSS media feature prefers-reduced-motion" → set to `reduce`. (Or OS-level setting on Windows: Settings → Accessibility → Visual effects → turn off Animation effects, then hard-refresh the tab.)

- [ ] **Step 2: Visual verification**

Reload http://localhost:3000. Scroll through § 02.

Expected:
- All stanzas fully opaque, unblurred, no rotation, immediately on first paint.
- Section marker and stanza eyebrows fully visible on first paint (no entry fade).
- Vertical hairline at full height on first paint.
- No animations trigger as you scroll.

- [ ] **Step 3: Disable reduced motion and verify normal behavior still works**

Turn emulation back to "No preference" and reload. Confirm the full animated behavior from Tasks 3–5 still works.

- [ ] **Step 4: No commit needed** unless verification uncovered a bug. If a bug was found, fix it, retest both modes, then commit with message `Fix: <what>`.

---

## Task 7: Responsive check

**Files:** (no code changes unless a bug is found)

- [ ] **Step 1: Resize the browser to 375px wide (mobile)**

In DevTools → Toggle device toolbar → iPhone SE (375×667) or custom 375px.

Expected:
- The `md:` grid classes disable; every stanza becomes full-width (`col-span-1`).
- The vertical hairline is hidden (`hidden md:block`).
- Eyebrows, stanzas, section marker all stack and remain readable.
- ScrollReveal still animates per-word.

- [ ] **Step 2: Resize to 1024px (tablet / md breakpoint)**

Expected: asymmetric layout reappears, hairline appears, stanzas at col-span-7 with correct offsets.

- [ ] **Step 3: Resize to 1920px (large desktop)**

Expected: container clamps to `max-w-[1280px]`, generous left/right gutters, layout holds.

- [ ] **Step 4: If any responsive bug was found, fix and commit**

```bash
git add components/sections/Manifesto.tsx
git commit -m "Fix: <specific responsive issue>"
```

---

## Task 8: Final polish pass

**Files:** `components/sections/Manifesto.tsx` (if adjustments needed)

- [ ] **Step 1: Read the section in context**

Open http://localhost:3000 fresh. Scroll from top (Hero) into Manifesto at a natural reading pace.

Evaluate:
- Does § 02's first stanza land at a comfortable vertical distance from Hero's bottom? If too tight, increase first-stanza `marginTop` to `22vh`. If too loose, reduce to `14vh`.
- Does the HUD cyan on `your life` / `agency` / `your device` feel too strong, too weak, or right? If too weak, swap `text-hud-deep` → `text-hud` (brighter cyan, `#0891b2`). If too strong, no change — `text-hud-deep` is the restrained choice by design.
- Does the stanza font size read too large next to Hero? If yes, cap the clamp at `2.4rem` instead of `2.6rem`.

- [ ] **Step 2: Run type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean. Fix any errors that reference files created/modified by this plan.

- [ ] **Step 3: Final commit (if any adjustments)**

```bash
git add components/sections/Manifesto.tsx
git commit -m "Polish Manifesto spacing/typography"
```

Otherwise skip.

---

## Done criteria

- § 02 renders after Hero on `/`.
- Three stanzas with correct copy, asymmetric layout, HUD accents.
- ScrollReveal scrubs each stanza per word (opacity + blur + rotation).
- Eyebrows and section marker fade in once on entry.
- Vertical hairline draws on scroll.
- Reduced-motion snaps everything to final state with no ScrollTrigger registration.
- Responsive at 375 / 1024 / 1920.
- No TS or lint errors.
