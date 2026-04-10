# Stick Fight!

Browser-based single-player roguelike stick figure fighting game. Open `stickfight.html` in Chrome.

## Files
- `stickfight.html` — UI, HUD, shop overlay, styles
- `stickfight.js` — all game logic, rendering, AI

## Controls
- WASD — move/jump (W = jump, double jump, wall jump off edges)
- F — punch (fast, low damage)
- G — kick (slower, high damage) / air slam (when airborne, dives down with shockwave)
- R — uppercut (launches enemy up, costs 20 energy)
- T — special (big damage + energy ball, costs 50 energy)
- Q — block / parry (press within 150ms of incoming hit = parry, stuns attacker)
- Double-tap A/D — dash (requires key release between taps, has i-frames)
- P / Esc — pause
- Space — start countdown / next round / close shop

## Architecture

### Game Loop
`frame()` → countdown → slowmo check → updates players, hazards, items, particles → `drawScene()`. Pauses when `waitingToStart`, `paused`, or `shopOpen`. Round ends when HP hits 0, slow-mo plays, then waits for Space.

### Round Flow
1. "Press SPACE" screen (scene visible, no movement)
2. Space → 3..2..1..FIGHT! countdown (1 sec per number, beeps)
3. Fight until KO
4. KO → slow-mo (90 frames at 15% speed) + explosion + screen shake
5. After slow-mo, "Press SPACE" for next round
6. Every 3 rounds (if coins > 0): roguelike shop before next round

### Player Object
Created by `makePlayer(x, color, face)`. Key props: `hp`, `nrg` (energy), `atk` (current attack name or null), `atkT` (frame timer), `weapon` (weapon key or null), `weaponT` (durability timer), `blocking`, `blockStart` (timestamp for parry window), `combo`, `hitstun`, `dashT`, `isAI`, `isBoss`.

### Combat
- Attacks in `ATTACKS` dict: `{dur, start, end, dmg, kx, ky, range, h, hs, nrg}`
- `doAttack(p, name)` initiates if not busy + has energy
- `getAtkBox(p)` returns hitbox during active frames; slam hitbox is centered below player, others use weapon range multiplier
- Combo scaling: hits after combo 2 deal reduced damage (min 3)
- Aerial hits do 1.4x damage
- Energy regens passively + on landing hits

### Parry System
- Q starts block, records `blockStart` timestamp
- On hit: if `Date.now() - blockStart < 150ms` → parry (stuns attacker 25 frames, knockback, slow-mo, gold particles)
- Otherwise → normal block (no damage, pushback both)

### Air Slam
- Press G while airborne → `doAttack(p, 'slam')` + `p.vy = 12` (dive down)
- Wide centered hitbox (50px), hits both sides
- On ground impact: 15 orange particles, screen shake, boom sound
- AI uses slam when airborne and close to player

### Slow-Mo System
- `slowmo` (frames remaining) and `slowmoScale` (0-1, probability of ticking per frame)
- KO: 90 frames at 0.15 scale
- Parry: 30 frames at 0.3 scale
- Particles and drawing still run every frame for smooth visuals

### AI (`aiUpdate`)
Rule-based. 4 difficulty-scaled params:
- `react` — frames between decisions (Easy=30, Insane=4)
- `aggro` — attack probability in range (0.3–0.95)
- `dodge` — dodge probability vs player attacks (0.1–0.9)
- Boss AI more aggressive with uppercuts
- AI uses slam when airborne near player
- AI chases items and weapon drops

### Weapons
In `WEAPONS` dict. Drop randomly (~40% chance every ~400 frames), picked up on contact, break after `weaponT` frames. Visual on leading hand in `drawBody()`.
- Sword — +60% dmg, +50% range
- Staff — +20% dmg, +80% range
- Nunchucks — +30% dmg, animated swing

### Stages (rotate every round)
1. Dojo — no hazards
2. Volcano — lava pools (burn on ground contact)
3. Ice Cave — falling icicles (warning shimmer before drop)
4. Storm — lightning strikes (yellow warning zone)

Hazards: `spawnHazards()` → `updateHazards()` → drawn in `drawScene()`.

### Boss Rounds
Every 5th round. 200+ HP (scales with round), purple, 1.3x scale, aggressive AI. Worth 5 coins.

### Roguelike Progression
- Coins earned on wins (2 normal, 5 boss)
- Shop opens every 3 rounds if player has coins
- `rollShopChoices()` picks 3 random upgrades from `ALL_UPGRADES` pool (excludes maxed)
- Different choices each visit
- Bought items flash green with "BOUGHT!" feedback + sound
- Unaffordable items dimmed, update after each purchase
- `upgrades` dict: `{dmg, hp, spd, nrg, crit, lifesteal, armor, dodge}`
- All upgrades apply to player only, not CPU

### Upgrade Pool (`ALL_UPGRADES`)
| Upgrade | Effect per level | Max | Cost |
|---|---|---|---|
| Power Up | +15% damage | 5 | 2 |
| Tough Body | +20 max HP | 5 | 2 |
| Swift Feet | +10% speed | 3 | 3 |
| Chi Flow | +30% energy regen | 3 | 3 |
| Critical Eye | +12% crit chance (2x dmg) | 4 | 3 |
| Vampiric | Heal 10% of dmg dealt | 3 | 4 |
| Iron Skin | -10% damage taken | 4 | 3 |
| Phantom | +8% dodge chance | 3 | 3 |

### Drawing
- `drawStick(p)` — afterimages, glow, color state → `drawBody()`
- `drawBody()` — jointed limbs (elbows/knees), facial expressions (eyes, open mouth on hit, sweat low HP), weapon visuals, attack trails (kick arc, uppercut curve, slam shockwave), energy ball on special
- Slam pose: legs spread, arms down
- Particles: `hitFX()` impact sparks, `textFX()` floating damage/status numbers, landing dust, dash trails, KO multi-color explosion (50 particles)
- Countdown: large centered number with fade-out per tick

### Difficulty
Buttons reset wins/coins/upgrades. Affects AI reaction time, aggression, dodge chance.

## Known Quirks
- Dash needs key release between taps (prevents accidental dash while running)
- Shop only appears after wins when `roundNum % 3 === 1`
- Weapon drops ~40% chance every ~400 frames
- Can't press Space to skip during KO slow-mo (must wait for it to finish)
- Parry only works for human player (AI always does normal block logic)
- Upgrades reset on difficulty change
