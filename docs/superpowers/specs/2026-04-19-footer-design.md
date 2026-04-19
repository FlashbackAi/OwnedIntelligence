# Footer Design Spec
**Date:** 2026-04-19
**Status:** Approved

## Overview

A static `<footer>` section that sits below ClosingManifesto. Occupies at least 50vh. Dark ink background with hairline dot grid overlay. Split two-column layout: massive Hydrogen wordmark left, structured content right. No scroll animations — static by design.

## Font

Hydrogen (`public/fonts/hydrogen.ttf`) must be registered in `app/layout.tsx` as a CSS variable `--font-hydrogen` via `next/font/local`. It is not currently wired in. This is a prerequisite step.

## Background

- `bg-ink` (`#0B0D10`)
- `bg-grid-hairline` dot pattern overlaid at ~15% opacity using `paper` color dots (CSS custom property override or inline style)
- `border-t` hairline at top: `border-paper/10`

## Layout

Container: `max-w-screen-xl mx-auto px-10 py-16`, `flex items-end gap-0`.

### Left column — 60% width

- Single element: the text `flashbacklabs` rendered in Hydrogen font
- Color: `text-paper`
- Size: `clamp(4rem, 10vw, 9rem)`, `leading-none`
- Aligned to bottom of the flex row
- No wrapping (`whitespace-nowrap`)

### Right column — 40% width

Stacked vertically, bottom-aligned, all text in `font-mono`:

1. **Section label** — `§ FLASHBACK LABS`, `text-[10.5px] tracking-[0.28em] uppercase text-paper/40`
2. **Hairline divider** — `border-t border-paper/10 my-5`
3. **Link grid** — two columns side by side:
   - *Product*: Get Flashback AI, How it works, Principles
   - *Company*: About, Contact, Press
   - Column headers in `text-paper/40 text-[10px] tracking-[0.2em] uppercase mb-3`
   - Links in `text-paper/70 text-[11px] tracking-[0.1em] hover:text-paper transition-colors`
4. **Socials row** — Twitter/X and LinkedIn, icon + label, `text-paper/60 hover:text-paper`, `mt-8`
5. **Bottom row** — `mt-10 pt-5 border-t border-paper/10 flex justify-between`:
   - Left: `© 2025 Flashback Labs` in `text-paper/40 text-[10px] tracking-[0.15em]`
   - Right: `contact@flashbacklabs.com` in `text-paper/50 text-[10px] tracking-[0.15em] hover:text-paper transition-colors`

## Components

- **File:** `components/sections/Footer.tsx` — new file, `"use client"` not needed (no hooks)
- **Registration:** Add `<Footer />` import and usage to `app/page.tsx` below `<ClosingManifesto />`
- **Font wiring:** `app/layout.tsx` — add `hydrogen` local font, inject `--font-hydrogen` variable, add to `<html>` className

## Accessibility

- `<footer>` with `aria-label="Flashback Labs site footer"`
- All links have descriptive text
- Decorative grid overlay has `aria-hidden="true"`
- No motion — fully reduced-motion safe

## Out of scope

- No scroll animations
- No hover effects on the wordmark
- No mobile-specific layout changes beyond natural flex wrapping (links stack gracefully)
