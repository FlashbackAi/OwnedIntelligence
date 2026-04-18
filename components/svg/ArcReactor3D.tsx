"use client";

/**
 * Flashback Labs — Arc Reactor (3D / R3F).
 *
 * Aesthetic: an engineering CAD model of a miniaturized reactor core.
 * Rendered flat (MeshBasicMaterial everywhere, no lighting) so it reads as a
 * blueprint-in-space, not a Marvel promo render.
 *
 * Construction:
 *   Layer stack (z axis) — back → front:
 *     -0.70 : triangle glow halo (cyan disc)
 *     -0.50 : triangle core (extruded prism + edge outline)
 *     -0.30 : back plane (core rings, coil fingers)
 *      0.00 : mid plane (mid ring, hexagon registration polygon)
 *     +0.44 : gold-arc glow tubes (fatter, low-opacity)
 *     +0.45 : front plane (outer ring, ticks, gold arcs, pin dots)
 *
 * Spokes slant from mid-plane (z=0) to back-plane (z=-0.3), bridging layers.
 *
 * Boot sequence (~3.6 s total) — elements CONSTRUCT, they don't just fade:
 *   - Rings & arcs: BufferGeometry.setDrawRange sweeps around them
 *   - Ticks, coil fingers, pin dots: scale-pop stagger (outBack)
 *   - Spokes: parent group scales from 0 at centre, extruding outward
 *   - Triangle: edge draws in, then fill scales in with slight rotation
 *   - Glows: fade in last, under the draw so you notice the bloom on-arrival
 *
 * Ambient: sine yaw + pitch + triangle opacity breath (see ReactorScene.useFrame).
 * Pointer parallax: group rotation lerps toward pointer X/Y on desktop.
 * prefers-reduced-motion: snaps to final state, skips all timelines.
 */

import {
  forwardRef,
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { animate, createTimeline, stagger } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";

const COLOR = {
  ink: "#0B0D10",
  hairline: "#D8D5CE",
  gold: "#8B6914",
  goldGlow: "#C9974A",
  hudDeep: "#0369A1",
  hudGlow: "#38BDF8",
  steel: "#5A6470",
} as const;

// Radii (world units). Outer diameter = 4. AutoZoom fits 6 world units per
// shortest canvas side → ~67% of canvas filled by reactor at rest.
const R = {
  outer: 2.0,
  mid: 1.5,
  hex: 1.15,
  coilRing: 0.76,
  coreOuter: 0.9,
  coreInner: 0.6,
  tri: 0.45,
  triGlow: 0.78,
  pinDot: 0.035,
} as const;

const Z = {
  front: 0.45,
  frontGlow: 0.44,
  mid: 0.0,
  back: -0.3,
  triangle: -0.5,
  triangleGlow: -0.7,
} as const;

/* ───────── geometric helpers ───────── */

// θ measured in degrees from top (+Y), clockwise. Matches paper engineering diagrams.
function pt3(thetaDeg: number, r: number, z = 0): THREE.Vector3 {
  const rad = (thetaDeg * Math.PI) / 180;
  return new THREE.Vector3(r * Math.sin(rad), r * Math.cos(rad), z);
}

function arcPoints(
  startDeg: number,
  endDeg: number,
  r: number,
  steps = 48,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const deg = startDeg + (endDeg - startDeg) * (i / steps);
    pts.push(pt3(deg, r));
  }
  return pts;
}

/* ───────── AutoZoom — sizes ortho camera to fit reactor + rotation headroom ───────── */
// 6 world units / shortest side. Re-runs on canvas resize.
function AutoZoom() {
  const { size, camera } = useThree();
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    const side = Math.min(size.width, size.height);
    camera.zoom = side / 6.0;
    camera.updateProjectionMatrix();
  }, [size.width, size.height, camera]);
  return null;
}

/* ───────── Ring (full torus) ───────── */

type RingProps = {
  radius: number;
  thickness?: number;
  color?: string;
  geomRef?: React.RefObject<THREE.BufferGeometry | null>;
  matRef?: React.RefObject<THREE.MeshBasicMaterial | null>;
};

function Ring({
  radius,
  thickness = 0.01,
  color = COLOR.ink,
  geomRef,
  matRef,
}: RingProps) {
  return (
    <mesh>
      <torusGeometry ref={geomRef} args={[radius, thickness, 6, 160]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={1}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ───────── GoldArc (partial torus via tubeGeometry) ───────── */

type GoldArcProps = {
  startDeg: number;
  endDeg: number;
  radius: number;
  thickness?: number;
  color?: string;
  opacity?: number;
  geomRef?: React.RefObject<THREE.BufferGeometry | null>;
  matRef?: React.RefObject<THREE.MeshBasicMaterial | null>;
};

function GoldArc({
  startDeg,
  endDeg,
  radius,
  thickness = 0.032,
  color = COLOR.gold,
  opacity = 1,
  geomRef,
  matRef,
}: GoldArcProps) {
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      arcPoints(startDeg, endDeg, radius, 48),
    );
    return new THREE.TubeGeometry(curve, 64, thickness, 12, false);
  }, [startDeg, endDeg, radius, thickness]);

  return (
    <mesh
      geometry={geom}
      ref={(m) => {
        if (geomRef && m) {
          (geomRef as { current: THREE.BufferGeometry | null }).current =
            m.geometry;
        }
      }}
    >
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={opacity}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ───────── TriangleCore (extruded prism + edge outline) ───────── */

type TriangleCoreProps = {
  radius: number;
  rotationRef?: React.RefObject<THREE.Group | null>;
  fillMatRef?: React.RefObject<THREE.MeshBasicMaterial | null>;
  edgeMatRef?: React.RefObject<THREE.LineBasicMaterial | null>;
  edgeGeomRef?: React.RefObject<THREE.BufferGeometry | null>;
};

function TriangleCore({
  radius,
  rotationRef,
  fillMatRef,
  edgeMatRef,
  edgeGeomRef,
}: TriangleCoreProps) {
  const { shape, edgePoints } = useMemo(() => {
    const top = pt3(0, radius);
    const right = pt3(120, radius);
    const left = pt3(240, radius);
    const s = new THREE.Shape();
    s.moveTo(top.x, top.y);
    s.lineTo(right.x, right.y);
    s.lineTo(left.x, left.y);
    s.lineTo(top.x, top.y);
    const DEPTH = 0.2;
    const ep: [number, number, number][] = [
      [top.x, top.y, DEPTH / 2 + 0.001],
      [right.x, right.y, DEPTH / 2 + 0.001],
      [left.x, left.y, DEPTH / 2 + 0.001],
      [top.x, top.y, DEPTH / 2 + 0.001],
    ];
    return { shape: s, edgePoints: ep };
  }, [radius]);

  return (
    <group ref={rotationRef}>
      <mesh position={[0, 0, -0.1]}>
        <extrudeGeometry
          args={[shape, { depth: 0.2, bevelEnabled: false, steps: 1 }]}
        />
        <meshBasicMaterial
          ref={fillMatRef}
          color={COLOR.hudDeep}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </mesh>
      <Line
        points={edgePoints}
        color={COLOR.ink}
        lineWidth={1.6}
        transparent
        opacity={1}
        ref={(obj: unknown) => {
          const line = obj as {
            material?: THREE.LineBasicMaterial;
            geometry?: THREE.BufferGeometry;
          } | null;
          if (!line) return;
          if (edgeMatRef && line.material) {
            (edgeMatRef as { current: THREE.LineBasicMaterial | null }).current =
              line.material;
          }
          if (edgeGeomRef && line.geometry) {
            (edgeGeomRef as { current: THREE.BufferGeometry | null }).current =
              line.geometry;
          }
        }}
      />
    </group>
  );
}

/* ───────── Ticks — minor (24) + major (4) ───────── */

type TicksProps = {
  count: number;
  innerR: number;
  outerR: number;
  color?: string;
  groupRef?: React.RefObject<THREE.Group | null>;
  // When set, each tick mark is wrapped in its own <group> whose scale we
  // animate from 0→1 during boot for the stagger-pop effect.
  perTickScaleRefs?: React.MutableRefObject<(THREE.Group | null)[]>;
};

function Ticks({
  count,
  innerR,
  outerR,
  color = COLOR.ink,
  groupRef,
  perTickScaleRefs,
}: TicksProps) {
  const items = useMemo(() => {
    const arr: { angle: number; pts: [THREE.Vector3, THREE.Vector3] }[] = [];
    for (let i = 0; i < count; i++) {
      const deg = (i / count) * 360;
      arr.push({ angle: deg, pts: [pt3(deg, innerR), pt3(deg, outerR)] });
    }
    return arr;
  }, [count, innerR, outerR]);

  return (
    <group ref={groupRef}>
      {items.map((it, i) => (
        <group
          key={i}
          ref={(g) => {
            if (perTickScaleRefs) perTickScaleRefs.current[i] = g;
          }}
          // Pivot at midpoint of the tick so it scales outward from there,
          // not from world origin (prevents it sliding in from the centre).
          position={pt3(it.angle, (innerR + outerR) / 2)}
        >
          <Line
            points={[
              pt3(it.angle, innerR).sub(pt3(it.angle, (innerR + outerR) / 2)),
              pt3(it.angle, outerR).sub(pt3(it.angle, (innerR + outerR) / 2)),
            ]}
            color={color}
            lineWidth={1}
          />
        </group>
      ))}
    </group>
  );
}

/* ───────── Pin dots — small solid circles at cardinal points on outer ring ───────── */

type PinDotsProps = {
  radius: number;
  angles: number[];
  perDotScaleRefs?: React.MutableRefObject<(THREE.Group | null)[]>;
};

function PinDots({ radius, angles, perDotScaleRefs }: PinDotsProps) {
  return (
    <group>
      {angles.map((a, i) => (
        <group
          key={i}
          position={pt3(a, radius)}
          ref={(g) => {
            if (perDotScaleRefs) perDotScaleRefs.current[i] = g;
          }}
        >
          <mesh>
            <circleGeometry args={[R.pinDot, 24]} />
            <meshBasicMaterial color={COLOR.ink} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ───────── Coil fingers — 6 short arcs around the core (Iron-Man style) ───────── */

type CoilFingersProps = {
  perFingerScaleRefs?: React.MutableRefObject<(THREE.Group | null)[]>;
};

function CoilFingers({ perFingerScaleRefs }: CoilFingersProps) {
  const SECTOR = 60;
  const ARC_HALF = 19;
  const centres = Array.from({ length: 6 }, (_, i) => i * SECTOR + 30);
  return (
    <group>
      {centres.map((c, i) => {
        const curve = new THREE.CatmullRomCurve3(
          arcPoints(c - ARC_HALF, c + ARC_HALF, R.coilRing, 24),
        );
        const geom = new THREE.TubeGeometry(curve, 32, 0.018, 8, false);
        return (
          <group
            key={i}
            ref={(g) => {
              if (perFingerScaleRefs) perFingerScaleRefs.current[i] = g;
            }}
          >
            <mesh geometry={geom}>
              <meshBasicMaterial color={COLOR.ink} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ───────── Hexagon registration polygon (between mid ring and core) ───────── */

type HexagonProps = {
  radius: number;
  geomRef?: React.RefObject<THREE.BufferGeometry | null>;
  matRef?: React.RefObject<THREE.LineBasicMaterial | null>;
};

function Hexagon({ radius, geomRef, matRef }: HexagonProps) {
  // 6 vertices at 0°,60°,120°,… — drawn as a tube so line thickness is controllable
  const points = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => pt3(i * 60, radius));
  }, [radius]);

  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0);
    return new THREE.TubeGeometry(curve, 48, 0.008, 6, false);
  }, [points]);

  return (
    <mesh
      geometry={geom}
      ref={(m) => {
        if (geomRef && m) {
          (geomRef as { current: THREE.BufferGeometry | null }).current =
            m.geometry;
        }
      }}
    >
      <meshBasicMaterial
        ref={matRef as unknown as React.Ref<THREE.MeshBasicMaterial>}
        color={COLOR.ink}
        transparent
        opacity={0.55}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ───────── Spoke — scales from centre for "extrude" boot ───────── */

type SpokeProps = {
  angleDeg: number;
  innerR: number;
  outerR: number;
  innerZ?: number;
  outerZ?: number;
  groupRef?: React.RefObject<THREE.Group | null>;
};

function Spoke({
  angleDeg,
  innerR,
  outerR,
  innerZ = 0,
  outerZ = 0,
  groupRef,
}: SpokeProps) {
  const points = useMemo(
    () => [pt3(angleDeg, innerR, innerZ), pt3(angleDeg, outerR, outerZ)],
    [angleDeg, innerR, outerR, innerZ, outerZ],
  );
  return (
    <group ref={groupRef}>
      <Line points={points} color={COLOR.ink} lineWidth={1} />
    </group>
  );
}

/* ───────── ReactorScene — composition + animation orchestration ───────── */

function ReactorScene() {
  const groupRef = useRef<THREE.Group>(null);

  // === Refs for boot animation targets ===

  // Ring geometries — we animate `setDrawRange` on these to sweep them in.
  const outerRingGeom = useRef<THREE.BufferGeometry>(null);
  const midRingGeom = useRef<THREE.BufferGeometry>(null);
  const coreOuterGeom = useRef<THREE.BufferGeometry>(null);
  const coreInnerGeom = useRef<THREE.BufferGeometry>(null);
  const hexGeom = useRef<THREE.BufferGeometry>(null);

  // Gold arc geometries (draw-in) + their glow materials (fade-in)
  const goldArcGeoms = [
    useRef<THREE.BufferGeometry>(null),
    useRef<THREE.BufferGeometry>(null),
    useRef<THREE.BufferGeometry>(null),
  ];
  const goldGlowMats = [
    useRef<THREE.MeshBasicMaterial>(null),
    useRef<THREE.MeshBasicMaterial>(null),
    useRef<THREE.MeshBasicMaterial>(null),
  ];

  // Triangle
  const triGroupRef = useRef<THREE.Group>(null);
  const triFillMat = useRef<THREE.MeshBasicMaterial>(null);
  const triEdgeMat = useRef<THREE.LineBasicMaterial>(null);
  const triEdgeGeom = useRef<THREE.BufferGeometry>(null);
  const triGlowMat = useRef<THREE.MeshBasicMaterial>(null);

  // Scale-pop groups
  const tickScaleRefs = useRef<(THREE.Group | null)[]>(Array(24).fill(null));
  const majorTickScaleRefs = useRef<(THREE.Group | null)[]>(Array(4).fill(null));
  const pinDotScaleRefs = useRef<(THREE.Group | null)[]>(Array(6).fill(null));
  const coilScaleRefs = useRef<(THREE.Group | null)[]>(Array(6).fill(null));

  // Spokes
  const spokeGroupRefs = [
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
  ];

  // Ambient state
  const timeRef = useRef(0);
  const targetRotation = useRef({ x: -0.3, y: 0.22 });
  const reducedRef = useRef(false);

  // === Boot timeline ===
  useLayoutEffect(() => {
    reducedRef.current = prefersReducedMotion();

    // Helper — progressively reveal indexed geometry via setDrawRange.
    function drawInGeometry(
      geom: THREE.BufferGeometry | null | undefined,
      fromZero = true,
    ) {
      if (!geom || !geom.index) return null;
      if (fromZero) geom.setDrawRange(0, 0);
      return { total: geom.index.count };
    }

    // All geometries we plan to draw-in — start invisible (except non-indexed spokes).
    const rings = [
      outerRingGeom.current,
      midRingGeom.current,
      coreOuterGeom.current,
      coreInnerGeom.current,
      hexGeom.current,
      ...goldArcGeoms.map((r) => r.current),
      triEdgeGeom.current,
    ];
    rings.forEach((g) => {
      if (g && g.index) g.setDrawRange(0, 0);
    });

    // Scale-pop groups start at 0.
    const popGroups = [
      ...tickScaleRefs.current,
      ...majorTickScaleRefs.current,
      ...pinDotScaleRefs.current,
      ...coilScaleRefs.current,
    ];
    popGroups.forEach((g) => {
      if (g) g.scale.set(0, 0, 0);
    });

    // Spokes start scaled from centre (scale 0 on their group).
    spokeGroupRefs.forEach((r) => {
      if (r.current) r.current.scale.set(0.001, 0.001, 0.001);
    });

    // Triangle starts at scale 0 (fill + edge share the group) and tilted.
    if (triGroupRef.current) {
      triGroupRef.current.scale.set(0, 0, 0);
      triGroupRef.current.rotation.z = -0.6;
    }

    // Glow mats start invisible.
    goldGlowMats.forEach((r) => {
      if (r.current) r.current.opacity = 0;
    });
    if (triGlowMat.current) triGlowMat.current.opacity = 0;

    // Reduced motion → snap.
    if (reducedRef.current) {
      rings.forEach((g) => {
        if (g && g.index) g.setDrawRange(0, g.index.count);
      });
      popGroups.forEach((g) => g?.scale.set(1, 1, 1));
      spokeGroupRefs.forEach((r) => r.current?.scale.set(1, 1, 1));
      if (triGroupRef.current) {
        triGroupRef.current.scale.set(1, 1, 1);
        triGroupRef.current.rotation.z = 0;
      }
      goldGlowMats.forEach((r) => {
        if (r.current) r.current.opacity = 0.14;
      });
      if (triGlowMat.current) triGlowMat.current.opacity = 0.16;
      return;
    }

    const tl = createTimeline({
      defaults: { ease: "outQuart" },
      autoplay: true,
    });

    // ── Helper to add a drawRange tween at an offset. ──
    function addDrawRange(
      geom: THREE.BufferGeometry | null,
      duration: number,
      at: number,
      ease = "outExpo",
    ) {
      if (!geom || !geom.index) return;
      const total = geom.index.count;
      const state = { p: 0 };
      tl.add(
        state,
        {
          p: [0, 1],
          duration,
          ease,
          onUpdate: () => {
            geom.setDrawRange(0, Math.floor(state.p * total));
          },
        },
        at,
      );
    }

    // ─────── PHASE 1: outer ring sweeps in ───────
    addDrawRange(outerRingGeom.current, 900, 200, "outExpo");

    // ─────── PHASE 2: pin dots pop (cardinal markers) ───────
    const liveDots = pinDotScaleRefs.current.filter(Boolean) as THREE.Group[];
    if (liveDots.length) {
      tl.add(
        liveDots.map((g) => g.scale),
        {
          x: [0, 1],
          y: [0, 1],
          z: [0, 1],
          duration: 400,
          ease: "outBack(1.8)",
          delay: stagger(55),
        },
        450,
      );
    }

    // ─────── PHASE 3: minor tick marks stagger-pop ───────
    const liveTicks = tickScaleRefs.current.filter(Boolean) as THREE.Group[];
    if (liveTicks.length) {
      tl.add(
        liveTicks.map((g) => g.scale),
        {
          x: [0, 1],
          y: [0, 1],
          z: [0, 1],
          duration: 320,
          ease: "outBack(1.6)",
          delay: stagger(14),
        },
        650,
      );
    }

    // Major ticks — slower, visible anchoring
    const liveMajors = majorTickScaleRefs.current.filter(
      Boolean,
    ) as THREE.Group[];
    if (liveMajors.length) {
      tl.add(
        liveMajors.map((g) => g.scale),
        {
          x: [0, 1],
          y: [0, 1],
          z: [0, 1],
          duration: 500,
          ease: "outBack(1.8)",
          delay: stagger(90),
        },
        700,
      );
    }

    // ─────── PHASE 4: gold arcs draw in (one after another) + glow halos ───────
    goldArcGeoms.forEach((r, i) => {
      addDrawRange(r.current, 620, 1050 + i * 160, "outExpo");
    });
    goldGlowMats.forEach((r, i) => {
      if (!r.current) return;
      tl.add(
        r.current,
        { opacity: [0, 0.14], duration: 700, ease: "outQuart" },
        1250 + i * 160,
      );
    });

    // ─────── PHASE 5: mid ring sweeps in ───────
    addDrawRange(midRingGeom.current, 800, 1650, "outExpo");

    // ─────── PHASE 6: hexagon draws in ───────
    addDrawRange(hexGeom.current, 700, 1900, "outExpo");

    // ─────── PHASE 7: spokes extrude from centre ───────
    spokeGroupRefs.forEach((r, i) => {
      if (!r.current) return;
      tl.add(
        r.current.scale,
        {
          x: [0.001, 1],
          y: [0.001, 1],
          z: [0.001, 1],
          duration: 500,
          ease: "outExpo",
        },
        2100 + i * 100,
      );
    });

    // ─────── PHASE 8: core outer ring draws ───────
    addDrawRange(coreOuterGeom.current, 650, 2350, "outExpo");

    // ─────── PHASE 9: coil fingers pop-stagger ───────
    const liveCoils = coilScaleRefs.current.filter(Boolean) as THREE.Group[];
    if (liveCoils.length) {
      tl.add(
        liveCoils.map((g) => g.scale),
        {
          x: [0, 1],
          y: [0, 1],
          z: [0, 1],
          duration: 400,
          ease: "outBack(2)",
          delay: stagger(50),
        },
        2500,
      );
    }

    // ─────── PHASE 10: core inner ring draws ───────
    addDrawRange(coreInnerGeom.current, 550, 2700, "outExpo");

    // ─────── PHASE 11: triangle edge draws ───────
    addDrawRange(triEdgeGeom.current, 700, 2900, "outExpo");

    // ─────── PHASE 12: triangle fill scales + rotates into place ───────
    if (triGroupRef.current) {
      tl.add(
        triGroupRef.current.scale,
        {
          x: [0, 1],
          y: [0, 1],
          z: [0, 1],
          duration: 700,
          ease: "outBack(1.6)",
        },
        3100,
      );
      tl.add(
        triGroupRef.current.rotation,
        {
          z: [-0.6, 0],
          duration: 700,
          ease: "outBack(1.6)",
        },
        3100,
      );
    }

    // ─────── PHASE 13: triangle glow halo blooms in ───────
    if (triGlowMat.current) {
      tl.add(
        triGlowMat.current,
        { opacity: [0, 0.16], duration: 900, ease: "outQuart" },
        3250,
      );
    }

    return () => {
      tl.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Ambient loop + pointer parallax ===
  useFrame((state, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const g = groupRef.current;
    if (!g) return;
    if (reducedRef.current) return;

    const px = state.pointer.x || 0;
    const py = state.pointer.y || 0;
    const ambientYaw = Math.sin(t * 0.28) * 0.16;
    const ambientPitch = Math.sin(t * 0.22 + 1.2) * 0.07;

    targetRotation.current.y = px * 0.32 + ambientYaw + 0.12;
    targetRotation.current.x = -py * 0.18 + ambientPitch - 0.3;

    const lerp = Math.min(1, 3.5 * delta);
    g.rotation.y += (targetRotation.current.y - g.rotation.y) * lerp;
    g.rotation.x += (targetRotation.current.x - g.rotation.x) * lerp;

    // Triangle breath — pulse on both fill and glow after boot has finished
    if (
      triFillMat.current &&
      triGlowMat.current &&
      triGlowMat.current.opacity > 0.05
    ) {
      const breath = 0.5 + 0.5 * Math.sin(t * 1.4);
      triFillMat.current.opacity = 0.9 + 0.1 * breath;
      triGlowMat.current.opacity = 0.12 + 0.06 * breath;
    }
  });

  return (
    <group ref={groupRef} rotation={[-0.3, 0.22, 0]}>
      {/* ═══════ FRONT PLANE (z = +0.45) ═══════ */}
      <group position={[0, 0, Z.front]}>
        <Ring
          radius={R.outer}
          thickness={0.012}
          geomRef={outerRingGeom}
        />

        {/* 24 minor ticks */}
        <Ticks
          count={24}
          innerR={R.outer - 0.08}
          outerR={R.outer}
          perTickScaleRefs={tickScaleRefs}
        />

        {/* 4 major ticks at 0°,90°,180°,270° — longer */}
        <Ticks
          count={4}
          innerR={R.outer - 0.15}
          outerR={R.outer + 0.04}
          perTickScaleRefs={majorTickScaleRefs}
        />

        {/* 6 pin dots — cardinal markers at 0°,60°,120°,180°,240°,300° */}
        <PinDots
          radius={R.outer - 0.045}
          angles={[0, 60, 120, 180, 240, 300]}
          perDotScaleRefs={pinDotScaleRefs}
        />

        {/* Gold arc glow halos (render BEHIND arcs in z) */}
        <group position={[0, 0, Z.frontGlow - Z.front]}>
          <GoldArc
            startDeg={-60}
            endDeg={-28}
            radius={R.outer}
            thickness={0.08}
            color={COLOR.goldGlow}
            matRef={goldGlowMats[0]}
            opacity={0}
          />
          <GoldArc
            startDeg={-12}
            endDeg={12}
            radius={R.outer}
            thickness={0.08}
            color={COLOR.goldGlow}
            matRef={goldGlowMats[1]}
            opacity={0}
          />
          <GoldArc
            startDeg={28}
            endDeg={60}
            radius={R.outer}
            thickness={0.08}
            color={COLOR.goldGlow}
            matRef={goldGlowMats[2]}
            opacity={0}
          />
        </group>

        {/* Gold arcs proper */}
        <GoldArc
          startDeg={-60}
          endDeg={-28}
          radius={R.outer}
          thickness={0.032}
          geomRef={goldArcGeoms[0]}
        />
        <GoldArc
          startDeg={-12}
          endDeg={12}
          radius={R.outer}
          thickness={0.032}
          geomRef={goldArcGeoms[1]}
        />
        <GoldArc
          startDeg={28}
          endDeg={60}
          radius={R.outer}
          thickness={0.032}
          geomRef={goldArcGeoms[2]}
        />
      </group>

      {/* ═══════ MID PLANE (z = 0) ═══════ */}
      <Ring radius={R.mid} thickness={0.01} geomRef={midRingGeom} />
      <Hexagon radius={R.hex} geomRef={hexGeom} />

      {/* ═══════ SPOKES — bridge mid (z=0) → back (z=-0.3) ═══════ */}
      <Spoke
        angleDeg={30}
        innerR={R.coreOuter}
        outerR={R.mid}
        innerZ={Z.back}
        outerZ={Z.mid}
        groupRef={spokeGroupRefs[0]}
      />
      <Spoke
        angleDeg={150}
        innerR={R.coreOuter}
        outerR={R.mid}
        innerZ={Z.back}
        outerZ={Z.mid}
        groupRef={spokeGroupRefs[1]}
      />
      <Spoke
        angleDeg={270}
        innerR={R.coreOuter}
        outerR={R.mid}
        innerZ={Z.back}
        outerZ={Z.mid}
        groupRef={spokeGroupRefs[2]}
      />

      {/* ═══════ BACK PLANE (z = -0.3) ═══════ */}
      <group position={[0, 0, Z.back]}>
        <Ring radius={R.coreOuter} thickness={0.01} geomRef={coreOuterGeom} />
        <CoilFingers perFingerScaleRefs={coilScaleRefs} />
        <Ring radius={R.coreInner} thickness={0.009} geomRef={coreInnerGeom} />
      </group>

      {/* ═══════ TRIANGLE GLOW (z = -0.7) — cyan halo disc ═══════ */}
      <group position={[0, 0, Z.triangleGlow]}>
        <mesh>
          <circleGeometry args={[R.triGlow, 48]} />
          <meshBasicMaterial
            ref={triGlowMat}
            color={COLOR.hudGlow}
            transparent
            opacity={0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ═══════ TRIANGLE CORE (z = -0.5) ═══════ */}
      <group position={[0, 0, Z.triangle]}>
        <TriangleCore
          radius={R.tri}
          rotationRef={triGroupRef}
          fillMatRef={triFillMat}
          edgeMatRef={triEdgeMat}
          edgeGeomRef={triEdgeGeom}
        />
      </group>
    </group>
  );
}

/* ───────── HTML dimension labels (viewport-fixed, outside 3D rotation) ───────── */

function DimensionLabels() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      wrapRef.current?.querySelectorAll(".ar3d-dim").forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
      });
      return;
    }
    const labels = wrapRef.current?.querySelectorAll(".ar3d-dim");
    if (!labels || !labels.length) return;
    const anim = animate(Array.from(labels), {
      opacity: [0, 1],
      duration: 500,
      delay: stagger(110, { start: 3400 }),
      ease: "outQuart",
    });
    return () => {
      anim.pause();
    };
  }, []);

  const labelStyle: React.CSSProperties = {
    position: "absolute",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: COLOR.steel,
    fontFamily: "var(--font-mono)",
    opacity: 0,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none"
      style={{ position: "absolute", inset: 0 }}
    >
      <span
        className="ar3d-dim"
        style={{
          ...labelStyle,
          top: 4,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        R=200
      </span>
      <span
        className="ar3d-dim"
        style={{
          ...labelStyle,
          top: "50%",
          right: 4,
          transform: "translateY(-50%)",
        }}
      >
        3×120°
      </span>
      <span
        className="ar3d-dim"
        style={{
          ...labelStyle,
          bottom: 4,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        Ø90
      </span>
      <span
        className="ar3d-dim"
        style={{
          ...labelStyle,
          top: "50%",
          left: 4,
          transform: "translateY(-50%)",
        }}
      >
        FL-01
      </span>
    </div>
  );
}

/* ───────── Public component ───────── */

type ArcReactor3DProps = {
  /** Maximum visual size in px. Component is responsive up to this cap. */
  size?: number;
  className?: string;
};

const ArcReactor3D = forwardRef<HTMLDivElement, ArcReactor3DProps>(
  function ArcReactor3D({ size = 420, className }, ref) {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          maxWidth: size,
          // Let glow halos + rotation extremes breathe beyond the nominal box.
          // Parent section has overflow:hidden so this is safe.
          overflow: "visible",
        }}
      >
        <Canvas
          orthographic
          camera={{ position: [0, 0, 10], near: 0.01, far: 100 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <AutoZoom />
          <Suspense fallback={null}>
            <ReactorScene />
          </Suspense>
        </Canvas>
        <DimensionLabels />
      </div>
    );
  },
);

export default ArcReactor3D;
