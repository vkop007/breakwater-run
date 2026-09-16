# Browser Open-World Game — Implementation Plan

Status: Milestones 2–10 are implemented and locally validated for the district prototype. Build/lint, 24 unit tests, gameplay regressions, performance sampling, the 10-minute stability run, and final production smoke verification passed. VALIDATION.md records the evidence and remaining installed-browser/hardware coverage limits.

The sections below preserve the original implementation plan. The later user instruction authorized all milestones. Current installation, test commands, and playable scope are in README.md.

## 1. Original title options

1. **Breakwater Run** — recommended working title; connects the coastal setting with driving and deliveries.
2. **Saltline City** — emphasizes the place and its everyday life.
3. **Harbor Circuit** — emphasizes driving, routes, and races.
4. **Sunward Streets** — emphasizes colorful exploration.
5. **Tideway Stories** — emphasizes characters and neighborhood missions.

These are creative proposals; commercial name availability has not been checked.

## 2. Game concept

Build **Breakwater Run**, a single-player, third-person action-driving sandbox set in the fictional coastal city of **Port Solara**. The player is a new independent courier who earns money, builds relationships with local businesses, and unlocks vehicles while freely exploring the neighborhood. Reckless or illegal actions can generate witness reports and police pursuits.

Use colorful low-poly geometry, warm coastal daylight, teal sea water, coral storefront accents, original fictional signage, and readable vehicle silhouettes. Procedural models and simple character animation make the first release self-contained and reduce asset-loading risk. All characters, dialogue, brands, layouts, sounds, and mission content must be original or appropriately licensed.

The first release is one complete district, not the entire city. Multiplayer, weapons/combat, extensive interiors, destructible buildings, advanced character animation, and mobile controls are outside this slice. Desktop controls come first; input actions remain device-independent for later touch or controller support.

## 3. First district: Lantern Quay

A 480 × 480 meter neighborhood divided into twenty-five 96-meter chunks. Treat dimensions as a starting point; adjust after testing route length and visibility.

- A waterfront boulevard and a connected street grid, with a loop road for traffic and police routing.
- Sidewalks, marked crossings, alley shortcuts, a small park, and a pedestrian promenade.
- A parking lot, gas station, **Quayline Garage**, and a safe-house apartment entrance.
- **Parcel & Pine**, the delivery shop; a garage contact; mission start locations; and a race start.
- Modular residential blocks, warehouses, storefronts, trees, benches, lamps, bins, and original signs.
- A fast exposed arterial road and a slower protected backstreet route for vehicle-recovery missions.

The apartment and shop interactions initially use menu panels at doors. Build only the limited garage space needed for parking and vehicle selection. Use physical waterfront barriers and believable closed roads to define the district boundary.

Author roads, sidewalks, collision shapes, navigation graphs, and map outlines from shared district data so they stay aligned. Place key destinations close enough that testing a mission does not require long uneventful drives.

## 4. Main gameplay loop

Explore on foot or by car → discover a contact or activity → accept objectives → choose a route and vehicle → complete the job or escape consequences → earn money and unlocks → repair, recolor, or buy vehicles → save and continue exploring.

Missions are optional during free roam. Interaction prompts explain what is possible nearby. Checkpoints and recovery options limit frustration after a failed delivery, wreck, fall, or arrest.

## 5. Vertical-slice scope

### Movement and vehicles

- Camera-relative walk, run, sprint, jump, grounded movement, collision, fall recovery, and camera obstruction handling.
- Context-sensitive interactions; safe vehicle entry and exit; on-foot and chase cameras; optional hood camera.
- Three configurable original vehicles: **Pico** compact, **Kestrel** sports coupe, and **Hauler** delivery van.
- Arcade acceleration, reverse, braking, handbrake, speed-dependent steering, suspension, grip, damage, lights, reset, and synthesized engine sound.

### Living district

- Chunk residency, instanced props, simplified distant simulation, and pooled pedestrians and traffic.
- Pedestrians with walking, crossing, idle/talking, reacting, fleeing, reporting, and return-to-routine states.
- Lane-following traffic with selected signals, vehicle spacing, obstacle response, and recovery from blocked routes.
- Day/night lighting and clear, cloudy, and light-rain weather. Rain modestly reduces grip.
- One repeatable dynamic event, such as assisting a stranded courier, plus a small collectible set.

### Progression and consequences

- **City Delivery:** meet the shop owner, enter a van, collect three packages, deliver them, return the van, and receive money.
- **The Missing Car:** meet the garage owner, retrieve a marked car, return it without destroying it, and unlock garage services.
- **Hot Exit:** enter a target vehicle, trigger a pursuit, escape, and deliver it for cash and a vehicle unlock.
- Optional checkpoint street race with one lightweight AI opponent, position, elapsed time, best time, and a winning reward.
- Three wanted levels using one police vehicle model instantiated as several units. Higher levels increase pursuit pressure and introduce a limited roadblock behavior.
- Witness visibility and reporting timers, investigation, pursuit, last-known-position search, escape, and arrest.
- Money, vehicle ownership/unlocks, repair, paint and clothing colors, vehicle purchases, and health recovery. A one-time garage tune improves owned-car acceleration by 15% and top speed by 10%.

### Interface and persistence

- Loading/error states, main menu, lightweight character setup, gameplay HUD, pause menu, map, activity menu, settings, controls, credits, and arrest/recovery screens.
- HTML/CSS HUD with health, money, mission objective, interaction prompt, wanted state, search timer, speed, vehicle health, notifications, and a 2D minimap.
- Local saves, mission checkpoints, race records, ownership, settings, discovered locations, and time of day.
- Quality presets, camera sensitivity, HUD/text sizing, subtitles, separate audio channels, keyboard menu navigation, and optional screen shake. Motion blur is omitted entirely from the slice.

PWA installation/offline caching is optional after loading, version updates, and storage behavior are stable.

## 6. Technical architecture

| Layer | Responsibility |
| --- | --- |
| React + TypeScript | App screens, menu navigation, accessible UI, error boundaries, and component lifecycle. |
| React Three Fiber + Three.js | Scene composition, geometry, materials, lighting, instancing, rendering, and render statistics. Use Three.js objects directly where useful. |
| Drei | A small set of scene helpers, loading utilities, and optional development controls; avoid unnecessary effects. |
| Rapier | One physics world with fixed simulation steps, character collision queries, vehicle rigid bodies, and collision events. |
| Runtime systems | Input sampling, controllers, AI, mission events, chunk management, and audio parameters. Mutable runtime objects hold rapidly changing values. |
| Zustand | Screen state, settings, inventory, progression, and low-frequency HUD snapshots. Never write every physics transform into React state. |
| Data definitions | Typed vehicle configs, missions, district chunks, waypoint graphs, shops, interactions, NPC archetypes, and quality settings. |
| Web Audio API | User-gesture initialization, engine/siren synthesis, simple effects and ambience, channel gains, and focus suspension. |
| localStorage | Small versioned saves with validation, migrations, a last-good fallback, and graceful handling of denied/full storage. |

### Simulation and state boundaries

- Use one authoritative simulation clock and Rapier's fixed 60 Hz stepping. Cap catch-up after stalls; never simulate the full hidden-tab interval on resume.
- Run character and vehicle forces through physics-step hooks; interpolate visuals between simulation states.
- Use a kinematic capsule/character controller for the player and a dynamic chassis with four suspension raycasts for each active drivable vehicle. Apply suspension, traction, braking, and lateral grip forces from configuration.
- Decide character animation from movement state; do not let placeholder animation drive collision movement.
- Use explicit app states: loading, menu, setup, playing, paused, and recovery. Pause input, physics, AI, mission timers, and appropriate audio together. Clear held input on blur and pointer-lock loss.
- Route keyboard and mouse events into named actions. Keep on-foot, vehicle, and menu bindings separate; suppress browser shortcuts only while the relevant game surface has focus.
- Use typed gameplay events, such as `vehicleEntered`, `packageDelivered`, `crimeWitnessed`, and `pursuitCleared`. Mission evaluation and rewards consume events without depending on rendered components.
- Give persistent entities stable IDs. Missions reference data IDs and coordinates even when a destination chunk is not mounted.

### World and AI

- Maintain visual, simulation, and physics residency separately. Prioritize chunks along travel direction, prewarm collision before arrival, and use hysteresis to avoid boundary churn.
- Keep the player, occupied vehicle, and necessary mission entities resident. Never unload supporting terrain or a collider beneath an active actor.
- Preserve important entity state when chunks unload. Pool ambient entities; do not persist every ambient pedestrian.
- Use road and sidewalk waypoint graphs. Run nearby AI decisions at approximately 5–10 Hz and distant decisions less often; interpolate motion during rendering.
- Use coarse spatial queries before expensive raycasts. Witness checks need distance, view direction, and line of sight; report cancellation depends on losing observation before the timer completes.
- Police follow valid roads, search the last known position, and spawn at valid off-camera road points away from the player. If no safe spawn exists, delay deployment.
- Derive the map from the district's road/landmark data and draw it with Canvas 2D or SVG. Do not allocate a second 3D render camera.

### Saving

- Separate persistent progression from transient physics state. Restore the player and selected vehicle at validated safe spawn points rather than arbitrary midair coordinates.
- Include schema version, appearance/name, money, health, completed missions, active checkpoint, owned/unlocked vehicles, race records, discoveries, settings, safe location, and world time.
- Define mission restart behavior for spawned vehicles, packages, timers, and pursuit state. Persist stable checkpoint facts rather than serializing live rigid bodies.
- Apply rewards idempotently and autosave after confirmed mission completion. Make reset a clearly confirmed action.
- Reject invalid saves; retain a last-good backup; show a useful recovery message. Defer writes during falling, arrest, and invalid transitions. Continue is enabled only for a valid supported save.

## 7. Folder structure

All paths below are relative to `/Users/vk/dev/OpenWorldGame`:

```text
public/
  assets/
src/
  app/                 # App shell, routing between game screens
  assets/              # Small imported original assets
  components/          # Shared presentation components
  game/
    core/              # Runtime lifecycle, clock, events, entity IDs
    input/             # Action mappings and input contexts
    physics/           # Physics stepping, collision groups, queries
    player/            # Movement and character presentation
    camera/            # Follow, chase, hood, and obstruction checks
    vehicles/          # Vehicle controller and visual models
    world/             # Chunk residency, geometry, environment
    npcs/              # Pedestrian state machines and navigation
    traffic/           # Lane routing, signals, vehicle pooling
    police/            # Witnesses, pursuit, search, arrest
    missions/          # Objective evaluation and checkpoints
    interactions/      # Candidate selection and action execution
    economy/           # Rewards, purchases, ownership
    audio/             # Audio context, sources, gain channels
    save/              # Schema validation, migration, storage
  scenes/              # Menu background and playable scene
  stores/              # UI, settings, progression stores
  ui/                  # Menus, HUD, map, dialogs, dev panel
  data/                # Typed content/configuration definitions
  hooks/
  styles/
  utils/
  types/
tests/
  unit/
  integration/
  e2e/
```

Create modules as their milestones need them; avoid empty placeholder systems.

## 8. Packages and commands

These commands are planned, not executed. Use a Node.js LTS release supported by the selected Vite version and commit the generated lockfile. Choose mutually compatible React, Fiber, Drei, and Rapier releases during setup; do not bypass peer-dependency errors with force flags.

Because this folder contains the plan, scaffold in a temporary directory and copy the new project files into the repository without replacing the plan:

```bash
cd /Users/vk/dev/OpenWorldGame
scaffold_dir=$(mktemp -d /tmp/breakwater-run.XXXXXX)
npm create vite@latest "$scaffold_dir/breakwater-run" -- --template react-ts
cp -R "$scaffold_dir/breakwater-run"/. /Users/vk/dev/OpenWorldGame/
npm pkg set name=breakwater-run
npm install
npm install three @react-three/fiber @react-three/drei @react-three/rapier zustand
npm install -D @types/three
npm run dev -- --host 127.0.0.1
```

Vite's scaffold supplies React, React DOM, TypeScript, the React Vite plugin, and linting dependencies. Web Audio API and localStorage need no extra package. Install automated-test dependencies when the first controller/state integration needs them:

```bash
cd /Users/vk/dev/OpenWorldGame
npm install -D vitest @playwright/test
npx playwright install chromium firefox webkit
```

Provide these validation commands as scripts during implementation:

```bash
npm run lint
npm run build
npm run test -- --run
npm run test:browser
npm run preview -- --host 127.0.0.1
```

`test` and `test:browser` are now configured. Browser downloads require network access. Add `vite-plugin-pwa` only if the optional PWA work is accepted into the final milestone.

## 9. Milestone plan and acceptance gates

Each milestone ends with a runnable build, relevant checks, a short verification report, and complete paths for modified files. Fix regressions before starting the next milestone. Implement only Milestone 1 after the planning step; stop afterward as requested in the brief.

| Milestone | Deliverable | Acceptance gate |
| --- | --- | --- |
| **1. Website foundation** | Vite/React/strict TypeScript, styles, app state machine, real WebGL canvas, loading/error handling, main menu, basic setup, pause/resume, controls, credits, and working initial display settings. | Fresh install, lint and production build pass; menu → setup → canvas → pause → resume → menu works; resize and focus transitions behave; unsupported WebGL and initialization failure show recovery UI. |
| **2. Basic 3D world** | One city block, shared road/sidewalk data, modular buildings, lights, fog, sky, ground/colliders, and development performance panel. | Scene and physics agree; a test body rests/collides correctly; baseline draw calls, triangles, frame time, and physics counts are recorded. |
| **3. Player controller** | Grounded capsule movement, acceleration, sprint/jump, simple animation, mouse camera, obstruction checks, rebinding-ready input, sensitivity, interactions, and fall recovery. | Player traverses sidewalks and slopes without falling through geometry; jump is grounded; camera avoids walls; pause/focus loss cannot leave keys stuck. |
| **4. Vehicle gameplay** | Compact car first, then sports coupe and van through shared configs; suspension, traction, braking/reverse, damage, safe entry/exit, chase/hood cameras, speedometer, headlights, reset, and engine audio. | Complete a repeatable driving circuit in all three types; test curb impacts, handbrake, reversal, rollover/reset, blocked exits, switching seats/cameras, and differing handling. |
| **5. District expansion** | Full Lantern Quay chunk layout, garage, apartment, park, parking lot, gas station, props, map/minimap, day/night, and clear/cloudy/rain weather. | Fast driving across every boundary causes no holes or missing collisions; resident counts stabilize; destination markers align with roads; weather and night lighting remain readable. |
| **6. NPCs and traffic** | Navigation graphs, pedestrian states, crossings, signals, traffic spacing, collision response, ambient actor pools, and interaction contacts. | Traffic and pedestrians circulate without unbounded spawning; nearby actors react to hazards; queues recover; actor counts stabilize over a 10-minute traversal. |
| **7. Missions and economy** | Typed objective/checkpoint engine, delivery mission, garage-recovery mission, race with one rival, cash, unlocks, purchases, services, collectibles, and one small dynamic event. | Complete and fail/restart each available activity; mission vehicles/packages reset coherently; rewards cannot be applied twice; purchases cannot overspend; race position/time are correct. |
| **8. Police and Hot Exit** | Witness/report timers, three wanted levels, off-camera road spawns, pursuit, search, escape, arrest/recovery, roadblocks, and the full Hot Exit mission. | Unwitnessed actions do not report; interrupted reports can cancel; occluded players can escape; police spawn validly; all pursuit mission success/failure paths work. |
| **9. Saving and settings** | Versioned local persistence, autosave, apartment/manual save, checkpoint restoration, Continue/Reset Save, complete quality/audio/accessibility controls, and recovery options. | Reload restores progression safely; corrupted, outdated, missing, denied, and full storage are handled; reset requires confirmation; no invalid-state save; every visible setting changes real behavior. |
| **10. Optimization and polish** | Profiling, loading improvements, shadow/LOD/pool tuning, audio mix, input polish, browser/resolution QA, and optional PWA support. | All three missions, race, unlock/purchase/save/reload, pursuit and recovery pass end to end; reference hardware results are recorded for each quality preset and supported browser. |

### Milestone 1 implementation detail

The first implementation is an operational game shell with a real animated 3D scene and working application controls. Walking begins in Milestone 3 and driving in Milestone 4; the shell must not claim those features are already playable.

Planned created/modified files:

```text
/Users/vk/dev/OpenWorldGame/package.json
/Users/vk/dev/OpenWorldGame/package-lock.json
/Users/vk/dev/OpenWorldGame/index.html
/Users/vk/dev/OpenWorldGame/.gitignore
/Users/vk/dev/OpenWorldGame/eslint.config.js
/Users/vk/dev/OpenWorldGame/tsconfig.json
/Users/vk/dev/OpenWorldGame/tsconfig.app.json
/Users/vk/dev/OpenWorldGame/tsconfig.node.json
/Users/vk/dev/OpenWorldGame/vite.config.ts
/Users/vk/dev/OpenWorldGame/src/main.tsx
/Users/vk/dev/OpenWorldGame/src/app/App.tsx
/Users/vk/dev/OpenWorldGame/src/types/app.ts
/Users/vk/dev/OpenWorldGame/src/stores/appStore.ts
/Users/vk/dev/OpenWorldGame/src/stores/settingsStore.ts
/Users/vk/dev/OpenWorldGame/src/game/core/GameCanvas.tsx
/Users/vk/dev/OpenWorldGame/src/game/core/GameErrorBoundary.tsx
/Users/vk/dev/OpenWorldGame/src/game/core/useGameLifecycle.ts
/Users/vk/dev/OpenWorldGame/src/scenes/FoundationScene.tsx
/Users/vk/dev/OpenWorldGame/src/ui/LoadingScreen.tsx
/Users/vk/dev/OpenWorldGame/src/ui/MainMenu.tsx
/Users/vk/dev/OpenWorldGame/src/ui/CharacterSetup.tsx
/Users/vk/dev/OpenWorldGame/src/ui/PauseMenu.tsx
/Users/vk/dev/OpenWorldGame/src/ui/SettingsPanel.tsx
/Users/vk/dev/OpenWorldGame/src/ui/ControlsPanel.tsx
/Users/vk/dev/OpenWorldGame/src/ui/CreditsPanel.tsx
/Users/vk/dev/OpenWorldGame/src/styles/global.css
/Users/vk/dev/OpenWorldGame/README.md
```

Use actual module/asset readiness for loading status. If a phase has no measurable byte progress, show it as indeterminate; do not invent percentages. Offer retry when initialization fails.

Main-menu New Game opens lightweight character setup and Play enters the canvas. Initial settings change implemented renderer quality/resolution and UI sizing. Credits describe original procedural assets. Controls explain current interactions and label future gameplay bindings appropriately.

Feature-gate Map, mission information, Save Game, Continue, Reset Save, and save recovery options until their systems exist. Continue can appear disabled with a clear “No saved game” reason; avoid active-looking controls with no implementation.

Milestone 1 manual testing checklist:

- Install and launch from the documented commands.
- Confirm lint and production build pass.
- Exercise all visible menu, setup, settings, credits, and pause controls with mouse and keyboard.
- Verify Escape and focus loss pause the active scene; resume requires a clear user action after focus loss.
- Verify animation and simulation do not continue behind the pause state.
- Resize from 1024 × 768 through 1920 × 1080; check readable menus and no clipping.
- Exercise WebGL-unavailable and initialization-failure handling.
- Check development console for runtime errors and duplicate listeners after returning to the menu.
- Run the production preview, not only the development server.

## 10. Performance risks and mitigations

Performance figures are provisional budgets to validate on named reference devices, not guaranteed results on unspecified hardware. Target 60 FPS at 1080p/Medium on a modern desktop and at least 30 FPS at reduced resolution/Low on the selected lower-end reference device.

| Risk | Mitigation and measurement |
| --- | --- |
| Too many draw calls/materials | Share geometries/materials, instance props/windows/lights, and merge static meshes per chunk. Start with a Medium budget of roughly 200 draw calls and 300,000 visible triangles; measure before expanding detail. |
| Physics cost | Simple colliders, sleeping rigid bodies, active-radius physics, limited simultaneous police/traffic, and stable fixed stepping. Measure physics time separately from rendering. |
| Streaming hitches at vehicle speed | Prewarm upcoming chunks/colliders, reuse geometry, stagger construction, and retain previous chunks with hysteresis. Test at the sports coupe's maximum speed. |
| React rendering every frame | Keep transforms and controller state in refs/runtime objects; publish selected HUD snapshots at approximately 5–10 Hz and event-driven changes immediately. |
| AI/pathfinding spikes | Shared road/sidewalk graphs, staggered updates, spatial indexing, capped nearby decision counts, and pooled ambient entities. |
| Shadows, rain, and night lights | One limited shadow-casting sun, short shadow distance, emissive windows/streetlights, few nearby actual lights, pooled rain particles, and no real-time reflections. |
| Initial download/startup | Procedural first scene, lazy-load gameplay systems, cache shared assets, measure production compressed payload and cold-start timing. Aim initially for under 8 MB compressed before optional assets. |
| High-DPI fill rate | Cap device pixel ratio, provide resolution scaling, and reduce particles/shadows first on Low. |
| Tab/background stalls | Suspend expensive systems and audio; reset accumulator and held input on return. |
| Memory leaks and entity growth | Dispose unused GPU resources, balance pool acquisition/release, cap residency, and record a 10-minute traversal plus a longer soak before release. |
| Browser differences | Test Chrome, Edge, Firefox, and real Safari where available. Playwright WebKit is useful but does not substitute for real Safari verification. Detect unsupported WebGL and blocked audio/storage gracefully. |

Quality presets adjust render/simulation radii, shadow maps, traffic/NPC caps, resolution, particles, and weather effects. If anti-aliasing changes require renderer recreation, apply them through a controlled transition that preserves game state.

The development panel exposes FPS, frame time, draw calls, triangles, active NPCs/vehicles, loaded chunks, and physics bodies. Compare measured frame budgets against 16.7 ms for 60 FPS and 33.3 ms for 30 FPS. Run the same district traversal and pursuit scenario after material simulation changes.

## Completion definition

A user can launch the website, create a character, explore the district, drive all three vehicle types, complete each mission and the race, earn and spend money, trigger and escape police, recover from arrest, save, reload, and continue without console errors or unusable controls. The final report includes actual validation results and clearly identified browser/hardware gaps.
