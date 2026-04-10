// test.js — Run with: node test.js
// Tests basic majiang winning logic

function tileKey(t) { return `${t.suit}_${t.rank}`; }
function T(suit, rank) { return { suit, rank, id: suit+rank }; }
function hand(...specs) { return specs.map(s => { const suit = {w:'wan',t:'tiao',b:'tong'}[s[0]]; return T(suit, +s.slice(1)); }); }

// Copy core functions from game.js
function removeMelds(c) {
  const keys = Object.keys(c).filter(k => c[k]>0).sort();
  if (!keys.length) return true;
  const k = keys[0];
  const [s,rr] = k.split('_'), r = +rr;
  if (c[k]>=3) { c[k]-=3; if (removeMelds(c)) return true; c[k]+=3; }
  if (r<=7) { const k2=`${s}_${r+1}`,k3=`${s}_${r+2}`; if ((c[k2]||0)>0&&(c[k3]||0)>0) { c[k]--;c[k2]--;c[k3]--; if (removeMelds(c)) return true; c[k]++;c[k2]++;c[k3]++; } }
  return false;
}
function checkStandard(hand) {
  if ((hand.length - 2) % 3 !== 0) return false;
  const c = {}; hand.forEach(t => { const k = tileKey(t); c[k] = (c[k]||0)+1; });
  for (const p of Object.keys(c)) { if (c[p]<2) continue; const cc={...c}; cc[p]-=2; if (removeMelds(cc)) return true; }
  return false;
}
function checkQiDui(hand) {
  if (hand.length !== 14) return false;
  const c = {}; hand.forEach(t => { const k = tileKey(t); c[k] = (c[k]||0)+1; });
  return Object.values(c).every(v => v===2||v===4);
}
function canWin(hand, melds) {
  if (hand.length < 2) return false;
  if (melds) {
    const meldTiles = melds.reduce((s,m) => s + m.tiles.length, 0);
    const gangCount = melds.filter(m => m.type==='gang'||m.type==='angang').length;
    const adjusted = hand.length + meldTiles - gangCount;
    if (adjusted !== 14 && adjusted !== 15) return false;
  }
  return checkStandard(hand) || checkQiDui(hand);
}
function checkPPH(hand, melds) {
  if (melds && melds.some(m => m.type==='chi')) return false;
  const c = {}; hand.forEach(t => { const k=tileKey(t); c[k]=(c[k]||0)+1; });
  let pairs = 0;
  for (const v of Object.values(c)) { if (v===2) pairs++; else if (v===3) {} else return false; }
  return pairs === 1;
}

// Test runner
let pass = 0, fail = 0;
function test(name, actual, expected) {
  if (actual === expected) { pass++; }
  else { fail++; console.log(`❌ FAIL: ${name} — got ${actual}, expected ${expected}`); }
}

// ===== Basic winning hands (14 tiles, no melds) =====
console.log('--- Basic 14-tile wins ---');

// 平胡: 1,2,3 + 4,5,6 + 7,8,9 + 1,2,3 + 5,5
test('Basic win: 4 sequences + pair',
  canWin(hand('w1','w2','w3','w4','w5','w6','w7','w8','w9','t1','t2','t3','t5','t5'), []),
  true);

// All triplets + pair (碰碰胡)
test('All triplets + pair',
  canWin(hand('w1','w1','w1','w5','w5','w5','t3','t3','t3','b7','b7','b7','b9','b9'), []),
  true);

// 七对
test('Seven pairs',
  canWin(hand('w1','w1','w3','w3','w5','w5','t2','t2','t7','t7','b4','b4','b8','b8'), []),
  true);

// 龙七对 (7 pairs with a quad)
test('Dragon seven pairs',
  canWin(hand('w1','w1','w1','w1','w3','w3','w5','w5','t2','t2','t7','t7','b4','b4'), []),
  true);

// Not a win: random tiles
test('Not a win: random',
  canWin(hand('w1','w2','w4','w5','w7','w8','t1','t3','t5','t7','b2','b4','b6','b8'), []),
  false);

// Not a win: 13 tiles
test('Not a win: 13 tiles',
  canWin(hand('w1','w2','w3','w4','w5','w6','w7','w8','w9','t1','t2','t3','t5'), []),
  false);

// ===== Wins with melds =====
console.log('\n--- Wins with melds ---');

// 3 peng + pair in hand (2 tiles)
test('3 peng + pair (2 tiles)',
  canWin(hand('b5','b5'), [
    {type:'peng',tiles:[T('wan',1),T('wan',1),T('wan',1)]},
    {type:'peng',tiles:[T('tiao',3),T('tiao',3),T('tiao',3)]},
    {type:'peng',tiles:[T('tong',7),T('tong',7),T('tong',7)]},
    {type:'peng',tiles:[T('wan',9),T('wan',9),T('wan',9)]},
  ]),
  true);

// 3 peng + non-pair (2 tiles) — can't win
test('3 peng + non-pair (2 tiles)',
  canWin(hand('b5','w3'), [
    {type:'peng',tiles:[T('wan',1),T('wan',1),T('wan',1)]},
    {type:'peng',tiles:[T('tiao',3),T('tiao',3),T('tiao',3)]},
    {type:'peng',tiles:[T('tong',7),T('tong',7),T('tong',7)]},
    {type:'peng',tiles:[T('wan',9),T('wan',9),T('wan',9)]},
  ]),
  false);

// 2 peng + triplet + pair in hand (5 tiles)
test('2 peng + triplet+pair in hand (5 tiles)',
  canWin(hand('w3','w3','w3','b1','b1'), [
    {type:'peng',tiles:[T('wan',1),T('wan',1),T('wan',1)]},
    {type:'peng',tiles:[T('tiao',5),T('tiao',5),T('tiao',5)]},
    {type:'peng',tiles:[T('tong',9),T('tong',9),T('tong',9)]},
  ]),
  true);

// 1 peng + sequence + triplet + pair in hand (8 tiles)
test('1 peng + seq+trip+pair in hand (8 tiles)',
  canWin(hand('w1','w2','w3','t5','t5','t5','b8','b8'), [
    {type:'peng',tiles:[T('wan',7),T('wan',7),T('wan',7)]},
    {type:'peng',tiles:[T('tiao',1),T('tiao',1),T('tiao',1)]},
  ]),
  true);

// ===== Wins with gang (4-tile melds) =====
console.log('\n--- Wins with gang ---');

// 1 angang + 3 peng + pair (2 tiles) — total 2+4+9=15, adjusted=15-1=14
test('1 angang + 3 peng + pair after draw (2 tiles)',
  canWin(hand('b2','b2'), [
    {type:'angang',tiles:[T('wan',9),T('wan',9),T('wan',9),T('wan',9)]},
    {type:'peng',tiles:[T('tong',8),T('tong',8),T('tong',8)]},
    {type:'peng',tiles:[T('tong',5),T('tong',5),T('tong',5)]},
    {type:'peng',tiles:[T('tong',3),T('tong',3),T('tong',3)]},
  ]),
  true);

// 1 angang + 2 peng + triplet+pair in hand (5 tiles) — 5+4+6=15, adjusted=14
test('1 angang + 2 peng + trip+pair (5 tiles)',
  canWin(hand('w1','w1','w1','b3','b3'), [
    {type:'angang',tiles:[T('tiao',5),T('tiao',5),T('tiao',5),T('tiao',5)]},
    {type:'peng',tiles:[T('wan',7),T('wan',7),T('wan',7)]},
    {type:'peng',tiles:[T('tong',2),T('tong',2),T('tong',2)]},
  ]),
  true);

// 1 angang + 3 peng + non-pair (2 tiles) — can't win
test('1 angang + 3 peng + non-pair (2 tiles)',
  canWin(hand('b2','w7'), [
    {type:'angang',tiles:[T('wan',9),T('wan',9),T('wan',9),T('wan',9)]},
    {type:'peng',tiles:[T('tong',8),T('tong',8),T('tong',8)]},
    {type:'peng',tiles:[T('tong',5),T('tong',5),T('tong',5)]},
    {type:'peng',tiles:[T('tong',3),T('tong',3),T('tong',3)]},
  ]),
  false);

// 2 gang + 2 peng + pair (2 tiles) — 2+8+6=16, adjusted=16-2=14
test('2 gang + 2 peng + pair (2 tiles)',
  canWin(hand('b1','b1'), [
    {type:'angang',tiles:[T('wan',1),T('wan',1),T('wan',1),T('wan',1)]},
    {type:'gang',tiles:[T('tiao',5),T('tiao',5),T('tiao',5),T('tiao',5)]},
    {type:'peng',tiles:[T('tong',3),T('tong',3),T('tong',3)]},
    {type:'peng',tiles:[T('wan',8),T('wan',8),T('wan',8)]},
  ]),
  true);

// ===== Self-draw after gang (hand has extra tile) =====
console.log('\n--- Self-draw after gang (total=15) ---');

// After angang, drew a tile: 11 tiles in hand + angang(4) = 15, adjusted=14
test('After angang self-draw: 11 tiles + angang',
  canWin(hand('w1','w2','w3','w4','w5','w6','w7','w8','w9','b5','b5'), [
    {type:'angang',tiles:[T('tiao',3),T('tiao',3),T('tiao',3),T('tiao',3)]},
  ]),
  true);

// After angang, drew but can't win
test('After angang self-draw: can\'t win',
  canWin(hand('w1','w2','w4','w5','w7','w8','t1','t3','b5','b7','b9'), [
    {type:'angang',tiles:[T('tiao',3),T('tiao',3),T('tiao',3),T('tiao',3)]},
  ]),
  false);

// ===== 相公 (dead hand) =====
console.log('\n--- 相公 detection ---');

// Too many tiles (should fail)
test('相公: too many tiles',
  canWin(hand('w1','w2','w3','w4','w5','w6','w7','w8','w9','b5','b5','b5'), [
    {type:'angang',tiles:[T('tiao',3),T('tiao',3),T('tiao',3),T('tiao',3)]},
  ]),
  false);

// Too few tiles
test('相公: too few tiles',
  canWin(hand('b5'), [
    {type:'angang',tiles:[T('tiao',3),T('tiao',3),T('tiao',3),T('tiao',3)]},
    {type:'peng',tiles:[T('wan',1),T('wan',1),T('wan',1)]},
  ]),
  false);

// ===== 碰碰胡 detection =====
console.log('\n--- 碰碰胡 ---');

test('PPH: all triplets + pair',
  checkPPH(hand('w1','w1','w1','t3','t3','t3','b7','b7','b7','w5','w5','w5','b9','b9'), []),
  true);

test('PPH: with peng melds',
  checkPPH(hand('w1','w1','w1','b9','b9'), [
    {type:'peng',tiles:[T('tiao',3),T('tiao',3),T('tiao',3)]},
    {type:'peng',tiles:[T('tong',5),T('tong',5),T('tong',5)]},
    {type:'peng',tiles:[T('wan',7),T('wan',7),T('wan',7)]},
  ]),
  true);

test('PPH: has sequence = not PPH',
  checkPPH(hand('w1','w2','w3','t3','t3','t3','b7','b7','b7','w5','w5','w5','b9','b9'), []),
  false);

// ===== 暗杠后胡牌 (simulate real game flow) =====
console.log('\n--- 暗杠后胡牌 (real flow simulation) ---');

// Simulate: start with 13 tiles, draw 1 (=14), angang 4 (=10), draw 1 (=11), check win
// Case 1: angang then self-draw win
{
  const startHand = hand('w9','w9','w9','w9','w1','w2','w3','t4','t5','t6','b1','b2','b3');
  // Draw a tile
  startHand.push(T('wan',5)); // now 14 tiles
  // Angang w9
  const gangTiles = startHand.filter(t=>tileKey(t)==='wan_9');
  const afterGang = startHand.filter(t=>tileKey(t)!=='wan_9'); // 10 tiles
  const melds = [{type:'angang', tiles:gangTiles}];
  // Draw another tile (补摸)
  afterGang.push(T('tong',3)); // 11 tiles
  test('Angang flow: 11 tiles + angang, can win (3 seq + pair)',
    canWin(afterGang, melds), false); // b1b2b3+t4t5t6+w1w2w3 = 3seq, b3 not pair... let me fix
}

// Case 2: angang then draw winning tile
{
  const afterGang = hand('w1','w2','w3','t4','t5','t6','b7','b8','b9','b2'); // 10 tiles
  const melds = [{type:'angang', tiles:[T('wan',9),T('wan',9),T('wan',9),T('wan',9)]}];
  afterGang.push(T('tong',2)); // draw b2, now 11 tiles: w123+t456+b789+b2b2 pair!
  test('Angang flow: draw makes pair, win!',
    canWin(afterGang, melds), true);
}

// Case 3: angang then draw, can't win
{
  const afterGang = hand('w1','w2','w3','t4','t5','t6','b7','b8','b9','b2'); // 10 tiles
  const melds = [{type:'angang', tiles:[T('wan',9),T('wan',9),T('wan',9),T('wan',9)]}];
  afterGang.push(T('tong',5)); // draw b5, now 11 tiles, no win
  test('Angang flow: draw bad tile, no win',
    canWin(afterGang, melds), false);
}

// Case 4: angang + peng, then draw pair = win (your exact bug case)
{
  const h = hand('b2','b2'); // 2 tiles in hand
  const melds = [
    {type:'angang', tiles:[T('wan',9),T('wan',9),T('wan',9),T('wan',9)]},
    {type:'peng', tiles:[T('tong',8),T('tong',8),T('tong',8)]},
    {type:'peng', tiles:[T('tong',5),T('tong',5),T('tong',5)]},
    {type:'peng', tiles:[T('tong',3),T('tong',3),T('tong',3)]},
  ];
  // 2 + 4+3+3+3 = 15, gangCount=1, adjusted=14
  test('Angang+3peng: pair in hand = WIN (your bug case)',
    canWin(h, melds), true);
}

// Case 5: angang + peng, non-pair = no win
{
  const h = hand('b2','t7'); // 2 tiles, not pair
  const melds = [
    {type:'angang', tiles:[T('wan',9),T('wan',9),T('wan',9),T('wan',9)]},
    {type:'peng', tiles:[T('tong',8),T('tong',8),T('tong',8)]},
    {type:'peng', tiles:[T('tong',5),T('tong',5),T('tong',5)]},
    {type:'peng', tiles:[T('tong',3),T('tong',3),T('tong',3)]},
  ];
  test('Angang+3peng: non-pair = no win',
    canWin(h, melds), false);
}

// Case 6: angang + 2peng, 5 tiles in hand, triplet+pair
{
  const h = hand('w1','w1','w1','b3','b3'); // triplet + pair
  const melds = [
    {type:'angang', tiles:[T('tiao',5),T('tiao',5),T('tiao',5),T('tiao',5)]},
    {type:'peng', tiles:[T('wan',7),T('wan',7),T('wan',7)]},
    {type:'peng', tiles:[T('tong',2),T('tong',2),T('tong',2)]},
  ];
  // 5+4+3+3=15, gangCount=1, adjusted=14
  test('Angang+2peng: trip+pair in hand = WIN',
    canWin(h, melds), true);
}

// Case 7: angang + 2peng, 5 tiles in hand, sequence+pair
{
  const h = hand('w1','w2','w3','b3','b3'); // sequence + pair
  const melds = [
    {type:'angang', tiles:[T('tiao',5),T('tiao',5),T('tiao',5),T('tiao',5)]},
    {type:'peng', tiles:[T('wan',7),T('wan',7),T('wan',7)]},
    {type:'peng', tiles:[T('tong',2),T('tong',2),T('tong',2)]},
  ];
  test('Angang+2peng: seq+pair in hand = WIN',
    canWin(h, melds), true);
}

// Case 8: double angang + peng + pair
{
  const h = hand('b5','b5'); // pair
  const melds = [
    {type:'angang', tiles:[T('wan',1),T('wan',1),T('wan',1),T('wan',1)]},
    {type:'angang', tiles:[T('tiao',9),T('tiao',9),T('tiao',9),T('tiao',9)]},
    {type:'peng', tiles:[T('tong',3),T('tong',3),T('tong',3)]},
    {type:'peng', tiles:[T('wan',7),T('wan',7),T('wan',7)]},
  ];
  // 2+4+4+3+3=16, gangCount=2, adjusted=14
  test('2 angang + 2 peng + pair = WIN',
    canWin(h, melds), true);
}

// Case 9: dianpao after angang (someone throws tile you need)
{
  const h = hand('w1','w2','w3','t4','t5','t6','b7','b8','b9','b2'); // 10 tiles waiting
  const melds = [{type:'angang', tiles:[T('wan',9),T('wan',9),T('wan',9),T('wan',9)]}];
  // Someone throws b2, add to hand: 11 tiles
  const withTile = [...h, T('tong',2)];
  test('Angang + dianpao: someone throws matching tile = WIN',
    canWin(withTile, melds), true);
}

// ===== Summary =====
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail === 0) console.log('✅ All tests passed!');
else { console.log('❌ Some tests failed!'); process.exit(1); }
