/**
 * 3D Mechanical Keyboard Controls — F1-F4 Function Keys
 *
 * The keyboard IS the tension indicator. No separate panic bar needed.
 *
 * RGB Backlighting System:
 * - Per-key LED strips with independent color animation
 * - Continuous spectrum: deep blue → cyan → green → yellow → orange → red
 * - Rolling wave pattern that travels across keys
 * - Pulse frequency and emissive intensity rise with panic
 * - Edge-lit RGB strips on the keyboard case
 * - The whole keyboard glows brighter and more frantically as tension rises
 *
 * Also: type-colored keycaps, physical depression, cooldown fill, labels.
 */

import { Billboard, Text } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { colors } from '../../design/tokens';

// ─── Types ───────────────────────────────────────────────────

export interface CooldownState {
  abilityCd: { reality: number; history: number; logic: number };
  abilityMax: { reality: number; history: number; logic: number };
  nukeCd: number;
  nukeMax: number;
}

interface KeyboardControlsProps {
  panicRef: React.RefObject<number>;
  cooldownRef: React.RefObject<CooldownState>;
  onAbility: (type: 'reality' | 'history' | 'logic') => void;
  onNuke: () => void;
}

// ─── Key definitions ─────────────────────────────────────────

interface KeyDef {
  id: string;
  label: string;
  name: string;
  icon: string;
  color: string;
  abilityType: 'reality' | 'history' | 'logic' | null;
}

const KEY_DEFS: KeyDef[] = [
  {
    id: 'f1',
    label: 'F1',
    name: 'REALITY',
    icon: '\u{1F9A0}',
    color: colors.accent.reality,
    abilityType: 'reality',
  },
  {
    id: 'f2',
    label: 'F2',
    name: 'HISTORY',
    icon: '\u{1F4C8}',
    color: colors.accent.history,
    abilityType: 'history',
  },
  {
    id: 'f3',
    label: 'F3',
    name: 'LOGIC',
    icon: '\u{1F916}',
    color: colors.accent.logic,
    abilityType: 'logic',
  },
  {
    id: 'f4',
    label: 'F4',
    name: 'NUKE',
    icon: '\u{1F4A5}',
    color: colors.semantic.error,
    abilityType: null,
  },
];

// ─── Dimensions ──────────────────────────────────────────────

const KEY_W = 0.8;
const KEY_D = 0.5;
const KEY_H = 0.07;
const KEY_GAP = 0.1;
const KEY_SPACING = KEY_W + KEY_GAP;
const TOTAL_W = KEY_DEFS.length * KEY_W + (KEY_DEFS.length - 1) * KEY_GAP;
const START_X = -TOTAL_W / 2 + KEY_W / 2;

// Reusable colors for per-frame updates (avoid allocations)
const _gray = new THREE.Color('#333333');
const _full = new THREE.Color();
const _rgbColor = new THREE.Color();

/**
 * Compute panic-driven RGB along a continuous spectrum.
 * 0% = deep blue, 20% = cyan, 40% = green, 60% = yellow, 80% = orange, 100% = red
 * Returns a THREE.Color to avoid allocations.
 */
function panicToRgbColor(panic: number, phaseOffset: number, time: number): THREE.Color {
  // Rolling wave: each key has a phase offset that creates a traveling wave effect
  const waveSpeed = 2 + (panic / 100) * 6; // Wave travels faster at high panic
  const wave = Math.sin(time * waveSpeed + phaseOffset) * 0.5 + 0.5;
  // The wave shifts the hue position
  const hueShift = wave * 0.08;

  // Map panic 0-100 to hue: 0.6 (blue) → 0.5 (cyan) → 0.33 (green) → 0.16 (yellow) → 0.08 (orange) → 0 (red)
  const baseHue = 0.6 - (panic / 100) * 0.6;
  const hue = Math.max(0, Math.min(1, baseHue + hueShift));

  // Saturation: always high but dips slightly at low panic for calmer feel
  const saturation = 0.7 + (panic / 100) * 0.3;

  // Lightness: brighter at higher panic
  const lightness = 0.45 + (panic / 100) * 0.15;

  _rgbColor.setHSL(hue, saturation, lightness);
  return _rgbColor;
}

// ─── Main Component ──────────────────────────────────────────

export function KeyboardControls({
  panicRef,
  cooldownRef,
  onAbility,
  onNuke,
}: KeyboardControlsProps) {
  return (
    <group position={[0, -1.92, 0.6]} rotation={[-0.12, 0, 0]}>
      {/* Keyboard case — brushed aluminum housing with chamfered edges */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[TOTAL_W + 0.45, 0.06, KEY_D + 0.35]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          roughness={0.35}
          metalness={0.85}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
        />
      </mesh>

      {/* Plate surface — anodized aluminum */}
      <mesh position={[0, -0.009, 0]}>
        <boxGeometry args={[TOTAL_W + 0.35, 0.005, KEY_D + 0.2]} />
        <meshPhysicalMaterial
          color="#0f0f1e"
          roughness={0.25}
          metalness={0.92}
          clearcoat={0.2}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* Plate front edge — chamfered highlight */}
      <mesh position={[0, -0.01, (KEY_D + 0.3) / 2]}>
        <boxGeometry args={[TOTAL_W + 0.45, 0.015, 0.025]} />
        <meshPhysicalMaterial color="#2a2a4a" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Screw details on plate corners */}
      {[
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].map(([sx, sz]) => (
        <mesh
          key={`screw-${sx}-${sz}`}
          position={[sx * (TOTAL_W / 2 + 0.12), -0.006, sz * (KEY_D / 2 + 0.08)]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.012, 0.012, 0.008, 6]} />
          <meshStandardMaterial color="#444466" roughness={0.2} metalness={0.95} />
        </mesh>
      ))}

      {/* RGB edge-lit strips — left and right sides of case */}
      <RGBEdgeStrip panicRef={panicRef} side={-1} />
      <RGBEdgeStrip panicRef={panicRef} side={1} />

      {/* RGB underglow — main point light driven by panic */}
      <RGBUnderglow panicRef={panicRef} />

      {/* F-Keys with per-key RGB backlighting */}
      {KEY_DEFS.map((def, i) => (
        <FKey
          key={def.id}
          keyDef={def}
          keyIndex={i}
          position={[START_X + i * KEY_SPACING, 0, 0]}
          panicRef={panicRef}
          cooldownRef={cooldownRef}
          onPress={
            def.abilityType
              ? () => onAbility(def.abilityType as 'reality' | 'history' | 'logic')
              : onNuke
          }
        />
      ))}
    </group>
  );
}

// ─── RGB Edge-Lit Strip (left/right case sides) ─────────────

function RGBEdgeStrip({ panicRef, side }: { panicRef: React.RefObject<number>; side: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const p = panicRef.current ?? 0;
    const t = clock.elapsedTime;
    const pNorm = p / 100;

    const color = panicToRgbColor(p, side * 1.5, t);
    matRef.current.emissive.copy(color);

    // Pulse: breathing at low panic, frantic strobe at high panic
    const pulseSpeed = 2 + pNorm * 8;
    const pulseDepth = 0.15 + pNorm * 0.35;
    const pulse = 1 - Math.sin(t * pulseSpeed) * pulseDepth;
    matRef.current.emissiveIntensity = (0.3 + pNorm * 0.7) * pulse;
  });

  return (
    <mesh position={[side * (TOTAL_W / 2 + 0.21), -0.03, 0]} rotation={[0, 0, side * 0.05]}>
      <boxGeometry args={[0.015, 0.04, KEY_D + 0.25]} />
      <meshStandardMaterial
        ref={matRef}
        color="#080812"
        emissive="#3388ff"
        emissiveIntensity={0.3}
        roughness={0.2}
        metalness={0.1}
      />
    </mesh>
  );
}

// ─── RGB Underglow Light ─────────────────────────────────────

function RGBUnderglow({ panicRef }: { panicRef: React.RefObject<number> }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const p = panicRef.current ?? 0;
    const t = clock.elapsedTime;
    const pNorm = p / 100;

    const color = panicToRgbColor(p, 0, t);
    lightRef.current.color.copy(color);

    // Intensity ramps with panic, with breathing pulse
    const pulseSpeed = 2 + pNorm * 6;
    const pulse = 1 + Math.sin(t * pulseSpeed) * (0.1 + pNorm * 0.3);
    lightRef.current.intensity = (1.2 + pNorm * 2.5) * pulse;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, -0.08, 0]}
      intensity={1.5}
      distance={3}
      decay={2}
      color={colors.scene.monitorGlow}
    />
  );
}

// ─── Individual F-Key ────────────────────────────────────────

interface FKeyProps {
  keyDef: KeyDef;
  keyIndex: number;
  position: [number, number, number];
  panicRef: React.RefObject<number>;
  cooldownRef: React.RefObject<CooldownState>;
  onPress: () => void;
}

function FKey({ keyDef, keyIndex, position, panicRef, cooldownRef, onPress }: FKeyProps) {
  const keycapGroupRef = useRef<THREE.Group>(null);
  const keycapMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ledMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const cooldownBarRef = useRef<THREE.Mesh>(null);
  const perKeyLightRef = useRef<THREE.PointLight>(null);
  const pressYRef = useRef(0);
  const isPressedRef = useRef(false);

  // Phase offset for wave effect: each key gets a different phase
  const phaseOffset = keyIndex * 1.2;

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
      isPressedRef.current = false;
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = panicRef.current ?? 0;
    const pNorm = p / 100;

    // ── Spring animation for key press ──
    const target = isPressedRef.current ? -0.05 : 0;
    pressYRef.current += (target - pressYRef.current) * 0.25;
    if (keycapGroupRef.current) {
      keycapGroupRef.current.position.y = pressYRef.current;
    }

    // ── Get cooldown state ──
    const cd = cooldownRef.current;
    if (!cd) return;
    let remaining: number;
    let max: number;
    if (keyDef.abilityType) {
      remaining = cd.abilityCd[keyDef.abilityType];
      max = cd.abilityMax[keyDef.abilityType];
    } else {
      remaining = cd.nukeCd;
      max = cd.nukeMax;
    }
    const ready = remaining <= 0;
    const progress = max > 0 ? Math.max(0, 1 - remaining / max) : 1;

    // ── Keycap color: gray when cooling down, type color when ready ──
    if (keycapMatRef.current) {
      if (ready) {
        keycapMatRef.current.color.set(keyDef.color);
        keycapMatRef.current.emissive.set(keyDef.color);
        keycapMatRef.current.emissiveIntensity = 0.2;
      } else {
        _full.set(keyDef.color);
        keycapMatRef.current.color.copy(_gray).lerp(_full, progress);
        keycapMatRef.current.emissive.copy(_gray).lerp(_full, progress * 0.5);
        keycapMatRef.current.emissiveIntensity = 0.05 + progress * 0.15;
      }
    }

    // ── Cooldown bar ──
    if (cooldownBarRef.current) {
      if (ready) {
        cooldownBarRef.current.visible = false;
      } else {
        cooldownBarRef.current.visible = true;
        cooldownBarRef.current.scale.x = Math.max(0.01, progress);
        cooldownBarRef.current.position.x = -(KEY_W * (1 - progress)) / 2;
      }
    }

    // ── Per-key RGB LED backlighting ──
    const rgbColor = panicToRgbColor(p, phaseOffset, t);

    if (ledMatRef.current) {
      ledMatRef.current.emissive.copy(rgbColor);

      // Pulse: breathing pattern that gets faster and deeper with panic
      const pulseSpeed = 2 + pNorm * 8;
      const pulseDepth = 0.1 + pNorm * 0.4;
      const keyPulse = Math.sin(t * pulseSpeed + phaseOffset * 0.5);
      const intensityBase = ready ? 0.5 + pNorm * 1.2 : 0.1;
      ledMatRef.current.emissiveIntensity = intensityBase + keyPulse * pulseDepth * intensityBase;
    }

    // ── Per-key point light (spills RGB onto desk/case) ──
    if (perKeyLightRef.current) {
      perKeyLightRef.current.color.copy(rgbColor);
      const lightPulse = Math.sin(t * (3 + pNorm * 5) + phaseOffset);
      perKeyLightRef.current.intensity = (0.2 + pNorm * 0.6) * (1 + lightPulse * 0.3);
    }
  });

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      isPressedRef.current = true;
      onPress();
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    },
    [onPress]
  );

  const handlePointerUp = useCallback(() => {
    isPressedRef.current = false;
  }, []);

  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
    isPressedRef.current = false;
  }, []);

  return (
    <group position={position}>
      {/* Switch well — recessed dark area under the keycap */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[KEY_W + 0.02, 0.04, KEY_D + 0.02]} />
        <meshStandardMaterial color="#060610" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* Switch housing visible between keycap and plate */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[KEY_W * 0.5, 0.015, KEY_D * 0.5]} />
        <meshStandardMaterial color="#333344" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* RGB LED strip — emissive plane under the keycap gap */}
      <mesh position={[0, -0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[KEY_W - 0.04, KEY_D - 0.04]} />
        <meshStandardMaterial
          ref={ledMatRef}
          color="#080808"
          emissive="#3388ff"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Per-key RGB point light — spills color below */}
      <pointLight
        ref={perKeyLightRef}
        position={[0, -0.04, 0]}
        intensity={0.3}
        distance={1.0}
        decay={2}
        color="#3388ff"
      />

      {/* Keycap — sculpted with rounded edges, slight concave dish */}
      <group ref={keycapGroupRef}>
        {/* Main keycap body with draft angle */}
        <mesh
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[KEY_W, KEY_H, KEY_D]} />
          <meshPhysicalMaterial
            ref={keycapMatRef}
            color={keyDef.color}
            emissive={keyDef.color}
            emissiveIntensity={0.2}
            roughness={0.35}
            metalness={0.05}
            clearcoat={0.4}
            clearcoatRoughness={0.15}
          />
        </mesh>

        {/* Keycap top edge highlight — simulates rounded edge catch-light */}
        <mesh position={[0, KEY_H / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[KEY_W - 0.04, KEY_D - 0.04]} />
          <meshBasicMaterial color="white" transparent opacity={0.06} />
        </mesh>

        {/* Cooldown progress bar — front face of keycap */}
        <mesh
          ref={cooldownBarRef}
          position={[0, KEY_H / 2 + 0.005, KEY_D / 2 + 0.001]}
          visible={false}
        >
          <planeGeometry args={[KEY_W, 0.02]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>

        {/* Labels — Billboard so always readable from camera */}
        <Billboard position={[0, KEY_H / 2 + 0.02, 0]}>
          {/* F-key label */}
          <Text
            position={[0, 0.1, 0]}
            fontSize={0.055}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.004}
            outlineColor="black"
          >
            {keyDef.label}
          </Text>
          {/* Emoji icon */}
          <Text position={[0, 0.02, 0]} fontSize={0.1} anchorX="center" anchorY="middle">
            {keyDef.icon}
          </Text>
          {/* Ability name */}
          <Text
            position={[0, -0.06, 0]}
            fontSize={0.04}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.003}
            outlineColor="black"
          >
            {keyDef.name}
          </Text>
        </Billboard>
      </group>
    </group>
  );
}
