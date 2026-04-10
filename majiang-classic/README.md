# 川麻 · 血战到底

Browser-based Sichuan Majiang (四川麻将) with authentic rules.

## Play

```bash
open index.html
```

## Rules

**Basics**
- 108 tiles: 万 (wan), 条 (tiao), 饼 (tong) — no winds or dragons
- No 吃 (chi), only 碰 (peng) and 杠 (gang)
- 定缺: choose one suit to discard first; must clear it before winning

**血战到底 (Fight to the End)**
- Game continues after someone wins until only 1 player remains or tiles run out

**Scoring: 底分 × 2^番数**

| 番型 | 番数 | 分数 |
|------|------|------|
| 平胡 | 0 | 1 |
| 碰碰胡 | 1 | 2 |
| 清一色 | 2 | 4 |
| 七对 | 2 | 4 |
| 龙七对 | 3 | 8 |
| 清七对 | 4 | 16 |
| 清龙七对 | 5 | 32 |
| 杠上开花 | +1 | × |
| 海底捞月 | +1 | × |

Fan types stack (e.g. 清一色 + 碰碰胡 = 3番 = 8分).

**刮风下雨 (Gang Scoring)**

| Type | Payment |
|------|---------|
| 暗杠 | Each player pays 2× base |
| 明杠 | Each player pays 1× base |
| 补杠 | Each player pays 1× base |

**End-of-game Penalties**
- 花猪: Didn't clear 缺 suit → pay winners & ting players
- 查叫: Not in ting (ready) state → pay ting players max possible fan

## Files

- `index.html` — game layout
- `style.css` — styling
- `tiles.js` — 108-tile set, rendering, shuffle
- `game.js` — game logic, AI, scoring, fan detection
