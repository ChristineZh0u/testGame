# Home Defense — Roguelike Prototype

## Overview
A browser-based roguelike survival game inspired by Slay the Spire, Vampire Survivors, and Balatro. You defend your home from waves of bugs using auto-triggering spells, relics, and rule cards that interact through tag-based synergies. Your cat helps.

**Play:** `open /Users/zhouchrs/workplace/testGame/spellengine/index.html`  
**Controls:** WASD/arrows to move, ESC to pause

## File Structure
```
spellengine/
├── index.html    — HTML shell + CSS (UI overlay, reward cards, rarity borders)
├── data.js       — All data definitions (spells, relics, rules, characters, enemies, wave events, combos, rarity colors)
├── systems.js    — Core systems (TriggerEngine, EffectSystem, EnemySpawner)
├── game.js       — Game class (loop, update, input, rewards, combat, hit effects, helpers)
├── render.js     — All rendering (canvas drawing, HUD, emoji rendering for enemies/player/projectiles)
```

## Architecture
- **Data-driven:** Cards are plain objects in `data.js`. Adding a new spell = add an entry + optionally a new case in `EffectSystem.execute()`.
- **TriggerEngine** — Manages spell cooldowns and fires spells based on trigger conditions (`every_x_seconds`, `on_damage_taken`, `on_enemy_killed`, `on_low_hp`, `on_spell_trigger`). Recursion depth guard (max 3) prevents infinite chains. Uses `_timer` (HUD display) and `_cdTimer` (cooldown gating for event-based spells) separately.
- **EffectSystem** — Executes spell effects (projectiles, AoE, chain, heal, meteor, frost/slow, static field, echo/repeat). Respects rule modifiers like Spring Cleaning (AoE radius boost).
- **EnemySpawner** — Gradual ramp: 3s spawn interval → 0.5s over time. +1 enemy per wave every 30s. Wave events every 50s after 90s. Boss every 5 min. Enemy types unlock over time (chargers at 30s, elites at 90s, splitters at 120s, shielded at 180s, exploders at 240s).
- **Dead enemy handling:** Enemies get `dead` flag, all loops skip dead, sweep once per frame at end of `update()`.
- **Rarity-gated rewards:** Common only at Lv1-2, uncommon at 3+, rare at 6+, epic at 10+, legendary at 15+. Within each tier, rarer cards still appear less often via weighted random.

## Theme: Home Defense 🏠

### 3 Characters
| Character | Emoji | Starting Cards | Bonus |
|-----------|-------|---------------|-------|
| Slipper Dad | 👨 | Slipper Throw | Physical +25% dmg |
| Spray Mom | 👩 | Bug Spray + Coffee Mug | Cooldowns -15% |
| Cat Kid | 🧒 | TP Orbit + Cat Call | Cat spells +20% dmg |

### 14 Spells (with rarity)
- **Common:** 🩴 Slipper Throw, 🧴 Bug Spray (orbit), 🧻 TP Orbit, 🤧 Sneeze Blast (AoE on hit)
- **Uncommon:** 🤖 Roomba (orbit), 🌸 Air Freshener (AoE slow), 🐱 Cat Call (chain pounce), 💊 Antihistamine (heal on kill), 💩 Poop Fling (piercing)
- **Rare:** 🧪 Bleach Bomb (large AoE), 🧦 Static Socks (%HP dmg), 🤮 Allergy Attack (low HP explosion)
- **Epic:** 😺 Cat Nap Echo (repeats last spell)
- **Legendary:** 🚽 Toilet Flush (meteor targeting densest cluster)

### 12 Relics
- **Common:** Tissue Box (XP range), Running Shoes (speed), Cat Treats (heal per kill)
- **Uncommon:** Coffee Mug (cooldowns), Spicy Food (damage), Door Lock (shield), Scented Candle (chemical +25%), Cat Collar (cat +25%)
- **Rare:** Cactus (thorns), Extra TP Roll (+1 orbit projectile)
- **Epic:** Junk Drawer (+1 reward choice)
- **Legendary:** Expired Milk (+40% dmg / -30% HP)

### 7 Rules
- **Uncommon:** Spring Cleaning (AoE +20% radius)
- **Rare:** Adrenaline (kill streak +5% dmg), Cat Reflex (20% retrigger on kill), Time Warp (combos trigger slow motion)
- **Epic:** Panic Mode (below 50% HP = 2x spell speed), Clean Freak (shared tags = 2x dmg)
- **Legendary:** Hoarder (newest spell counts as all tags)

### 7 Enemy Types
| Type | Emoji | Special |
|------|-------|---------|
| Ant | 🐜 | Basic swarm |
| Cockroach | 🪳 | Fast, spawns 2-3 🐛 baby roaches on death |
| Fly | 🪰 | Splits into 2 mini flies on death |
| Beetle | 🪲 | 50% armor |
| Stink Bug | 🦟 | Explodes on death, AoE damages player |
| Spider | 🕷️ | Elite, tanky |
| Rat | 🐀 | Boss, spawns every 5 min, periodic AoE attack |

### Combo System
- 3 simultaneous spells → 💨 Sneeze Wave (small shockwave)
- 5 simultaneous spells → 🌪️ Cleaning Frenzy (large shockwave)
- 8 simultaneous spells → 🐱 Cat Summoned (orbiting cat helper for 8s)

## Key Systems
- **Rarity borders:** Grey (common), green (uncommon), blue (rare), purple (epic), gold (legendary) with tinted card backgrounds.
- **Upgrade system:** Once all cards of available rarities are owned, level-ups offer spell upgrades (+30% dmg, -15% cd, stackable).
- **Kill streak:** Visual indicator at 3+, tracked for death screen stats.
- **Screen shake:** Only on meteor, exploder death, combo shockwave, boss spawn/attack.
- **Particles:** Colored trails on projectiles (thicker for orbits), burst on enemy death.
- **Element hit effects:** Physical = dust puffs, Chemical = green mist, Cat = scratch sparks, Gross/allergy = splatter. Hit flash tinted to spell color.
- **Burn DoT:** Chemical hits apply burn (damage over time, pulsing glow).
- **Frost slow:** Air Freshener slows enemies to 40% speed, rendered semi-transparent.
- **Orbit differentiation:** Each orbit spell has different size (scales with damage), colored glow ring, distinct trail color. Gravity Lens extra orbs start on opposite sides.
- **Pause:** ESC to pause/resume.
- **Debug log:** Bottom-right corner shows spell casts, kills, events, errors.

## Known Design Decisions
- `_depth` counter (max 3) replaces boolean `_firing` flag to allow spell chains while preventing infinite recursion (Cat Nap Echo → repeat → on_spell_trigger loop).
- Event-based spells use `_cdTimer` separate from `_timer` because `_timer` is used for HUD cooldown bar display.
- All emoji are single-codepoint to avoid multi-character rendering issues.
- Slow motion is a rule card (Time Warp) not an automatic combo effect — player opts in.
- Early game pacing: 3s spawn interval, only ants for first 30s, commons-only rewards until Lv3.

## What Could Be Added Next
- Sound effects / Web Audio API
- More spell effects (homing, boomerang, trap placement)
- Meta progression via localStorage (unlock cards/characters across runs)
- Arena hazards (furniture, spills)
- Card removal/reroll option at reward screen
- Synergy preview on reward hover
- More characters (Grandma with broom, Dog companion)
- Difficulty scaling options
- Mobile touch controls
