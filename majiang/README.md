# 霓虹雀馆 · Neon Sparrow House

A cyberpunk roguelike Sichuan Majiang (川麻) game set in 2077 Hong Kong.

## Play

```bash
open index.html
```

## Game Overview

You enter an underground majiang den in Kowloon Walled City with $10. Fight your way through 8 floors of increasingly high-stakes majiang. Reach $100,000 on Floor 8 to win. Go broke and you stay here forever.

## Flow

```
Title → Pick Starter Relic → Floor 1 → Game End → Stay/Go Up → Event/Shop/Relic → Floor 2 → ... → Floor 8 → $100,000 → Victory
```

- After each game: choose to **go up** (need enough chips) or **stay** on the current floor
- Going up triggers a random **event**, **shop**, or **free relic pick**
- You can stay on a floor and grind until you have enough chips

## Majiang Rules (川麻 · 血战到底)

**Basics**
- 108 tiles: 万 (wan), 条 (tiao), 饼 (tong) — no winds or dragons
- No 吃 (chi), only 碰 (peng) and 杠 (gang)
- 定缺: choose one suit to discard first; must clear it before winning

**血战到底 (Fight to the End)**
- Game continues after someone wins until only 1 player remains or tiles run out

**Scoring: base × 2^fan**

| Fan Type | Fan | Score |
|----------|-----|-------|
| 平胡 (Basic) | 0 | 1× |
| 碰碰胡 (All Triplets) | 1 | 2× |
| 清一色 (Flush) | 2 | 4× |
| 七对 (7 Pairs) | 2 | 4× |
| 龙七对 (7 Pairs + Quad) | 3 | 8× |
| 清七对 (Flush 7 Pairs) | 4 | 16× |
| 清龙七对 (Flush 7P + Quad) | 5 | 32× |
| 杠上开花 (Win after Gang) | +1 | × |
| 海底捞月 (Last Tile Win) | +1 | × |

Fan types stack (e.g. 清一色 + 碰碰胡 = 3 fan = 8×).

**Gang Scoring (刮风下雨)**

| Type | Payment |
|------|---------|
| 暗杠 (Concealed) | Each pays 2× base |
| 明杠 (Open) | Each pays 1× base |
| 补杠 (Add) | Each pays 1× base |

**End-of-game Penalties**
- 花猪: Didn't clear void suit → pay winners & ready players
- 查叫: Not ready (ting) → pay ready players their max possible fan

## Roguelike System

### Floors & Stakes

| Floor | Base Score | Chips Needed |
|-------|-----------|--------------|
| 1F | $5 | $10 |
| 2F | $10 | $20 |
| 3F | $20 | $50 |
| 4F | $50 | $100 |
| 5F | $100 | $500 |
| 6F | $500 | $1,000 |
| 7F | $1,000 | $5,000 |
| 8F | $5,000 | $100,000 (Victory!) |

### Starter Relics (Pick 1 of 3)

| Relic | Effect |
|-------|--------|
| 🐲 龙脉 | All wins +2 fan (×4 score) |
| 🌟 金手指 | Start with a triplet + pair |
| 👻 鬼眼 | See 1 opponent's hand (stacks with 透视眼) |
| 🏦 瑞士银行 | Start $50, +$10/round |
| 🎪 混沌之心 | Random temp relic each round |
| 🗝 神偷 | Swap 3 tiles per round |
| 🦎 变色龙 | Change 3 tiles' suit per round |

### Relics (Unlock by Floor)

**Tier 0 (Always)**
| Relic | Effect | Stacks |
|-------|--------|--------|
| 🛡 铁壁 | -30% losses | ✓ |
| 🔄 换牌术 | Swap 1 tile/round | ✓ |
| 🍀 好运符 | 2 fewer void tiles | ✗ |
| 📈 利息 | +$5/round | ✓ |
| 🧲 吸金石 | +$1 per peng/gang | ✓ |
| 🔁 碰碰返利 | Peng refund base×1 | ✓ |
| 🎎 对子运 | More pairs in hand | ✓ |

**Tier 1 (3F+)**
| Relic | Effect | Stacks |
|-------|--------|--------|
| 🏺 聚宝盆 | Gang income ×2 | ✓ |
| 🔥 连胜火焰 | +base×streak bonus | ✓ |
| 💎 钻石甲 | Max loss = base×8 | ✗ |
| 📋 保险 | Pay half when dealt in | ✓ |
| 👁 透视眼 | See 1 opponent's hand | ✗ |
| 🎲 杠运 | More quads in hand | ✓ |
| 📶 顺子运 | More sequences in hand | ✓ |

**Tier 2 (5F+)**
| Relic | Effect | Stacks |
|-------|--------|--------|
| ⚡ 双倍赌注 | Winnings ×2 | ✓ |
| 📡 扫描仪 | See all ting | ✗ |
| 🎯 自摸达人 | Self-draw +base×5 | ✓ |
| 🌈 清一色大师 | Flush +base×10 | ✓ |
| ⛓ 连杠 | Each gang +50% next | ✓ |
| 🏦 收税官 | Earn base×1 on AI gang | ✓ |
| 🔗 连环计 | +base×3 per sequence | ✓ |

**Tier 3 (7F+)**
| Relic | Effect | Stacks |
|-------|--------|--------|
| 👑 贪婪王冠 | +1 fan when winning | ✓ |
| 🧛 吸血鬼 | +20% of winnings | ✓ |
| ☃️ 雪球 | Every $100 won → +1 base | ✗ |

### Events

Random events between floors:
- 🎲 地下赌局 — Gamble for chips
- 💎 黑市交易 — Free chips
- 🔧 改装店 — Pay for a chance at chips
- 🎰 老虎机 — High risk, high reward
- 🍜 大排档 — Small heal

### Shop (🏪 黑市商店)

Buy relics with chips. Prices increase ×1.8 per copy owned.

### AI Opponents

8 unique characters with personalities affecting playstyle and dialogue:

| Character | Style | Personality |
|-----------|-------|-------------|
| 🐍 阿蛇 | Flush | Sneaky, goes for 清一色 |
| 👩‍💻 黑客 | Balanced | Trash-talking hacker |
| 🃏 老千 | Triplets | "Never cheats" |
| 🦾 铁手 | Aggressive | Fast, loud |
| 👻 幽灵 | Flush | Silent, creepy |
| 🎰 赌神 | Balanced | Cool, confident |
| 💅 妈妈桑 | Triplets | Flirty, warm |
| 🐉 九龙 | Aggressive | Boss energy |

Boss floors (7F-8F) feature tougher opponents.

## Controls

- Click tiles to discard
- Action buttons: 胡/碰/杠/过
- 🔄换牌: Swap a tile (relic)
- 🦎变色: Change tile suit (relic)
- ⏩快进: Fast-forward after winning (press twice to end immediately)
- EN/中文: Toggle language

## Files

- `index.html` — Game layout
- `style.css` — Cyberpunk styling
- `tiles.js` — 108-tile set, rendering
- `game.js` — Majiang logic, AI, scoring
- `rogue.js` — Roguelike system, relics, events, shop
- `sound.js` — Web Audio sound effects
- `i18n.js` — Chinese/English localization
- `test.js` — Unit tests (`node test.js`)
