// ── MAIN GAME ─────────────────────────────────────────────────────

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width = 900;
const H = canvas.height = 700;

const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Escape' && game && (game.state === 'playing' || game.state === 'paused')) {
    game.state = game.state === 'paused' ? 'playing' : 'paused';
  }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const debugLog = [];
const MAX_LOG = 8;
function dbg(msg) { debugLog.unshift(`[${(game?.runTime||0).toFixed(1)}s] ${msg}`); if (debugLog.length > MAX_LOG) debugLog.pop(); }

class Game {
  constructor() {
    this.W = W; this.H = H;
    this.state = 'start';
    this.shakeX = 0; this.shakeY = 0; this.shakeDur = 0; this.shakeInt = 0;
    this.showStartScreen();
  }

  init(charData) {
    this.player = {
      x: W / 2, y: H / 2, radius: 12, speed: 2.5, hp: 100, maxHp: 100,
      xp: 0, xpToLevel: 15, level: 1,
      spells: [], relics: [], rules: [],
      bonus: charData.bonus, color: charData.color,
      shieldTimer: 0, invincible: 0, emoji: charData.emoji
    };
    if (charData.startSpell) this.player.spells.push({ ...SPELLS[charData.startSpell], _timer: 0 });
    if (charData.startSpell2) this.player.spells.push({ ...SPELLS[charData.startSpell2], _timer: 0 });
    if (charData.startRelic) this.applyRelic(RELICS[charData.startRelic]);

    this.enemies = []; this.projectiles = []; this.aoeEffects = [];
    this.lightningEffects = []; this.xpOrbs = []; this.floatingTexts = [];
    this.spirits = []; this.particles = [];
    this.runTime = 0; this.slowMotion = 0; this.comboText = null;
    this.killCount = 0; this.streak = 0; this.streakTimer = 0; this.maxStreak = 0;
    this.totalDamage = 0;

    this.triggers = new TriggerEngine(this);
    this.effects = new EffectSystem(this);
    this.spawner = new EnemySpawner(this);
    this.state = 'playing';
  }

  applyRelic(relicData) {
    const r = { ...relicData };
    this.player.relics.push(r);
    if (r.effect === 'glass_cannon') {
      this.player.maxHp = Math.round(this.player.maxHp * (1 - r.params.hpPenalty));
      this.player.hp = Math.min(this.player.hp, this.player.maxHp);
    }
  }

  shake(intensity, duration) { this.shakeInt = intensity; this.shakeDur = duration; }

  spawnDmgNumber(x, y, dmg, color) {
    this.floatingTexts.push({ x: x + (Math.random()-0.5)*10, y: y - 10, text: `${dmg}`, color, life: 0.6, size: dmg > 30 ? 16 : 12 });
  }

  applyHitEffect(e, color) {
    e.flashTimer = 0.1; e.flashColor = color;
    if (color.includes('cc88') || color.includes('6666') || color.includes('4488')) {
      // Physical — dust puffs
      for (let i = 0; i < 3; i++) this.particles.push({ x: e.x+(Math.random()-0.5)*10, y: e.y, vx: (Math.random()-0.5)*2, vy: -1-Math.random(), life: 0.4, color: '#aa9977', size: 2 });
    } else if (color.includes('88cc') || color.includes('44dd') || color.includes('cc88ff')) {
      // Chemical — green/purple mist
      for (let i = 0; i < 3; i++) this.particles.push({ x: e.x+(Math.random()-0.5)*10, y: e.y, vx: (Math.random()-0.5)*1, vy: -1-Math.random()*2, life: 0.5, color: '#88cc44', size: 3 });
    } else if (color.includes('ffaa') || color.includes('ffcc')) {
      // Cat — scratch marks
      for (let i = 0; i < 4; i++) { const a = Math.random()*Math.PI*2; this.particles.push({ x: e.x, y: e.y, vx: Math.cos(a)*3, vy: Math.sin(a)*3, life: 0.2, color: '#ffcc44', size: 2 }); }
    } else if (color.includes('8866') || color.includes('ff44')) {
      // Gross/allergy — splatter
      for (let i = 0; i < 2; i++) this.particles.push({ x: e.x+(Math.random()-0.5)*8, y: e.y, vx: (Math.random()-0.5)*2, vy: 1+Math.random(), life: 0.4, color: '#886622', size: 2 });
    } else {
      // Default sparkle
      for (let i = 0; i < 2; i++) { const a = Math.random()*Math.PI*2; this.particles.push({ x: e.x+Math.cos(a)*8, y: e.y+Math.sin(a)*8, vx: 0, vy: -0.5, life: 0.3, color: '#ffffff', size: 2 }); }
    }
  }

  showStartScreen() {
    const el = document.getElementById('start-screen');
    el.style.display = 'block';
    el.innerHTML = `<h2>🏠 Home Defense 🏠</h2><p style="color:#aaa;margin-bottom:15px">The bugs are coming! Choose your defender</p><div class="reward-options">${
      CHARACTERS.map((c, i) => `
        <div class="char-option" onclick="game.selectChar(${i})">
          <h3 style="color:${c.color}">${c.name}</h3>
          <p>${c.desc}</p>
        </div>`).join('')
    }</div>`;
  }

  selectChar(i) {
    document.getElementById('start-screen').style.display = 'none';
    this.init(CHARACTERS[i]);
    this.loop();
  }

  loop() {
    if (this.state === 'dead') return;
    const rawDt = 1 / 60;
    const dt = this.slowMotion > 0 ? rawDt * 0.3 : rawDt;
    try {
      if (this.state === 'playing') {
        this.runTime += rawDt;
        this.slowMotion = Math.max(0, this.slowMotion - rawDt);
        this.update(dt);
      }
      // Screen shake
      if (this.shakeDur > 0) {
        this.shakeDur -= rawDt;
        this.shakeX = (Math.random() - 0.5) * this.shakeInt * 2;
        this.shakeY = (Math.random() - 0.5) * this.shakeInt * 2;
      } else { this.shakeX = 0; this.shakeY = 0; }
      ctx.save();
      ctx.translate(this.shakeX, this.shakeY);
      this.render();
      ctx.restore();
      if (this.state === 'paused') {
        ctx.fillStyle = 'rgba(5,5,15,0.7)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 32px monospace'; ctx.textAlign = 'center';
        ctx.fillText('PAUSED', W / 2, H / 2 - 10);
        ctx.fillStyle = '#888'; ctx.font = '14px monospace';
        ctx.fillText('Press ESC to resume', W / 2, H / 2 + 20);
      }
    } catch (e) { console.error('Game error:', e); dbg(`ERROR: ${e.message}`); }
    requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    const p = this.player;
    let moveSpeed = p.speed;
    for (const r of p.relics) if (r.effect === 'speed_boost') moveSpeed *= (1 + r.params.percent);
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (dx || dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      p.x = Math.max(p.radius, Math.min(W - p.radius, p.x + dx / len * moveSpeed));
      p.y = Math.max(p.radius, Math.min(H - p.radius, p.y + dy / len * moveSpeed));
    }
    for (const r of p.relics) {
      if (r.effect === 'shield') {
        r._timer = (r._timer || 0) + dt;
        if (r._timer >= r.params.interval) { r._timer = 0; p.shieldTimer = 1; }
      }
    }
    p.invincible = Math.max(0, p.invincible - dt);
    // Streak decay
    if (this.streakTimer > 0) { this.streakTimer -= dt; if (this.streakTimer <= 0) this.streak = 0; }

    this.triggers.update(dt);
    this.spawner.update(dt);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateXpOrbs(dt);
    this.updateVisualEffects(dt);
    this.updateSpirits(dt);
    this.enemies = this.enemies.filter(e => !e.dead);
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      if (pr.life <= 0) { this.projectiles.splice(i, 1); continue; }
      // Trail particles — orbits leave thicker trails
      if (pr.type === 'orbit') {
        if (Math.random() < 0.5) {
          this.particles.push({ x: pr.x, y: pr.y, vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3, life: 0.35, color: pr.color, size: 3 });
        }
      } else if (Math.random() < 0.3) {
        this.particles.push({ x: pr.x, y: pr.y, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5, life: 0.2, color: pr.color, size: 2 });
      }
      if (pr.type === 'orbit') {
        pr.angle += pr.speed * dt;
        pr.x = this.player.x + Math.cos(pr.angle) * pr.range;
        pr.y = this.player.y + Math.sin(pr.angle) * pr.range;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (e.dead) continue;
          if (this.dist(pr.x, pr.y, e.x, e.y) < e.radius + 6) {
            const d = pr.damage * (1 - (e.armor || 0));
            e.hp -= d; this.applyHitEffect(e, pr.color);
            this.spawnDmgNumber(e.x, e.y, Math.round(d), pr.color);
            if (e.hp <= 0) this.onEnemyKilled(e);
          }
        }
      } else {
        pr.x += pr.vx; pr.y += pr.vy;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (e.dead) continue;
          if (this.dist(pr.x, pr.y, e.x, e.y) < e.radius + (pr.radius || 6)) {
            const d = pr.damage * (1 - (e.armor || 0));
            e.hp -= d; this.applyHitEffect(e, pr.color);
            this.spawnDmgNumber(e.x, e.y, Math.round(d), pr.color);
            if (e.hp <= 0) this.onEnemyKilled(e);
            if (!pr.pierce) { this.projectiles.splice(i, 1); break; }
          }
        }
      }
    }
  }

  updateEnemies(dt) {
    const p = this.player;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) continue;
      e.flashTimer = Math.max(0, (e.flashTimer || 0) - dt);
      e.slowTimer = Math.max(0, (e.slowTimer || 0) - dt);
      // Burn damage over time
      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.hp -= 3 * dt;
        if (Math.random() < 0.1) this.particles.push({ x: e.x+(Math.random()-0.5)*8, y: e.y, vx: 0, vy: -1.5, life: 0.3, color: '#ff4400', size: 2 });
        if (e.hp <= 0) this.onEnemyKilled(e);
      }
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      let spd = this.slowMotion > 0 ? e.speed * 0.3 : e.speed;
      if (e.slowTimer > 0) spd *= 0.4;
      e.x += Math.cos(a) * spd; e.y += Math.sin(a) * spd;
      if (e.type === 'boss') {
        e.attackTimer += dt;
        if (e.attackTimer > 3) {
          e.attackTimer = 0;
          this.aoeEffects.push({ x: e.x, y: e.y, radius: 80, damage: e.damage, color: '#ff004488', life: 0.5 });
          if (this.dist(p.x, p.y, e.x, e.y) < 80) this.damagePlayer(e.damage);
        }
      }
      if (this.dist(p.x, p.y, e.x, e.y) < p.radius + e.radius) {
        this.damagePlayer(e.damage * dt * 2);
        const pushA = Math.atan2(p.y - e.y, p.x - e.x);
        p.x = Math.max(p.radius, Math.min(W - p.radius, p.x + Math.cos(pushA) * 2));
        p.y = Math.max(p.radius, Math.min(H - p.radius, p.y + Math.sin(pushA) * 2));
      }
    }
  }

  damagePlayer(dmg) {
    const p = this.player;
    if (p.invincible > 0) return;
    if (p.shieldTimer > 0) {
      p.shieldTimer = 0;
      this.floatingTexts.push({ x: p.x, y: p.y - 25, text: 'BLOCKED', color: '#ffd700', life: 0.8 });
      return;
    }
    p.hp -= dmg;
    // Thorns relic
    for (const r of p.relics) {
      if (r.effect === 'thorns') {
        this.damageEnemiesInRadius(p.x, p.y, r.params.radius, r.params.damage);
        this.aoeEffects.push({ x: p.x, y: p.y, radius: r.params.radius, damage: 0, color: '#ff888844', life: 0.2 });
      }
    }
    this.triggers.onEvent('on_damage_taken', { damage: dmg });
    if (p.hp / p.maxHp <= 0.3) this.triggers.onEvent('on_low_hp', {});
    if (p.hp <= 0) this.die();
  }

  onEnemyKilled(e) {
    if (e.dead) return;
    e.dead = true;
    this.killCount++;
    this.streak++; this.streakTimer = 2;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;
    this.xpOrbs.push({ x: e.x, y: e.y, xp: e.xp, radius: 4, color: '#ffd700' });
    // Death particles
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({ x: e.x, y: e.y, vx: Math.cos(a)*(1+Math.random()*2), vy: Math.sin(a)*(1+Math.random()*2), life: 0.4, color: e.color, size: 3 });
    }
    // Vampirism relic
    for (const r of this.player.relics) {
      if (r.effect === 'vampirism') this.player.hp = Math.min(this.player.maxHp, this.player.hp + r.params.heal);
    }
    if (e.splits) {
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        this.enemies.push({
          x: e.x + Math.cos(a)*15, y: e.y + Math.sin(a)*15,
          hp: 12, maxHp: 12, speed: 1.8, damage: 4, xp: 2, radius: 5,
          color: '#33bb88', type: 'swarm_mini', attackTimer: 0, armor: 0,
          emoji: '🪰', slowTimer: 0, flashTimer: 0
        });
      }
    }
    if (e.spawns) {
      const count = 2 + Math.floor(Math.random() * 2); // 2-3 babies
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        this.enemies.push({
          x: e.x + Math.cos(a)*12, y: e.y + Math.sin(a)*12,
          hp: 8, maxHp: 8, speed: 1.5, damage: 3, xp: 1, radius: 5,
          color: '#664422', type: 'baby_roach', attackTimer: 0, armor: 0,
          emoji: '🐛', slowTimer: 0, flashTimer: 0
        });
      }
    }
    if (e.explodes) {
      this.aoeEffects.push({ x: e.x, y: e.y, radius: 70, damage: 0, color: '#ffaa00', life: 0.4 });
      if (this.dist(this.player.x, this.player.y, e.x, e.y) < 70) this.damagePlayer(e.damage);
      this.shake(5, 0.15);
    }
    this.triggers.onEvent('on_enemy_killed', { enemy: e });
  }

  updateXpOrbs(dt) {
    const p = this.player;
    let pickupRange = 50;
    for (const r of p.relics) if (r.effect === 'xp_range') pickupRange *= (1 + r.params.percent);
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const o = this.xpOrbs[i];
      const d = this.dist(p.x, p.y, o.x, o.y);
      if (d < pickupRange) {
        const a = Math.atan2(p.y - o.y, p.x - o.x);
        o.x += Math.cos(a) * 5; o.y += Math.sin(a) * 5;
      }
      if (d < p.radius + o.radius) {
        p.xp += o.xp; this.xpOrbs.splice(i, 1);
        if (p.xp >= p.xpToLevel) this.levelUp();
      }
    }
  }

  updateVisualEffects(dt) {
    for (let i = this.aoeEffects.length - 1; i >= 0; i--) { this.aoeEffects[i].life -= dt; if (this.aoeEffects[i].life <= 0) this.aoeEffects.splice(i, 1); }
    for (let i = this.lightningEffects.length - 1; i >= 0; i--) { this.lightningEffects[i].life -= dt; if (this.lightningEffects[i].life <= 0) this.lightningEffects.splice(i, 1); }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) { const t = this.floatingTexts[i]; t.life -= dt; t.y -= 1; if (t.life <= 0) this.floatingTexts.splice(i, 1); }
    for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.life -= dt; p.x += p.vx; p.y += p.vy; if (p.life <= 0) this.particles.splice(i, 1); }
    if (this.comboText) { this.comboText.life -= dt; if (this.comboText.life <= 0) this.comboText = null; }
  }

  updateSpirits(dt) {
    for (let i = this.spirits.length - 1; i >= 0; i--) {
      const s = this.spirits[i];
      s.life -= dt; s.angle += 3 * dt;
      s.x = this.player.x + Math.cos(s.angle) * 60;
      s.y = this.player.y + Math.sin(s.angle) * 60;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (this.dist(s.x, s.y, e.x, e.y) < e.radius + 10) { e.hp -= 8 * dt; if (e.hp <= 0) this.onEnemyKilled(e); }
      }
      if (s.life <= 0) this.spirits.splice(i, 1);
    }
  }

  levelUp() {
    const p = this.player;
    p.level++; dbg(`LEVEL UP → ${p.level}`);
    p.xp -= p.xpToLevel;
    p.xpToLevel = Math.round(p.xpToLevel * 1.4);
    p.maxHp += 5;
    p.hp = Math.min(p.maxHp, p.hp + 20);
    // Vacuum all XP orbs
    for (const o of this.xpOrbs) { o._vacuum = true; }
    this.state = 'reward';
    this.showRewardScreen();
  }

  showRewardScreen() {
    const options = this.generateRewards();
    const el = document.getElementById('reward-screen');
    el.style.display = 'block';
    el.innerHTML = `<h2>Level ${this.player.level}! Choose a reward:</h2><div class="reward-options">${
      options.map((o, i) => {
        const r = RARITY_COLORS[o.rarity] || RARITY_COLORS.common;
        return `
        <div class="reward-card" style="border-color:${r.border};background:${r.bg}" onclick="game.pickReward(${i})">
          <div class="card-rarity" style="color:${r.labelColor}">${r.label} ${(o.rarity||'common').toUpperCase()}</div>
          <div class="card-emoji">${o.emoji || ''}</div>
          <div class="card-type" style="color:${o.type==='spell'?'#ff6b6b':o.type==='relic'?'#ffd700':o.type==='rule'?'#6bffb8':o.type==='upgrade'?'#44ddff':'#44ff44'}">${o.type}</div>
          <div class="card-name">${o.name}</div>
          <div class="card-desc">${o.desc}</div>
          ${o.tags && o.tags.length ? `<div class="card-tags">${o.tags.join(' ')}</div>` : ''}
        </div>`;
      }).join('')
    }</div>`;
    this._rewardOptions = options;
  }

  generateRewards() {
    const lvl = this.player.level;
    // Rarity unlocks at certain levels
    const allowed = ['common'];
    if (lvl >= 3) allowed.push('uncommon');
    if (lvl >= 6) allowed.push('rare');
    if (lvl >= 10) allowed.push('epic');
    if (lvl >= 15) allowed.push('legendary');

    const pool = [];
    const ownedSpells = new Set(this.player.spells.map(s => s.name));
    for (const [k, v] of Object.entries(SPELLS)) if (!ownedSpells.has(v.name) && allowed.includes(v.rarity)) pool.push({ ...v, _key: k });
    const ownedRelics = new Set(this.player.relics.map(r => r.name));
    for (const [k, v] of Object.entries(RELICS)) if (!ownedRelics.has(v.name) && allowed.includes(v.rarity)) pool.push({ ...v, _key: k });
    const ownedRules = new Set(this.player.rules.map(r => r.name));
    for (const [k, v] of Object.entries(RULES)) if (!ownedRules.has(v.name) && allowed.includes(v.rarity)) pool.push({ ...v, _key: k });

    // Shuffle, then weight — rarer cards less likely to show
    pool.sort(() => Math.random() - 0.5);
    const weights = { common: 5, uncommon: 4, rare: 3, epic: 2, legendary: 1 };
    const weighted = [];
    for (const card of pool) {
      if (Math.random() * 5 < (weights[card.rarity] || 3)) weighted.push(card);
    }

    let slots = 3;
    for (const r of this.player.relics) if (r.effect === 'extra_reward') slots = 4;
    const result = weighted.slice(0, slots);

    while (result.length < slots && this.player.spells.length > 0) {
      const spell = this.player.spells[Math.floor(Math.random() * this.player.spells.length)];
      if (result.find(r => r._upgradeTarget === spell.name)) continue;
      result.push({ type: 'upgrade', rarity: 'uncommon', name: `↑ ${spell.name}`, desc: `+30% dmg, -15% cd`, emoji: spell.emoji || '⬆️', _upgradeTarget: spell.name });
    }
    if (result.length === 0) result.push({ type: 'heal', rarity: 'common', name: 'Full Heal', desc: 'Restore to max HP', emoji: '💚' });
    return result;
  }

  pickReward(i) {
    const card = this._rewardOptions[i];
    if (card.type === 'spell') this.player.spells.push({ ...card, _timer: 0 });
    else if (card.type === 'relic') this.applyRelic(card);
    else if (card.type === 'rule') this.player.rules.push({ ...card });
    else if (card.type === 'upgrade') {
      const spell = this.player.spells.find(s => s.name === card._upgradeTarget);
      if (spell) { spell.damage = Math.round(spell.damage * 1.3); spell.cooldown *= 0.85; spell._level = (spell._level || 1) + 1; }
    }
    else if (card.type === 'heal') this.player.hp = this.player.maxHp;
    document.getElementById('reward-screen').style.display = 'none';
    this.state = 'playing';
  }

  triggerCombo(combo) {
    dbg(`COMBO x${this.triggers.simultaneousCount}: ${combo.desc}`);
    this.comboText = { text: combo.desc, life: 1.5 };
    // Time Warp rule: combos trigger slow motion
    for (const rule of this.player.rules) {
      if (rule.effect === 'combo_slow') this.slowMotion = rule.params.duration;
    }
    if (combo.effect === 'shockwave') {
      this.aoeEffects.push({ x: this.player.x, y: this.player.y, radius: combo.radius, damage: combo.damage, color: '#ffd700', life: 0.4 });
      this.damageEnemiesInRadius(this.player.x, this.player.y, combo.radius, combo.damage);
      this.shake(10, 0.3);
    }
    if (combo.effect === 'spirit') {
      this.spirits.push({ x: this.player.x, y: this.player.y, angle: Math.random() * Math.PI * 2, life: combo.duration, color: '#ffaa44' });
    }
  }

  die() {
    this.state = 'dead';
    const el = document.getElementById('death-screen');
    el.style.display = 'block';
    const mins = Math.floor(this.runTime / 60);
    const secs = Math.floor(this.runTime % 60);
    el.innerHTML = `<h2>🪳 Overrun!</h2>
      <div style="color:#aaa;margin:10px 0;line-height:1.8">
        <div>⏱ Survived <span style="color:#fff">${mins}:${secs.toString().padStart(2,'0')}</span></div>
        <div>📊 Level <span style="color:#fff">${this.player.level}</span></div>
        <div>💀 Bugs Squished <span style="color:#fff">${this.killCount}</span></div>
        <div>🔥 Best Streak <span style="color:#fff">${this.maxStreak}</span></div>
        <div>🃏 Spells: <span style="color:#ff6b6b">${this.player.spells.map(s => s.name).join(', ')}</span></div>
        <div>💎 Relics: <span style="color:#ffd700">${this.player.relics.map(r => r.name).join(', ') || 'None'}</span></div>
        <div>📜 Rules: <span style="color:#6bffb8">${this.player.rules.map(r => r.name).join(', ') || 'None'}</span></div>
      </div>
      <button onclick="game.restart()">Try Again</button>`;
  }

  restart() {
    document.getElementById('death-screen').style.display = 'none';
    this.state = 'start'; this.showStartScreen();
  }

  // ── HELPERS ──
  dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); }
  nearestEnemy(x, y) { let b = null, bd = Infinity; for (const e of this.enemies) { if (e.dead) continue; const d = this.dist(x,y,e.x,e.y); if (d < bd) { bd = d; b = e; } } return b; }
  getEnemiesNear(x, y, range, max) { return this.enemies.filter(e => !e.dead).map(e => ({_d: this.dist(x,y,e.x,e.y), _ref: e})).filter(e => e._d < range).sort((a,b) => a._d - b._d).slice(0, max).map(e => e._ref); }

  damageEnemiesInRadius(x, y, radius, dmg, color) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (this.dist(x, y, e.x, e.y) < radius + e.radius) {
        const d = dmg * (1 - (e.armor || 0));
        e.hp -= d; e.flashTimer = 0.1;
        if (d > 0) this.spawnDmgNumber(e.x, e.y, Math.round(d), color || '#fff');
        if (e.hp <= 0) this.onEnemyKilled(e);
      }
    }
  }
}
