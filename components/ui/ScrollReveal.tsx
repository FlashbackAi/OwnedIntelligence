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
