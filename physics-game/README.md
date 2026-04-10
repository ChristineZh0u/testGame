# Roguelike Pool

A browser-based 8-ball pool game with roguelike progression. Pocket balls, earn gold, buy upgrades, and survive as many rounds as you can.

## How to Play

Open `index.html` in a browser.

- **Aim**: Click and drag away from the cue ball — the stick pulls back like a slingshot
- **Shoot**: Release to fire. Minimum drag distance required to prevent misfires
- **Fast Forward**: Click while balls are moving to speed up (8x)
- **Place Cue Ball**: After a scratch, click behind the head string to place it

## Roguelike Mechanics

- **Rounds**: Each round spawns target balls to pocket within a limited number of shots
- **HP**: Lose 1 HP if you pocket zero balls in a round. Game over at 0 HP
- **Gold**: Earned by pocketing balls (+5 per ball, +bonus per round)
- **Upgrades**: Buy from 3 random choices between rounds. Reroll for gold or skip to save

## Upgrade Trees (Tiered with Rarity)

| Upgrade | Tiers | Rarity | Effect |
|---------|-------|--------|--------|
| Explosive Cue | 3 | Uncommon → Rare → Legendary | Cue explodes on hit → chain reactions → 2x blast radius |
| Power Up | 3 | Common → Uncommon | +25% shot power per level |
| Extra Shot | 4 | Common | +1 shot per round |
| Big Pockets | 3 | Common → Uncommon → Rare | Pockets grow per level |
| Guide Line | 3 | Common → Uncommon | Longer aim guide, unlocks bounce preview at Lv2 |
| Max HP Up | 3 | Uncommon → Rare | +1 max HP per level |
| Armor | 2 | Uncommon → Rare | No HP loss on empty rounds → heal on clear |
| Pocket Magnet | 2 | Rare → Legendary | Slow balls drift toward pockets |
| More Balls | 3 | Common → Uncommon | +2 target balls per round (more gold opportunity) |
| Heal | - | Common | +1 HP (available when hurt) |
| Fewer Balls | - | Common | -1 ball next round |

Rarity determines cost: Common 10g, Uncommon 25g, Rare 50g, Legendary 80g.

## Round Mutators (from Round 2+)

- **Slippery Felt** — less friction
- **Sticky Felt** — more friction
- **Tiny Pockets** — pockets shrink
- **Bumper Ball** — a bouncing obstacle ball
- **Obstacle** — a wall spawns on the table

## Guide Line Behavior

- Starts long in Round 1, shrinks by 25px each round (min 80px)
- Guide Line upgrade adds length back
- Bounce/deflection preview shown for free in Rounds 1–3, then requires Guide Line Lv2

## Tech

Single HTML file, vanilla JS + Canvas. No dependencies.
