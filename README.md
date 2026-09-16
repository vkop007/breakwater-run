# Breakwater Run

A playable, original browser sandbox set in Port Solara’s Lantern Quay. The district combines on-foot exploration, three drivable vehicles, deliveries, vehicle recovery, a street race, police pursuits, shops, and local progress saves.

## Run

Node.js 22.12+ and npm are required. React remains on 19.2 because the installed React Three Fiber version requires React below 19.3.

```bash
cd /Users/vk/dev/OpenWorldGame
npm ci
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. No account, API key, backend, or remote asset service is needed. Dependencies require network access for installation; geometry, sounds, and fonts are local.

```bash
npm run lint
npm test -- --run
npm run build
npm run preview -- --host 127.0.0.1

# Browser regression suite (install test browsers once)
npx playwright install chromium firefox webkit
npm run test:browser

# Production performance sample; preview must be running on 4173
node scripts/benchmark.mjs

# Ten-minute chunk residency soak; dev server must be running on 5173
node scripts/soak.mjs
```

The production preview is http://127.0.0.1:4173. Deploy the generated `dist/` directory to a static host. No deployment has been performed.

## Play

Choose **New Game**, customize your character, then **Start exploring**. Your orange Pico is beside the apartment. Follow the map to Parcel & Pine for a legal delivery job, or meet Ivo at Quayline Garage. Activities can mark any contact on the map; starting a job requires visiting that contact.

| Action | Control |
| --- | --- |
| Move / accelerate / brake and reverse | W A S D |
| Sprint / walk slowly | Shift / Alt |
| Jump / handbrake | Space |
| Rotate camera | Hold left mouse button and drag |
| Interact / enter the nearest vehicle | E |
| Exit a stopped vehicle | F |
| Change follow/chase/hood camera | C |
| Headlights | H |
| Reset a stopped or overturned vehicle | R |
| District map / activities | M / Tab |
| Pause or close panel | Escape |
| Live performance and collision debug | F3 |

The camera follows vehicle turns after a short delay. Exit and reset check for clearance. Release S when stopped to avoid continuing into reverse. Motion, physics, AI, mission clocks, and audio pause when the window loses focus; resume explicitly.

## District and activities

- A 480 × 480 m district with 25 procedural 96 m chunks, roads, marked crossings, raised pavements, buildings, trees, a park, an open garage, a gas station, and an apartment entrance.
- Pico compact, Kestrel coupe, and Hauler van have distinct mass, power, speed, steering, grip, and four-wheel suspension. Damage reduces power; repair services restore condition.
- **City Delivery:** enter the van, collect three parcels beside the depot, unload at the market, garage, and apartment, then return the van. $650.
- **The Missing Car:** return Ivo’s green Pico. $800 and garage access.
- **Hot Exit:** recover the marked Kestrel, lose a two-level police response, and deliver it. $1,200 and the coupe purchase unlock.
- **Harbor Circuit:** six ordered checkpoints, one AI rival, a 120-second limit, best-time tracking, and $500 for winning.
- Five coastal keepsakes pay $75 each. A stranded courier beside the park pays $125 for help and returns after a cooldown.
- The garage sells and retrieves owned vehicles, repairs/repaints nearby cars, and installs a one-time $600 tune (+15% acceleration, +10% top speed for owned cars). Apartment/market services restore health or change clothing. The gas station repairs vehicles.
- Pedestrians cross, wait, idle, talk, flee dangerous cars, and report witnessed offences. Traffic follows lane routes, signals, vehicle spacing, and obstacle checks. Distant traffic uses simplified motion.
- Police respond to witnesses, investigate, pursue, search the last known location, and arrest a nearby stopped player after four seconds. Breaking sight and remaining unseen clears attention. Three wanted levels increase units; the third adds a stationary roadblock unit. Arrest costs up to $100.
- Time, sky, fog, ambient light, window glow, streetlights, headlights, clouds, and light rain change during play. Rain reduces grip. Sound is synthesized with Web Audio; optional dialogue uses available browser voices.

Apartment and shop interiors are represented by service panels at their entrances. Mobile layouts are responsive, but gameplay requires keyboard and mouse. Multiplayer, combat, extensive interiors, PWA installation, and cloud saves are outside this district prototype.

## Saving and recovery

Save at the apartment or from Pause on safe ground, while stopped and free of police attention. Mission completion autosaves. Continue restores the player on foot at the saved safe position and restores mission progress, checkpoint facts, important parked vehicles, health, money, ownership, colors, discoveries, time, and weather.

Objective checkpoints preserve the mission step, timer, player location, and mission vehicle positions/condition. Recovery can restore that checkpoint, return to the apartment, load the last save, or return to the menu. Restarting an activity resets its objectives and timer, repairs and rights its mission vehicle at the starting location, and returns the player to the contact. A race restart reseats the player in the original race vehicle at the starting line. Objective checkpoint recovery remains a separate option. Rewards and purchases guard against duplicate actions.

Progress uses `breakwater.save.v1` and `breakwater.save.backup.v1` keys with schema version 2; schema 1 is migrated on read. Invalid data falls back to the last-good backup. Storage denial/full capacity produces feedback rather than a crash. Reset Save requires confirmation. Settings use the separate `breakwater.settings.v1` key.

## Settings and implementation

Low/Medium/High adjust shadow quality, detail distance, pedestrian and traffic counts, resolution limits, and rain density. Resolution, camera sensitivity, interface/text size, reduced motion, camera shake, captions, and five audio gains are configurable. Antialiasing follows the selected preset after reload; other settings apply immediately. Save before reloading. No motion blur is used.

React/TypeScript/Vite manage the app; Three.js/Fiber render the scene; Rapier runs fixed 60 Hz character and vehicle physics; Zustand stores progression and low-frequency HUD snapshots. Fast transforms remain in runtime objects. Buildings, windows, trees, NPCs, and rain use instancing. Only resident chunks and nearby AI bodies are simulated in detail. The menu and gameplay scenes load separately.

`src/data/` contains district, vehicle, and mission definitions. `src/game/` separates world, player, camera, vehicles, NPCs, traffic, police, missions, audio, saving, and input. A development-only `window.__breakwater` harness allows browser tests to inspect the real runtime; it is removed from production builds.

All source/configuration/test paths are listed in [SOURCE_FILES.txt](./SOURCE_FILES.txt). [VALIDATION.md](./VALIDATION.md) records test coverage, performance observations, and browser limitations. [PLAN.md](./PLAN.md) preserves the milestone plan and implementation decisions.

World geometry, names, signage, dialogue, and synthesized sounds are original. Barlow Condensed and DM Sans are bundled with their OFL notices in `public/licenses/`. Third-party library licenses remain in their packages.
