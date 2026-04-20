<div align="center">

# FLASHBACK · LABS

**Your personal Jarvis — owned by you, remembering your life, working for you alone.**

*An editorial, cinematic marketing site for Flashback Labs — built with Next.js 16, React 19, GSAP, and Three.js.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-149ECA?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

![Hero](docs/screenshots/hero.png)

</div>

---

## § 00 · What this is

A single long-form landing page designed like a printed manifesto — ten sections, each with its own typographic system, hand-tuned scroll choreography, and a consistent blueprint/engineering aesthetic. Every section is a beat; every beat earns its scroll.

## § 01 · The sections

### Hero — *"In a world where AI does everything, what's left for you."*

An editorial headline with an SVG arc-reactor breathing behind it, angled CTAs, and a dotted-grid canvas. Sets the tone: confident, human, counter-cultural.

![Hero](docs/screenshots/hero.png)

### § 02 · Manifesto — The problem

ScrollReveal + GSAP-driven prose with margin callouts and scrubbed hairlines. Makes the case: attention was the product; memory will be next.

![Manifesto](docs/screenshots/manifesto.png)

### § 03 · Thesis — The amplification zone

A blueprint plate marking the narrow band between *assist* and *automate* — the zone where AI makes you more, not less. Scrubbed marker, reveal-on-rest detail callout.

![Thesis](docs/screenshots/thesis.png)

### § 04 · Principles — Four rules we won't break

Four squircle bubbles with subtle tinted fills and hover-to-unpack descriptions. Nonautonomous · Private · User-owned · Auditable.

![Principles](docs/screenshots/principles.png)
![Principles — all four](docs/screenshots/principles2.png)

### § 05 · Products — Four surfaces, one Jarvis

Blueprint flow stations, plate-row sub-product index, 55M count-up. Flashback AI flagship plus Home, Car, and a fourth preview surface.

![Products](docs/screenshots/products.png)

### § 06 · Infrastructure — From data to proof

An isometric step-pyramid tower (INFRA → DATA → INTEL → VERIFY) with hover-reveal layer details. Hand-drawn blueprint geometry built in SVG.

![Infrastructure](docs/screenshots/infrastructure.png)

### § 10 · Closing manifesto + Footer

Strikethrough / overwrite treatment on *obsolete* → *more capable*. Then a quiet footer with pixel-art wordmark, sitemap, and contact.

![Closing](docs/screenshots/closing.png)
![Footer](docs/screenshots/footer.png)

---

## § 07 · Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2** (Turbopack, App Router) |
| UI | **React 19.2** · **Tailwind CSS 4** |
| Motion | **GSAP 3.15** (scrub, ScrollTrigger) · **anime.js 4** · **Lenis** (smooth scroll) |
| 3D / SVG | **three.js** + **@react-three/fiber / drei** · hand-authored SVG plates |
| Language | **TypeScript 5** strict |

> ⚠️ This is **not** the Next.js you know. v16 has breaking changes in routing, fetching, and caching. See `node_modules/next/dist/docs/` before writing against it — and heed deprecation notices.

## § 08 · Run it

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm run lint
```

## § 09 · Layout

```
app/                     # Next.js App Router — page.tsx composes all sections
components/
  sections/              # One file per section (Hero, Manifesto, Thesis, …)
  svg/                   # Hand-authored blueprint plates + ArcReactor
  ui/                    # Nav + shared primitives
lib/                     # Scroll helpers, GSAP wiring
public/images/products/  # Product preview placeholders
docs/screenshots/        # README imagery (captured via Playwright MCP)
```

## § 10 · Design notes

- **Editorial, not SaaS.** Closer to a printed technical manual than a landing page.
- **Blueprint language.** Crosshair ticks, dimension lines, callouts, § section marks.
- **Motion with restraint.** Scrubbed reveals over autoplay. Every animation tied to scroll or intent.
- **Two typographic registers.** A heavy display face for headlines; a monospaced caption face for margins, indices, and metadata.

---

<div align="center">

**— Flashback Labs —**
[contact@flashbacklabs.com](mailto:contact@flashbacklabs.com)

</div>
