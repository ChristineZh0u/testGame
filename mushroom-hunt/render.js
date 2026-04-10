// render.js — all drawing
function drawWorld(now) {
  X.fillStyle='#111';
  X.fillRect(0,0,W,H);
  X.save();
  X.translate(-cam.x-cam.shakeX, -cam.y-cam.shakeY);

  const sx=Math.max(0,Math.floor(cam.x/TILE)-1);
  const sy=Math.max(0,Math.floor(cam.y/TILE)-1);
  const ex=Math.min(MAP_W-1,Math.floor((cam.x+W)/TILE)+1);
  const ey=Math.min(MAP_H-1,Math.floor((cam.y+H)/TILE)+1);

  // Tiles
  for(let ty=sy;ty<=ey;ty++)for(let tx=sx;tx<=ex;tx++){
    if(!explored.has(ty*MAP_W+tx))continue;
    const t=map[ty][tx],px=tx*TILE,py=ty*TILE;
    if(t===0)continue;
    if(t===1){
      X.fillStyle=((tx+ty)%2)?'#3a5a28':'#345224';
      X.fillRect(px,py,TILE,TILE);
      if((tx*7+ty*13)%5===0){
        X.fillStyle='#4a6a30';
        X.fillRect(px+10,py+8,4,12);
        X.fillRect(px+25,py+20,4,10);
      }
      if((tx*11+ty*7)%11===0){
        X.fillStyle='#2a4a1a';
        X.beginPath();X.arc(px+20,py+25,6,0,Math.PI*2);X.fill();
      }
    }
    if(t===2){
      X.fillStyle='#1a3a6a';X.fillRect(px,py,TILE,TILE);
      X.fillStyle=`rgba(100,180,255,${.15+Math.sin(now/500+tx+ty)*.1})`;
      X.fillRect(px,py,TILE,TILE);
    }
    if(t===3){
      X.fillStyle='#5a4a30';X.fillRect(px,py,TILE,TILE);
      X.fillStyle='#6a5a3a';X.fillRect(px+5,py+2,TILE-10,TILE-4);
    }
    if(t===4){
      X.fillStyle=((tx+ty)%2)?'#4a2a2a':'#3a2020';
      X.fillRect(px,py,TILE,TILE);
      // Skull pattern on boss floor
      if((tx+ty)%4===0){
        X.fillStyle='rgba(255,100,50,.08)';
        X.beginPath();X.arc(px+TILE/2,py+TILE/2,12,0,Math.PI*2);X.fill();
      }
    }
    if(t===5){
      // Spike trap
      const trap=traps.find(tr=>tr.tx===tx&&tr.ty===ty);
      const phase=trap?((gameTime%trap.cycle)/trap.cycle):0;
      const active=phase<.4;
      X.fillStyle=active?'#5a2020':'#3a3a28';
      X.fillRect(px,py,TILE,TILE);
      if(active){
        X.fillStyle='#cc4444';
        for(let si=0;si<4;si++){
          const sx2=px+8+si*8,sy2=py+10;
          X.beginPath();X.moveTo(sx2,sy2+16);X.lineTo(sx2+4,sy2);X.lineTo(sx2+8,sy2+16);X.fill();
        }
      }else{
        X.fillStyle='#666';
        for(let si=0;si<4;si++) X.fillRect(px+8+si*8,py+20,8,3);
      }
    }
    if(t===6){
      // Breakable wall — cracked appearance
      X.fillStyle='#4a4035';X.fillRect(px,py,TILE,TILE);
      X.strokeStyle='#2a2015';X.lineWidth=2;
      X.beginPath();
      X.moveTo(px+10,py);X.lineTo(px+20,py+20);X.lineTo(px+15,py+TILE);
      X.moveTo(px+25,py+5);X.lineTo(px+30,py+25);
      X.stroke();
    }
    // Wall edges
    if(t>=1&&t!==6){
      X.fillStyle='rgba(0,0,0,.25)';
      if(ty>0&&map[ty-1][tx]===0)X.fillRect(px,py,TILE,3);
      if(ty<MAP_H-1&&map[ty+1][tx]===0)X.fillRect(px,py+TILE-3,TILE,3);
      if(tx>0&&map[ty][tx-1]===0)X.fillRect(px,py,3,TILE);
      if(tx<MAP_W-1&&map[ty][tx+1]===0)X.fillRect(px+TILE-3,py,3,TILE);
    }
  }

  // Fog of war
  X.fillStyle='rgba(0,0,0,.85)';
  for(let ty=sy;ty<=ey;ty++)for(let tx=sx;tx<=ex;tx++){
    if(!explored.has(ty*MAP_W+tx))X.fillRect(tx*TILE,ty*TILE,TILE,TILE);
  }

  // Torches — light glow
  for(const t of torches){
    const ttx=Math.floor(t.x/TILE),tty=Math.floor(t.y/TILE);
    if(!explored.has(tty*MAP_W+ttx))continue;
    const flicker=.8+Math.sin(now/200+t.flicker)*.2;
    const rg=X.createRadialGradient(t.x,t.y,2,t.x,t.y,80*flicker);
    rg.addColorStop(0,'rgba(255,180,60,.2)');
    rg.addColorStop(1,'rgba(255,180,60,0)');
    X.fillStyle=rg;
    X.beginPath();X.arc(t.x,t.y,80*flicker,0,Math.PI*2);X.fill();
    // Torch emoji
    X.font='14px serif';X.textAlign='center';X.textBaseline='middle';
    X.fillText('🔥',t.x,t.y);
  }

  // Dash trails
  for(const t of trails){
    X.globalAlpha=t.life;
    X.fillStyle=t.color;
    X.beginPath();X.arc(t.x,t.y,6,0,Math.PI*2);X.fill();
  }
  X.globalAlpha=1;

  // Notes
  for(const n of notes){
    if(n.read)continue;
    const ntx=Math.floor(n.x/TILE),nty=Math.floor(n.y/TILE);
    if(!explored.has(nty*MAP_W+ntx))continue;
    X.save();X.translate(n.x,n.y+Math.sin(now/400)*2);
    X.font='18px serif';X.textAlign='center';X.textBaseline='middle';
    X.fillText('📜',0,0);
    // Interact hint
    if(Math.hypot(player.x-n.x,player.y-n.y)<50){
      X.font='10px sans-serif';X.fillStyle='#fff';X.globalAlpha=.7;
      X.fillText('[E] Read',0,16);
    }
    X.restore();
  }

  // Chests
  for(const c of chests){
    const ctx2=Math.floor(c.x/TILE),cty=Math.floor(c.y/TILE);
    if(!explored.has(cty*MAP_W+ctx2))continue;
    X.save();X.translate(c.x,c.y+Math.sin(now/500)*2);
    if(!c.opened){
      X.shadowColor='#ffaa00';X.shadowBlur=8+Math.sin(now/200)*3;
    }
    X.font='20px serif';X.textAlign='center';X.textBaseline='middle';
    X.fillText(c.opened?'📭':'📦',0,0);
    if(!c.opened&&Math.hypot(player.x-c.x,player.y-c.y)<50){
      X.shadowBlur=0;X.font='10px sans-serif';X.fillStyle='#fff';X.globalAlpha=.7;
      X.fillText('[E] Open',0,18);
    }
    X.restore();
  }

  // Mushrooms
  for(const m of mushrooms){
    if(m.collected)continue;
    const mtx=Math.floor(m.x/TILE),mty=Math.floor(m.y/TILE);
    if(!explored.has(mty*MAP_W+mtx))continue;
    m.bobT+=.03;
    X.save();X.translate(m.x,m.y+Math.sin(m.bobT)*3);
    if(m.type==='legendary'){X.shadowColor='#ff44ff';X.shadowBlur=15+Math.sin(now/150)*5;}
    else if(m.type==='rare'){X.shadowColor='#bb44ff';X.shadowBlur=10;}
    X.font='22px serif';X.textAlign='center';X.textBaseline='middle';
    X.fillText(m.type==='legendary'?'🌈':m.type==='rare'?'🟣':'🟤',0,0);
    X.restore();
  }

  // Pickups
  for(const p of pickups){
    if(p.collected)continue;
    const ptx=Math.floor(p.x/TILE),pty=Math.floor(p.y/TILE);
    if(!explored.has(pty*MAP_W+ptx))continue;
    p.bobT+=.04;
    X.save();X.translate(p.x,p.y+Math.sin(p.bobT)*4);
    X.shadowColor='#ffdd44';X.shadowBlur=12;
    X.font='22px serif';X.textAlign='center';X.textBaseline='middle';
    X.fillText(p.type==='key'?'🗝️':'❤️',0,0);
    X.restore();
  }

  // Enemies
  for(const e of enemies){
    if(e.hp<=0)continue;
    const etx=Math.floor(e.x/TILE),ety=Math.floor(e.y/TILE);
    if(!explored.has(ety*MAP_W+etx))continue;
    X.save();X.translate(e.x,e.y);
    if(e.type==='ghost'){
      X.globalAlpha=.5+Math.sin(e.phaseT*2)*.2;
      X.shadowColor='#8844ff';X.shadowBlur=10;
    }
    const sz=e.type==='charger'?26:e.type==='ghost'?24:22;
    X.font=`${sz}px serif`;X.textAlign='center';X.textBaseline='middle';
    X.fillText(e.type==='charger'?'🦇':e.type==='ghost'?'👻':'🐍',0,0);
    // HP bar
    X.globalAlpha=1;X.shadowBlur=0;
    X.fillStyle='#333';X.fillRect(-12,-18,24,4);
    X.fillStyle=e.type==='charger'?'#ff4444':e.type==='ghost'?'#8844ff':'#44ff44';
    X.fillRect(-12,-18,24*(e.hp/e.maxHp),4);
    X.restore();
  }

  // Boss
  if(boss&&(boss.active||boss.dead)){
    const btx=Math.floor(boss.x/TILE),bty=Math.floor(boss.y/TILE);
    if(explored.has(bty*MAP_W+btx)){
      X.save();X.translate(boss.x,boss.y);
      if(!boss.dead){
        const colors=['#ffaa00','#ff2244','#ff22ff'];
        X.shadowColor=colors[boss.phase-1];
        X.shadowBlur=20+Math.sin(now/100)*8;
        // Boss pulses bigger in phase 3
        const scale=boss.phase===3?1+Math.sin(now/200)*.1:1;
        X.font=`${40*scale}px serif`;X.textAlign='center';X.textBaseline='middle';
        X.fillText('👑',0,0);
        X.shadowBlur=0;
        // HP bar
        X.fillStyle='#333';X.fillRect(-30,-35,60,6);
        X.fillStyle=colors[boss.phase-1];
        X.fillRect(-30,-35,60*(boss.hp/boss.maxHp),6);
        // Phase indicator
        X.fillStyle='#fff';X.font='9px sans-serif';
        X.fillText(`Phase ${boss.phase}`,0,-42);
      }else{
        X.globalAlpha=.4;
        X.font='40px serif';X.textAlign='center';X.textBaseline='middle';
        X.fillText('👑',0,0);
      }
      X.restore();
    }
  }

  // Projectiles
  for(const p of projectiles){
    X.fillStyle=p.color;X.shadowColor=p.color;X.shadowBlur=8;
    X.beginPath();X.arc(p.x,p.y,p.r,0,Math.PI*2);X.fill();
    X.shadowBlur=0;
  }

  // Player
  X.save();X.translate(player.x,player.y);
  if(invincible>0&&Math.sin(invincible*30)>0)X.globalAlpha=.4;
  if(player.dashTimer>0){X.shadowColor='#88ccff';X.shadowBlur=15;}
  X.font='24px serif';X.textAlign='center';X.textBaseline='middle';
  X.scale(player.facing,1);
  X.fillText('🧑‍🌾',0,0);
  X.restore();

  // Particles
  for(const p of particles2){
    X.globalAlpha=Math.min(1,p.life*3);
    X.fillStyle=p.color;
    X.beginPath();X.arc(p.x,p.y,p.r,0,Math.PI*2);X.fill();
  }
  X.globalAlpha=1;

  X.restore(); // camera
}

function drawHUD(){
  // HP bar
  const hpW=150,hpH=14,hpX=15,hpY=H-30;
  X.fillStyle='rgba(0,0,0,.5)';X.fillRect(hpX-2,hpY-2,hpW+4,hpH+4);
  X.fillStyle='#882222';X.fillRect(hpX,hpY,hpW,hpH);
  X.fillStyle='#ee3333';X.fillRect(hpX,hpY,hpW*(player.hp/player.maxHp),hpH);
  X.fillStyle='#fff';X.font='11px sans-serif';X.textBaseline='middle';
  X.fillText(`HP ${player.hp}/${player.maxHp}`,hpX+5,hpY+hpH/2);

  // Dash cooldown
  X.fillStyle='rgba(0,0,0,.5)';X.fillRect(hpX-2,hpY-20,82,14);
  X.fillStyle=dashCooldown<=0?'#4488ff':'#555';
  X.fillRect(hpX,hpY-18,80*(1-Math.max(0,dashCooldown)/player.dashCD),10);
  X.fillStyle='#fff';X.font='9px sans-serif';
  X.fillText(dashCooldown<=0?'DASH [SPACE]':'DASH',hpX+3,hpY-13);

  // Inventory
  X.fillStyle='rgba(0,0,0,.5)';X.fillRect(W-220,H-35,210,28);
  X.fillStyle='#fff';X.font='14px sans-serif';X.textAlign='right';X.textBaseline='middle';
  X.fillText(`🟤${inventory.common} 🟣${inventory.rare} 🌈${inventory.legendary} 🗝️${inventory.keys}`,W-15,H-20);
  X.textAlign='left';

  // Progress bar
  const prog=collected();
  X.fillStyle='rgba(0,0,0,.5)';X.fillRect(W/2-100,H-30,200,20);
  X.fillStyle='#44aa44';X.fillRect(W/2-100,H-30,200*Math.min(1,prog/mushroomsNeeded),20);
  X.fillStyle='#fff';X.font='12px sans-serif';X.textAlign='center';
  X.fillText(`${prog}/${mushroomsNeeded} mushrooms`,W/2,H-18);
  X.textAlign='left';

  // Timer
  const mins=Math.floor(gameTime/60),secs=Math.floor(gameTime%60);
  X.fillStyle='rgba(0,0,0,.5)';X.fillRect(hpX,hpY-38,70,14);
  X.fillStyle='#ccc';X.font='10px sans-serif';
  X.fillText(`⏱ ${mins}:${secs.toString().padStart(2,'0')}`,hpX+3,hpY-31);

  // Messages
  if(msgQueue.length){
    const m=msgQueue[0];
    const alpha=Math.min(1,m.t);
    const mw=Math.min(500,X.measureText(m.text).width+40);
    X.fillStyle=`rgba(0,0,0,${alpha*.7})`;
    X.fillRect(W/2-mw/2,55,mw,36);
    X.strokeStyle=`rgba(200,160,80,${alpha*.5})`;X.lineWidth=1;
    X.strokeRect(W/2-mw/2,55,mw,36);
    X.fillStyle=`rgba(255,255,255,${alpha})`;
    X.font='16px sans-serif';X.textAlign='center';X.textBaseline='middle';
    X.fillText(m.text,W/2,73);
    X.textAlign='left';
  }

  // Minimap
  const mmS=3,mmX=W-MAP_W*mmS-10,mmY=10;
  X.fillStyle='rgba(0,0,0,.6)';X.fillRect(mmX-2,mmY-2,MAP_W*mmS+4,MAP_H*mmS+4);
  for(let ty=0;ty<MAP_H;ty++)for(let tx=0;tx<MAP_W;tx++){
    if(!explored.has(ty*MAP_W+tx))continue;
    const t=map[ty][tx];
    if(t===0)continue;
    X.fillStyle=t===4?'#663333':t===2?'#224466':t===5?'#553322':'#2a4a1a';
    X.fillRect(mmX+tx*mmS,mmY+ty*mmS,mmS,mmS);
  }
  // Uncollected mushroom dots
  for(const m of mushrooms){
    if(m.collected)continue;
    const mtx=Math.floor(m.x/TILE),mty=Math.floor(m.y/TILE);
    if(!explored.has(mty*MAP_W+mtx))continue;
    X.fillStyle=m.type==='legendary'?'#ff44ff':m.type==='rare'?'#bb44ff':'#aa8844';
    X.fillRect(mmX+mtx*mmS,mmY+mty*mmS,2,2);
  }
  X.fillStyle='#ffff00';
  X.fillRect(mmX+Math.floor(player.x/TILE)*mmS,mmY+Math.floor(player.y/TILE)*mmS,mmS+1,mmS+1);
  if(boss&&!boss.dead){
    X.fillStyle='#ff4444';
    X.fillRect(mmX+Math.floor(boss.x/TILE)*mmS,mmY+Math.floor(boss.y/TILE)*mmS,mmS+1,mmS+1);
  }

  // Game over / win
  if(gameState==='dead'||gameState==='win'){
    X.fillStyle='rgba(0,0,0,.7)';X.fillRect(0,0,W,H);
    X.textAlign='center';

    if(gameState==='win'){
      X.fillStyle='#ffdd44';X.font='52px sans-serif';
      X.fillText('🏆 Victory!',W/2,H/2-80);
      X.fillStyle='#fff';X.font='20px sans-serif';
      const mins2=Math.floor(stats.time/60),secs2=Math.floor(stats.time%60);
      X.fillText(`Time: ${mins2}:${secs2.toString().padStart(2,'0')}`,W/2,H/2-35);
      X.fillText(`Mushrooms: ${collected()}/${totalMushrooms} · Kills: ${stats.kills}`,W/2,H/2-5);
      X.fillText(`Chests: ${stats.chestsOpened} · Secrets: ${stats.secretsFound} · Notes: ${stats.notesRead}`,W/2,H/2+25);
      X.fillText(`Damage Taken: ${stats.damageTaken}`,W/2,H/2+55);
      X.fillStyle='#aaa';X.font='16px sans-serif';
      const rating=stats.damageTaken<=3?'🌟 Untouchable!':stats.damageTaken<=8?'💪 Tough Forager':stats.time<180?'⚡ Speedrunner':'🍄 Forest Explorer';
      X.fillText(rating,W/2,H/2+85);
    }else{
      X.fillStyle='#ff4444';X.font='52px sans-serif';
      X.fillText('💀 Game Over',W/2,H/2-40);
      X.fillStyle='#fff';X.font='20px sans-serif';
      X.fillText(`Mushrooms: ${collected()} · Kills: ${stats.kills}`,W/2,H/2+5);
    }
    X.fillStyle='#ccc';X.font='18px sans-serif';
    X.fillText('Press R to restart',W/2,H/2+120);
    X.textAlign='left';
  }
}
