// ===== Sorting =====
function queSortFor(q) {
  return (a, b) => {
    const d = (a.suit === q ? 1 : 0) - (b.suit === q ? 1 : 0);
    return d || tileSort(a, b);
  };
}

// ===== Win Detection =====
function canWin(hand, melds) {
  if (hand.length < 2) return false;
  if (melds) {
    const meldTiles = melds.reduce((s,m) => s + m.tiles.length, 0);
    const gangCount = melds.filter(m => m.type==='gang'||m.type==='angang').length;
    const adjusted = hand.length + meldTiles - gangCount;
    if (adjusted !== 14 && adjusted !== 15) {
      if (hand.length <= 14) console.log('canWin rejected:', 'hand:', hand.length, 'meldTiles:', meldTiles, 'gangCount:', gangCount, 'adjusted:', adjusted, 'types:', melds.map(m=>m.type+':'+m.tiles.length));
      return false;
    }
  }
  const std = checkStandard(hand);
  const qd = checkQiDui(hand);
  return std || qd;
}
function checkStandard(hand) {
  const c = {}; hand.forEach(t => { const k = tileKey(t); c[k] = (c[k]||0)+1; });
  for (const p of Object.keys(c)) { if (c[p]<2) continue; const cc={...c}; cc[p]-=2; if (removeMelds(cc)) return true; }
  return false;
}
function checkQiDui(hand) {
  if (hand.length !== 14) return false;
  const c = {}; hand.forEach(t => { const k = tileKey(t); c[k] = (c[k]||0)+1; });
  return Object.values(c).every(v => v===2||v===4);
}
function removeMelds(c) {
  const keys = Object.keys(c).filter(k => c[k]>0).sort();
  if (!keys.length) return true;
  const k = keys[0];
  const [s,rr] = k.split('_'), r = +rr;
  if (c[k]>=3) { c[k]-=3; if (removeMelds(c)) return true; c[k]+=3; }
  if (r<=7) { const k2=`${s}_${r+1}`,k3=`${s}_${r+2}`; if ((c[k2]||0)>0&&(c[k3]||0)>0) { c[k]--;c[k2]--;c[k3]--; if (removeMelds(c)) return true; c[k]++;c[k2]++;c[k3]++; } }
  return false;
}
function queClear(hand, q) { return !hand.some(t => t.suit === q); }

// ===== Fan Detection =====
function calcFan(hand, melds, extras) {
  const fans = [], all = [...hand]; melds.forEach(m => all.push(...m.tiles));
  const qys = new Set(all.map(t => t.suit)).size === 1;
  const qd = hand.length === 14 && checkQiDui(hand);
  const pph = checkPPH(hand, melds);
  if (qd) {
    const c = {}; hand.forEach(t => { const k=tileKey(t); c[k]=(c[k]||0)+1; });
    const quads = Object.values(c).filter(v=>v===4).length;
    if (qys && quads) fans.push({name:'清龙七对',fan:5});
    else if (qys) fans.push({name:'清七对',fan:4});
    else if (quads) fans.push({name:'龙七对',fan:3});
    else fans.push({name:'七对',fan:2});
  } else {
    if (qys) fans.push({name:'清一色',fan:2});
    if (pph) fans.push({name:'碰碰胡',fan:1});
    if (!qys && !pph) fans.push({name:'平胡',fan:0});
  }
  if (extras.isGangShangHua) fans.push({name:'杠上开花',fan:1});
  if (extras.isHaiDi) fans.push({name:'海底捞月',fan:1});
  const totalFan = fans.reduce((s,f)=>s+f.fan,0);
  return { fans, totalFan };
}
function checkPPH(hand, melds) {
  // All melds must be peng/gang (no sequences)
  if (melds.some(m => m.type==='chi')) return false;
  // Hand portion: only triplets + exactly 1 pair allowed
  const c = {}; hand.forEach(t => { const k=tileKey(t); c[k]=(c[k]||0)+1; });
  let pairs = 0;
  for (const v of Object.values(c)) {
    if (v===2) pairs++;
    else if (v===3) {} // triplet ok
    else return false; // 1 or 4 = not all triplets
  }
  return pairs === 1;
}
function isTingPai(hand, melds) {
  for (const s of ['wan','tiao','tong']) for (let r=1;r<=9;r++) if (canWin([...hand,{suit:s,rank:r,id:-1}], melds)) return true;
  return false;
}
function getTingTiles(hand, melds) {
  const res = [];
  for (const s of ['wan','tiao','tong']) for (let r=1;r<=9;r++) {
    const f = {suit:s,rank:r,id:-1};
    if (canWin([...hand,f], melds)) res.push(f);
  }
  return res;
}
function maxTingFan(hand, melds) {
  let best = 0;
  for (const s of ['wan','tiao','tong']) for (let r=1;r<=9;r++) {
    const f = {suit:s,rank:r,id:-1}, th = [...hand,f];
    if (canWin(th, melds)) { const {totalFan}=calcFan(th,melds,{}); if (totalFan>best) best=totalFan; }
  }
  return best;
}

// ===== Game =====
let BASE = 1;
const NAMES = ['南(你)','东','北','西'];

class MajiangGame {
  constructor() { this.phase = 'idle'; }

  pName(p) { return NAMES[p]; }
  showMsg(text) {
    const el = document.getElementById('msg-bar');
    el.textContent = text;
    clearTimeout(this._mt);
    this._mt = setTimeout(() => el.textContent = '', 3500);
  }
  showCenter(text) {
    const el = document.getElementById('center-msg');
    el.textContent = text;
    el.style.animation = 'none'; el.offsetHeight;
    el.style.animation = 'centerPop 2s ease-out forwards';
  }

  // ===== Fly animations =====
  getPilePos() {
    const pile = document.getElementById('draw-pile');
    const r = pile.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }
  getHandPos(p) {
    const el = document.getElementById(p===0?'hand-row':`hand-${p}`);
    const r = el.getBoundingClientRect();
    if (p===0) return { x: r.right, y: r.top + r.height/2 };
    if (p===1) return { x: r.left + r.width/2, y: r.top + r.height/2 };
    if (p===2) return { x: r.left + r.width/2, y: r.bottom };
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }
  getDiscardPos(p) {
    const el = document.getElementById(`discards-${p}`);
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }

  flyTile(fromPos, toPos, tile, faceDown, cb, duration) {
    const dur = duration || 350;
    const fly = document.getElementById('fly-tile');
    fly.innerHTML = '';
    if (faceDown) {
      const d = document.createElement('div');
      d.className = 'tile';
      d.style.cssText = 'width:3.2vw;height:4.4vw;background:linear-gradient(180deg,#2c7a4b,#1a5c32);border-color:#145228;';
      fly.appendChild(d);
    } else {
      const d = renderTile(tile);
      d.style.cssText = 'width:3.2vw;height:4.4vw;';
      d.querySelector('.num').style.fontSize = '1.8vw';
      d.querySelector('.suit-char').style.fontSize = '0.9vw';
      fly.appendChild(d);
    }
    fly.style.display = 'block';
    fly.style.transition = 'none';
    fly.style.left = fromPos.x + 'px';
    fly.style.top = fromPos.y + 'px';
    fly.style.transform = 'translate(-50%,-50%) scale(0.8)';
    fly.style.opacity = '1';
    fly.offsetHeight;
    fly.style.transition = `all ${dur}ms cubic-bezier(0.2, 0.8, 0.3, 1)`;
    fly.style.left = toPos.x + 'px';
    fly.style.top = toPos.y + 'px';
    fly.style.transform = 'translate(-50%,-50%) scale(1)';
    // Mid-flight scale up for emphasis
    if (dur >= 500) {
      setTimeout(() => { fly.style.transform = 'translate(-50%,-50%) scale(1.3)'; }, dur * 0.3);
      setTimeout(() => { fly.style.transform = 'translate(-50%,-50%) scale(1)'; }, dur * 0.6);
    }
    setTimeout(() => {
      fly.style.display = 'none';
      if (cb) cb();
    }, dur + 10);
  }

  start() {
    this.wall = shuffle(createTileSet());
    this.hands = [[],[],[],[]];
    this.melds = [[],[],[],[]];
    this.discards = [[],[],[],[]];
    this.que = [null,null,null,null];
    this.won = [false,false,false,false];
    this.scores = [0,0,0,0];
    this.scoreLog = [[],[],[],[]];
    this.current = 0;
    this.phase = 'dealing';
    this.lastDiscard = null;
    this.lastDiscardPlayer = -1;
    this.justGanged = false;
    this.drawnTile = null; // track newly drawn tile for separation
    this.winDetails = [];
    this.winTile = [null, null, null, null];
    // Rogue relic flags (preserved across start if set by rogue)
    this._gangMulti = this._gangMulti || 1;
    this._shield = this._shield || 1;
    this._xrayCount = this._xrayCount || 0;
    this._fastMode = false;
    this._stopped = false;
    this._gangCountThisGame = 0;
    document.getElementById('modal').style.display = 'none';
    document.getElementById('center-msg').textContent = '';
    for (let p=0;p<4;p++) { document.getElementById(`status-${p}`).textContent=''; document.getElementById(`status-${p}`).className=''; document.getElementById(`que-${p}`).textContent=''; }
    for (let r=0;r<13;r++) for (let p=0;p<4;p++) this.hands[p].push(this.wall.pop());
    for (let p=0;p<4;p++) this.hands[p].sort(tileSort);

    // 金手指: guarantee pair + triplet before 定缺
    if (this._goldenDeal) {
      // Helper: swap a hand tile for a specific wall tile
      const doSwap = (wantKey) => {
        const idx = this.wall.findIndex(t=>tileKey(t)===wantKey);
        if (idx<0) return false;
        // Find least useful hand tile to swap out (singleton, not part of our targets)
        const hand = this.hands[0];
        const counts = {}; hand.forEach(t=>{const k=tileKey(t);counts[k]=(counts[k]||0)+1;});
        const swapOut = hand.filter(t=>!this._goldenKeep?.has(tileKey(t)))
          .sort((a,b)=>(counts[tileKey(a)]||0)-(counts[tileKey(b)]||0))[0];
        if (!swapOut) return false;
        this.hands[0] = this.hands[0].filter(t=>t.id!==swapOut.id);
        this.hands[0].push(this.wall[idx]);
        this.wall[idx] = swapOut;
        return true;
      };

      const hand = this.hands[0];
      const counts = {}; hand.forEach(t=>{const k=tileKey(t);counts[k]=(counts[k]||0)+1;});

      // Pick best triplet candidate: prefer tiles we already have 2 of, then 1
      const candidates = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
      let tripKey = null;
      for (const [k,c] of candidates) {
        if (c >= 3) { tripKey = k; break; } // already have triplet
        const inWall = this.wall.filter(t=>tileKey(t)===k).length;
        if (c + inWall >= 3) { tripKey = k; break; }
      }
      if (tripKey) {
        this._goldenKeep = new Set([tripKey]);
        while (this.hands[0].filter(t=>tileKey(t)===tripKey).length < 3) {
          if (!doSwap(tripKey)) break;
        }
      }

      // Pick pair: different from triplet, prefer tiles we have 1 of with copies in wall
      const hand2 = this.hands[0];
      const counts2 = {}; hand2.forEach(t=>{const k=tileKey(t);counts2[k]=(counts2[k]||0)+1;});
      let pairKey = null;
      for (const [k,c] of Object.entries(counts2).sort((a,b)=>b[1]-a[1])) {
        if (k === tripKey) continue;
        if (c >= 2) { pairKey = k; break; }
        if (this.wall.some(t=>tileKey(t)===k)) { pairKey = k; break; }
      }
      if (pairKey) {
        this._goldenKeep.add(pairKey);
        while (this.hands[0].filter(t=>tileKey(t)===pairKey).length < 2) {
          if (!doSwap(pairKey)) break;
        }
      }
      delete this._goldenKeep;
      shuffle(this.wall);
      this.hands[0].sort(tileSort);
    }

    // 杠运: swap tiles to create quads (before 定缺)
    for (let n=0; n<(this._gangLuck||0); n++) {
      const hand = this.hands[0], counts = {};
      hand.forEach(t=>{ const k=tileKey(t); counts[k]=(counts[k]||0)+1; });
      // Find best candidate: has 2-3 in hand AND remaining copies exist in wall
      const candidates = Object.entries(counts)
        .filter(([k,c])=>c>=2&&c<4&&this.wall.some(t=>tileKey(t)===k))
        .sort((a,b)=>b[1]-a[1]);
      const best = candidates[0];
      if (best) {
        const need = 4 - best[1];
        for (let i=0;i<need;i++) {
          const idx = this.wall.findIndex(t=>tileKey(t)===best[0]);
          const swapOut = hand.find(t=>tileKey(t)!==best[0]&&counts[tileKey(t)]===1);
          if (idx>=0&&swapOut) { this.hands[0]=this.hands[0].filter(t=>t.id!==swapOut.id); this.hands[0].push(this.wall[idx]); this.wall[idx]=swapOut; }
        }
      }
    }
    // 对子运: swap tiles to create more pairs
    for (let n=0; n<(this._pairLuck||0); n++) {
      const hand = this.hands[0];
      const singles = hand.filter(t=>hand.filter(x=>tileKey(x)===tileKey(t)).length===1);
      if (singles.length>=2) {
        const target = singles[0];
        const idx = this.wall.findIndex(t=>tileKey(t)===tileKey(target));
        const swapOut = singles[1];
        if (idx>=0) { this.hands[0]=this.hands[0].filter(t=>t.id!==swapOut.id); this.hands[0].push(this.wall[idx]); this.wall[idx]=swapOut; }
      }
    }
    // 顺子运: swap tiles to create sequences
    for (let n=0; n<(this._seqLuck||0); n++) {
      const hand = this.hands[0];
      for (const t of hand) {
        const k1 = `${t.suit}_${t.rank+1}`, k2 = `${t.suit}_${t.rank+2}`;
        const has1 = hand.some(x=>tileKey(x)===k1), has2 = hand.some(x=>tileKey(x)===k2);
        if (has1 && !has2 && t.rank<=7) {
          const idx = this.wall.findIndex(x=>tileKey(x)===k2);
          const swapOut = hand.find(x=>hand.filter(y=>tileKey(y)===tileKey(x)).length===1&&tileKey(x)!==tileKey(t)&&tileKey(x)!==k1);
          if (idx>=0&&swapOut) { this.hands[0]=this.hands[0].filter(x=>x.id!==swapOut.id); this.hands[0].push(this.wall[idx]); this.wall[idx]=swapOut; break; }
        }
      }
    }
    if (this._gangLuck||this._pairLuck||this._seqLuck) { shuffle(this.wall); }
    this.hands[0].sort(tileSort);

    document.getElementById('btn-start').style.display = 'none';
    this.hideActions();
    this.render();
    SFX.start();
    this.rollDice();
  }

  rollDice() {
    const el = document.getElementById('center-msg');
    let rolls = 0;
    const maxRolls = 15;
    const interval = setInterval(() => {
      const d1 = Math.floor(Math.random()*6)+1;
      const d2 = Math.floor(Math.random()*6)+1;
      const dice = ['⚀','⚁','⚂','⚃','⚄','⚅'];
      el.innerHTML = `<div style="font-size:3vw">${dice[d1-1]} ${dice[d2-1]}</div><div style="font-size:1vw;margin-top:0.3vw">${d1+d2}</div>`;
      el.style.animation = 'none';
      rolls++;
      if (rolls >= maxRolls) {
        clearInterval(interval);
        const total = d1 + d2;
        this.current = total % 4;
        const names = [t('south')+'('+t('you')+')', t('east'), t('north'), t('west')];
        el.innerHTML = `<div style="font-size:3vw">${dice[d1-1]} ${dice[d2-1]}</div><div style="font-size:1.2vw;margin-top:0.3vw;color:#0ff">${names[this.current]} ${LANG==='en'?'goes first':'先出牌'}</div>`;
        SFX.discard();
        setTimeout(() => {
          el.innerHTML = '';
          this.startQueSelect();
        }, 1500);
      }
    }, 100);
  }

  startQueSelect() {
    this.phase = 'que';
    for (let p=1;p<4;p++) {
      const c = {wan:0,tiao:0,tong:0};
      this.hands[p].forEach(t => c[t.suit]++);
      this.que[p] = Object.keys(c).reduce((a,b) => c[a]<=c[b]?a:b);
    }
    // Show tile counts to help player decide
    const c = {wan:0,tiao:0,tong:0};
    this.hands[0].forEach(t => c[t.suit]++);
    document.getElementById('que-counts').textContent = `万:${c.wan}张  条:${c.tiao}张  饼:${c.tong}张`;
    document.getElementById('que-select').style.display = '';
  }

  selectQue(suit) {
    this.que[0] = suit;
    document.getElementById('que-select').style.display = 'none';
    for (let p=0;p<4;p++) document.getElementById(`que-${p}`).textContent = `${t('que')}${t(SUIT_NAMES[this.que[p]]==='万'?'wan':SUIT_NAMES[this.que[p]]==='条'?'tiao':'tong')}`;

    // 好运符: replace 2 que-suit tiles with non-que tiles from wall
    if (this._luckyDeal) {
      const queTiles = this.hands[0].filter(t => t.suit === suit);
      const toSwap = queTiles.slice(0, 2);
      for (const old of toSwap) {
        // Find a non-que tile in the wall
        const idx = this.wall.findIndex(t => t.suit !== suit);
        if (idx >= 0) {
          this.hands[0] = this.hands[0].filter(t => t.id !== old.id);
          this.hands[0].push(this.wall[idx]);
          this.wall[idx] = old;
        }
      }
      shuffle(this.wall);
      this.hands[0].sort(queSortFor(suit));
      this.showMsg('🍀 好运符: 替换了2张缺门牌!');
    }


    this._swapUsed = 0;
    this._chameleonUsed = 0; // reset swap count per round
    this.phase = 'draw';
    this.render();

    // AI opening lines (personality-based)
    for (let p=1;p<=3;p++) {
      const line = this.aiLine(p,'opener');
      if (line) setTimeout(() => this.aiSay(p, line), p*600);
    }
    setTimeout(() => this.doTurn(), 2000);
  }

  activePlayers() { return [0,1,2,3].filter(p => !this.won[p]); }

  draw(p) {
    if (!this.wall.length) { this.endGame(); return null; }
    const t = this.wall.pop();
    this.hands[p].push(t);
    if (p === 0) this.drawnTile = t;
    return t;
  }

  sortHand(p) { this.hands[p].sort(this.que[p] ? queSortFor(this.que[p]) : tileSort); }

  gangPay(basePay, isPlayer) {
    // 连杠: each gang this game increases next gang income
    const chain = isPlayer ? (this._gangChain||0) * this._gangCountThisGame : 0;
    const multi = isPlayer ? (this._gangMulti||1) : 1;
    return Math.round(basePay * multi * (1 + chain));
  }

  doTurn() {
    if (this._stopped || this.phase==='over') return;
    const p = this.current;
    if (this.won[p]) { this.advanceTurn(); return; }
    if (!this.wall.length) { this.endGame(); return; }

    // Animate draw: tile flies from pile to player
    const from = this.getPilePos();
    const to = this.getHandPos(p);
    this.flyTile(from, to, null, true, () => {
      if (!this._fastMode) SFX.draw();
      const drawn = this.draw(p);
      if (!drawn) return;
      // Debug: check for 相公 (after draw, hand has +1 tile before discard)
      const meldTiles = this.melds[p].reduce((s,m)=>s+m.tiles.length, 0);
      const gangCount = this.melds[p].filter(m=>m.type==='gang'||m.type==='angang').length;
      const adjusted = (this.hands[p].length - 1) + meldTiles - gangCount;
      if (adjusted !== 13) console.warn(`⚠️ 相公 P${p}: 手牌${this.hands[p].length}-1 + 副露${meldTiles} - 杠${gangCount} = ${adjusted} ≠ 13`,
        '副露:', this.melds[p].map(m=>m.type+'('+m.tiles.length+'张)').join(' '));
      this.lastDiscard = null;
      this.lastDiscardPlayer = -1;
      this.phase = 'discard';
      this.render();

      const gangs = this.findSelfGangs(p);
      const qc = queClear(this.hands[p], this.que[p]);
      const cw = canWin(this.hands[p], this.melds[p]);
      const hu = qc && cw;
      if (p===0) {
        const handStr = this.hands[p].map(t=>tileName(t)).join(' ');
        const meldStr = this.melds[p].map(m=>m.type+'['+m.tiles.map(t=>tileName(t)).join('')+']').join(' ');
        const mt = this.melds[p].reduce((s,m)=>s+m.tiles.length,0);
        const gc = this.melds[p].filter(m=>m.type==='gang'||m.type==='angang').length;
        console.log('自摸检测:', '手牌数:', this.hands[p].length, '缺清:', qc, '能胡:', cw, '缺门:', this.que[p], '手牌:', handStr, '副露:', meldStr, 'adjusted:', this.hands[p].length+mt-gc);
      }

      if (p === 0) {
        const acts = {};
        if (hu) acts.hu = true;
        if (gangs.length) acts.gang = true;
        if (hu || gangs.length) { acts.pass = true; this.showActions(acts); }
        // Show swap button if relic active and not used this round
        if (this._canSwap && this._swapUsed < (this._swapMax||1) && this.wall.length) {
          document.getElementById('btn-swap').style.display = '';
        }
        if (this._chameleon && (this._chameleonUsed||0) < this._chameleon) {
          document.getElementById('btn-chameleon').style.display = '';
        }
        this.render();
      } else {
        if (hu) { this.doWin(p, p, true); return; }
        if (gangs.length) { this.doSelfGang(p, gangs[0]); return; }
        setTimeout(() => this.aiDiscard(p), this.aiDelay());
      }
    });
  }

  findSelfGangs(p) {
    const gangs = [], c = {};
    this.hands[p].forEach(t => { const k=tileKey(t); c[k]=(c[k]||0)+1; });
    for (const [k,v] of Object.entries(c)) if (v===4) gangs.push({type:'angang',key:k});
    for (const m of this.melds[p]) if (m.type==='peng') { const k=tileKey(m.tiles[0]); if (c[k]) gangs.push({type:'jiagang',key:k}); }
    return gangs;
  }

  doSelfGang(p, gi) {
    const k = gi.key, active = this.activePlayers().filter(x=>x!==p);
    if (gi.type === 'angang') {
      const tiles = this.hands[p].filter(t=>tileKey(t)===k);
      this.hands[p] = this.hands[p].filter(t=>tileKey(t)!==k);
      this.melds[p].push({type:'angang',tiles}); this._lastMeldPlayer=p;
      const pay = BASE*2;
      // 聚宝盆 + 连杠
      const realPay = this.gangPay(pay, p===0);
      if (p===0) this._gangCountThisGame++;
      active.forEach(x => {
        const xPay = x===0 ? pay : realPay; // player pays normal, player earns multiplied
        this.scores[x]-=xPay; this.scores[p]+=xPay;
        this.scoreLog[x].push(`暗杠给${NAMES[p]} -${xPay}`);
      });
      // 收税官: player earns when AI gangs
      if (p!==0 && (this._gangTax||0)>0) {
        const tax = BASE * this._gangTax;
        this.scores[0]+=tax; this.scores[p]-=tax;
        this.scoreLog[0].push(`🏦收税 +${tax}`);
      }
      this.scoreLog[p].push(`暗杠${tileName(tiles[0])} +${realPay*active.length}`);
      this.showCenter(`${NAMES[p]} 暗杠!`);
      SFX.gang();
      if (p===0 && (this._meldBonus||0)>0) { this.scores[0]+=this._meldBonus; this.scoreLog[0].push(`🧲吸金 +${this._meldBonus}`); }
      if (p!==0) this.aiSay(p, this.aiLine(p,'gang') || '暗杠!');
      this.aiReactTo(p, 'reactGang');
      this.showMsg(`${NAMES[p]} 暗杠 ${tileName(tiles[0])} 每家-${pay}`);
    } else {
      const tile = this.hands[p].find(t=>tileKey(t)===k);
      this.hands[p] = this.hands[p].filter(t=>t.id!==tile.id);
      const meld = this.melds[p].find(m=>m.type==='peng'&&tileKey(m.tiles[0])===k);
      meld.type='gang'; meld.tiles.push(tile);
      const pay = BASE;
      const realPay = this.gangPay(pay, p===0);
      if (p===0) this._gangCountThisGame++;
      active.forEach(x => {
        const xPay = x===0 ? pay : realPay;
        this.scores[x]-=xPay; this.scores[p]+=xPay;
        this.scoreLog[x].push(`补杠给${NAMES[p]} -${xPay}`);
      });
      if (p!==0 && (this._gangTax||0)>0) {
        const tax = BASE * this._gangTax;
        this.scores[0]+=tax; this.scores[p]-=tax;
        this.scoreLog[0].push(`🏦收税 +${tax}`);
      }
      this.scoreLog[p].push(`补杠${tileName(tile)} +${realPay*active.length}`);
      this.showCenter(`${NAMES[p]} 补杠!`);
      SFX.gang();
      if (p!==0) this.aiSay(p, this.aiLine(p,'gang') || '补杠!');
      this.aiReactTo(p, 'reactGang');
      this.showMsg(`${NAMES[p]} 补杠 ${tileName(tile)} 每家-${pay}`);
    }
    this.sortHand(p);
    this.justGanged = true;
    this.drawnTile = null;
    this.render();
    setTimeout(() => { this.phase='draw'; this.doTurn(); }, this.delay());
  }

  // ===== Smart AI =====
  aiSay(p, text) {
    if (this._fastMode || p===0) return;
    const el = document.getElementById(`bubble-${p}`);
    if (!el) return;
    // If text is array, pick random; if opponent has personality, use that
    const msg = Array.isArray(text) ? text[Math.floor(Math.random()*text.length)] : text;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 5000);
  }

  aiLine(p, category) {
    if (typeof rogue === 'undefined' || !rogue.opponents || !rogue.opponents[p]) return null;
    const op = rogue.opponents[p];
    const lines = op[category];
    return lines ? lines[Math.floor(Math.random()*lines.length)] : null;
  }

  aiStyle(p) {
    if (typeof rogue === 'undefined' || !rogue.opponents || !rogue.opponents[p]) return 'balanced';
    return rogue.opponents[p].style || 'balanced';
  }

  // Other AIs react to someone's action (30% chance each)
  aiReactTo(actor, category) {
    if (this._fastMode) return;
    const others = [1,2,3].filter(p => p!==actor && !this.won[p]);
    // Higher chance to react when player does something
    const threshold = actor===0 ? 0.6 : 0.3;
    for (const p of others) {
      if (Math.random() > threshold) continue;
      const line = this.aiLine(p, category);
      if (line) setTimeout(() => this.aiSay(p, line), 500 + Math.random()*800);
    }
  }

  aiDiscard(p) {
    if (this._stopped || this.phase==='over') return;
    const hand = this.hands[p], qs = this.que[p];
    // Must discard que suit first
    const qt = hand.filter(t => t.suit === qs);
    if (qt.length) {
      this.discard(p, qt[0]); return;
    }

    const counts = {};
    hand.forEach(t => { const k = tileKey(t); counts[k] = (counts[k]||0)+1; });

    // Check if currently ting with 14 tiles (before discard)
    // Try each discard: if discarding it keeps us ting, strongly prefer it
    let best = null, bestScore = -9999;
    const wasTing = hand.length % 3 === 2; // 14 tiles = need to discard

    for (const t of hand) {
      const remaining = hand.filter(x => x.id !== t.id);
      let score = this.evalHand(remaining, this.melds[p], counts, t, p);

      // Huge bonus if remaining hand is ting
      if (isTingPai(remaining, this.melds[p])) {
        score += 50;
        // Even more bonus for more waiting tiles
        const tingCount = getTingTiles(remaining, this.melds[p]).length;
        score += tingCount * 5;
      }

      if (score > bestScore) { bestScore = score; best = t; }
    }

    // No talking when ting — don't give away info

    this.discard(p, best || hand[0]);
  }

  evalHand(hand, melds, origCounts, discarded, playerIdx) {
    const c = {};
    hand.forEach(t => { const k = tileKey(t); c[k] = (c[k]||0)+1; });
    let score = 0;
    const style = playerIdx ? this.aiStyle(playerIdx) : 'balanced';

    // Base: pairs, triplets, sequences
    for (const [k, cnt] of Object.entries(c)) {
      if (cnt >= 3) score += (style==='pengpeng' ? 18 : 12);
      else if (cnt === 2) score += (style==='pengpeng' ? 8 : 6);
    }

    // Connected tiles
    for (const t of hand) {
      const s = t.suit, r = t.rank;
      if (c[`${s}_${r+1}`]) score += (style==='qingyise' ? 4 : 3);
      if (c[`${s}_${r+2}`]) score += 1;
    }

    // Suit concentration (清一色 potential)
    const suitCounts = { wan:0, tiao:0, tong:0 };
    hand.forEach(t => suitCounts[t.suit]++);
    const maxSuit = Math.max(...Object.values(suitCounts));
    const qysBonus = style==='qingyise' ? 2 : 1;
    if (maxSuit === hand.length) score += 20 * qysBonus;
    else if (maxSuit >= hand.length - 1) score += 12 * qysBonus;
    else if (maxSuit >= hand.length - 2) score += 6 * qysBonus;

    // Peng-peng-hu potential
    const trips = Object.values(c).filter(v => v >= 3).length;
    const meldTrips = melds.filter(m => m.type !== 'chi').length;
    if (trips + meldTrips >= 3) score += (style==='pengpeng' ? 15 : 8);

    // Ting bonus
    if (hand.length % 3 === 1 && isTingPai(hand, melds)) {
      score += (style==='aggressive' ? 50 : 40);
      score += getTingTiles(hand, melds).length * 5;
    }

    // Penalize discarding useful tiles
    const dk = tileKey(discarded);
    if (origCounts[dk] >= 2) score -= 4;

    // Middle tiles
    for (const t of hand) {
      if (t.rank >= 3 && t.rank <= 7) score += 0.5;
    }

    // Smart AI: avoid feeding dangerous tiles (scales with _aiSmartness)
    const smartness = this._aiSmartness || 0;
    if (smartness > 0 && playerIdx) {
      // Check if discarded tile's suit is scarce in other players' discards (they might want it)
      const ds = discarded.suit;
      let suitInDiscards = 0;
      for (let i=0;i<4;i++) suitInDiscards += this.discards[i].filter(t=>t.suit===ds).length;
      // If very few of this suit discarded, others might be collecting it — risky to discard
      if (suitInDiscards < 3) score -= 5 * smartness;
      // Avoid discarding tiles adjacent to recently discarded tiles (someone might be waiting)
      if (this.lastDiscard && this.lastDiscard.suit === ds) {
        const diff = Math.abs(this.lastDiscard.rank - discarded.rank);
        if (diff <= 2) score -= 3 * smartness;
      }
    }

    return score;
  }

  discard(p, tile) {
    this.justGanged = false;
    this.drawnTile = null;
    this.hands[p] = this.hands[p].filter(t=>t.id!==tile.id);
    this.sortHand(p);

    // Animate: tile flies from hand to discard area
    const from = this.getHandPos(p);
    const to = this.getDiscardPos(p);
    this.flyTile(from, to, tile, p!==0, () => {
      this.discards[p].push(tile);
      SFX.discard();
      this.lastDiscard = tile;
      this.lastDiscardPlayer = p;
      this.render();

      // AI commentary on discards
      if (!this._fastMode && Math.random() > 0.6) {
        const k = tileKey(tile);
        // Count how many of this tile already discarded across all players
        let sameDiscarded = 0;
        for (let i=0;i<4;i++) sameDiscarded += this.discards[i].filter(t=>tileKey(t)===k).length;

        const others = [1,2,3].filter(x=>x!==p&&!this.won[x]);
        if (!others.length) {}
        else {
          const reactor = others[Math.floor(Math.random()*others.length)];
          if (sameDiscarded >= 3) {
            // 3rd or 4th copy discarded
            this.aiSay(reactor, ['第三张了...','这牌都被打完了','没人要啊','浪费','可惜了'][Math.floor(Math.random()*5)]);
          } else if (sameDiscarded === 2 && Math.random()>0.5) {
            this.aiSay(reactor, ['又一张','这牌没人碰?','嗯...'][Math.floor(Math.random()*3)]);
          } else if (tile.rank>=4 && tile.rank<=6 && Math.random()>0.7) {
            // Discarding middle tiles is risky
            this.aiSay(reactor, ['好牌啊','不要?','胆子大','中张都打?'][Math.floor(Math.random()*4)]);
          }
        }
      }

      setTimeout(() => this.checkActions(p, tile), this.delay());
    });
    this.render(); // update hand immediately (tile removed)
  }

  actionFast() {
    SFX.click();
    if (this._fastMode) {
      // Second press: stop everything and end
      this._stopped = true;
      this.endGame();
      return;
    }
    this._fastMode = true;
    document.getElementById('btn-fast').textContent = '⏭结束';
    this.showMsg('⏩ 快进中... 再按一次直接结束');
  }

  delay() { return this._fastMode ? 30 : 500; }
  aiDelay() { return this._fastMode ? 30 : 800 + Math.random()*600; }
  flyDur() { return this._fastMode ? 50 : 350; }

  actionChameleon() {
    SFX.click();
    this._chameleonMode = true;
    this._chameleonUsed = (this._chameleonUsed||0) + 1;
    document.getElementById('btn-chameleon').style.display = 'none';
    this.showMsg('🦎 点击一张牌变色');
  }

  actionSwap() {
    SFX.click();
    this._swapMode = true;
    this._swapUsed++;
    const left = (this._swapMax||1) - this._swapUsed;
    document.getElementById('btn-swap').style.display = 'none';
    this.showMsg(`🔄 点击一张手牌换掉 (剩${left}次)`);
  }

  playerClickTile(tile) {
    if (this.phase!=='discard'||this.current!==0) return;

    // Chameleon mode: change tile suit
    if (this._chameleonMode) {
      this._chameleonMode = false;
      const suits = ['wan','tiao','tong'].filter(s=>s!==tile.suit);
      const newSuit = suits[Math.floor(Math.random()*suits.length)];
      const oldName = tileName(tile);
      tile.suit = newSuit;
      SFX.draw();
      this.showMsg(`🦎 ${oldName} → ${tileName(tile)}`);
      this.sortHand(0);
      this.render();
      // Show chameleon again if uses remain
      if (this._chameleon && this._chameleonUsed < this._chameleon) {
        document.getElementById('btn-chameleon').style.display = '';
      }
      // Re-check hu/gang
      const gangs = this.findSelfGangs(0);
      const hu = queClear(this.hands[0], this.que[0]) && canWin(this.hands[0], this.melds[0]);
      if (hu || gangs.length) {
        const acts = {};
        if (hu) acts.hu = true;
        if (gangs.length) acts.gang = true;
        acts.pass = true;
        this.showActions(acts);
      }
      return;
    }

    // Swap mode: replace clicked tile with random wall tile
    if (this._swapMode) {
      this._swapMode = false;
      const idx = this.hands[0].findIndex(t => t.id === tile.id);
      if (idx < 0) return;
      const old = this.hands[0][idx];
      const newTile = this.wall.pop();
      this.hands[0][idx] = newTile;
      this.wall.push(old);
      shuffle(this.wall);
      this.drawnTile = newTile;
      this.sortHand(0);
      SFX.draw();
      this.showMsg(`🔄 换掉了 ${tileName(old)} → ${tileName(newTile)}`);
      this.render();
      // Re-check hu/gang after swap
      const gangs = this.findSelfGangs(0);
      const hu = queClear(this.hands[0], this.que[0]) && canWin(this.hands[0], this.melds[0]);
      if (hu || gangs.length) {
        const acts = {};
        if (hu) acts.hu = true;
        if (gangs.length) acts.gang = true;
        acts.pass = true;
        this.showActions(acts);
      }
      // Show swap button again if swaps remain
      if (this._canSwap && this._swapUsed < (this._swapMax||1) && this.wall.length) {
        document.getElementById('btn-swap').style.display = '';
      }
      return;
    }

    this.hideActions();
    this.discard(0, tile);
  }

  checkActions(from, tile) {
    if (this._stopped || this.phase==='over') return;
    const k = tileKey(tile), actions = {};
    for (let i=1;i<=3;i++) {
      const p=(from+i)%4;
      if (this.won[p]) continue;
      const h=this.hands[p], cnt=h.filter(t=>tileKey(t)===k).length, pa={};
      if (queClear(h,this.que[p]) && canWin([...h,tile], this.melds[p])) pa.hu=true;
      if (tile.suit !== this.que[p] && cnt>=3) pa.gang=true;
      if (tile.suit !== this.que[p] && cnt>=2) pa.peng=true;
      if (Object.keys(pa).length) actions[p]=pa;
    }
    // If any AI can hu, they take priority over player's peng/gang
    let aiCanHu = false;
    for (let i=1;i<=3;i++) {
      const p=(from+i)%4;
      if (p!==0 && actions[p]?.hu) { aiCanHu = true; break; }
    }
    if (actions[0] && (!aiCanHu || actions[0].hu)) {
      this.pendingActions=actions; this.showActions(actions[0]); return;
    }
    this.resolveAI(actions, from);
  }

  resolveAI(actions, from) {
    // Priority: 胡 > 杠 > 碰 (regardless of seat order)
    // 1. Check hu first (any player)
    for (let i=1;i<=3;i++) {
      const p=(from+i)%4;
      if (actions[p]?.hu) { this.doWin(p,from,false); return; }
    }
    // 2. Check gang (seat order)
    for (let i=1;i<=3;i++) {
      const p=(from+i)%4;
      if (actions[p]?.gang) { this.doMeld(p,'gang'); return; }
    }
    // 3. Check peng (seat order)
    for (let i=1;i<=3;i++) {
      const p=(from+i)%4;
      if (actions[p]?.peng) { this.doMeld(p,'peng'); return; }
    }
    let next=(from+1)%4, tries=0;
    while (this.won[next]&&tries<4) { next=(next+1)%4; tries++; }
    if (tries>=4) { this.endGame(); return; }
    this.current=next; this.phase='draw';
    setTimeout(()=>this.doTurn(), this.delay());
  }

  getMeldPos(p) {
    const el = document.getElementById(`melds-${p}`);
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }

  doMeld(p, type) {
    const tile=this.lastDiscard, k=tileKey(tile);
    const fromPlayer = this.lastDiscardPlayer;

    // Animate: tile flies from discarder's discard area to meld area
    const from = this.getDiscardPos(fromPlayer);
    const to = this.getMeldPos(p);

    // Remove from discards visually first
    this.discards[fromPlayer].pop();
    this.render();

    const flyDur = p===0 ? 500 : 350;
    this.flyTile(from, to, tile, false, () => {
      const match = this.hands[p].filter(t=>tileKey(t)===k);
      if (type==='peng') {
        const used=match.slice(0,2);
        this.hands[p]=this.hands[p].filter(t=>!used.includes(t));
        this.melds[p].push({type:'peng',tiles:[...used,tile]}); this._lastMeldPlayer=p;
        this.showCenter(`${NAMES[p]} 碰!`);
        if (p!==0) this.aiSay(p, this.aiLine(p,'peng') || '碰!');
        this.aiReactTo(p, 'reactPeng');
        SFX.peng();
        // 吸金石 + 碰碰返利
        if (p===0) {
          const bonus = (this._meldBonus||0) + (this._pengRefund||0)*BASE;
          if (bonus>0) { this.scores[0]+=bonus; this.scoreLog[0].push(`碰奖励 +${bonus}`); }
        }
        this.showMsg(`${NAMES[p]} 碰 ${tileName(tile)} ← ${NAMES[fromPlayer]}`);
      } else {
        const used=match.slice(0,3);
        this.hands[p]=this.hands[p].filter(t=>!used.includes(t));
        this.melds[p].push({type:'gang',tiles:[...used,tile]}); this._lastMeldPlayer=p;
        const pay=BASE, active=this.activePlayers().filter(x=>x!==p);
        const realPay = this.gangPay(pay, p===0);
        if (p===0) this._gangCountThisGame++;
        active.forEach(x => {
          const xPay = x===0 ? pay : realPay;
          this.scores[x]-=xPay; this.scores[p]+=xPay;
          this.scoreLog[x].push(`明杠给${NAMES[p]} -${xPay}`);
        });
        if (p!==0 && (this._gangTax||0)>0) {
          const tax = BASE * this._gangTax;
          this.scores[0]+=tax; this.scores[p]-=tax;
          this.scoreLog[0].push(`🏦收税 +${tax}`);
        }
        this.scoreLog[p].push(`明杠${tileName(tile)} +${realPay*active.length}`);
        this.showCenter(`${NAMES[p]} 明杠!`);
        if (p!==0) this.aiSay(p, this.aiLine(p,'gang') || '杠!');
        this.aiReactTo(p, 'reactGang');
        SFX.gang();
        this.showMsg(`${NAMES[p]} 明杠 ${tileName(tile)} ← ${NAMES[fromPlayer]} 每家-${pay}`);
        this.justGanged=true;
      }
      this.sortHand(p); this.current=p; this.lastDiscard=null; this.drawnTile=null; this.render();
      if (type==='gang') { setTimeout(()=>{this.phase='draw';this.doTurn();},600); }
      else if (p===0) { this.phase='discard'; this.render(); }
      else { setTimeout(()=>this.aiDiscard(p), this.aiDelay()); }
    }, flyDur);
  }

  doWin(winner, from, selfDraw) {
    this.won[winner]=true;
    // For dianpao (点炮), add the winning tile to hand for fan calculation
    if (!selfDraw && this.lastDiscard) {
      this.winTile[winner] = this.lastDiscard; // track the winning tile
      this.hands[winner].push(this.lastDiscard);
      this.discards[this.lastDiscardPlayer].pop();
    } else {
      // 自摸: the drawn tile is the winning tile
      this.winTile[winner] = this.hands[winner][this.hands[winner].length - 1];
    }
    const el=document.getElementById(`status-${winner}`);
    el.textContent='胡!'; el.className='status-won';
    const extras = { isSelfDraw:selfDraw, isGangShangHua:selfDraw&&this.justGanged, isHaiDi:selfDraw&&this.wall.length===0 };
    const {fans,totalFan} = calcFan(this.hands[winner], this.melds[winner], extras);
    // Apply extra fan from relics (only for player)
    const bonusFan = winner===0 ? (this._extraFan||0) : 0;
    const realFan = totalFan + bonusFan;
    if (bonusFan > 0) fans.push({name:'龙脉+'+bonusFan,fan:bonusFan});
    const score = BASE * Math.pow(2, realFan);
    const fanStr = fans.map(f=>f.name).join('+');
    if (selfDraw) {
      const payers = this.activePlayers().filter(x=>x!==winner);
      payers.forEach(x => { this.scores[x]-=score; this.scores[winner]+=score; this.scoreLog[x].push(`${NAMES[winner]}自摸 -${score}`); });
      this.scoreLog[winner].push(`自摸 ${fanStr} ${realFan}番 +${score*payers.length}`);
      this.showCenter(`${NAMES[winner]} 自摸!`);
      SFX.hu();
      if (winner!==0) this.aiSay(winner, this.aiLine(winner,'zimo') || '自摸!');
      this.aiReactTo(winner, 'reactHu');
      this.showMsg(`${NAMES[winner]} 自摸 ${fanStr} ${realFan}番 每家-${score}`);
    } else {
      this.scores[from]-=score; this.scores[winner]+=score;
      this.scoreLog[from].push(`点炮给${NAMES[winner]} -${score}`);
      this.scoreLog[winner].push(`胡 ${NAMES[from]}点炮 ${fanStr} ${realFan}番 +${score}`);
      this.scoreLog[winner].push(`胡 ${NAMES[from]}点炮 ${fanStr} ${totalFan}番 +${score}`);
      this.showCenter(`${NAMES[winner]} 胡!`);
      SFX.hu();
      if (winner!==0) this.aiSay(winner, this.aiLine(winner,'hu') || '胡了!');
      this.aiReactTo(winner, 'reactHu');
      this.showMsg(`${NAMES[winner]} 胡! ${NAMES[from]}点炮 ${fanStr} ${totalFan}番 -${score}`);
    }
    this.winDetails.push({winner,from,selfDraw,fans,totalFan,score});
    this.justGanged=false; this.drawnTile=null;
    if (this.activePlayers().length<=1) { this.endGame(); return; }
    // Show fast-forward if player already won
    if (this.won[0]) document.getElementById('btn-fast').style.display = '';
    this.render(); this.advanceTurn();
  }

  // UI
  showActions(a) {
    this.hideActions();
    if (a.hu) document.getElementById('btn-hu').style.display='';
    if (a.gang) document.getElementById('btn-gang').style.display='';
    if (a.peng) document.getElementById('btn-peng').style.display='';
    document.getElementById('btn-pass').style.display='';
  }
  hideActions() { ['btn-hu','btn-gang','btn-peng','btn-pass','btn-swap','btn-fast','btn-chameleon'].forEach(id=>document.getElementById(id).style.display='none'); }

  actionHu() {
    SFX.click(); this.hideActions();
    // AI reactions to player winning
    const others = [1,2,3].filter(p=>!this.won[p]);
    if (others.length) {
      const r = others[Math.floor(Math.random()*others.length)];
      this.aiSay(r, this.aiLine(r,'react') || '...');
    }
    this.doWin(0, this.lastDiscardPlayer>=0?this.lastDiscardPlayer:0, this.current===0);
  }
  actionGang() {
    SFX.click(); this.hideActions();
    if (this.lastDiscard&&this.lastDiscardPlayer>=0&&this.lastDiscardPlayer!==0) this.doMeld(0,'gang');
    else { const g=this.findSelfGangs(0); if (g.length) this.doSelfGang(0,g[0]); }
  }
  actionPeng() { SFX.click(); this.hideActions(); this.doMeld(0,'peng'); }
  actionPass() {
    SFX.click(); this.hideActions();
    if (this.pendingActions) {
      const a={...this.pendingActions}, f=this.lastDiscardPlayer; delete a[0]; this.pendingActions=null;
      this.resolveAI(a,f);
    } else this.render();
  }

  advanceTurn() {
    if (this._stopped || this.phase==='over') return;
    let n=(this.current+1)%4, t=0;
    while (this.won[n]&&t<4) { n=(n+1)%4; t++; }
    if (t>=4) { this.endGame(); return; }
    this.current=n; this.phase='draw';
    setTimeout(()=>this.doTurn(),this.delay());
  }

  endGame() {
    this.phase='over';
    const hz=[],nt=[],tp=[];
    for (let p=0;p<4;p++) { if (this.won[p]) continue; if (!queClear(this.hands[p],this.que[p])) hz.push(p); }
    for (let p=0;p<4;p++) { if (this.won[p]||hz.includes(p)) continue; if (isTingPai(this.hands[p], this.melds[p])) tp.push(p); else nt.push(p); }
    // 花猪
    for (const h of hz) for (const w of [...[0,1,2,3].filter(p=>this.won[p]),...tp]) {
      const mf=this.won[w]?2:maxTingFan(this.hands[w],this.melds[w]);
      const pen=BASE*Math.pow(2,mf);
      this.scores[h]-=pen; this.scores[w]+=pen;
      this.scoreLog[h].push(`花猪赔${NAMES[w]} -${pen}`);
      this.scoreLog[w].push(`花猪收${NAMES[h]} +${pen}`);
    }
    // 查叫
    for (const n of nt) for (const t of tp) {
      const mf=maxTingFan(this.hands[t],this.melds[t]);
      const pen=BASE*Math.pow(2,mf);
      this.scores[n]-=pen; this.scores[t]+=pen;
      this.scoreLog[n].push(`查叫赔${NAMES[t]} -${pen}`);
      this.scoreLog[t].push(`查叫收${NAMES[n]} +${pen}`);
    }
    let msg='<div style="font-size:22px;margin-bottom:12px">🀄 游戏结束</div>';
    for (const w of this.winDetails) {
      const fs=w.fans.map(f=>`${f.name}(${f.fan}番)`).join(' ');
      msg+=`<div style="color:#f1c40f">${NAMES[w.winner]} 胡! ${w.selfDraw?'自摸':NAMES[w.from]+'点炮'} | ${fs} | ${w.totalFan}番=${w.score}分</div>`;
    }
    if (hz.length) msg+=`<div style="color:#e74c3c;margin-top:4px">🐷 花猪: ${hz.map(p=>NAMES[p]).join(', ')}</div>`;
    if (nt.length) msg+=`<div style="color:#e67e22">❌ 查叫: ${nt.map(p=>NAMES[p]).join(', ')}</div>`;
    msg+='<div style="margin-top:10px;text-align:left">';
    for (let p=0;p<4;p++) {
      const s=this.scores[p];
      const tag=this.won[p]?'✅胡':hz.includes(p)?'🐷花猪':nt.includes(p)?'❌未听':'✋听牌';
      const det=this.scoreLog[p].length?this.scoreLog[p].join(', '):'无';
      msg+=`<div style="margin:6px 0;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1)">`;
      msg+=`<b>${NAMES[p]}</b> ${tag} <b style="color:${s>=0?'#2ecc71':'#e74c3c'};float:right">${s>=0?'+':''}${s}分</b>`;
      msg+=`<div style="font-size:12px;color:#888;margin-top:2px;clear:both">${det}</div></div>`;
    }
    msg+='</div>';
    msg+=`<button onclick="rogue.proceed()">${t('cont')}</button>`;
    document.getElementById('modal-content').innerHTML=msg;
    document.getElementById('modal').style.display='flex';
    this.render();
  }

  render() {
    const remain = this.wall?this.wall.length:0;
    document.getElementById('tiles-left').textContent=`剩余: ${remain}`;
    document.getElementById('tiles-remain').textContent=`${t('remain')} ${remain} ${t('tiles')}`;
    // Update pile visual
    const piles = document.querySelectorAll('.pile-tile');
    piles.forEach((p,i) => p.style.display = remain > i*10 ? '' : 'none');
    document.getElementById('turn-info').textContent=`${t('current')}: ${[t('south')+'('+t('you')+')',t('east'),t('north'),t('west')][this.current||0]}`;
    document.getElementById('score-info').textContent=`${t('score')}: ${this.scores?this.scores[0]:0}`;
    // Highlight active player
    for (let p=0;p<4;p++) {
      const lbl=document.getElementById(`label-${p}`);
      if (lbl) lbl.classList.toggle('active-turn', p===this.current && this.phase!=='over');
    }
    if (!this.hands) return;
    // Hands
    for (let p=0;p<4;p++) {
      const el=document.getElementById(`hand-${p}`);
      el.innerHTML='';
      const isOver = this.phase==='over';
      const isMe = p===0;
      const xray = (this._xrayCount||0) >= p; // count=1 sees p1, count=2 sees p1+p2, count=3 sees all
      if (!isMe && !isOver && !xray) el.classList.add('hidden-hand'); else el.classList.remove('hidden-hand');

      const wt = this.winTile[p];
      const tiles = isMe ? this.hands[p].filter(t=>!this.drawnTile||t.id!==this.drawnTile.id) : this.hands[p];
      tiles.forEach(t => {
        const isQ=this.que[p]&&t.suit===this.que[p];
        const opts = isMe&&this.phase==='discard'&&this.current===0 ? {onClick:tile=>this.playerClickTile(tile),dimQue:isQ} : {dimQue:isMe&&isQ};
        const tileEl = renderTile(t,opts);
        if (isOver && wt && t.id===wt.id) tileEl.classList.add('win-tile');
        el.appendChild(tileEl);
      });

      // Show winning tile face-up inside hidden hand
      if (wt && !isMe && !isOver) {
        const wtEl = renderTile(wt);
        wtEl.classList.add('win-tile');
        wtEl.style.marginLeft = '0.6vw';
        el.appendChild(wtEl);
      }
    }
    // Drawn tile (separated)
    const dEl=document.getElementById('drawn-tile');
    dEl.innerHTML='';
    if (this.drawnTile&&this.phase==='discard'&&this.current===0) {
      const isQ=this.que[0]&&this.drawnTile.suit===this.que[0];
      dEl.appendChild(renderTile(this.drawnTile,{onClick:t=>this.playerClickTile(t),dimQue:isQ}));
    }
    // Melds
    for (let p=0;p<4;p++) {
      const el=document.getElementById(`melds-${p}`); el.innerHTML='';
      this.melds[p].forEach((m,mi) => {
        const g=document.createElement('div');
        g.className='meld-group'+(m.type==='angang'?' angang':'');
        const isNew = mi === this.melds[p].length-1 && this._lastMeldPlayer===p;
        m.tiles.forEach((t,i) => {
          const faceDown = m.type==='angang'&&(i===0||i===3);
          const tile = renderTile(t,{faceDown});
          if (isNew) tile.classList.add('tile-anim-meld');
          g.appendChild(tile);
        });
        el.appendChild(g);
      });
    }
    // Discards
    for (let p=0;p<4;p++) {
      const el=document.getElementById(`discards-${p}`); el.innerHTML='';
      this.discards[p].forEach(t => {
        const d=renderTile(t);
        if (this.lastDiscard&&t.id===this.lastDiscard.id) {
          d.classList.add('last-discard', `tile-anim-discard-${p}`);
        }
        el.appendChild(d);
      });
    }
    this._lastMeldPlayer = -1;
    // Ting hint
    const hint=document.getElementById('ting-hint');
    if (this.phase==='discard'&&this.current===0&&this.que[0]) {
      const h=this.hands[0];
      if (queClear(h,this.que[0])&&h.length%3===1) {
        // Check what we're waiting for with current hand (before discard, hand has 14 tiles)
        // Actually show ting after removing each possible discard
      }
      // Show ting if already in ting state (13 tiles after discard scenario)
      if (queClear(h,this.que[0])) {
        const tt=getTingTiles(h, this.melds[0]);
        // This is during draw phase with 14 tiles, not useful here
      }
      hint.textContent='';
    } else { hint.textContent=''; }
    // Show ting for 13-tile hand
    if (this.que[0]&&queClear(this.hands[0],this.que[0])) {
      const tt=getTingTiles(this.hands[0], this.melds[0]);
      if (tt.length) hint.textContent=`${t('tingHint')}: ${tt.map(x=>tileName(x)).join(' ')}`;
      else hint.textContent='';
    }
    // 扫描仪: show AI ting
    if (this._scanTing && this.phase!=='over') {
      let scanStr = '';
      for (let p=1;p<=3;p++) {
        if (this.won[p]||!this.que[p]) continue;
        if (queClear(this.hands[p],this.que[p])) {
          const tt=getTingTiles(this.hands[p], this.melds[p]);
          if (tt.length) scanStr += ` | ${NAMES[p]}: ${tt.map(x=>tileName(x)).join(' ')}`;
        }
      }
      if (scanStr) hint.textContent = (hint.textContent||'') + scanStr;
    }
  }
}

const game = new MajiangGame();
