# Breakwater Run 0.2.0 validation

Recorded on 2026-09-16 on macOS with an Apple M4 and 16 GiB RAM. Scope: the playable Lantern Quay district and Milestones 2–10. This is a browser-game prototype with original procedural assets, keyboard/mouse gameplay, and local saves.

## Implementation and coverage

| Milestone | Implemented behavior | Evidence |
| --- | --- | --- |
| 2. Basic 3D world | Roads, raised pavements, buildings, Rapier colliders, lights/sky/fog, performance panel | Real Rapier tests for ground support, capsule/facade collisions, pavement, and a chunk seam; production render statistics |
| 3. Player | Walk/run/sprint/jump, camera-relative movement, mouse camera, collision and interactions | Keyboard movement/jump/grounding in Chromium, Firefox and WebKit; pause stops physics |
| 4. Vehicles | Pico, Kestrel and Hauler; raycast suspension, braking/reverse, handbrake, damage, lights, entry/exit, cameras/reset | All three accelerate and brake using live physics; common enter/drive/handbrake/exit flow in three engines; wreck/rollover restart regression |
| 5. District | 25 connected 96 m chunks; garage, apartment, park, gas station, map, day/night and rain | All chunk locations exercised during a 10-minute residency soak; map/waypoints and night/rain browser checks |
| 6. NPCs and traffic | Bounded logical actor pools, nearby physics, traffic routes/signals/spacing, pedestrians/crossings/reactions | Pedestrian/witness browser scenario, active-count assertions during the soak, traffic route implementation and rendering inspection |
| 7. Missions and economy | City Delivery, The Missing Car, Harbor Circuit, checkpoints/restart, rewards, services/purchases/unlocks, collectibles/courier | Mission objective flows, timer failure, race win/reward, repair/tune/purchase/paint gates, idempotence and cooldown checks |
| 8. Police | Witness reports, three wanted levels, valid road spawns, pursuit/search/arrest, Hot Exit | Interrupted report cancellation, report completion, all three levels, arrest/recovery, spawn/routing unit tests and Hot Exit objective flow |
| 9. Saving/settings | Versioned local saves, migration/backup, Continue, objective checkpoints, reset confirmation, graphics/audio/accessibility controls | Round-trip and corrupt/denied/unsafe storage tests; reload/Continue in three engines; reset confirm/cancel; audio lifecycle and settings checks |
| 10. Polish | Instancing/LOD/residency, limited shadows, local synthesized audio, deferred scenes, control fixes, QA/docs | Build/lint, automated regressions, design evaluation, production sampling and completed stability run |

Mission tests seed selected destinations and states to cover objective gates without spending minutes driving between every stop. They test the real game systems, but do not constitute complete manual drives of every mission or traffic arrangement. Keyboard walking, jumping, entry/exit, acceleration, braking and handbrake are exercised through the running simulation.

## Automated checks

- `npm run lint`: passed with no lint warnings.
- `npm test -- --run`: **24 passed across 6 files**. Includes real Rapier geometry/vehicle-pose checks, app lifecycle/settings, rewards, checkpoint/restart behavior, save validation/migration and police routing/spawning.
- `npm run build`: passed TypeScript and Vite production compilation. Vite's nonfatal large-chunk warning remains for the Three.js and Rapier dependencies.
- Browser regression coverage: **8 passing scenarios in aggregate**: the common gameplay/save flow in Chromium, Firefox and WebKit, plus five deeper Chromium scenarios (audio/weather; police; progression/services; three vehicles/race; collectibles/courier/map/reset). The deeper scenarios deliberately skip duplicate execution in the other engines.
- The final mission/vehicle changes were rechecked with the progression and vehicles/race scenarios: **2 passed in 51.2 seconds**.
- Installed browser engines: Chromium 153, Firefox 155 and WebKit 26.6 through Playwright. These are browser-engine automation builds; they are not tests of installed Microsoft Edge or shipping Safari.
- A full `npm audit` after dependency updates reported zero vulnerabilities. React/DOM stay on 19.2 for Fiber compatibility; Vitest is 4.1.11.

Final production smoke: menu → setup → playable district succeeded on port 4173 with no page errors. `artifacts/final-production.png` records the result. The console emitted the known upstream Rapier initialization-argument deprecation warning; gameplay initialized normally. The production JavaScript contains no `__breakwater` development harness.

Whole-job restart repairs and rights the relevant vehicle, resets its location and velocities, resets objectives/timer, clears current pursuit and stale input, and restores a coherent player position. A race can restart with its original checkpoint vehicle after the player has exited. Restoring the latest objective checkpoint remains independent of restarting the whole job.

## Browser, audio and UI inspection

Common automated flow: New Game → setup → walking/jumping → enter/drive/brake/exit → pause → safe save → map → main menu → reload → Continue. Production and development views were inspected at desktop, tablet and narrow widths, including 1440×900, 768 px and 375 px wide layouts.

The final independent gameplay design evaluator returned **PASS**. A different model provider was unavailable, so evaluation used a separate same-provider agent. The final map accessibility scan reported no automated violations. Earlier foundation scans using axe-core 4.12.1 reported zero WCAG A/AA automated violations for menu, setup, pause, settings and narrow menu after contrast fixes. Automated scanning does not establish complete accessibility compliance, and text over the 3D canvas still requires visual judgment.

Audio checks verified gesture initialization, engine/siren/weather paths, channel gain settings, pause/resume and disposal on return to menu. Audio is locally synthesized; spoken dialogue depends on available browser voices. Graphics presets change density, detail/shadows, resolution limits and rain. Antialiasing follows the selected preset after reload, as the settings panel states. Other settings apply live. Gameplay remains keyboard/mouse only.

Earlier foundation checks covered focus pause, stationary paused frames, menu keyboard focus, resolution/interface scaling, denied settings storage, disabled WebGL recovery and deliberate WebGL context loss/retry. Their screenshots remain in `artifacts/milestone-1-*.png`.

## Performance observations

Production samples used 1440×900 and the live performance panel. Default headless Chromium reported 30 FPS on all presets; a blank-page animation measured 30.001 FPS under the same default environment, indicating browser/platform pacing. These readings cannot establish a 60 FPS performance ceiling for the game.

| Preset | Median FPS under default pacing | Draw calls | Triangles | Pedestrians | Vehicles | Resident chunks | Bodies / colliders |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Low | 30 | 79 | 22,828 | 10 | 7 | 9 | 20 / 203 |
| Medium | 30 | 79 | 23,548 | 20 | 9 | 9 | 23 / 208 |
| High | 30 | 104 | 32,616 | 30 | 11 | 25 | 42 / 517 |

Initial game readiness after starting from the loaded menu was approximately 2.17–2.19 seconds in these samples. No page errors were recorded. The final build estimates approximately **1.184 MB gzip JavaScript**, plus CSS and fonts; Rapier accounts for roughly 838 kB. These are compression estimates, not measured network transfers. Hosting must enable HTTP compression. The 3D/physics modules are deferred from the application shell; the loading screen reports real readiness without invented percentages.

A second run disabled frame-rate/vsync limits while the separate soak was active. Median FPS was 132/57/33 for Low/Medium/High; ranges were 79–138, 38–68 and 19–57. Readiness was 7–14 seconds under this concurrent load. This is a stress observation, not a guaranteed user performance figure or an isolated hardware benchmark. Prefer Low or reduced resolution on slower systems. A universal 60 FPS target and minimum 30 FPS on lower-end hardware have not been established.

Reproduce with `node scripts/benchmark.mjs` while the production preview is on port 4173. Optional `BENCHMARK_UNCAPPED=1` enables the uncapped sampling mode. Raw samples and screenshots are in `artifacts/performance*.json` and `artifacts/production-*.png`.

## Stability run

`node scripts/soak.mjs` completed **610 seconds, 120 residency transitions, all 25 chunk locations**, at Medium quality in the development build. Rendering and physics ran continuously while test positions changed every five seconds. The script did not use manual road traversal.

- No page/runtime errors.
- Peak 23 physics bodies, 209 colliders, 11 resident vehicles and 20 pedestrians; no unbounded actor-count growth.
- Garbage-collected JavaScript heap samples ranged from **21.1–30.4 MiB**, starting at 23.0 MiB and ending at 24.1 MiB. Comparable samples show no sustained growth over this run.
- Physics reached step 36,585. The browser closed cleanly at completion.

The raw record is `artifacts/soak.json`. This bounded run is evidence against obvious residency leaks, not proof of indefinite stability or GPU-memory behavior. It preceded the isolated mission-restart fix; that fix has separate unit/browser regressions.

## Remaining release coverage and scope limits

- Test installed Microsoft Edge and shipping Safari, plus representative lower-end machines. Chromium and WebKit automation do not replace those checks.
- Profile extended real driving, dense pursuits and longer play sessions on that hardware before advertising 60 FPS or a broad minimum specification.
- Desktop gameplay is supported. Responsive menus do not supply touch controls.
- Apartment/shop interactions use entrance service panels. Extensive interiors, combat, multiplayer, cloud saves and optional PWA/offline installation are outside this district slice.

Source and test paths are listed in `SOURCE_FILES.txt`; usage and controls are in `README.md`. The local production preview is http://127.0.0.1:4173/. No external deployment was performed.
