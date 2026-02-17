# Design Vision — Photorealistic Procedural Generation

## Goal

Every visual element in Psyduck Panic must be **photorealistic, fully procedural, and fully immersive**. No placeholders, no "low-poly charm," no flat-shaded primitives standing in for real objects. The player should feel like they are looking into a real late-night bedroom through a diorama window.

All geometry is procedurally generated via Three.js — no external 3D model files, no image textures. Realism comes from **complex curves, detailed geometry, PBR materials, and sophisticated lighting** — not from imported assets.

## Narrative Context

This is a **missile-command-style defense game**. The escalating conflict is **disruptive AI** — rogue hallucinations manifest as thought bubbles (enemies) that rain down on the player's character. If not countered (knocked out), the hallucinations cause the human character to **visibly increase in tension and headache**. The physical distress is progressive and must be communicated through the visuals:

- **0-33% panic**: Subtle tension — slight forehead crease, jaw clenching, occasional eye rub
- **33-66% panic**: Visible headache — temples pulsing, squinting, hands pressing temples, sweat beads, reddening skin, erratic posture
- **66-99% panic**: Near-transformation — skin yellowing, features morphing duck-ward, feathers emerging through skin, head expanding, psychic energy crackling around skull
- **100% panic**: Full Psyduck transformation — game over

The transformation is NOT a costume swap. It is a **gradual, unsettling, visceral morph** where the human anatomy warps into Psyduck anatomy over the full 0-100% range. Every intermediate state should look disturbingly organic — like watching a person slowly turn into something else.

## Quality Bar

Every 3D element must meet ALL of these criteria before it ships:

1. **Complex geometry** — Organic shapes use subdivision, smooth curves, bevels, and anatomical proportions. No raw sphere-for-head, box-for-arm primitives.
2. **PBR materials** — Every surface has appropriate roughness, metalness, normal perturbation (procedural or computed), and clearcoat where applicable. Skin looks like skin. Wood looks like wood. Metal looks like metal.
3. **Material variety** — Different surfaces on the same object (e.g., shirt fabric vs. skin vs. hair) use distinct material properties, not just different colors on the same material.
4. **Subsurface effects** — Skin and translucent materials (lampshades, energy drink cans) use subsurface scattering or approximations thereof.
5. **Specular highlights and reflections** — Glossy surfaces (monitor glass, coffee mug glaze, keyboard keycaps) show environment-mapped reflections or procedural environment approximations.
6. **Procedural textures** — Wood grain, fabric weave, wall paint texture, floor material, paper fiber — all generated via shader noise (Simplex, Perlin, Worley) or procedural patterns, not flat hex colors.
7. **Ambient occlusion** — Contact shadows in crevices (between keyboard keys, under desk edge, where character sits).
8. **Physically correct lighting** — Area lights where appropriate, proper falloff, color temperature consistency between light sources.

## Element-by-Element Requirements

### Character (Continuous Morph: Human → Psyduck)

**Current state**: Sphere body, sphere head, cone hair, box arms — placeholder primitives with discrete state swaps at 33%/66% thresholds.

**Target state — Continuous morph driven by panic 0-100%**:

The character is NOT three separate models. It is a **single parameterized mesh** that continuously morphs from human to Psyduck as panic increases. Every frame, the mesh interpolates between human and Psyduck vertex positions based on `panic / 100`.

**Human form (panic 0%)**:
- **Body**: Sculpted torso with chest, shoulders, and waist definition using parametric geometry or Catmull-Clark subdivision. Shirt fabric material with procedural weave pattern and subtle wrinkles.
- **Head**: Anatomically proportioned with chin, jaw, forehead curvature. Nose and ear geometry present.
- **Hair**: Volumetric strands or shell-based rendering. Multiple layers with color variation.
- **Skin**: Subsurface scattering approximation (MeshPhysicalMaterial sheen). Pores via procedural noise.
- **Eyes**: 3D eyeball geometry with iris, pupil, sclera, corneal highlight. Eyelids with blink.
- **Arms/Hands**: Articulated with elbow joints, suggested fingers.
- **Expression**: Relaxed, neutral, slight concern.

**Tension escalation (panic 10-33%)**:
- Forehead crease deepens (vertex displacement on brow)
- Jaw clenches (jaw vertices pull inward)
- Occasional eye rub animation trigger
- Skin tone shifts slightly warmer/redder (material color lerp)
- Posture stiffens (spine straightens, shoulders rise)
- Hair becomes slightly disheveled (strand displacement increases)

**Visible headache (panic 33-66%)**:
- Temples visibly pulse (vertex animation on temple area, in/out with heartbeat rhythm that accelerates with panic)
- Eyes squint (eyelid vertices lower)
- Hands rise toward temples/forehead (arm IK targets shift upward)
- Sweat beads appear (small glossy sphere instances on forehead, growing in count)
- Skin reddens progressively (material color shifts toward flush)
- Erratic micro-movements in posture (jitter amplitude increases)
- Hair stands progressively more on end (strand direction rotates upward)

**Near-transformation (panic 66-99%)**:
- **Skin yellowing** — material color lerps from flesh toward Psyduck gold (#f1c40f)
- **Features morphing** — nose flattens and pushes forward toward beak shape (vertex morph targets), mouth widens
- **Feathers emerging** — procedural displacement on skin surface creates feather-like bumps, growing in coverage with panic
- **Head expanding** — skull vertices scale outward gradually, proportions shift from human to duck
- **Psychic energy** — crackling energy arcs around skull (animated line geometry with glow), aura rings materialize
- **Eyes widen and simplify** — iris detail fades, eyes become rounder/larger/more vacant
- **Body swells** — torso inflates, limbs shorten proportionally toward duck anatomy
- **Wings emerge** — arms flatten and widen, fingers merge, arm material shifts from fabric to feathered

**Full Psyduck (panic 100% = game over)**:
- Complete duck anatomy — round body, bill, stubby wings, three-tuft head hair
- Feathered surface material (golden yellow with procedural displacement)
- Vacant psychic stare (large round eyes, tiny pupils)
- Psychic aura at full intensity — multiple concentric rings, lightning arcs, head-hold pose

### Room Environment

**Current state**: Flat plane walls, flat plane floor, box desk — no textures.

**Target state**:
- **Walls**: Procedural paint texture with subtle roller marks (Perlin noise normal map). Visible in monitor glow.
- **Floor**: Procedural wood or carpet. Wood: grain pattern via layered noise. Carpet: short-pile fiber appearance via noise-based displacement.
- **Desk**: Wood grain procedural texture on top surface. Rounded edge profile (beveled box or lathe geometry). Visible grain catch light differently than walls.
- **Monitor**: Glossy glass surface with reflections (environment map or screen-space). Thin bezel with chamfered edges. IPS glow bleed at edges.
- **Monitor stand**: Metal arm with brushed aluminum material (anisotropic highlight).
- **Mouse**: Ergonomic curved shape (parametric surface), not a flat box. Matte plastic material with subtle texture.
- **Coffee mug**: Ceramic material with glaze (high-gloss clearcoat). Handle geometry. Visible liquid surface with meniscus.
- **Keyboard**: See "Mechanical Keyboard" section below for full requirements.
- **Window**: Glass material with subtle refraction/reflection. Condensation procedural effect at high panic.
- **Books**: Visible page edges (layered geometry), spine curvature, different cover materials.
- **Energy drinks**: Cylindrical with pull-tab geometry, metallic aluminum material, condensation droplets at high wave tiers.

### Mechanical Keyboard (F1-F4 Controls)

**Current state**: Flat box keycaps on a flat box plate. No sculpted profile, no visible switches, no light bleed.

**Target state — A single photorealistic mechanical keyboard section**:

This is the player's primary input device and must feel **deeply satisfying** to interact with. It sits on the desk as a physical object in the diorama.

**Geometry**:
- **Keycaps**: Sculpted Cherry/OEM profile with concave top dish, rounded edges, and slight draft angle on sides. Each keycap is a proper 3D shape, not a box. Legend text (F1, F2, F3, F4) is inset/recessed into the keycap surface, not a billboard floating above.
- **Switches**: Cherry MX-style switch housing visible through the gap between keycap and plate. Cross-stem visible on keycap underside.
- **Plate**: Brushed aluminum with anisotropic highlights. Screw holes or mounting detail visible.
- **Case**: Surrounding keyboard case with rounded corners, chamfered edges. Material: dark anodized aluminum or high-quality ABS plastic with subtle texture.

**Depress animation**:
- Authentic mechanical key travel: ~4mm with proper spring-back curve (not linear lerp).
- Two-stage feel: initial resistance → tactile bump → bottoming out → spring return.
- Keycap tilts very slightly on off-center presses (micro-rotation).
- Adjacent keycaps show micro-vibration on a hard press (sympathetic movement).

**Sound design**:
- **Keydown**: Satisfying tactile "thock" — the deep, resonant sound of a quality mechanical switch. Not a thin click. Synthesized via Web Audio with attack transient + resonant body + dampened release.
- **Key return**: Softer upstroke sound as spring returns keycap to rest.
- **Bottoming out**: Subtle impact sound that varies slightly per-key (pitch variation for realism).
- Sound characteristics shift with panic: calm → crisp clean thocks; high panic → slightly more aggressive/reverberant.

**Haptics** (mobile/gamepad):
- Keydown: Short, sharp haptic pulse (10ms).
- Matches the mechanical switch feel — not a generic buzz.

**RGB backlighting**:
- Per-key RGB LED visible through translucent keycap legends and through gaps around each keycap.
- **Light bleed**: Soft glow spills from under each keycap onto the plate surface (achieved via small point lights or emissive plane segments beneath each key).
- **Color escalation with game tension**:
  - Low panic (0-20%): Cool breathing cyan/blue — slow sinusoidal pulse, calming
  - Medium panic (20-50%): Shifts to amber/warm white — faster pulse rate
  - High panic (50-75%): Orange to red transition — rapid pulsing, occasional flicker
  - Critical panic (75-100%): Angry red with stroboscopic flashing, desynchronized per-key chaos, emergency feel
- **Cooldown visualization**: When an ability is on cooldown, that key's LED dims to near-off and fills back to full brightness as cooldown expires — like a progress bar rendered as light intensity.
- **Ready flash**: When an ability comes off cooldown, the key flashes bright white once then settles to its panic-driven color.

### Enemies (Thought Bubbles)

**Current state**: Colored spheres with emoji text overlaid.

**Target state**:
- **Bubble**: Glass-like material with refraction, internal color glow (emissive core with transparent shell). Iridescent surface (thin-film interference via MeshPhysicalMaterial iridescence). Subtle surface distortion animation.
- **Interior**: Visible swirling thought pattern inside (animated procedural noise texture).
- **Icon**: 3D extruded icon geometry, not flat emoji text. Floats inside the bubble.
- **Glow**: Volumetric glow approximation (multiple transparent shells with falloff), not a single transparent sphere.

### Boss

**Current state**: Red sphere with emoji.

**Target state**:
- **Core**: Crystalline or mechanical-organic form — faceted geometry with emissive veins/cracks. Pulsing internal energy visible through semi-transparent shell.
- **Orbs**: Glass orbs with internal color swirl, not solid colored spheres.
- **Presence**: Distortion field around boss (vertex displacement on nearby geometry). Heat-haze-like post-processing effect.
- **HP visualization**: 3D segmented health ring, not text overlay.

### Particles and Effects

**Current state**: Solid color spheres and flat planes.

**Target state**:
- **Counter burst**: Sparks with trail (instanced mesh with velocity-stretched geometry). Ember glow with proper falloff.
- **Trail rings**: Energy rings with procedural lightning/plasma texture, not solid color torus.
- **Confetti**: Thin rectangular planes are acceptable but should have metallic foil material with angle-dependent color shift.

### Lighting

**Current state**: 7 lights with dynamic color — this is the strongest element.

**Target improvements**:
- **Area lights** for monitor screen (RectAreaLight) instead of point lights for more physically accurate screen glow.
- **Shadow maps** on key lights for character and desk object shadows.
- **Bloom post-processing** for emissive surfaces (monitor, energy drinks, boss, aura).
- **Ambient occlusion** (SSAO or baked) for depth in corners and under objects.
- **Volumetric light** approximation for monitor glow cone visible in dusty air.

## Implementation Strategy

All procedural generation uses Three.js built-in capabilities:

- `MeshPhysicalMaterial` for PBR with clearcoat, sheen, iridescence, transmission
- `ShaderMaterial` / `onBeforeCompile` for custom procedural textures (noise-based normals, displacement)
- `BufferGeometry` with computed vertices for organic shapes
- `InstancedMesh` for particle systems
- `RectAreaLight` + `RectAreaLightHelper` for area lighting
- `EffectComposer` (from postprocessing or three/examples) for bloom, SSAO, DOF
- `PMREMGenerator` for environment map approximation from scene lights
- `DataTexture` for procedurally generated normal/roughness maps

## Performance Budget

- Target: 60 FPS on mid-range GPU (GTX 1060 / M1 MacBook Air)
- Max draw calls: 200
- Max triangles: 500K
- Use `InstancedMesh` for repeated geometry (particles, stars, confetti)
- LOD for character detail (reduce subdivision at distance)
- Texture atlasing for procedural textures where possible

## Non-Goals

- External 3D model files (`.glb`, `.gltf`, `.obj`) — everything is procedural code
- External image textures (`.png`, `.jpg`) — all textures are procedural
- Stylized/cartoon aesthetic — the target is photorealism within procedural constraints
- "Good enough" placeholder quality — every element must look finished and immersive
