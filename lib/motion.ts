/**
 * Flashback Labs — motion tokens.
 * Centralize duration + easing so we don't hardcode ms values in components.
 */

export const DURATION = {
  fast: 220,
  base: 420,
  slow: 900,
  epic: 1800,
} as const;

// anime.js v4 named easings. Using strings so they map directly to the API.
export const EASE = {
  outQuart: "outQuart",
  outExpo: "outExpo",
  outBack: "outBack(1.4)",
  inOutCubic: "inOutCubic",
  linear: "linear",
} as const;

/**
 * SSR-safe check for prefers-reduced-motion. Returns false on the server.
 * Components that animate should call this inside useEffect and skip/shorten
 * their timelines if it returns true.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
