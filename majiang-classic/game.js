// ===== Sorting =====
function queSortFor(q) {
  return (a, b) => {
    const d = (a.suit === q ? 1 : 0) - (b.suit === q ? 1 : 0);
    return d || tileSort(a, b);
  };
}

// ===== Win Detection =====
function canWin(hand) {
  if (hand.length % 3 !== 2) return false;
  return checkStandard(hand) || checkQiDui(hand);
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
  const k = Object.keys(c).find(k => c[k]>0);
  if (!k) return true;
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
  return { fans, totalFan: fans.reduce((s,f)=>s+f.fan,0) };
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
function isTingPai(hand) {
  for (const s of ['wan','tiao','tong']) for (let r=1;r<=9;r++) if (canWin([...hand,{suit:s,rank:r,id:-1}])) return true;
  return false;
}
function getTingTiles(hand) {
  const res = [];
  for (const s of ['wan','tiao','tong']) for (let r=1;r<=9;r++) {
    const f = {suit:s,rank:r,id:-1};
    if (canWin([...hand,f])) res.push(f);
  }
  return res;
}
function maxTingFan(hand, melds) {
  let best = 0;
  for (const s of ['wan','tiao','tong']) for (let r=1;r<=9;r++) {
    const f = {suit:s,rank:r,id:-1}, th = [...hand,f];
    if (canWin(th)) { const {totalFan}=calcFan(th,melds,{}); if (totalFan>best) best=totalFan; }
  }
  return best;
}

// ===== Game =====
const BASE = 1;
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
    document.getElementById('modal').style.display = 'none';
    document.getElementById('center-msg').textContent = '';
    for (let p=0;p<4;p++) { document.getElementById(`status-${p}`).textContent=''; document.getElementById(`status-${p}`).className=''; document.getElementById(`que-${p}`).textContent=''; }
    for (let r=0;r<13;r++) for (let p=0;p<4;p++) this.hands[p].push(this.wall.pop());
    for (let p=0;p<4;p++) this.hands[p].sort(tileSort);
    document.getElementById('btn-start').style.display = 'none';
    this.hideActions();
    this.render();
    SFX.start();
    this.startQueSelect();
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
    for (let p=0;p<4;p++) document.getElementById(`que-${p}`).textContent = `缺${SUIT_NAMES[this.que[p]]}`;
    this.phase = 'draw';
    this.render();
    this.doTurn();
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

  doTurn() {
    const p = this.current;
    if (this.won[p]) { this.advanceTurn(); return; }
    if (!this.wall.length) { this.endGame(); return; }

    // Animate draw: tile flies from pile to player
    const from = this.getPilePos();
    const to = this.getHandPos(p);
    this.flyTile(from, to, null, true, () => {
      SFX.draw();
      const drawn = this.draw(p);
      if (!drawn) return;
      this.lastDiscard = null;
      this.lastDiscardPlayer = -1;
      this.phase = 'discard';
      this.render();

      const gangs = this.findSelfGangs(p);
      const qc = queClear(this.hands[p], this.que[p]);
      const cw = canWin(this.hands[p]);
      const hu = qc && cw;
      if (p===0) console.log('自摸检测:', '手牌数:', this.hands[p].length, '缺清:', qc, '能胡:', cw, '缺门:', this.que[p]);

      if (p === 0) {
        const acts = {};
        if (hu) acts.hu = true;
        if (gangs.length) acts.gang = true;
        if (hu || gangs.length) { acts.pass = true; this.showActions(acts); }
        this.render();
      } else {
        if (hu) { this.doWin(p, p, true); return; }
        if (gangs.length) { this.doSelfGang(p, gangs[0]); return; }
        setTimeout(() => this.aiDiscard(p), 800 + Math.random()*600);
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
      active.forEach(x => { this.scores[x]-=pay; this.scores[p]+=pay; this.scoreLog[x].push(`暗杠给${NAMES[p]} -${pay}`); });
      this.scoreLog[p].push(`暗杠${tileName(tiles[0])} +${pay*active.length}`);
      this.showCenter(`${NAMES[p]} 暗杠!`);
      SFX.gang();
      this.showMsg(`${NAMES[p]} 暗杠 ${tileName(tiles[0])} 每家-${pay}`);
    } else {
      const tile = this.hands[p].find(t=>tileKey(t)===k);
      this.hands[p] = this.hands[p].filter(t=>t.id!==tile.id);
      const meld = this.melds[p].find(m=>m.type==='peng'&&tileKey(m.tiles[0])===k);
      meld.type='gang'; meld.tiles.push(tile);
      const pay = BASE;
      active.forEach(x => { this.scores[x]-=pay; this.scores[p]+=pay; this.scoreLog[x].push(`补杠给${NAMES[p]} -${pay}`); });
      this.scoreLog[p].push(`补杠${tileName(tile)} +${pay*active.length}`);
      this.showCenter(`${NAMES[p]} 补杠!`);
      SFX.gang();
      this.showMsg(`${NAMES[p]} 补杠 ${tileName(tile)} 每家-${pay}`);
    }
    this.sortHand(p);
    this.justGanged = true;
    this.drawnTile = null;
    this.render();
    setTimeout(() => { this.phase='draw'; this.doTurn(); }, 600);
  }

  aiDiscard(p) {
    const hand = this.hands[p], qs = this.que[p];
    const qt = hand.filter(t=>t.suit===qs);
    if (qt.length) { this.discard(p, qt[0]); return; }
    // Smarter AI: try each tile, prefer discarding one that keeps ting or most useful
    const c = {}; hand.forEach(t => { const k=tileKey(t); c[k]=(c[k]||0)+1; });
    let best=null, bestS=999;
    for (const t of hand) {
      const k=tileKey(t), cnt=c[k];
      const nb = (c[`${t.suit}_${t.rank-1}`]||0) + (c[`${t.suit}_${t.rank+1}`]||0);
      let s = cnt*3 + nb*2 + (t.rank>=2&&t.rank<=8?1:0);
      // Bonus for pairs/triplets
      if (cnt>=3) s += 6;
      if (cnt===2) s += 3;
      if (s<bestS) { bestS=s; best=t; }
    }
    this.discard(p, best||hand[0]);
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
      SFX.discard();      this.lastDiscard = tile;
      this.lastDiscardPlayer = p;
      this.render();
      // Pause before checking peng/gang so player can see the discard
      setTimeout(() => this.checkActions(p, tile), 500);
    });
    this.render(); // update hand immediately (tile removed)
  }

  playerClickTile(tile) {
    if (this.phase!=='discard'||this.current!==0) return;
    this.hideActions();
    this.discard(0, tile);
  }

  checkActions(from, tile) {
    const k = tileKey(tile), actions = {};
    for (let i=1;i<=3;i++) {
      const p=(from+i)%4;
      if (this.won[p]) continue;
      const h=this.hands[p], cnt=h.filter(t=>tileKey(t)===k).length, pa={};
      if (queClear(h,this.que[p]) && canWin([...h,tile])) pa.hu=true;
      if (cnt>=3) pa.gang=true;
      if (cnt>=2) pa.peng=true;
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
    setTimeout(()=>this.doTurn(), 500);
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
        SFX.peng();
        this.showMsg(`${NAMES[p]} 碰 ${tileName(tile)} ← ${NAMES[fromPlayer]}`);
      } else {
        const used=match.slice(0,3);
        this.hands[p]=this.hands[p].filter(t=>!used.includes(t));
        this.melds[p].push({type:'gang',tiles:[...used,tile]}); this._lastMeldPlayer=p;
        const pay=BASE, active=this.activePlayers().filter(x=>x!==p);
        active.forEach(x => { this.scores[x]-=pay; this.scores[p]+=pay; this.scoreLog[x].push(`明杠给${NAMES[p]} -${pay}`); });
        this.scoreLog[p].push(`明杠${tileName(tile)} +${pay*active.length}`);
        this.showCenter(`${NAMES[p]} 明杠!`);
        SFX.gang();
        this.showMsg(`${NAMES[p]} 明杠 ${tileName(tile)} ← ${NAMES[fromPlayer]} 每家-${pay}`);
        this.justGanged=true;
      }
      this.sortHand(p); this.current=p; this.lastDiscard=null; this.drawnTile=null; this.render();
      if (type==='gang') { setTimeout(()=>{this.phase='draw';this.doTurn();},600); }
      else if (p===0) { this.phase='discard'; this.render(); }
      else { setTimeout(()=>this.aiDiscard(p), 800 + Math.random()*600); }
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
    const score = BASE * Math.pow(2, totalFan);
    const fanStr = fans.map(f=>f.name).join('+');
    if (selfDraw) {
      const payers = this.activePlayers().filter(x=>x!==winner);
      payers.forEach(x => { this.scores[x]-=score; this.scores[winner]+=score; this.scoreLog[x].push(`${NAMES[winner]}自摸 -${score}`); });
      this.scoreLog[winner].push(`自摸 ${fanStr} ${totalFan}番 +${score*payers.length}`);
      this.showCenter(`${NAMES[winner]} 自摸!`);
      SFX.hu();
      this.showMsg(`${NAMES[winner]} 自摸 ${fanStr} ${totalFan}番 每家-${score}`);
    } else {
      this.scores[from]-=score; this.scores[winner]+=score;
      this.scoreLog[from].push(`点炮给${NAMES[winner]} -${score}`);
      this.scoreLog[winner].push(`胡 ${NAMES[from]}点炮 ${fanStr} ${totalFan}番 +${score}`);
      this.showCenter(`${NAMES[winner]} 胡!`);
      SFX.hu();
      this.showMsg(`${NAMES[winner]} 胡! ${NAMES[from]}点炮 ${fanStr} ${totalFan}番 -${score}`);
    }
    this.winDetails.push({winner,from,selfDraw,fans,totalFan,score});
    this.justGanged=false; this.drawnTile=null;
    if (this.activePlayers().length<=1) { this.endGame(); return; }
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
  hideActions() { ['btn-hu','btn-gang','btn-peng','btn-pass'].forEach(id=>document.getElementById(id).style.display='none'); }

  actionHu() { SFX.click(); this.hideActions(); this.doWin(0, this.lastDiscardPlayer>=0?this.lastDiscardPlayer:0, this.current===0); }
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
    let n=(this.current+1)%4, t=0;
    while (this.won[n]&&t<4) { n=(n+1)%4; t++; }
    if (t>=4) { this.endGame(); return; }
    this.current=n; this.phase='draw';
    setTimeout(()=>this.doTurn(),500);
  }

  endGame() {
    this.phase='over';
    const hz=[],nt=[],tp=[];
    for (let p=0;p<4;p++) { if (this.won[p]) continue; if (!queClear(this.hands[p],this.que[p])) hz.push(p); }
    for (let p=0;p<4;p++) { if (this.won[p]||hz.includes(p)) continue; if (isTingPai(this.hands[p])) tp.push(p); else nt.push(p); }
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
    msg+=`<button onclick="document.getElementById('modal').style.display='none';game.start();">再来一局</button>`;
    document.getElementById('modal-content').innerHTML=msg;
    document.getElementById('modal').style.display='flex';
    document.getElementById('btn-start').style.display='';
    document.getElementById('btn-start').textContent='再来一局';
    this.render();
  }

  render() {
    const remain = this.wall?this.wall.length:0;
    document.getElementById('tiles-left').textContent=`剩余: ${remain}`;
    document.getElementById('tiles-remain').textContent=`剩余 ${remain} 张`;
    // Update pile visual
    const piles = document.querySelectorAll('.pile-tile');
    piles.forEach((p,i) => p.style.display = remain > i*10 ? '' : 'none');
    document.getElementById('turn-info').textContent=`当前: ${NAMES[this.current||0]}`;
    document.getElementById('score-info').textContent=`分数: ${this.scores?this.scores[0]:0}`;
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
      if (!isMe && !isOver) el.classList.add('hidden-hand'); else el.classList.remove('hidden-hand');

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
      if (h.length%3===2 && queClear(h,this.que[0])) {
        const tt=getTingTiles(h);
        // This is during draw phase with 14 tiles, not useful here
      }
      hint.textContent='';
    } else { hint.textContent=''; }
    // Show ting for 13-tile hand
    if (this.que[0]&&this.hands[0].length%3===2&&queClear(this.hands[0],this.que[0])) {
      const tt=getTingTiles(this.hands[0]);
      if (tt.length) hint.textContent=`听牌: ${tt.map(t=>tileName(t)).join(' ')}`;
      else hint.textContent='';
    }
  }
}

const game = new MajiangGame();
