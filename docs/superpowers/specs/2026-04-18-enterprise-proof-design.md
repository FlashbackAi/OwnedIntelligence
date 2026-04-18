# § 07 Enterprise Proof — Design Spec

**Date:** 2026-04-18
**Section:** 07 of 10 (landing page)
**File target:** `components/sections/EnterpriseProof.tsx`
**Data target:** `content/clients.ts`

---

## Purpose

Short, high-credibility section immediately following § 06 Infrastructure. Communicates four paying enterprise clients and zero external funding — the "this is a real company" hammer. Must feel authoritative and restrained; no over-animation.

---

## Layout

Single compact section — no full viewport height. Same rhythm as all other sections: `py-24 md:py-36`, `max-w-[1240px]`, `56px` gutters.

Vertical stack top to bottom:

1. Section label — mono, `steel`: `ENTERPRISE // 07`
2. Headline — mono, `ink`, larger: `PAYING CLIENTS // NO EXTERNAL FUNDING`
3. `paper-sunk` band containing four monogram boxes
4. One-liner body copy — `steel`, centered: `Revenue-generating from day one. We build what people pay for.`

---

## paper-sunk Band

Full-width within the section container. Background `paper-sunk` (`#EEEEEA`). 1px `hairline` top and bottom border. Generous vertical padding (`py-10`) so the boxes breathe.

Boxes are in a single flex row, centered, evenly spaced (`gap-8`). On mobile (`< 640px`): 2×2 grid.

---

## Monogram Boxes

Each box:

| Property | Value |
|---|---|
| Background | `paper-raised` (`#FFFFFF`) |
| Border | 1px `hairline` (`#D8D5CE`) → transitions to 1px `ink` (`#0B0D10`) on scroll entry |
| Border radius | `8px` |
| Size | ~120px wide × ~96px tall |
| Padding | `px-4 py-5` |

Two lines inside, centered:
- **Monogram** — Nevera display font, `28px`, `steel` (`#5A6470`) → `ink` (`#0B0D10`) on scroll entry
- **Company name** — JetBrains Mono, `10px`, uppercase, `steel`, stays `steel` permanently

Four clients (from `content/clients.ts`):

| id | monogram | name | color (brand, for future real logo) |
|---|---|---|---|
| `stevie` | `SA` | Stevie Awards | `#C8942A` |
| `imageshield` | `IS` | ImageShield | `#1A6EBF` |
| `reqsy` | `RQ` | Reqsy | `#2E7D5B` |
| `ink` | `INK` | Ink | `#0B0D10` |

---

## Animation

**Entry trigger:** GSAP ScrollTrigger (consistent with all other sections) drives the header label + headline reveal.

**Logo entry (anime.js):**
- All four boxes fade in simultaneously but with a 100ms stagger
- Per box: `opacity: 0 → 1`, `translateY: 10px → 0`, `400ms`, `easeOutQuart`
- Concurrent: box border color transitions `hairline → ink`, monogram color transitions `steel → ink`
- Fires once on first scroll-entry via `useAnimeOnView`

**Rule from master plan:** "Don't over-animate credibility." This is the only animation in the section.

---

## Data Shape (`content/clients.ts`)

```ts
export type Client = {
  id: string;
  monogram: string;
  name: string;
  brandColor: string; // reserved for real logo swap
};

export const CLIENTS: Client[] = [
  { id: "stevie", monogram: "SA", name: "Stevie Awards", brandColor: "#C8942A" },
  { id: "imageshield", monogram: "IS", name: "ImageShield", brandColor: "#1A6EBF" },
  { id: "reqsy", monogram: "RQ", name: "Reqsy", brandColor: "#2E7D5B" },
  { id: "ink", monogram: "INK", name: "Ink", brandColor: "#0B0D10" },
];
```

---

## Responsive

| Breakpoint | Logo layout |
|---|---|
| `≥ 640px` | Single flex row, evenly spaced |
| `< 640px` | 2×2 grid |

---

## Accessibility

- Section heading is a real `<h2>` (screen reader landmark)
- `prefers-reduced-motion`: skip translate + color transition; boxes appear instantly at full opacity/ink color
- No interactive elements in this section — purely presentational

---

## Integration

- Import in `app/page.tsx` after `<Infrastructure />`
- Uses existing `lib/useAnimeOnView.ts` and `lib/motion.ts` — no new lib files needed
- `content/clients.ts` is a new file (already planned in master plan file structure)
