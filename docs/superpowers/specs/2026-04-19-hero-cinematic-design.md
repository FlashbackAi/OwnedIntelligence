# HeroCinematic — design

**Date:** 2026-04-19
**Status:** Approved, ready for implementation
**Purpose:** Alternate hero variant built alongside the current `Hero` so we can A/B pick one. Current `Hero` stays untouched.

## Context

Current [components/sections/Hero.tsx](../../../components/sections/Hero.tsx) is a split layout: headline/sub/CTAs on the left, `<ArcReactor size={520} />` on the right, paper background. This new variant is a centered, cinematic restatement of the same message.

## Preview wiring

- New file: `components/sections/HeroCinematic.tsx`
- Manual swap: in [app/page.tsx](../../../app/page.tsx), replace `<Hero />` with `<HeroCinematic />` to preview. Both files coexist until a winner is chosen.

## Layout

- Full-viewport `<section>`, center-stacked.
- Reactor absolute-centered behind text (`z-10`).
- Text column centered, `max-w-[720px]`, `text-center`: byline eyebrow → headline → sub → CTA row.
- Same copy as current Hero (headline, sub, both CTAs).
- Same dotted hairline grid (appears after bg transitions to paper).

## On-load cinematic

Single anime.js timeline, autoplay on mount.

| t (ms) | Event |
|--------|-------|
| 0 | Section renders with `bg-ink` (solid black). `<ArcReactor size={900}>` centered, CSS `scale(1.15)`. Reactor's own boot animation plays (owned by `ArcReactor`). Text hidden. Grid hidden. |
| 1600 | Reactor wrapper eases from `scale(1.15)` → `scale(1)`, duration 900ms, ease `outExpo`. |
| 2200 | Background crossfades `bg-ink` → `bg-paper`, duration 600ms. Grid fades in alongside. |
| 2600 | Byline eyebrow fades/translates in. |
| 2650 | Headline word-stagger (reuse current Hero's anim: `translateY: [36,0]`, stagger 42ms, `outExpo` 950ms). |
| ~3900 | HUD underline draws under "you." (`scaleX: [0,1]`, 600ms). |
| ~4050 | Sub + CTA row fade/translate in. |

**Reduced motion:** skip cinematic entirely — render final state (paper bg, reactor at rest size, text visible, underline drawn).

## Scroll parallax (post-cinematic, above-the-fold)

Plain `window.scroll` listener throttled via `requestAnimationFrame`. Only active while section is in viewport.

- Reactor wrapper: `translateY(scrollY * 0.35)` — recedes.
- Headline block: `translateY(scrollY * -0.15)` — comes forward.
- Sub + CTA: `translateY(scrollY * -0.08)`.

No GSAP ScrollTrigger; this is above-the-fold only so a simple scroll listener suffices.

## Stacking

- z-0: background color layer + hairline grid
- z-10: reactor
- z-20: text stack (byline, headline, sub, CTAs)

CTAs keep `pointer-events-auto`. Reactor has `pointer-events: none` so it doesn't block clicks.

## Legibility

Headline sits primarily above the reactor's bright center. Start without a mask. If overlap reads poorly in browser, add a subtle paper radial-gradient behind the text column.

## Out of scope

- No changes to `ArcReactor`, `Nav`, or any other section.
- No route changes; preview is via manual swap in `app/page.tsx`.
- No persistence/flag system; this is a design-decision phase only.
