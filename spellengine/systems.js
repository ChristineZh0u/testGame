// ── CORE SYSTEMS ──────────────────────────────────────────────────

class TriggerEngine {
  constructor(game) {
    this.game = game; this.lastSpellId = null;
    this.simultaneousCount = 0; this.comboWindow = 0; this._depth = 0;
    this.killTimes = []; // for momentum rule
  }

  update(dt) {
    if (this.comboWindow > 0) {
      this.comboWindow -= dt;
      if (this.comboWindow <= 0) { this.checkCombo(); this.simultaneousCount = 0; }
    }
    const p = this.game.player;
    for (const card of p.spells) {
      card._timer = (card._timer || 0) + dt;
      card._cdTimer = (card._cdTimer || 0) + dt;
      const cd = this.getEffectiveCooldown(card);
      if (card.trigger === 'every_x_seconds' && card._timer >= cd) {
        card._timer = 0; card._cdTimer = 0;
        this.fireSpell(card);
      }
    }
    // Prune old kill times for momentum
    const now = this.game.runTime;
    this.killTimes = this.killTimes.filter(t => now - t < 3);
  }

  getEffectiveCooldown(card) {
    let cd = card.cooldown;
    const p = this.game.player;
    for (const r of p.relics) {
      if (r.effect === 'reduce_cooldowns') cd *= (1 - r.params.percent);
    }
    if (p.bonus?.type === 'cooldown_reduce') cd *= (1 - p.bonus.percent);
    // Overclock rule
    for (const rule of p.rules) {
      if (rule.effect === 'overclock' && p.hp / p.maxHp < rule.params.threshold) cd *= 0.5;
    }
    return cd;
  }

  onEvent(eventType, data) {
    const p = this.game.player;
    for (const card of p.spells) {
      if (card.trigger !== eventType) continue;
      const cd = this.getEffectiveCooldown(card);
      if ((card._cdTimer || cd) < cd) continue;
      if (eventType === 'on_low_hp' && p.hp / p.maxHp > card.triggerVal) continue;
      card._cdTimer = 0;
      this.fireSpell(card);
    }
    if (eventType === 'on_enemy_killed') {
      this.killTimes.push(this.game.runTime);
      for (const rule of p.rules) {
        if (rule.effect === 'kill_retrigger' && this.lastSpellId && Math.random() < rule.params.chance) {
          const spell = p.spells.find(s => s.name === this.lastSpellId);
          if (spell) this.fireSpell(spell);
        }
      }
    }
  }

  fireSpell(card) {
    if (this._depth >= 3) return;
    this._depth++;
    const dmg = this.calcDamage(card);
    this.game.effects.execute(card, dmg);
    this.lastSpellId = card.name;
    this.simultaneousCount++;
    this.comboWindow = 0.15;
    this.onEvent('on_spell_trigger', { spell: card });
    this._depth--;
  }

  calcDamage(card) {
    let dmg = card.damage;
    const p = this.game.player;
    for (const r of p.relics) {
      if (r.effect === 'damage_boost') dmg *= (1 + r.params.percent);
      if (r.effect === 'tag_damage_boost' && card.tags.includes(r.params.tag)) dmg *= (1 + r.params.percent);
      if (r.effect === 'glass_cannon') dmg *= (1 + r.params.dmgBoost);
    }
    if (p.bonus?.type === 'tag_damage' && card.tags.includes(p.bonus.tag)) dmg *= (1 + p.bonus.percent);
    if (p.bonus?.type === 'echo_damage' && card._isEcho) dmg *= (1 + p.bonus.percent);
    for (const rule of p.rules) {
      if (rule.effect === 'pair_tag_bonus') {
        for (const tag of card.tags) {
          if (p.spells.filter(s => s !== card && s.tags.includes(tag)).length > 0) { dmg *= rule.params.multiplier; break; }
        }
      }
      if (rule.effect === 'momentum') {
        dmg *= (1 + this.killTimes.length * rule.params.bonus);
      }
    }
    return Math.round(dmg);
  }

  checkCombo() {
    for (const c of COMBO_THRESHOLDS) {
      if (this.simultaneousCount >= c.count) this.game.triggerCombo(c);
    }
  }
}

class EffectSystem {
  constructor(game) { this.game = game; }

  execute(card, dmg) {
    const g = this.game, p = g.player;

    switch (card.effect) {
      case 'spawn_orbiting_projectile': {
        let count = 1;
        for (const r of p.relics) if (r.effect === 'extra_orbit') count = 2;
        for (let n = 0; n < count; n++) {
          g.projectiles.push({
            type: 'orbit', x: p.x, y: p.y, angle: Math.random() * Math.PI * 2 + n * Math.PI,
            speed: card.params.speed, range: card.params.range, damage: dmg,
            color: card.color, life: card.cooldown * 0.9, emoji: card.emoji,
            size: Math.max(14, 10 + dmg * 0.4)
          });
        }
        break;
      }
      case 'spawn_projectile': {
        const nearest = g.nearestEnemy(p.x, p.y);
        if (!nearest) break;
        const a = Math.atan2(nearest.y - p.y, nearest.x - p.x);
        g.projectiles.push({
          type: 'linear', x: p.x, y: p.y, vx: Math.cos(a) * card.params.speed,
          vy: Math.sin(a) * card.params.speed, damage: dmg, color: card.color,
          life: card.params.range / card.params.speed / 60, radius: 6,
          pierce: card.params.pierce || false, emoji: card.emoji
        });
        break;
      }
      case 'area_damage': {
        let radius = card.params.radius;
        for (const rule of p.rules) if (rule.effect === 'cascade') radius *= (1 + rule.params.bonus);
        g.aoeEffects.push({ x: p.x, y: p.y, radius, damage: dmg, color: card.color, life: 0.3 });
        g.damageEnemiesInRadius(p.x, p.y, radius, dmg, card.color);
        break;
      }
      case 'chain_lightning': {
        const targets = g.getEnemiesNear(p.x, p.y, card.params.range, card.params.chains);
        let prev = { x: p.x, y: p.y };
        for (const t of targets) {
          g.lightningEffects.push({ x1: prev.x, y1: prev.y, x2: t.x, y2: t.y, color: card.color, life: 0.25 });
          t.hp -= dmg * (1 - (t.armor || 0));
          g.spawnDmgNumber(t.x, t.y, dmg, card.color);
          if (t.hp <= 0) g.onEnemyKilled(t);
          prev = t;
        }
        break;
      }
      case 'heal_player':
        p.hp = Math.min(p.maxHp, p.hp + card.params.heal);
        g.floatingTexts.push({ x: p.x, y: p.y - 20, text: `+${card.params.heal}`, color: '#44ff44', life: 0.8 });
        break;
      case 'repeat_last_spell': {
        const last = g.triggers.lastSpellId;
        const spell = p.spells.find(s => s.name === last && s.name !== card.name);
        if (spell) {
          const clone = { ...spell, _isEcho: true };
          this.execute(clone, g.triggers.calcDamage(clone));
        }
        break;
      }
      case 'duplicate_spell': {
        const rand = p.spells[Math.floor(Math.random() * p.spells.length)];
        if (rand && rand.name !== card.name) this.execute(rand, g.triggers.calcDamage(rand));
        break;
      }
      case 'frost_ring': {
        let radius = card.params.radius;
        for (const rule of p.rules) if (rule.effect === 'cascade') radius *= (1 + rule.params.bonus);
        g.aoeEffects.push({ x: p.x, y: p.y, radius, damage: dmg, color: card.color, life: 0.4 });
        // Damage + slow enemies
        for (const e of g.enemies) {
          if (e.dead) continue;
          if (g.dist(p.x, p.y, e.x, e.y) < radius + e.radius) {
            e.hp -= dmg * (1 - (e.armor || 0));
            e.slowTimer = card.params.slowDuration;
            g.spawnDmgNumber(e.x, e.y, dmg, card.color);
            if (e.hp <= 0) g.onEnemyKilled(e);
          }
        }
        break;
      }
      case 'meteor': {
        // Find densest cluster
        let bestX = p.x, bestY = p.y, bestCount = 0;
        for (const e of g.enemies) {
          if (e.dead) continue;
          let count = 0;
          for (const e2 of g.enemies) {
            if (!e2.dead && g.dist(e.x, e.y, e2.x, e2.y) < card.params.radius) count++;
          }
          if (count > bestCount) { bestCount = count; bestX = e.x; bestY = e.y; }
        }
        let radius = card.params.radius;
        for (const rule of p.rules) if (rule.effect === 'cascade') radius *= (1 + rule.params.bonus);
        // Warning indicator then damage
        g.aoeEffects.push({ x: bestX, y: bestY, radius, damage: dmg, color: '#ff440066', life: 0.15 });
        g.aoeEffects.push({ x: bestX, y: bestY, radius: radius * 0.6, damage: dmg, color: card.color, life: 0.5 });
        g.damageEnemiesInRadius(bestX, bestY, radius, dmg, card.color);
        g.shake(8, 0.25);
        // Particles
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2;
          g.particles.push({ x: bestX, y: bestY, vx: Math.cos(a) * (2 + Math.random() * 3), vy: Math.sin(a) * (2 + Math.random() * 3), life: 0.5, color: card.color, size: 3 });
        }
        break;
      }
      case 'static_field': {
        let radius = card.params.radius;
        for (const rule of p.rules) if (rule.effect === 'cascade') radius *= (1 + rule.params.bonus);
        g.aoeEffects.push({ x: p.x, y: p.y, radius, damage: 0, color: card.color, life: 0.3 });
        for (const e of g.enemies) {
          if (e.dead) continue;
          if (g.dist(p.x, p.y, e.x, e.y) < radius + e.radius) {
            const pctDmg = Math.round(e.maxHp * card.params.percent);
            e.hp -= pctDmg;
            g.spawnDmgNumber(e.x, e.y, pctDmg, card.color);
            if (e.hp <= 0) g.onEnemyKilled(e);
          }
        }
        break;
      }
    }
  }
}

class EnemySpawner {
  constructor(game) { this.game = game; this.timer = 0; this.bossTimer = 0; this.eventTimer = 0; this.wave = 0; }

  update(dt) {
    this.timer += dt;
    this.bossTimer += dt;
    this.eventTimer += dt;
    // Slow start: 3s between spawns, gradually speeds up, floor at 0.5s
    const interval = Math.max(0.5, 3 - this.game.runTime * 0.008);
    if (this.timer >= interval) {
      this.timer = 0; this.wave++;
      this.spawnWave();
    }
    if (this.bossTimer >= 300) { this.bossTimer = 0; this.spawnBoss(); }
    // Wave events start at 90s, every 50s
    if (this.game.runTime > 90 && this.eventTimer >= 50) { this.eventTimer = 0; this.triggerWaveEvent(); }
  }

  spawnWave() {
    const t = this.game.runTime;
    // Start with 1 enemy, slowly ramp: +1 every 30s, max 8
    const count = Math.min(1 + Math.floor(t / 30), 8);
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      let type = 'swarm';
      if (t > 240 && r < 0.08) type = 'exploder';
      else if (t > 180 && r < 0.12) type = 'shielded';
      else if (t > 120 && r < 0.15) type = 'splitter';
      else if (t > 90 && r < 0.18) type = 'elite';
      else if (t > 30 && r < 0.25) type = 'charger';
      this.spawn(type);
    }
  }

  triggerWaveEvent() {
    const g = this.game;
    const evt = WAVE_EVENTS[Math.floor(Math.random() * WAVE_EVENTS.length)];
    dbg(`EVENT: ${evt.name}`);
    g.floatingTexts.push({ x: g.W / 2, y: g.H / 2 - 30, text: evt.desc, color: '#ffaa00', life: 2.5 });
    for (let i = 0; i < evt.count; i++) this.spawn(evt.spawn);
  }

  spawn(type) {
    const g = this.game, t = ENEMY_TYPES[type];
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(g.W, g.H) / 2 + 50;
    const hpScale = 1 + this.game.runTime * 0.005;
    g.enemies.push({
      x: g.W / 2 + Math.cos(angle) * dist, y: g.H / 2 + Math.sin(angle) * dist,
      hp: Math.round(t.hp * hpScale), maxHp: Math.round(t.hp * hpScale),
      speed: t.speed, damage: t.damage, xp: t.xp, radius: t.radius,
      color: t.color, type, attackTimer: 0, emoji: t.emoji || '👻',
      splits: t.splits || false, armor: t.armor || 0, explodes: t.explodes || false,
      spawns: t.spawns || false,
      slowTimer: 0, flashTimer: 0
    });
  }

  spawnBoss() {
    const g = this.game, t = ENEMY_TYPES.boss;
    const hpScale = 1 + this.game.runTime * 0.01;
    g.enemies.push({
      x: g.W / 2, y: 50,
      hp: Math.round(t.hp * hpScale), maxHp: Math.round(t.hp * hpScale),
      speed: t.speed, damage: t.damage, xp: t.xp, radius: t.radius,
      color: t.color, type: 'boss', attackTimer: 0, armor: 0,
      emoji: '🐉', slowTimer: 0, flashTimer: 0
    });
    g.floatingTexts.push({ x: g.W / 2, y: g.H / 2, text: '⚠ BOSS ⚠', color: '#ff0044', life: 2 });
    g.shake(10, 0.5);
  }
}
