<div align="center">

# Flashbacklabs

**Your personal Jarvis - owned by you, remembering your life, working for you alone.**

*An editorial, cinematic marketing site for Flashback Labs - built with Next.js 16, React 19, GSAP, and Three.js.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-149ECA?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

<img width="1440" height="900" alt="hero" src="https://github.com/user-attachments/assets/4538ea9b-e94a-4d9d-86f1-db06c8c21359" />


</div>

---

## § 00 · What this is

A single long-form landing page designed like a printed manifesto - ten sections, each with its own typographic system, hand-tuned scroll choreography, and a consistent blueprint/engineering aesthetic. Every section is a beat; every beat earns its scroll.

## § 01 · The sections

### Hero - *"In a world where AI does everything, what's left for you."*

An editorial headline with an SVG arc-reactor breathing behind it, angled CTAs, and a dotted-grid canvas. Sets the tone: confident, human, counter-cultural.

<img width="1440" height="900" alt="hero" src="https://github.com/user-attachments/assets/422927ca-8abb-46d5-adb5-3086330187d5" />


### § 02 · Manifesto - The problem

ScrollReveal + GSAP-driven prose with margin callouts and scrubbed hairlines. Makes the case: attention was the product; memory will be next.

<img width="1440" height="900" alt="manifesto" src="https://github.com/user-attachments/assets/c4418ebd-be19-4210-b57a-b3d7d376d9ee" />


### § 03 · Thesis - The amplification zone

A blueprint plate marking the narrow band between *assist* and *automate* - the zone where AI makes you more, not less. Scrubbed marker, reveal-on-rest detail callout.

<img width="1440" height="900" alt="thesis" src="https://github.com/user-attachments/assets/d140653a-4861-45ca-ba8c-e83719344c60" />


### § 04 · Principles - Four rules we won't break

Four squircle bubbles with subtle tinted fills and hover-to-unpack descriptions. Nonautonomous · Private · User-owned · Auditable.

<img width="1440" height="900" alt="principles" src="https://github.com/user-attachments/assets/d517e6a4-9b04-4769-8f8d-4fcf6c07c917" />

<img width="1440" height="900" alt="principles2" src="https://github.com/user-attachments/assets/6e6601ef-3430-495f-8529-4139c8824a76" />


### § 05 · Products - Four surfaces, one Jarvis

Blueprint flow stations, plate-row sub-product index, 55M count-up. Flashback AI flagship plus Home, Car, and a fourth preview surface.

<img width="1440" height="900" alt="products" src="https://github.com/user-attachments/assets/d803f9e7-2924-455d-8624-c669da2cdc94" />


### § 06 · Infrastructure - From data to proof

An isometric step-pyramid tower (INFRA → DATA → INTEL → VERIFY) with hover-reveal layer details. Hand-drawn blueprint geometry built in SVG.

<img width="1440" height="900" alt="infrastructure" src="https://github.com/user-attachments/assets/c27743ab-349f-4463-a0a8-4beed59532c9" />


### § 10 · Closing manifesto + Footer

Strikethrough / overwrite treatment on *obsolete* → *more capable*. Then a quiet footer with pixel-art wordmark, sitemap, and contact.

<img width="1440" height="900" alt="closing" src="https://github.com/user-attachments/assets/a70e5a7c-e039-4dfa-8bc3-789cc34ffd4f" />
<br/>
<img width="1440" height="900" alt="footer" src="https://github.com/user-attachments/assets/103c6b50-89ac-4f0b-ab42-33294aa53d88" />


---

## § 07 · Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2** (Turbopack, App Router) |
| UI | **React 19.2** · **Tailwind CSS 4** |
| Motion | **GSAP 3.15** (scrub, ScrollTrigger) · **anime.js 4** · **Lenis** (smooth scroll) |
| 3D / SVG | **three.js** + **@react-three/fiber / drei** · hand-authored SVG plates |
| Language | **TypeScript 5** strict |

> ⚠️ This is **not** the Next.js you know. v16 has breaking changes in routing, fetching, and caching. See `node_modules/next/dist/docs/` before writing against it - and heed deprecation notices.

## § 08 · Run it

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm run lint
```

## § 09 · Layout

```
app/                     # Next.js App Router - page.tsx composes all sections
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

**- Flashback Labs -**
[contact@flashbacklabs.com](mailto:contact@flashbacklabs.com)

</div>
