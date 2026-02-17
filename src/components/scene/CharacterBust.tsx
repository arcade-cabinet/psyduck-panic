/**
 * Character Bust — Rear View (Back of Head + Shoulders)
 *
 * The camera looks over the character's shoulder. We see:
 * - Back of head with brown textured hair (layered shells)
 * - Neck with skin material (veins emerge at high panic)
 * - Shoulders in a t-shirt (rise/bunch with panic)
 * - Subtle ear silhouettes at the sides
 *
 * Tension escalation is CONTINUOUS (panic 0-100):
 *   0-25%:  Relaxed. Shoulders low. Slow breathing.
 *   25-50%: Shoulders rise. Neck tightens. Head micro-jitter begins.
 *   50-75%: Shoulders hunched. Head trembles. Sweat beads. Fabric bunches.
 *   75-99%: Locked shoulders. Violent shake. Veins. Energy crackling.
 *   100%:   Head explosion (handled by parent via game-over state).
 *
 * All geometry is procedural. No external models or textures.
 */

import { useFrame } from '@react-three/fiber';
import type React from 'react';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { colors } from '../../design/tokens';

const ch = colors.character;

// Pre-allocated colors for per-frame lerping (avoid GC)
const _skinBase = new THREE.Color(ch.skin);
const _skinFlush = new THREE.Color(ch.skinFlush);
const _shirtBase = new THREE.Color(ch.shirt);
const _shirtWrinkle = new THREE.Color(ch.shirtWrinkle);
const _tempColor = new THREE.Color();

interface CharacterBustProps {
  panicRef: React.RefObject<number>;
}

export function CharacterBust({ panicRef }: CharacterBustProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shoulderLRef = useRef<THREE.Group>(null);
  const shoulderRRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const neckMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const shirtMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const panic = panicRef.current ?? 0;
    const pNorm = panic / 100; // 0-1

    // ── Breathing ──
    // Frequency: 12 breaths/min at calm → 30 at meltdown
    const breathFreq = 1.2 + pNorm * 1.8; // radians/sec
    const breathAmp = 0.015 * (1 - pNorm * 0.5); // shallower at high panic
    const breathY = Math.sin(t * breathFreq) * breathAmp;

    // ── Shoulder rise ──
    // Shoulders lerp upward with panic: 0 at calm, 0.18 at meltdown
    const shoulderRise = pNorm * pNorm * 0.18; // Quadratic for natural feel

    if (shoulderLRef.current && shoulderRRef.current) {
      const lBaseY = -0.35;
      const rBaseY = -0.35;
      shoulderLRef.current.position.y = lBaseY + shoulderRise + breathY;
      shoulderRRef.current.position.y = rBaseY + shoulderRise + breathY;

      // Shoulders also pinch inward at high panic (trapezius engagement)
      const pinch = pNorm * pNorm * 0.06;
      shoulderLRef.current.position.x = -0.42 + pinch;
      shoulderRRef.current.position.x = 0.42 - pinch;

      // Slight rotation — shoulders hunch forward
      const hunchRot = pNorm * 0.15;
      shoulderLRef.current.rotation.z = -0.1 + hunchRot * 0.3;
      shoulderRRef.current.rotation.z = 0.1 - hunchRot * 0.3;
    }

    // ── Head tremor ──
    if (headRef.current) {
      headRef.current.position.y = 0.15 + shoulderRise * 0.5 + breathY * 0.5;

      if (panic > 25) {
        const tremorAmp = Math.min(0.025, ((panic - 25) / 75) * 0.025);
        const tremorFreq = 8 + pNorm * 20;
        headRef.current.position.x = Math.sin(t * tremorFreq) * tremorAmp;
        headRef.current.rotation.z = Math.sin(t * tremorFreq * 1.3) * tremorAmp * 0.5;
      } else {
        // Subtle idle head movement
        headRef.current.position.x = Math.sin(t * 0.5) * 0.005;
        headRef.current.rotation.z = 0;
      }

      // Head swelling at extreme panic (75%+)
      if (panic > 75) {
        const swell = 1 + ((panic - 75) / 25) * 0.08;
        headRef.current.scale.setScalar(swell);
      } else {
        headRef.current.scale.setScalar(1);
      }
    }

    // ── Neck skin flush ──
    if (neckMatRef.current) {
      const flushT = Math.max(0, (panic - 40) / 60); // starts flushing at 40%
      _tempColor.copy(_skinBase).lerp(_skinFlush, flushT);
      neckMatRef.current.color.copy(_tempColor);
      // Increase sheen at high panic (sweat sheen)
      neckMatRef.current.sheen = Math.min(1, pNorm * 0.8);
      neckMatRef.current.sheenColor.set('#ffffff');
    }

    // ── Shirt material darkens slightly with tension (fabric bunching = shadows) ──
    if (shirtMatRef.current) {
      const bunchT = pNorm * pNorm * 0.3;
      _tempColor.copy(_shirtBase).lerp(_shirtWrinkle, bunchT);
      shirtMatRef.current.color.copy(_tempColor);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {/* ── HEAD GROUP ── */}
      <group ref={headRef} position={[0, 0.15, 0]}>
        <Skull />
        <HairShells panic={panicRef} />
        <EarL />
        <EarR />
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, -0.15, 0.02]}>
        <cylinderGeometry args={[0.12, 0.14, 0.35, 16]} />
        <meshPhysicalMaterial
          ref={neckMatRef}
          color={ch.skin}
          roughness={0.65}
          metalness={0}
          sheen={0}
          sheenRoughness={0.3}
          sheenColor="#ffffff"
        />
      </mesh>

      {/* Neck tendons — become visible at high panic */}
      <NeckTendons panicRef={panicRef} />

      {/* ── LEFT SHOULDER ── */}
      <group ref={shoulderLRef} position={[-0.42, -0.35, 0]}>
        <Shoulder side="left" shirtMatRef={shirtMatRef} />
      </group>

      {/* ── RIGHT SHOULDER ── */}
      <group ref={shoulderRRef} position={[0.42, -0.35, 0]}>
        <Shoulder side="right" shirtMatRef={null} />
      </group>

      {/* ── TORSO (upper back, visible between shoulders) ── */}
      <mesh position={[0, -0.5, 0.05]}>
        <boxGeometry args={[0.7, 0.45, 0.3]} />
        <meshStandardMaterial color={ch.shirt} roughness={0.85} />
      </mesh>

      {/* T-shirt collar */}
      <mesh position={[0, -0.15, -0.02]} rotation={[0.1, 0, 0]}>
        <torusGeometry args={[0.14, 0.02, 8, 24, Math.PI]} />
        <meshStandardMaterial color={ch.shirtWrinkle} roughness={0.8} />
      </mesh>

      {/* ── SWEAT BEADS (appear at 50%+ panic) ── */}
      <SweatBeads panicRef={panicRef} />

      {/* ── ENERGY CRACKLING (75%+ panic) ── */}
      <EnergyCrackling panicRef={panicRef} />

      {/* ── STEAM/HEAT (80%+ panic) ── */}
      <HeatDistortion panicRef={panicRef} />
    </group>
  );
}

// ─── Skull (back of head) ─────────────────────────────────────

function Skull() {
  // Anatomically proportioned skull from behind
  // Occipital curve (back bump), temporal ridges on sides
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.32, 32, 24);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);

      // Flatten the front face (we don't see it)
      if (v.z > 0.15) {
        v.z = 0.15 + (v.z - 0.15) * 0.3;
      }

      // Occipital bump — slight protrusion at the back-bottom of skull
      const occipitalAngle = Math.atan2(v.y + 0.05, -v.z);
      if (v.z < -0.1 && v.y < 0 && v.y > -0.25) {
        const bump = Math.cos(occipitalAngle * 2) * 0.03;
        v.z -= bump;
      }

      // Temporal ridges — slight widening at the sides
      const lateralDist = Math.abs(v.x);
      if (lateralDist > 0.2 && v.y > -0.1 && v.y < 0.15) {
        v.x *= 1.03;
      }

      // Slight vertical elongation for natural head shape
      v.y *= 1.08;

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={ch.skin}
        roughness={0.6}
        metalness={0}
        sheen={0.1}
        sheenRoughness={0.5}
        sheenColor="#ffddcc"
      />
    </mesh>
  );
}

// ─── Hair Shells ──────────────────────────────────────────────

function HairShells({ panic }: { panic: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const shellCount = 6;

  // Each shell is a slightly scaled sphere with hair-colored material
  const shells = useMemo(() => {
    return Array.from({ length: shellCount }, (_, i) => {
      const offset = i * 0.008; // Each layer slightly larger
      const opacity = 1 - i * 0.12; // Outer shells more transparent
      return { offset, opacity, key: `hair-${i}` };
    });
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const p = (panic.current ?? 0) / 100;

    // Hair stands on end with panic — rotate shells outward
    groupRef.current.children.forEach((child, i) => {
      const shell = child as THREE.Mesh;
      // Panic makes hair rise: shells displace upward
      const riseAmount = p * p * 0.02 * (i + 1);
      shell.position.y = 0.05 + riseAmount;

      // Slight disheveling — shells jitter at high panic
      if (p > 0.5) {
        const jitter = (p - 0.5) * 0.01 * (i + 1);
        shell.position.x = Math.sin(t * 3 + i * 1.5) * jitter;
      } else {
        shell.position.x = 0;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0.05, -0.05]}>
      {shells.map((s, i) => (
        <HairShell key={s.key} index={i} offset={s.offset} opacity={s.opacity} />
      ))}
    </group>
  );
}

function HairShell({ index, offset, opacity }: { index: number; offset: number; opacity: number }) {
  const geometry = useMemo(() => {
    // Half-sphere covering the back of the head
    const geo = new THREE.SphereGeometry(
      0.33 + offset,
      24,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.65 // Only cover top ~65% of sphere
    );

    // Cut off the front — hair is on the back of head
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.z > 0.1) {
        v.z = 0.1 + (v.z - 0.1) * 0.15; // Flatten front significantly
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, [offset]);

  // Alternate between base hair color and highlights for depth
  const hairColor = index % 2 === 0 ? ch.hair : ch.hairHighlight;

  return (
    <mesh geometry={geometry} position={[0, 0, 0]}>
      <meshStandardMaterial
        color={hairColor}
        roughness={0.75 - index * 0.03}
        metalness={0.05}
        transparent={opacity < 1}
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Ears ─────────────────────────────────────────────────────

function EarL() {
  return (
    <mesh position={[-0.3, -0.02, 0.05]} rotation={[0, -0.3, 0]}>
      <sphereGeometry args={[0.06, 8, 8, 0, Math.PI]} />
      <meshPhysicalMaterial color={ch.skin} roughness={0.6} sheen={0.1} sheenColor="#ffddcc" />
    </mesh>
  );
}

function EarR() {
  return (
    <mesh position={[0.3, -0.02, 0.05]} rotation={[0, 0.3, 0]}>
      <sphereGeometry args={[0.06, 8, 8, 0, Math.PI]} />
      <meshPhysicalMaterial color={ch.skin} roughness={0.6} sheen={0.1} sheenColor="#ffddcc" />
    </mesh>
  );
}

// ─── Shoulder ─────────────────────────────────────────────────

function Shoulder({
  side,
  shirtMatRef,
}: {
  side: 'left' | 'right';
  shirtMatRef: React.RefObject<THREE.MeshStandardMaterial | null> | null;
}) {
  const scaleX = side === 'left' ? 1 : -1;

  return (
    <group scale={[scaleX, 1, 1]}>
      {/* Deltoid — rounded shoulder cap */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial
          ref={side === 'left' ? shirtMatRef : undefined}
          color={ch.shirt}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      {/* Upper arm taper */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.15, 0.3, 12]} />
        <meshStandardMaterial color={ch.shirt} roughness={0.85} />
      </mesh>
      {/* Trapezius slope — connects shoulder to neck */}
      <mesh position={[0.18, 0.15, 0]} rotation={[0, 0, 0.6]}>
        <cylinderGeometry args={[0.08, 0.14, 0.25, 8]} />
        <meshStandardMaterial color={ch.shirt} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ─── Neck Tendons ─────────────────────────────────────────────

function NeckTendons({ panicRef }: { panicRef: React.RefObject<number> }) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const panic = panicRef.current ?? 0;
    // Tendons become visible above 50% panic
    const visibility = Math.max(0, (panic - 50) / 50);

    if (leftRef.current) {
      leftRef.current.visible = panic > 50;
      (leftRef.current.material as THREE.MeshStandardMaterial).opacity = visibility * 0.6;
    }
    if (rightRef.current) {
      rightRef.current.visible = panic > 50;
      (rightRef.current.material as THREE.MeshStandardMaterial).opacity = visibility * 0.6;
    }
  });

  return (
    <>
      <mesh
        ref={leftRef}
        position={[-0.08, -0.12, -0.08]}
        rotation={[0.1, 0, -0.15]}
        visible={false}
      >
        <cylinderGeometry args={[0.008, 0.01, 0.3, 6]} />
        <meshStandardMaterial color={ch.neckVein} transparent opacity={0} roughness={0.5} />
      </mesh>
      <mesh
        ref={rightRef}
        position={[0.08, -0.12, -0.08]}
        rotation={[0.1, 0, 0.15]}
        visible={false}
      >
        <cylinderGeometry args={[0.008, 0.01, 0.3, 6]} />
        <meshStandardMaterial color={ch.neckVein} transparent opacity={0} roughness={0.5} />
      </mesh>
    </>
  );
}

// ─── Sweat Beads ──────────────────────────────────────────────

function SweatBeads({ panicRef }: { panicRef: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);

  // Pre-generate bead positions on neck/shoulder area
  const beadData = useMemo(
    () =>
      Array.from({ length: 12 }, (_) => ({
        id: `sweat-${Math.random().toString(36).slice(2, 8)}`,
        x: (Math.random() - 0.5) * 0.3,
        y: -0.05 + Math.random() * -0.2,
        z: -0.1 + Math.random() * -0.05,
        threshold: 50 + Math.random() * 30, // Each bead appears at different panic
      })),
    []
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const panic = panicRef.current ?? 0;

    groupRef.current.children.forEach((child, i) => {
      const bead = beadData[i];
      child.visible = panic > bead.threshold;
    });
  });

  return (
    <group ref={groupRef}>
      {beadData.map((bead) => (
        <mesh key={bead.id} position={[bead.x, bead.y, bead.z]} visible={false}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshPhysicalMaterial
            color={ch.sweat}
            roughness={0.1}
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.05}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Energy Crackling (75%+ panic) ────────────────────────────

function EnergyCrackling({ panicRef }: { panicRef: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);

  // Pre-generate arc positions around the head
  const arcs = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return {
          id: `arc-${i}-${Math.random().toString(36).slice(2, 6)}`,
          x: Math.cos(angle) * 0.45,
          y: 0.1 + Math.sin(angle * 2) * 0.15,
          z: Math.sin(angle) * 0.45,
          phase: Math.random() * Math.PI * 2,
        };
      }),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const panic = panicRef.current ?? 0;
    const t = clock.elapsedTime;

    const visible = panic > 75;
    groupRef.current.visible = visible;

    if (visible) {
      const intensity = (panic - 75) / 25;
      groupRef.current.children.forEach((child, i) => {
        const arc = arcs[i];
        // Flicker: randomly show/hide arcs
        child.visible = Math.sin(t * 12 + arc.phase) > 0.3 - intensity * 0.5;
        // Rotate the whole group
        child.position.set(
          arc.x + Math.sin(t * 5 + arc.phase) * 0.05,
          arc.y + Math.cos(t * 7 + arc.phase) * 0.03,
          arc.z + Math.sin(t * 6 + arc.phase * 2) * 0.05
        );
        // Scale with intensity
        child.scale.setScalar(0.5 + intensity * 0.8);
      });

      groupRef.current.rotation.y = t * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.15, 0]} visible={false}>
      {arcs.map((arc) => (
        <mesh key={arc.id}>
          <boxGeometry args={[0.15, 0.01, 0.01]} />
          <meshBasicMaterial color="#00ccff" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Heat Distortion (80%+ panic) ─────────────────────────────

function HeatDistortion({ panicRef }: { panicRef: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);

  // Rising heat wisps above the head
  const wisps = useMemo(
    () =>
      Array.from({ length: 5 }, (_) => ({
        id: `wisp-${Math.random().toString(36).slice(2, 8)}`,
        x: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const panic = panicRef.current ?? 0;
    const t = clock.elapsedTime;

    const visible = panic > 80;
    groupRef.current.visible = visible;

    if (visible) {
      const intensity = (panic - 80) / 20;
      groupRef.current.children.forEach((child, i) => {
        const wisp = wisps[i];
        // Rising, oscillating wisps
        const yOffset = ((t * wisp.speed + wisp.phase) % 1) * 0.6;
        child.position.set(wisp.x + Math.sin(t * 2 + wisp.phase) * 0.05, 0.4 + yOffset, -0.1);
        (child as THREE.Mesh).scale.set(0.3 + intensity * 0.3, 0.02, 0.02);
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - yOffset / 0.6) * 0.3 * intensity;
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} visible={false}>
      {wisps.map((wisp) => (
        <mesh key={wisp.id}>
          <planeGeometry args={[0.3, 0.02]} />
          <meshBasicMaterial color="#ff8844" transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
