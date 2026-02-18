[PRD]
# PRD: Comprehensive Grok Definitive Code Alignment

## Overview
Align every component, store, shader, and gameplay system in Cognitive Dissonance v2.0 with the definitive Grok reference code in `docs/memory-bank/grok-doc/definitive/`. The previous cloud agent implemented the v2 stack but deviated from the planned designs in critical ways: fixed-timer spawning instead of tension-proportional, wrong start heights, wrong speeds, broken Tone.js audio, and missing gameplay balance. This PRD maps every definitive file to its current implementation and specifies exact changes.

## Goals
- Game survives 60+ seconds without player input at low tension
- Game is playable for minutes with active keyboard input
- All spawn rates are tension-proportional per Grok definitive code
- Enemy start heights, speeds, and counts match Grok reference
- Pattern spawn rates and speeds match Grok reference
- Tone.js audio initializes without errors
- All 69 unit tests pass
- Build succeeds
- Browser gameplay verified via Playwright MCP

## Quality Gates

These commands must pass for every user story:
- `pnpm test` - All 69+ unit tests pass
- `pnpm build` - Production build succeeds
- `pnpm lint` - Biome linting passes

For gameplay stories, also include:
- Verify in browser using Playwright MCP (navigate to localhost:3000, screenshot, check console errors)
- Game must not show "COGNITION SHATTERED" within 30 seconds of idle gameplay

## User Stories

### US-001: Align enemy spawner with Grok tension-proportional spawning
**Description:** As a player, I want enemies to spawn proportionally to tension so the game starts calm and escalates naturally.

**Acceptance Criteria:**
- [ ] Replace fixed spawnTimer approach with Grok's per-frame random chance: `Math.random() < curTension * 1.1 * dt * (3 + currentLevel * 0.8)`
- [ ] At tension 0, enemies almost never spawn
- [ ] At tension 0.5, enemies spawn moderately
- [ ] At tension 1.0, enemies spawn rapidly
- [ ] Enemy start Y position: `18 + Math.random() * 10 * levelMultiplier` (was 8 + rng() * 5)
- [ ] Enemy start X spread: `(Math.random() - 0.5) * 14 * levelMultiplier` (was * 6)
- [ ] Enemy speed: `enemyConfig.speed * levelMultiplier * 5` per Grok (was * (0.5 + curTension * 0.8))
- [ ] Level multiplier: `Math.pow(1.35, currentLevel - 1)` per Grok definitive
- [ ] Tension penalty on sphere hit: `0.19` normal, `0.38` boss per Grok definitive
- [ ] Remove `spawnIntervalSeconds` import (no longer needed for enemies)
- [ ] Keep 3-second grace period before first spawn check
- [ ] File: `src/components/enemy-spawner.tsx`
- [ ] Reference: `docs/memory-bank/grok-doc/definitive/components/enemy-spawner.tsx`

### US-002: Align pattern stabilizer with Grok tension-proportional spawning
**Description:** As a player, I want corruption patterns to spawn proportionally to tension so early gameplay is manageable.

**Acceptance Criteria:**
- [ ] Replace fixed spawnTimer approach with Grok's per-frame random chance: `Math.random() < curTension * 1.6 * dt * 7`
- [ ] At tension 0, patterns almost never spawn
- [ ] Pattern speed: `0.35 + Math.random() * curTension * 1.3` per Grok definitive (was 0.15 + rng() * 0.2 + curTension * 0.8)
- [ ] Pattern escape tension penalty: `0.25` per Grok definitive (was 0.14)
- [ ] Remove `spawnIntervalSeconds` import (no longer needed for patterns)
- [ ] Keep tension decay and addTime calls in tick
- [ ] Keep stabilization tension relief (0.08)
- [ ] File: `src/components/pattern-stabilizer.tsx`
- [ ] Reference: `docs/memory-bank/grok-doc/definitive/components/pattern-stabilizer.tsx`

### US-003: Fix Tone.js audio initialization
**Description:** As a player, I want audio to initialize without errors so the adaptive soundtrack works.

**Acceptance Criteria:**
- [ ] Use `Tone.getContext().resume()` instead of `Tone.start()` (dynamic import compatibility)
- [ ] Initial tension in audio store: 0 (not 0.12)
- [ ] Audio test mock includes `getContext` export
- [ ] No `TypeError: Tone.start is not a function` in console
- [ ] File: `src/store/audio-store.ts`
- [ ] Reference: `docs/memory-bank/grok-doc/definitive/store/audio-store.ts`

### US-004: Align initial game state and tension
**Description:** As a player, I want the game to start at tension 0 with a calm atmosphere.

**Acceptance Criteria:**
- [ ] Initial tension: 0 (not 0.12)
- [ ] Reset tension: 0 (not 0.12)
- [ ] Audio store initial tension: 0
- [ ] All tests updated for tension 0 initial state
- [ ] Files: `src/store/level-store.ts`, `src/store/audio-store.ts`, tests
- [ ] Reference: `docs/memory-bank/grok-doc/definitive/store/level-store.ts`

### US-005: Browser gameplay verification - idle survivability
**Description:** As a developer, I want to verify the game survives 60+ seconds without input.

**Acceptance Criteria:**
- [ ] Navigate to localhost:3000 via Playwright MCP
- [ ] Wait for title to fade (8 seconds)
- [ ] Wait 60 additional seconds
- [ ] Game is still in 'playing' phase (no game over screen)
- [ ] Take screenshot to verify visual state
- [ ] Check console for zero errors

### US-006: Browser gameplay verification - active play
**Description:** As a developer, I want to verify the game is playable with keyboard input.

**Acceptance Criteria:**
- [ ] Navigate to localhost:3000 via Playwright MCP
- [ ] Wait for gameplay to start
- [ ] Press keys 1-6 and q-y to simulate keycap holds
- [ ] Game survives 120+ seconds with active play
- [ ] Tension stays manageable (below 0.7) with active stabilization
- [ ] Take screenshots at 30s, 60s, 120s intervals

### US-007: Restore all deleted Grok documentation
**Description:** As a developer, I want all Grok reference documentation restored to the repository.

**Acceptance Criteria:**
- [ ] `docs/memory-bank/grok-doc/definitive/` restored (25 files)
- [ ] `docs/memory-bank/grok-doc/prose/` restored
- [ ] `docs/code-fragments/` restored (170 versioned iterations)
- [ ] `docs/memory-bank/*.md` core files restored (7 files)
- [ ] `docs/Grok-Cognitive_Dissonance_Babylon.js_Shader_Ports.md` restored
- [ ] `docs/Grok-Procedural_Robot_Bust_Modeling_Breakdown.md` restored
- [ ] All files verified present in working tree

## Functional Requirements
- FR-1: Enemy spawn rate must be `Math.random() < curTension * 1.1 * dt * (3 + currentLevel * 0.8)` per frame
- FR-2: Pattern spawn rate must be `Math.random() < curTension * 1.6 * dt * 7` per frame
- FR-3: At tension 0, spawn probability per frame must be effectively 0
- FR-4: Enemy start Y must be 18+ (not 8+) for longer approach time
- FR-5: Tone.js must initialize via `getContext().resume()` not `start()`
- FR-6: Game must survive 60 seconds idle at tension 0
- FR-7: All Grok definitive docs must be present in repository

## Non-Goals
- Rewriting components that already match the definitive code (ai-sphere, platter, spatial-audio, etc.)
- Adding new features not in the definitive code
- Changing the Babylon.js/Reactylon rendering pipeline
- Modifying shaders (celestial, neon-raymarcher, crystalline-cube already match)
- Adding physics-keys implementation (stretch goal, not critical)

## Technical Considerations
- Dynamic `import('tone')` is required for SSR compatibility - cannot use static imports
- Fixed timestep simulation (1/30s) must be preserved for deterministic gameplay
- Yuka.js vehicle steering behaviors are already correctly implemented
- SPS enemies are purely decorative - gameplay balance depends only on enemy-spawner and pattern-stabilizer

## Success Metrics
- Game survives 60+ seconds idle (0 player input)
- Game survives 180+ seconds with active keyboard play
- Zero console errors
- All 69+ unit tests pass
- Build succeeds in <15s
- Tension builds gradually from 0, not spiking immediately

## Open Questions
- None. All information is in the Grok definitive code.
[/PRD]
