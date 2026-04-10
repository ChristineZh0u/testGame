# 🍄 Mushroom Hunt: Deep Forest

Top-down dungeon-crawler adventure. Vanilla HTML5 Canvas + JS, no dependencies.

## Play

Open `mushroom-hunt.html` in a browser.

### Controls
- **WASD / Arrow Keys** — Move
- **Space** — Dash (damages enemies, breaks cracked walls, has cooldown)
- **E / Enter** — Interact (open chests, read notes)
- **R** — Restart (on death or win)

### Objective
1. Explore a procedurally generated dungeon (fog of war, minimap top-right shows explored mushroom locations)
2. Collect 60% of mushrooms across rooms (🟤 common, 🟣 rare, 🌈 legendary)
3. Find the 🗝️ boss key in a mid-dungeon room
4. Enter the boss room, defeat the 👑 Mushroom King by dashing into him
5. Boss has 3 phases — phase 2 at 60% HP (faster attacks), phase 3 at 30% HP (teleports, spawns minions)

### Enemies
- 🐍 Snakes — slow room patrols
- 🦇 Bats — charge when close, retreat after hitting
- 👻 Ghosts — phase through walls, drift toward player
- All die to dash attacks and can drop ❤️ hearts

### World Features
- 🔥 Torches — flickering light in some rooms
- ⬆️ Spike traps — cycle on/off in corridors, time your movement
- 💥 Breakable walls — cracked appearance, dash into them to discover secret rooms with legendary mushrooms + bonus chests
- 📦 Chests — press E to open, random loot: 👟 speed boost, 💖 max HP up, 💨 dash upgrade, ❤️‍🩹 full heal, 👁️ far sight
- 📜 Lore notes — scattered environmental storytelling, press E to read

### End Screen
Win screen shows stats: time, mushrooms, kills, chests opened, secrets found, notes read, damage taken, and a rating (🌟 Untouchable / ⚡ Speedrunner / 💪 Tough Forager / 🍄 Forest Explorer).

## Architecture

```
mushroom-hunt.html  — Entry point, loads scripts
engine.js           — Input, camera (with screen shake), audio (Web Audio API), collision
world.js            — Procedural dungeon gen (rooms, corridors, water, bridges, traps, breakable walls, secret rooms, torches)
entities.js         — Player, enemies, mushrooms, pickups, chests, notes, boss (3 phases), particles, dash trails
render.js           — Drawing: tiles, fog of war, torches, traps, entities, HUD, minimap, end screen
main.js             — Game loop, init, restart
game.js             — Legacy clicker version (unused, kept for reference)
```

### Key design decisions
- All placement uses `floorPos()` to guarantee spawning on walkable, non-trap tiles
- Charger bats retreat 1.2s after hitting the player to prevent stun-locking
- Ghosts ignore wall collision for a unique threat that forces dash usage
- Boss phase 3 adds teleportation + minion spawning for a climactic fight
- Secret rooms are adjacent to existing rooms, connected by breakable walls (tile type 6)
- Spike traps use a cycle timer — active 40% of the time, safe 60%
- Screen shake on damage, boss awakening, and wall breaks for game feel
- Dash leaves a trail effect and breaks walls, making it feel impactful
- Map regenerates every playthrough for replayability
