# Active Context — Cognitive Dissonance

## Current State (2026-02-18)

### Branch: `cursor/handoff-documentation-content-4fd6`

### What's Done

- Full foundation: Next.js 16.1.6 + Turbopack + Babylon.js 8 + Reactylon 3.5.4
- React 19, TypeScript 5.9, Tailwind 4
- Biome 2.4.1 — 0 errors, 0 warnings
- `pnpm build` passes (~14s)
- `pnpm dev` starts in 440ms
- All game code under `src/` directory structure
- babel-plugin-reactylon working with Turbopack

#### Core Gameplay (Implemented)
- **Per-color keycap matching**: 12 keycaps with unique HSL colors. Patterns spawn with a seeded `colorIndex`. Only the matching keycap pulls back a pattern. Wrong presses do nothing.
- **Pattern stabilization**: Escaping corruption tendrils spawn from sphere center. Hold matching keycaps to pull them back. Missed patterns → tension spike.
- **Enemy spawner**: Yuka AI with 4 behaviors (seek, wander, zigzag, split). Split enemies spawn 2 smaller seeker children on death.
- **Moment of clarity**: Coherence at 100 triggers brief sphere calm + blue pulse + "COHERENCE MAINTAINED" flash. Then entropy resumes. No win state.
- **Glass sphere**: Celestial nebula shader, tension-driven degradation (color shift, roughness, jitter), shatter particle explosion at max tension.
- **Restart ritual**: After shatter → restart, spheres recreated with GSAP emergence animation + emissive pulse.
- **Heavy industrial platter**: PBR metal base, rim, track. Garage-door keycap emergence with GSAP CustomEase. Metallic dust particles on door open. Recess glow animation pulsing with tension.
- **Diegetic GUI**: Two-layer coherence arc — dim background ring + proportional foreground tube arc.
- **Post-process corruption**: Chromatic aberration + film noise + vignette + scanlines, all driven by tension.
- **SPS enemies**: SolidParticleSystem for dense enemy wave visuals.

#### Audio (Implemented)
- **Tone.js ambient score**: 4 seed-driven layers (drone, pads, glitch, chimes) evolving with tension.
- **Spatial audio**: 3 procedural synth effects — pattern escape whoosh (brown noise + filter sweep), stabilization chime (sine synth, chromatic pitch from colorIndex), glass shatter (white noise + highpass + long reverb).

#### Platform Scaffolds
- **Web**: Full Next.js app, working.
- **Android/iOS**: `native/App.tsx` entry point for Metro bundler (excluded from Next.js).
- **XR**: `xr-session.tsx` stub — checks WebXR, creates default experience with hand tracking.

#### Testing
- **48 Vitest unit tests** — all passing (stores, utilities, shaders)
- **17 Playwright E2E tests** — all passing under xvfb-run with headed Chromium + WebGL
  - Smoke (7): page load, canvas, title, WebGL, console errors, store bridge
  - Gameplay (5): scene visible, game-over, restart, store manipulation, full flow
  - Governor (5): 10s survival, restart cycles, 30s active play, no console errors

#### State Management
- 5 Zustand stores: seed, level, audio, game, input
- Miniplex ECS world with entity archetypes
- Zustand bridge exposed on window for E2E test access

### What's NOT Done

- **Physics keys** (Ammo.js): Stubbed — needs full physics engine integration
- **Visual verification**: No human eye-test of 3D scene rendering quality
- **XR hand tracking interaction**: Stub only — pinch→keycap mapping not wired
- **Mobile touch optimization**: Keycap hit areas may need enlargement for touch
- **Loading screen**: "INITIALIZING CORE" with static sizzle before title
- **High score + seed sharing**: LocalStorage persistence, "Share this dream" button
- **Accessibility**: ARIA labels on keycaps, reduced motion option

### Next Steps

1. Human operator: pull branch, run `pnpm test:e2e` headed in desktop Chrome
2. Visually verify 3D scene quality
3. Merge PR to main
