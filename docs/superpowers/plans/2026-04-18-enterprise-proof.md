# § 07 Enterprise Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the § 07 Enterprise Proof section — a compact credibility strip showing four paying client monogram boxes on a `paper-sunk` band, animated in via GSAP ScrollTrigger on scroll entry.

**Architecture:** Single self-contained component `components/sections/EnterpriseProof.tsx` with client data defined inline at module level (consistent with all other sections in the codebase). GSAP + ScrollTrigger handles the reveal animation — same pattern as Products, Principles, and Infrastructure. No new lib files needed.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (token-based), GSAP + ScrollTrigger, `lib/motion.ts` tokens.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `components/sections/EnterpriseProof.tsx` | Full section — data, markup, animation |
| Modify | `app/page.tsx` | Import and mount `<EnterpriseProof />` after `<Infrastructure />` |

---

### Task 1: Create the EnterpriseProof component — static markup only

**Files:**
- Create: `components/sections/EnterpriseProof.tsx`

- [ ] **Step 1: Create the file with client data and static markup (no animation)**

Create `components/sections/EnterpriseProof.tsx` with this full content:

```tsx
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
      // Ensure ink colors are applied immediately.
      boxes.forEach((box) => {
        box.style.borderColor = "var(--color-ink)";
        const mono = box.querySelector<HTMLElement>(".ep-monogram");
        if (mono) mono.style.color = "var(--color-ink)";
      });
      return;
    }

    // ── Initial states ────────────────────────────────────────────────
    gsap.set(sectionMarker, { opacity: 0, y: 8 });
    gsap.set(headline,      { opacity: 0, y: 12 });
    gsap.set(boxes,         { opacity: 0, y: 16 });
    gsap.set(tagline,       { opacity: 0, y: 8 });

    // ── Scroll-triggered reveal ───────────────────────────────────────
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

    // Animate border + monogram color to ink after each box fades in.
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
      tl.scrollTrigger?.kill();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative py-24 md:py-36"
      aria-label="Enterprise clients"
    >
      <div className="mx-auto max-w-[1240px] px-14">
        {/* Section marker */}
        <p className="ep-marker font-mono text-[11px] uppercase tracking-widest text-[var(--color-steel)] mb-4">
          Enterprise // 07
        </p>

        {/* Headline */}
        <h2 className="ep-headline font-mono text-xl md:text-2xl tracking-widest text-[var(--color-ink)] uppercase mb-12">
          Paying Clients // No External Funding
        </h2>

        {/* paper-sunk band */}
        <div className="border-t border-b border-[var(--color-hairline)] bg-[var(--color-paper-sunk)] py-10 mb-10">
          {/* Desktop: single row — Mobile: 2×2 grid */}
          <ul className="flex flex-wrap justify-center gap-8 sm:flex-nowrap sm:gap-6 md:gap-10 list-none p-0 m-0">
            {CLIENTS.map((client) => (
              <li key={client.id} className="flex-shrink-0">
                <div
                  className="ep-box flex flex-col items-center justify-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-paper-raised)] px-4 py-5"
                  style={{ width: 120, height: 96 }}
                >
                  {/* Monogram */}
                  <span
                    className="ep-monogram font-display text-[28px] leading-none text-[var(--color-steel)]"
                    aria-hidden="true"
                  >
                    {client.monogram}
                  </span>
                  {/* Company name */}
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-steel)] text-center leading-tight">
                    {client.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Tagline */}
        <p className="ep-tagline text-center text-sm text-[var(--color-steel)]">
          Revenue-generating from day one. We build what people pay for.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls "components/sections/EnterpriseProof.tsx"
```

Expected: file exists, no error.

- [ ] **Step 3: Commit**

```bash
git add components/sections/EnterpriseProof.tsx
git commit -m "feat: add § 07 EnterpriseProof static component"
```

---

### Task 2: Wire EnterpriseProof into the page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add the import**

In `app/page.tsx`, add after the Infrastructure import line:

```tsx
import EnterpriseProof from "@/components/sections/EnterpriseProof";
```

- [ ] **Step 2: Mount the component**

In the `<main>` JSX, add `<EnterpriseProof />` directly after `<Infrastructure />`:

```tsx
<Infrastructure />
<EnterpriseProof />
```

- [ ] **Step 3: Verify the dev server compiles without errors**

```bash
npm run dev
```

Expected: no TypeScript or compilation errors in the terminal. Visit `http://localhost:3000` and scroll to the section — the band and four boxes should be visible.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire § 07 EnterpriseProof into page"
```

---

### Task 3: Visual verification

- [ ] **Step 1: Open the browser at `http://localhost:3000`**

Scroll down past Infrastructure. Verify:

- [ ] Section label `ENTERPRISE // 07` is visible in mono `steel`
- [ ] Headline `PAYING CLIENTS // NO EXTERNAL FUNDING` is visible in mono `ink`
- [ ] `paper-sunk` band has a visible warm-gray background distinct from the page `paper`
- [ ] Four boxes (`SA`, `IS`, `RQ`, `INK`) are in a single row on desktop, 2×2 on mobile
- [ ] Each box has a white (`paper-raised`) background with a hairline border
- [ ] Tagline sits below the band

- [ ] **Step 2: Verify scroll animation**

Scroll away from the section (so it's out of viewport), then scroll back into view. Verify:

- [ ] Boxes fade and translate up into position with a visible stagger (not all at once)
- [ ] Box borders transition from `hairline` gray to `ink` dark
- [ ] Monograms transition from `steel` to `ink`
- [ ] Animation fires only once (does not replay on re-scroll)

- [ ] **Step 3: Verify reduced-motion**

In browser DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`. Reload and scroll to section. Verify:

- [ ] All elements are immediately visible at full opacity, no translate
- [ ] Borders and monograms are already `ink` colored (no transition)

- [ ] **Step 4: Commit verification checkpoint**

```bash
git add -A
git status
# Should show nothing staged — all changes already committed.
```

---

## Definition of Done

- `EnterpriseProof.tsx` exists and compiles cleanly
- Section renders correctly in the scroll flow after Infrastructure
- Four monogram boxes visible on `paper-sunk` band
- GSAP scroll-entry animation fires once with stagger
- Border + monogram color transitions to `ink` on entry
- `prefers-reduced-motion` respected — instant full-opacity state, ink colors applied
- No pure `#FFFFFF` page background, no drop shadows, no glows — consistent with brand system
