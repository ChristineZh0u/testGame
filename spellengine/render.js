// ── RENDER ────────────────────────────────────────────────────────

Game.prototype.render = function() {
  ctx.fillStyle = '#1a1510'; ctx.fillRect(0, 0, W, H);

  // Floor tiles
  ctx.strokeStyle = '#2a2218'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Particles (behind everything)
  for (const p of this.particles) {
    ctx.globalAlpha = Math.min(1, p.life * 3);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // AoE effects
  for (const a of this.aoeEffects) {
    ctx.globalAlpha = a.life * 2;
    ctx.fillStyle = a.color;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.radius * (1 - a.life * 0.5), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Lightning
  for (const l of this.lightningEffects) {
    ctx.globalAlpha = l.life * 4;
    ctx.strokeStyle = l.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1);
    const dx = l.x2 - l.x1, dy = l.y2 - l.y1;
    for (let t = 0.2; t < 1; t += 0.2) ctx.lineTo(l.x1 + dx*t + (Math.random()-0.5)*20, l.y1 + dy*t + (Math.random()-0.5)*20);
    ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  }

  // XP orbs
  for (const o of this.xpOrbs) {
    ctx.fillStyle = o.color; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Enemies
  for (const e of this.enemies) {
    if (e.dead) continue;
    const flash = e.flashTimer > 0;
    const size = e.radius * 2.2;
    ctx.font = `${size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (flash) { ctx.globalAlpha = 0.5; }
    if (e.slowTimer > 0) { ctx.globalAlpha = 0.6; }
    ctx.fillText(e.emoji || '👻', e.x, e.y);
    // Tinted flash overlay
    if (flash && e.flashColor) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = e.flashColor;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
    }
    // Burn indicator
    if (e.burnTimer > 0) {
      ctx.globalAlpha = 0.3 + Math.sin(this.runTime * 10) * 0.15;
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Armor indicator
    if (e.armor > 0) {
      ctx.strokeStyle = '#aaaaff88'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
    }
    // HP bar
    if (e.hp < e.maxHp) {
      const bw = e.radius * 2.5;
      ctx.fillStyle = '#333'; ctx.fillRect(e.x - bw/2, e.y - e.radius - 8, bw, 3);
      ctx.fillStyle = e.type === 'boss' ? '#ff2244' : '#ff4444';
      ctx.fillRect(e.x - bw/2, e.y - e.radius - 8, bw * Math.max(0, e.hp / e.maxHp), 3);
    }
    // Boss label
    if (e.type === 'boss') {
      ctx.fillStyle = '#ff0044'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('BOSS', e.x, e.y - e.radius - 12);
    }
  }
  ctx.textBaseline = 'alphabetic';

  // Projectiles
  for (const pr of this.projectiles) {
    const sz = pr.size || (pr.radius || 6) * 2.5;
    ctx.font = `${sz}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Orbit glow ring
    if (pr.type === 'orbit') {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = pr.color;
      ctx.beginPath(); ctx.arc(pr.x, pr.y, sz * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillText(pr.emoji || '✨', pr.x, pr.y);
  }
  ctx.textBaseline = 'alphabetic';

  // Spirits
  for (const s of this.spirits) {
    ctx.globalAlpha = 0.6 + Math.sin(this.runTime * 8) * 0.2;
    ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🐱', s.x, s.y);
    ctx.globalAlpha = 1;
  }
  ctx.textBaseline = 'alphabetic';

  // Player
  const p = this.player;
  if (p) {
    if (p.shieldTimer > 0) {
      ctx.strokeStyle = '#ffd70088'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
    }
    // Low HP warning pulse
    if (p.hp / p.maxHp <= 0.3) {
      ctx.globalAlpha = 0.15 + Math.sin(this.runTime * 6) * 0.1;
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(p.x, p.y, 40, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (p.invincible > 0) ctx.globalAlpha = 0.5;
    ctx.font = '28px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, p.x, p.y);
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
  }

  // Floating texts
  for (const t of this.floatingTexts) {
    ctx.globalAlpha = Math.min(1, t.life * 2.5);
    ctx.fillStyle = t.color; ctx.font = `${t.size || 14}px monospace`; ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
    ctx.globalAlpha = 1;
  }

  // Combo text
  if (this.comboText) {
    const scale = 1 + (1 - Math.min(1, this.comboText.life)) * 0.3;
    ctx.globalAlpha = Math.min(1, this.comboText.life);
    ctx.fillStyle = '#ffd700'; ctx.font = `bold ${Math.round(28 * scale)}px monospace`; ctx.textAlign = 'center';
    ctx.fillText(this.comboText.text, W / 2, H / 2 - 60);
    ctx.globalAlpha = 1;
  }

  if (p) this.renderHUD();
};

Game.prototype.renderHUD = function() {
  const p = this.player;
  ctx.textAlign = 'left';

  // HP bar with gradient
  ctx.fillStyle = '#222'; ctx.fillRect(10, 10, 200, 16);
  const hpPct = Math.max(0, p.hp / p.maxHp);
  ctx.fillStyle = hpPct > 0.5 ? '#44cc44' : hpPct > 0.3 ? '#ccaa22' : '#ff4444';
  ctx.fillRect(10, 10, 200 * hpPct, 16);
  ctx.strokeStyle = '#444'; ctx.strokeRect(10, 10, 200, 16);
  ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
  ctx.fillText(`HP ${Math.round(p.hp)}/${p.maxHp}`, 14, 22);

  // XP bar
  ctx.fillStyle = '#222'; ctx.fillRect(10, 30, 200, 10);
  ctx.fillStyle = '#4488ff'; ctx.fillRect(10, 30, 200 * (p.xp / p.xpToLevel), 10);
  ctx.strokeStyle = '#444'; ctx.strokeRect(10, 30, 200, 10);
  ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
  ctx.fillText(`Lv ${p.level}  XP ${p.xp}/${p.xpToLevel}`, 14, 39);

  // Timer + kills
  const mins = Math.floor(this.runTime / 60);
  const secs = Math.floor(this.runTime % 60);
  ctx.fillStyle = '#888'; ctx.font = '14px monospace'; ctx.textAlign = 'right';
  ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, W - 10, 22);
  ctx.fillStyle = '#888'; ctx.font = '11px monospace';
  ctx.fillText(`Squished: ${this.killCount}  Bugs: ${this.enemies.length}`, W - 10, 38);

  // Streak
  if (this.streak >= 3) {
    ctx.textAlign = 'center';
    ctx.fillStyle = this.streak >= 10 ? '#ff4444' : this.streak >= 5 ? '#ffaa00' : '#ffd700';
    ctx.font = `bold ${14 + Math.min(this.streak, 10)}px monospace`;
    ctx.fillText(`🔥 ${this.streak} STREAK`, W / 2, 55);
  }

  // Momentum indicator
  const killTimes = this.triggers.killTimes;
  if (killTimes.length > 0) {
    for (const rule of p.rules) {
      if (rule.effect === 'momentum') {
        const bonus = Math.round(killTimes.length * rule.params.bonus * 100);
        if (bonus > 0) {
          ctx.textAlign = 'center'; ctx.fillStyle = '#ffcc44'; ctx.font = '11px monospace';
          ctx.fillText(`Momentum +${bonus}%`, W / 2, 70);
        }
      }
    }
  }

  // Active cards sidebar
  ctx.textAlign = 'left'; ctx.font = '10px monospace';
  let y = 55;
  ctx.fillStyle = '#ff6b6b'; ctx.fillText('SPELLS:', 10, y); y += 12;
  for (const s of p.spells) {
    const cd = this.triggers.getEffectiveCooldown(s);
    const pct = Math.min(1, (s._timer || 0) / cd);
    ctx.fillStyle = '#222'; ctx.fillRect(10, y - 8, 110, 10);
    ctx.fillStyle = s.color + '66'; ctx.fillRect(10, y - 8, 110 * pct, 10);
    ctx.strokeStyle = '#333'; ctx.strokeRect(10, y - 8, 110, 10);
    const lvl = s._level ? ` Lv${s._level}` : '';
    ctx.fillStyle = pct >= 0.95 ? '#fff' : '#999'; ctx.fillText(`${s.name}${lvl}`, 14, y);
    y += 13;
  }
  y += 4;
  if (p.relics.length) {
    ctx.fillStyle = '#ffd700'; ctx.fillText('RELICS:', 10, y); y += 12;
    for (const r of p.relics) { ctx.fillStyle = '#ddd'; ctx.fillText(r.name, 14, y); y += 13; }
    y += 4;
  }
  if (p.rules.length) {
    ctx.fillStyle = '#6bffb8'; ctx.fillText('RULES:', 10, y); y += 12;
    for (const r of p.rules) { ctx.fillStyle = '#ddd'; ctx.fillText(r.name, 14, y); y += 13; }
  }

  // Slow motion
  if (this.slowMotion > 0) {
    ctx.textAlign = 'center'; ctx.fillStyle = '#44ddff'; ctx.font = 'bold 14px monospace';
    ctx.fillText('⏳ SLOW MOTION', W / 2, 22);
  }

  // Overclock indicator
  for (const rule of p.rules) {
    if (rule.effect === 'overclock' && p.hp / p.maxHp < rule.params.threshold) {
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff6644'; ctx.font = 'bold 12px monospace';
      ctx.fillText('⚡ PANIC MODE ⚡', W / 2, H - 30);
    }
  }

  // Debug log
  ctx.textAlign = 'right'; ctx.font = '9px monospace';
  for (let i = 0; i < debugLog.length; i++) {
    ctx.fillStyle = i === 0 ? '#ffcc0066' : '#44444466';
    ctx.fillText(debugLog[i], W - 10, H - 8 - i * 12);
  }
};

const game = new Game();
