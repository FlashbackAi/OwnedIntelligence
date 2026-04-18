# Manifesto Section — Design Spec

**Date:** 2026-04-18
**Section:** § 02 · Manifesto (follows Hero in `app/page.tsx`)
**Status:** Approved for implementation planning

## Purpose

The second section of the Flashback Labs landing page. Makes the editorial argument for why a personal, on-device AI matters, framed as **Extraction vs. Ownership**. Sets up the product thesis before any feature/product content. Functions as a teaser for the fuller `/manifesto` page (not built yet — existing Hero secondary CTA already links there).

## Copy

Three stanzas. Eyebrow = roman numeral + uppercase label (mirrors Hero `FLASHBACK LABS` mono eyebrow treatment).

**I · THE CLAIM**
> The AI they're building wants your life. Your photos. Your messages. Your habits. Your attention. All of it, harvested to be sold back to you.

**II · THE PROBLEM**
> Memory is the raw material of agency. When someone else owns the record of who you are, they own the terms of what you can become.

**III · THE ANSWER**
> A personal AI that runs entirely on your device. No company server holds your memory — it lives encrypted on decentralized storage, anchored on-chain, owned by you. It answers to you alone, and leaves when you ask it to.

**Per-stanza HUD accent.** One phrase per stanza rendered in `text-hud-deep` (`var(--color-hud-deep)` = `#0369a1`):
- I: **your life**
- II: **agency**
- III: **your device**

Restrained — echoes the cyan underline under "you." in Hero without reusing the same device.

## Structure

- Root: `<section id="manifesto" aria-labelledby="manifesto-heading">`, `bg-paper`, full-width, min-height `~140vh` (gives scroll room for ScrollReveal scrubbing).
- Container: same as Hero — `max-w-[1280px] mx-auto px-6 md:px-14`.
- Grid: `grid-cols-1 md:grid-cols-12`, asymmetric stanza offsets:
  - **I** → `md:col-span-7 md:col-start-1`
  - **II** → `md:col-span-7 md:col-start-6`
  - **III** → `md:col-span-7 md:col-start-1`
- Vertical spacing between stanzas: `mt-[22vh]` (first stanza `mt-[18vh]` from section top).
- Section marker top-left, inside container, `mt-12`: `§ 02 / MANIFESTO`, font-mono 10.5px, `tracking-[0.28em] uppercase text-steel`, preceded by a `w-10 h-px bg-ink/40` dash (same pattern as Hero byline).
- Visually-hidden `<h2 id="manifesto-heading" class="sr-only">Manifesto</h2>` for a11y.
- Each stanza wrapped in `<blockquote>` (semantic — these are authored manifesto statements).
- Per-stanza eyebrow above the blockquote, same mono/dash treatment as the section marker, 24px (`mb-6`) spacing to the stanza body.

### Decorative elements

- **Hairline grid background**: `<div class="absolute inset-0 bg-grid-hairline opacity-[0.4] pointer-events-none">` — same utility as Hero, at slightly lower opacity to differentiate.
- **Vertical hairline**: single 1px column running full section height at the col-6/7 gutter (approx `left: calc(50% - 1px)` within the grid, or positioned via a 12-col grid child spanning col-7). `bg-ink/15`. Draws itself scrubbed on scroll (see Motion).

## Typography

- **Stanza body**: `font-display`, `text-[clamp(1.6rem,3.4vw,2.6rem)]`, `leading-[1.35]`, `tracking-[-0.01em]`, `text-ink`. Below Hero headline scale (which is `clamp(2.4rem,5.5vw,4.5rem)`) so Hero stays dominant.
- **Eyebrows** (section + per-stanza): `font-mono text-[10.5px] tracking-[0.28em] uppercase text-steel`, preceded by `w-10 h-px bg-ink/40` horizontal dash + `gap-4`.
- **HUD accent word**: wrap target phrase in `<span class="text-hud-deep">…</span>` inline within the stanza body.

## Motion

### ScrollReveal (per stanza)

Integrate the React Bits `ScrollReveal` component verbatim at `components/ui/ScrollReveal.tsx`. Props per stanza:

```tsx
<ScrollReveal
  baseOpacity={0.12}
  baseRotation={2}
  blurStrength={3}
  enableBlur
  containerClassName="manifesto-stanza"
  textClassName="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1.35] tracking-[-0.01em] text-ink"
>
  {stanza text}
</ScrollReveal>
```

Rationale for reduced rotation (2° vs. library default 3°): Flashback's voice is composed/editorial, not kinetic.

**Note on HUD accent spans:** ScrollReveal's `splitText` only handles `typeof children === 'string'`. Inline `<span>` children would be dropped. We have two options; pick during implementation:
1. Fork/extend ScrollReveal to walk React children preserving spans (cleanest, keeps HUD highlight).
2. Achieve the accent color via CSS — apply a modifier class to the stanza and target specific word positions with `:nth-child`. Brittle.
3. Drop the per-stanza HUD accent for v1. Acceptable — stanzas still carry their weight without it.

Recommended: **option 1**. Small, contained change; we own the fork.

### Eyebrow motion

For each stanza eyebrow (section marker uses the same pattern):
- GSAP `fromTo` with ScrollTrigger tied to the same stanza element.
- `opacity: [0, 1]`, `translateY: [8, 0]`, `duration: 0.6s`, `ease: power3.out`.
- Trigger: `start: "top bottom-=10%"`, **not scrubbed** — fires once and completes, so the eyebrow reads as a label before the words animate.
- Fires ~150ms before the stanza word reveal begins (achieved naturally by the earlier trigger start).

### Vertical hairline

- GSAP `fromTo` on the hairline `<div>`: `scaleY: 0 → 1`, `transformOrigin: "top"`, **scrubbed** across the full section height.
- ScrollTrigger: `trigger: section`, `start: "top bottom"`, `end: "bottom bottom"`, `scrub: true`.

### Section marker

- Fires once when section enters viewport (`start: "top 85%"`, not scrubbed).
- Simple opacity + short y-translate fade-in (duration `0.5s`).

### Reduced motion

All scroll-driven animations must respect `prefers-reduced-motion`. Pattern:
```ts
if (prefersReducedMotion()) {
  // Snap to final state — stanzas opaque, no blur, no rotation, hairline at full height,
  // eyebrows visible. Do NOT register ScrollTrigger.
  return;
}
```
Use the existing `prefersReducedMotion()` helper from `lib/motion.ts`.

## Files to create

- `components/ui/ScrollReveal.tsx` — React Bits component (possibly extended for #1 above).
- `components/sections/Manifesto.tsx` — the section itself.
- Edit `app/page.tsx` — mount `<Manifesto />` after `<Hero />`.
- Edit `package.json` — add `gsap` dependency.

## Dependencies (new)

- `gsap` (includes `gsap/ScrollTrigger`). No existing usage in the project — Hero uses anime.js v4. Mixing is intentional: anime.js for discrete authored timelines (Hero, Arc Reactor boot), GSAP/ScrollTrigger for scroll-scrubbed effects where it's the better tool.

## Out of scope

- The `/manifesto` full page. Hero secondary CTA ("Read the Thesis") points to `/manifesto` and currently 404s. Stays that way until a later task explicitly builds it.
- Any section after Manifesto (§ 03).
- Changes to Hero or Arc Reactor. Hero is locked.

## Open questions

None. Implementation can proceed on the ScrollReveal extension choice (recommended: option 1) once plan begins.
