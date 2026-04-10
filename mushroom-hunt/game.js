const C = document.getElementById('c'), X = C.getContext('2d');
let W, H;
function resize() { W = C.width = innerWidth; H = C.height = innerHeight; }
resize(); onresize = resize;

// Audio
const AC = new (window.AudioContext || window.webkitAudioContext)();
function sfx(freq, dur, type='sine', vol=.15) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(); o.stop(AC.currentTime + dur);
}
function pickSfx() { sfx(800,.08); sfx(1200,.1,'triangle'); }
function badSfx() { sfx(200,.3,'sawtooth',.2); }
function powerSfx() { sfx(600,.1); sfx(900,.15); sfx(1200,.1); }
function legendSfx() { [600,800,1000,1200].forEach((f,i) => setTimeout(()=>sfx(f,.15,'triangle',.2), i*60)); }

// State
let shrooms, particles, critters, score, gold, combo, maxCombo, lives, timeLeft;
let round, frenzyTime, shieldTime, dayPhase, weather, upgrades;
let gameRunning = false, tickId, spawnId, critterId;
let mx = 0, my = 0;

const UPGRADES = [
  { id:'basket', name:'Big Basket', desc:'+20% click radius', cost:30, emoji:'🧺', max:3 },
  { id:'eagle', name:'Eagle Eye', desc:'Mushrooms last longer', cost:40, emoji:'🦅', max:3 },
  { id:'repel', name:'Critter Repel', desc:'Fewer squirrels', cost:50, emoji:'🚫', max:2 },
  { id:'luck', name:'Lucky Clover', desc:'More rare spawns', cost:60, emoji:'🍀', max:2 },
  { id:'armor', name:'Thick Gloves', desc:'+1 starting life', cost:80, emoji:'🧤', max:2 },
  { id:'magnet', name:'Spore Magnet', desc:'Auto-collect nearby', cost:100, emoji:'🧲', max:1 },
];

const SHROOM_TYPES = [
  { emoji:'🟤', pts:10, w:45, bad:false },
  { emoji:'🍄', pts:25, w:28, bad:false },
  { emoji:'🟣', pts:40, w:14, bad:false, glow:'#bb44ff' },
  { emoji:'👑', pts:60, w:6, bad:false, glow:'#ffdd00' },
  { emoji:'🌈', pts:150, w:1, bad:false, glow:'#ff44ff', legendary:true },
  { emoji:'🔴', pts:0, w:18, bad:true },
  { emoji:'⏱', pts:0, w:4, bad:false, isTime:true },
  { emoji:'⚡', pts:0, w:3, bad:false, isFrenzy:true },
  { emoji:'🛡️', pts:0, w:2, bad:false, isShield:true },
];

function upLvl(id) { return (upgrades[id]||0); }

function pickType() {
  const types = SHROOM_TYPES.map(t => {
    let w = t.w;
    if (!t.bad && t.pts > 25) w += upLvl('luck') * 3;
    if (t.bad) w += round * 2;
    return { ...t, w };
  });
  const total = types.reduce((s,t) => s+t.w, 0);
  let r = Math.random()*total;
  for (const t of types) { r -= t.w; if (r <= 0) return t; }
  return types[0];
}

// Trees
let trees = [];
function genTrees() {
  trees = [];
  for (let i = 0; i < 20; i++) trees.push({
    x: Math.random()*W, y: 40+Math.random()*(H*.75),
    s: .5+Math.random()*.9, sway: Math.random()*Math.PI*2
  });
  trees.sort((a,b) => a.y - b.y);
}
genTrees();

// Stars for night
let stars = Array.from({length:80}, () => ({ x:Math.random()*2000, y:Math.random()*800, b:Math.random() }));

function spawn() {
  const t = pickType();
  const size = 28 + Math.random()*16;
  const lifeBase = 3.5 - round*.15 + upLvl('eagle')*.6 + Math.random();
  shrooms.push({
    ...t, size, x: 30+Math.random()*(W-60), y: 80+Math.random()*(H-140),
    life: Math.max(1.2, lifeBase), maxLife: 0, scale: 0,
    wobble: Math.random()*Math.PI*2, flash: 0
  });
  shrooms[shrooms.length-1].maxLife = shrooms[shrooms.length-1].life;
}

function spawnCritter() {
  if (Math.random() < .4 + upLvl('repel')*.2) return;
  const fromLeft = Math.random() > .5;
  critters.push({
    x: fromLeft ? -30 : W+30, y: 100+Math.random()*(H-200),
    vx: (fromLeft?1:-1) * (60+Math.random()*40), target: null,
    emoji: '🐿️', life: 6, carrying: null
  });
}

function float(x, y, text, color) {
  const el = document.createElement('div');
  el.className = 'float';
  el.style.cssText = `left:${x}px;top:${y}px;color:${color||'#ffdd44'};font-size:26px;text-shadow:0 0 8px ${color||'#ff8800'}`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function addP(x, y, color, n=8) {
  for (let i = 0; i < n; i++) {
    const a = Math.random()*Math.PI*2, sp = 50+Math.random()*120;
    particles.push({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:.4+Math.random()*.3, color, r:2+Math.random()*3 });
  }
}

// Day/night & weather
function getDaylight() {
  // 0=dark, 1=bright
  const t = dayPhase % 60;
  if (t < 20) return .9; // day
  if (t < 25) return .9 - (t-20)/5 * .55; // sunset
  if (t < 45) return .35; // night
  return .35 + (t-45)/15 * .55; // sunrise
}

function isNight() { return getDaylight() < .5; }

// Drawing
function drawSky(now) {
  const dl = getDaylight();
  const r = Math.floor(26*dl), g = Math.floor(74*dl+10), b = Math.floor(20*dl+8);
  X.fillStyle = `rgb(${r},${g},${b})`;
  X.fillRect(0,0,W,H);

  // Stars at night
  if (dl < .6) {
    const sa = (1-dl/.6)*.8;
    X.fillStyle = `rgba(255,255,200,${sa})`;
    for (const s of stars) {
      const twinkle = .5+.5*Math.sin(now/500+s.b*10);
      X.globalAlpha = sa * twinkle;
      X.beginPath(); X.arc(s.x%W, s.y%H, 1.2, 0, Math.PI*2); X.fill();
    }
    X.globalAlpha = 1;
    // Moon
    if (dl < .45) {
      X.fillStyle = `rgba(255,255,220,${(.45-dl)*3})`;
      X.beginPath(); X.arc(W*.8, 60, 25, 0, Math.PI*2); X.fill();
    }
  }
}

function drawGround() {
  X.fillStyle = '#1e3a0e';
  X.fillRect(0, H*.3, W, H*.7);
  X.fillStyle = '#2a4818';
  for (let i = 0; i < 50; i++) {
    X.beginPath(); X.ellipse((i*197)%W, H*.35+(i*131)%(H*.6), 25, 8, 0, 0, Math.PI*2); X.fill();
  }
}

function drawTrees(now) {
  const dl = getDaylight();
  for (const t of trees) {
    X.save(); X.translate(t.x, t.y);
    const sway = Math.sin(now/2000+t.sway)*3 * (weather==='wind'?3:1);
    X.scale(t.s, t.s);
    // Trunk
    X.fillStyle = `rgb(${Math.floor(58*dl)},${Math.floor(37*dl)},${Math.floor(16*dl)})`;
    X.fillRect(-6,-10,12,50);
    // Leaves
    X.fillStyle = `rgb(${Math.floor(30*dl)},${Math.floor(80*dl)},${Math.floor(20*dl)})`;
    for (let j = 0; j < 3; j++) {
      X.beginPath(); X.moveTo(sway, -60+j*18); X.lineTo(-28-j*8, -20+j*18); X.lineTo(28+j*8, -20+j*18); X.fill();
    }
    X.restore();
  }
}

function drawWeather(now) {
  if (weather === 'rain') {
    X.strokeStyle = 'rgba(150,180,255,.3)';
    X.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const rx = (i*73+now*.3)%W, ry = (i*97+now*.8)%H;
      X.beginPath(); X.moveTo(rx,ry); X.lineTo(rx-3,ry+12); X.stroke();
    }
  }
  if (weather === 'fog') {
    X.fillStyle = `rgba(200,210,200,${.08+Math.sin(now/3000)*.03})`;
    X.fillRect(0,0,W,H);
  }
}

function drawShrooms(now) {
  const dl = getDaylight();
  for (const m of shrooms) {
    X.save();
    X.translate(m.x, m.y);
    m.scale = Math.min(1, m.scale+.08);
    const wb = Math.sin(now/200+m.wobble)*3;
    const lr = m.life/m.maxLife;

    // Night: only show nearby cursor or glowing ones
    if (isNight() && !m.glow && !m.legendary) {
      const d = Math.hypot(mx-m.x, my-m.y);
      if (d > 150) { X.restore(); continue; }
      X.globalAlpha = Math.max(0, 1 - d/150);
    }

    // Glow
    if (m.glow || m.legendary) {
      X.shadowColor = m.glow||'#ff88ff';
      X.shadowBlur = m.legendary ? 25+Math.sin(now/100)*10 : 15;
    }

    X.globalAlpha *= (lr < .3 ? lr/.3 : 1);
    X.font = `${m.size*m.scale}px serif`;
    X.textAlign = 'center'; X.textBaseline = 'middle';
    X.fillText(m.emoji, wb, 0);

    // Life ring
    if (lr < .6) {
      X.shadowBlur = 0;
      X.globalAlpha = .5;
      X.strokeStyle = m.bad ? '#ff4444' : '#44ff44';
      X.lineWidth = 2;
      X.beginPath(); X.arc(0,0,m.size*.7,-Math.PI/2,-Math.PI/2+Math.PI*2*lr); X.stroke();
    }
    X.restore();
  }
}

function drawCritters(now) {
  for (const c of critters) {
    X.save();
    X.translate(c.x, c.y);
    X.scale(c.vx > 0 ? 1 : -1, 1);
    X.font = '24px serif'; X.textAlign = 'center'; X.textBaseline = 'middle';
    X.fillText(c.emoji, 0, 0);
    if (c.carrying) {
      X.font = '16px serif';
      X.fillText(c.carrying, 0, -18);
    }
    X.restore();
  }
}

function drawParticles(dt) {
  for (const p of particles) {
    X.globalAlpha = Math.min(1, p.life*2.5);
    X.fillStyle = p.color;
    X.beginPath(); X.arc(p.x,p.y,p.r,0,Math.PI*2); X.fill();
  }
  X.globalAlpha = 1;
}

function drawCursor(now) {
  X.save(); X.translate(mx, my);
  // Flashlight at night
  if (isNight()) {
    const rg = X.createRadialGradient(0,0,10,0,0,150);
    rg.addColorStop(0,'rgba(255,255,200,.12)');
    rg.addColorStop(1,'rgba(255,255,200,0)');
    X.fillStyle = rg;
    X.beginPath(); X.arc(0,0,150,0,Math.PI*2); X.fill();
  }
  X.font = '28px serif'; X.textAlign = 'center'; X.textBaseline = 'middle';
  X.fillText('🧺',0,0);
  if (frenzyTime > 0) { X.shadowColor='#00ddff'; X.shadowBlur=20; X.fillText('🧺',0,0); }
  if (shieldTime > 0) { X.shadowColor='#44ff88'; X.shadowBlur=15; X.fillText('🛡️',12,-12); }
  X.restore();
}

function drawFrenzyOverlay() {
  if (frenzyTime > 0) {
    X.fillStyle = `rgba(0,200,255,${.04+Math.sin(Date.now()/100)*.02})`;
    X.fillRect(0,0,W,H);
  }
}

// Update
function update(dt) {
  dayPhase += dt;
  // Weather changes
  if (Math.random() < .001) weather = ['clear','rain','fog','wind'][Math.random()*4|0];

  for (let i = shrooms.length-1; i >= 0; i--) {
    shrooms[i].life -= dt * (frenzyTime>0?.5:1);
    if (shrooms[i].life <= 0) { combo = 0; updateHud(); shrooms.splice(i,1); }
  }

  // Magnet
  if (upLvl('magnet')) {
    for (const m of shrooms) {
      if (m.bad) continue;
      const d = Math.hypot(mx-m.x, my-m.y);
      if (d < 80 && d > 5) {
        const pull = 120*dt/d;
        m.x += (mx-m.x)*pull;
        m.y += (my-m.y)*pull;
      }
    }
  }

  // Critters
  for (let i = critters.length-1; i >= 0; i--) {
    const c = critters[i];
    if (!c.carrying && !c.target) {
      // Find nearest good shroom
      let best = null, bd = Infinity;
      for (const m of shrooms) {
        if (m.bad || m.isTime || m.isFrenzy || m.isShield) continue;
        const d = Math.hypot(c.x-m.x, c.y-m.y);
        if (d < bd) { bd = d; best = m; }
      }
      c.target = best;
    }
    if (c.target && !c.carrying) {
      const t = c.target;
      if (!shrooms.includes(t)) { c.target = null; continue; }
      const dx = t.x-c.x, dy = t.y-c.y, d = Math.hypot(dx,dy);
      if (d < 20) {
        c.carrying = t.emoji;
        c.vx = c.x < W/2 ? -80 : 80;
        shrooms.splice(shrooms.indexOf(t),1);
        float(t.x, t.y-20, '🐿️ stolen!', '#ff8844');
      } else {
        c.x += dx/d*70*dt; c.y += dy/d*70*dt;
        c.vx = dx > 0 ? 1 : -1;
      }
    } else {
      c.x += c.vx*dt;
    }
    c.life -= dt;
    if (c.life <= 0 || c.x < -50 || c.x > W+50) critters.splice(i,1);
  }

  // Particles
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 200*dt; p.life -= dt;
    if (p.life <= 0) particles.splice(i,1);
  }

  if (frenzyTime > 0) frenzyTime -= dt;
  if (shieldTime > 0) shieldTime -= dt;
}

function updateHud() {
  document.getElementById('sc').textContent = score;
  document.getElementById('gold').textContent = gold;
  document.getElementById('combo').textContent = combo;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('lvl').textContent = `Round ${round}`;
  document.getElementById('livesEl').textContent = '❤️'.repeat(Math.max(0,lives))+'🖤'.repeat(Math.max(0,(3+upLvl('armor'))-lives));
}

// Click
C.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
C.addEventListener('click', e => {
  if (!gameRunning) return;
  AC.resume();
  const cx=e.clientX, cy=e.clientY;
  // Click critter to scare it
  for (let i = critters.length-1; i >= 0; i--) {
    const c = critters[i];
    if (Math.hypot(cx-c.x,cy-c.y) < 30) {
      if (c.carrying) { float(c.x,c.y-20,'Scared off!','#88ff44'); }
      critters.splice(i,1); pickSfx(); return;
    }
  }
  const radius = 1.1 + upLvl('basket')*.2;
  for (let i = shrooms.length-1; i >= 0; i--) {
    const m = shrooms[i];
    if (Math.hypot(cx-m.x,cy-m.y) < m.size*m.scale*radius) {
      if (m.bad) {
        if (shieldTime > 0) {
          shieldTime = 0;
          float(m.x,m.y-20,'🛡️ Blocked!','#44ff88');
          shrooms.splice(i,1); pickSfx();
        } else {
          lives--; combo = 0;
          addP(m.x,m.y,'#ff3333',12);
          float(m.x,m.y-20,'☠️ -1','#ff4444');
          shrooms.splice(i,1); badSfx(); updateHud();
          if (lives <= 0) endRound();
        }
      } else {
        combo++; maxCombo = Math.max(maxCombo,combo);
        const mult = Math.min(5, 1+Math.floor(combo/4));
        if (m.isTime) {
          timeLeft += 5; float(m.x,m.y-20,'+5s ⏱','#44ddff'); powerSfx();
        } else if (m.isFrenzy) {
          frenzyTime = 6; float(m.x,m.y-20,'⚡ FRENZY!','#00ffcc'); powerSfx();
        } else if (m.isShield) {
          shieldTime = 10; float(m.x,m.y-20,'🛡️ Shield!','#44ff88'); powerSfx();
        } else {
          const pts = m.pts*mult;
          score += pts;
          gold += Math.ceil(pts/10);
          if (m.legendary) legendSfx(); else pickSfx();
          float(m.x,m.y-20,`+${pts}${mult>1?' x'+mult:''}`, m.glow||'#ffdd44');
          addP(m.x,m.y,m.glow||'#ffaa22', m.legendary?20:8);
        }
        shrooms.splice(i,1); updateHud();
      }
      return;
    }
  }
});

// Game loop
let lastT = 0;
function loop(now) {
  if (!gameRunning) return;
  const dt = Math.min(.05,(now-(lastT||now))/1000);
  lastT = now;
  update(dt);
  drawSky(now); drawGround(); drawTrees(now); drawWeather(now);
  drawFrenzyOverlay(); drawShrooms(now); drawCritters(now);
  drawParticles(dt); drawCursor(now);
  requestAnimationFrame(loop);
}

function tick() {
  if (!gameRunning) return;
  timeLeft--;
  updateHud();
  if (timeLeft <= 0) endRound();
}

function endRound() {
  gameRunning = false;
  clearInterval(tickId); clearInterval(spawnId); clearInterval(critterId);
  showShop();
}

function showShop() {
  const box = document.getElementById('shopBox');
  const alive = lives > 0;
  let html = `<h2>${alive?'🌿 Round Complete!':'☠️ You Fell!'}</h2>`;
  html += `<p>Score: ${score} · Gold: 💰${gold} · Max Combo: ${maxCombo}x</p>`;
  if (alive) {
    html += `<p style="font-size:14px;color:#c0a060">Spend gold on upgrades before the next round</p>`;
    html += `<div class="shopGrid">`;
    for (const u of UPGRADES) {
      const cur = upLvl(u.id);
      const owned = cur >= u.max;
      html += `<div class="shopItem${owned?' owned':''}" onclick="G.buy('${u.id}')">
        <div class="emoji">${u.emoji}</div>
        <div class="name">${u.name} ${cur?`(${cur}/${u.max})`:''}</div>
        <div class="desc">${u.desc}</div>
        <div class="cost">${owned?'MAX':'💰 '+u.cost}</div>
      </div>`;
    }
    html += `</div>`;
    html += `<button id="shopBtn" onclick="G.nextRound()">Next Round →</button>`;
  } else {
    html += `<p style="margin:10px 0">${score>=800?'🌟 Master Forager!':score>=400?'🍄 Skilled Hunter!':'🌱 Keep Practicing!'}</p>`;
    html += `<button id="shopBtn" onclick="G.start()">Try Again</button>`;
  }
  box.innerHTML = html;
  document.getElementById('shop').className = 'open';
}

// Public API
const G = window.G = {
  buy(id) {
    const u = UPGRADES.find(u=>u.id===id);
    if (!u || upLvl(id)>=u.max || gold<u.cost) return;
    gold -= u.cost;
    upgrades[id] = (upgrades[id]||0)+1;
    powerSfx();
    updateHud();
    showShop(); // refresh
  },
  nextRound() {
    document.getElementById('shop').className = '';
    round++;
    timeLeft = Math.max(25, 45-round*2);
    frenzyTime = 0; shieldTime = 0;
    shrooms = []; critters = []; particles = [];
    gameRunning = true; lastT = 0;
    updateHud();
    tickId = setInterval(tick,1000);
    const rate = () => Math.max(200, 550-round*30);
    (function sched(){ spawnId = setTimeout(()=>{ if(gameRunning){spawn();sched();}}, rate()); })();
    critterId = setInterval(spawnCritter, Math.max(2000, 5000-round*400));
    requestAnimationFrame(loop);
  },
  start() {
    document.getElementById('title').style.display = 'none';
    document.getElementById('shop').className = '';
    score=0; gold=0; combo=0; maxCombo=0; round=0;
    lives=3; frenzyTime=0; shieldTime=0; dayPhase=0; weather='clear';
    upgrades={}; shrooms=[]; critters=[]; particles=[];
    genTrees();
    lives = 3 + upLvl('armor');
    G.nextRound();
  }
};
