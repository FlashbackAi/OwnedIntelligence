"use client";

/**
 * Flashback Labs — Nav.
 *
 * Top bar: wordmark on the left, hamburger on the right (both rounded
 * "bubbles" with hairline borders — elevation without shadow).
 *
 * Pressing the hamburger blooms the NavReactor — a left-edge semicircular
 * dial that locks the current scroll section at 3 o'clock and lets you step
 * to adjacent sections without leaving the page you're reading. Scroll-spy
 * via IntersectionObserver keeps the active item synced as you scroll.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavReactor, { type NavReactorItem } from "./NavReactor";

/* Section ids in document order on `/`. The dial maps each item to one of
   these via `sectionId`; the spy picks whichever id is currently mid-screen. */
const SPY_SECTIONS = [
  "hero",
  "manifesto",
  "thesis",
  "principles",
  "infrastructure",
  "products",
  "independence",
  "closing",
] as const;

/* Item set + their spy targets. `home` is the top of the page (hero), and
   `thesis` covers the manifesto/thesis/principles run since they're a single
   editorial unit. `get started` lives at the bottom (closing manifesto). */
const FLASHBACK_ITEMS: (NavReactorItem & { spySections?: string[] })[] = [
  {
    label: "home",
    href: "/",
    ariaLabel: "Home",
    sectionId: "hero",
    spySections: ["hero"],
  },
  {
    label: "thesis",
    href: "/#manifesto",
    ariaLabel: "Thesis",
    sectionId: "manifesto",
    spySections: ["manifesto", "thesis", "principles"],
  },
  {
    label: "technology",
    href: "/#infrastructure",
    ariaLabel: "Technology",
    sectionId: "infrastructure",
    spySections: ["infrastructure"],
  },
  {
    label: "products",
    href: "/#products",
    ariaLabel: "Products",
    sectionId: "products",
    spySections: ["products"],
  },
  {
    label: "partners",
    href: "/#independence",
    ariaLabel: "Partners",
    sectionId: "independence",
    spySections: ["independence"],
  },
  {
    label: "get started",
    href: "/#closing",
    ariaLabel: "Get Started",
    sectionId: "closing",
    spySections: ["closing"],
  },
];

function Wordmark() {
  return (
    <span className="font-display text-ink inline-flex items-center gap-2 text-[15px] md:text-[16px] tracking-[-0.03em] leading-none">
      <span>FLASHBACK</span>
      <span
        className="w-px h-3 bg-gold"
        aria-hidden="true"
        style={{ backgroundColor: "#8B6914" }}
      />
      <span>LABS</span>
    </span>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  /* While a picked section glides into view, the spy is locked — otherwise
     every section passing under the viewport would steal the active slot
     from the item the user just clicked and reshuffle the label arc.
     `onSettle` runs once the scroll comes to rest (used to close the dial
     on arrival). */
  const spyLockRef = useRef(false);
  const spyLockTimerRef = useRef<number | null>(null);
  const lockSpyDuringScroll = useCallback((onSettle?: () => void) => {
    spyLockRef.current = true;
    if (spyLockTimerRef.current) window.clearTimeout(spyLockTimerRef.current);
    const release = () => {
      spyLockRef.current = false;
      if (spyLockTimerRef.current) window.clearTimeout(spyLockTimerRef.current);
      spyLockTimerRef.current = null;
      window.removeEventListener("scrollend", release);
      onSettle?.();
    };
    window.addEventListener("scrollend", release);
    // Fallback for browsers without scrollend (Safari).
    spyLockTimerRef.current = window.setTimeout(release, 1800);
  }, []);

  /* Build a lookup from section-id → menu-item-index so the spy can
     translate observed sections into the right active item. */
  const sectionToIndex = useMemo(() => {
    const map = new Map<string, number>();
    FLASHBACK_ITEMS.forEach((item, i) => {
      (item.spySections ?? []).forEach((id) => map.set(id, i));
    });
    return map;
  }, []);

  /* Scroll-spy — only meaningful on the home page where the anchored
     sections live. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/") return;

    const nodes: HTMLElement[] = [];
    // Treat the very top of the page as "hero" — there's no explicit id on
    // HeroCinematic's <section>, so we synthesize a sentinel at the top.
    let sentinel = document.getElementById("hero");
    if (!sentinel) {
      sentinel = document.createElement("div");
      sentinel.id = "hero";
      sentinel.setAttribute("aria-hidden", "true");
      sentinel.style.cssText =
        "position:absolute;top:0;left:0;width:1px;height:80vh;pointer-events:none;";
      document.body.appendChild(sentinel);
    }
    SPY_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) nodes.push(el as HTMLElement);
    });
    if (nodes.length === 0) return;

    // Track each observed section's current intersection ratio; whichever
    // section has the largest ratio (and is at least 15% in view) wins.
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        }
        let bestId: string | null = null;
        let bestRatio = 0.15;
        for (const [id, r] of ratios) {
          if (r > bestRatio) {
            bestRatio = r;
            bestId = id;
          }
        }
        if (bestId && !spyLockRef.current) {
          const idx = sectionToIndex.get(bestId);
          if (idx !== undefined) {
            setActiveIndex((cur) => (cur === idx ? cur : idx));
          }
        }
      },
      {
        // Multiple thresholds so the spy responds smoothly as a section scrolls
        // through, not just at the moment it crosses a single line.
        threshold: [0.15, 0.3, 0.5, 0.7, 0.9],
      },
    );
    nodes.forEach((n) => observer.observe(n));

    return () => {
      observer.disconnect();
      if (sentinel && sentinel.parentElement && sentinel.id === "hero") {
        // Only remove the synthetic sentinel; never the real section.
        const isSynthetic = sentinel.getAttribute("aria-hidden") === "true";
        if (isSynthetic) sentinel.parentElement.removeChild(sentinel);
      }
    };
  }, [pathname, sectionToIndex]);

  /* Lock body scroll while open? — intentionally no. The dial is meant to
     hover *while you read*. It closes when a picked section arrives, or
     early via Esc / outside click. */

  const handleSelect = useCallback(
    (item: NavReactorItem, idx: number) => {
      setActiveIndex(idx);

      // In-page picks keep the dial open while the page glides to the
      // section, then close it on arrival. Esc/outside click close early.
      if (item.href.startsWith("/#")) {
        const id = item.href.slice(2);
        const el = document.getElementById(id);
        if (el && pathname === "/") {
          // Already there → no scroll will happen (and no scrollend);
          // treat the pick as arrival.
          if (Math.abs(el.getBoundingClientRect().top) < 4) {
            setOpen(false);
            return;
          }
          lockSpyDuringScroll(() => setOpen(false));
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        // Not on home — route there and let the hash do the rest.
        router.push(item.href);
        setOpen(false);
        return;
      }

      // "home" while already on home: glide to the top, close on arrival.
      if (item.href === "/" && pathname === "/") {
        if (window.scrollY < 4) {
          setOpen(false);
          return;
        }
        lockSpyDuringScroll(() => setOpen(false));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // mailto, external, or full routes leave the page — close the dial.
      if (item.href.startsWith("mailto:") || item.href.startsWith("http")) {
        window.location.href = item.href;
        setOpen(false);
        return;
      }

      router.push(item.href);
      setOpen(false);
    },
    [pathname, router, lockSpyDuringScroll],
  );

  /* The reactor toggle: morph the hamburger glyph into a tiny triangle when
     open — echoing the core glyph on the dial. */
  const toggleRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <nav
        className="fixed left-0 right-0 top-6 z-1100 flex items-center justify-between gap-4 px-6 md:px-10 pointer-events-none"
        aria-label="Main navigation"
      >
        {/* Logo bubble */}
        <div
          className="inline-flex items-center justify-center rounded-full border border-hairline pointer-events-auto h-12 md:h-14 px-5 md:px-7 gap-2"
          aria-label="Flashback Labs"
          style={{ background: "#FFFFFF", minHeight: "48px" }}
        >
          <Wordmark />
        </div>

        {/* Toggle bubble — hamburger / reactor pip */}
        <button
          ref={toggleRef}
          type="button"
          className="relative inline-flex flex-col items-center justify-center rounded-full border border-hairline pointer-events-auto w-12 h-12 md:w-14 md:h-14 cursor-pointer p-0 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-pressed={open}
          aria-expanded={open}
          style={{ background: "#FFFFFF" }}
        >
          {open ? (
            // Mini triangle — same glyph as the dial's hud core.
            <svg
              viewBox="-12 -12 24 24"
              width="20"
              height="20"
              aria-hidden="true"
            >
              <polygon
                points="0,-7 6.1,3.5 -6.1,3.5"
                fill="var(--color-hud-deep)"
                stroke="var(--color-ink)"
                strokeWidth="1.1"
                strokeLinejoin="miter"
              />
            </svg>
          ) : (
            <>
              <span
                className="block mx-auto rounded-[2px]"
                style={{
                  width: 22,
                  height: 1.5,
                  background: "#0B0D10",
                }}
              />
              <span
                className="block mx-auto rounded-[2px]"
                style={{
                  marginTop: "5px",
                  width: 22,
                  height: 1.5,
                  background: "#0B0D10",
                }}
              />
            </>
          )}
        </button>
      </nav>

      <NavReactor
        items={FLASHBACK_ITEMS}
        activeIndex={activeIndex}
        open={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
