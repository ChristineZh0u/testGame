// entities.js — player, enemies, items, boss, particles, chests, notes
let player, enemies, mushrooms, pickups, projectiles, particles2, boss;
let chests, notes, trails;
let inventory, gameState, msgQueue, explored;
let dashCooldown=0, invincible=0, totalMushrooms=0, mushroomsNeeded=0;
let stats;

function floorPos(r) {
  for (let tries=0;tries<50;tries++) {
    const tx=r.x+1+Math.floor(Math.random()*(r.w-2));
    const ty=r.y+1+Math.floor(Math.random()*(r.h-2));
    if (!solid(tx,ty) && map[ty][tx]!==5) return {x:tx*TILE+TILE/2, y:ty*TILE+TILE/2};
  }
  return {x:r.cx*TILE+TILE/2, y:r.cy*TILE+TILE/2};
}

const NOTES = [
  "The forest remembers those who take without giving...",
  "I heard the King's crown is made of pure mycelium.",
  "The spores whisper at night. They say he's watching.",
  "Day 47: The mushrooms are growing larger. I'm scared.",
  "If you dash through danger, danger cannot touch you.",
  "Secret rooms hide behind cracked walls. Try dashing into them.",
  "The golden ones... they sing if you listen closely.",
  "Three phases. He has three phases. Nobody survives the third.",
];

const CHEST_LOOT = [
  {type:'speedUp', emoji:'👟', msg:'👟 Speed Boost! +20% movement speed', apply:()=>{ player.speed*=1.2; }},
  {type:'hpUp', emoji:'💖', msg:'💖 Max HP Up! +2 max health', apply:()=>{ player.maxHp+=2; player.hp+=2; }},
  {type:'dashUp', emoji:'💨', msg:'💨 Dash Upgrade! Faster cooldown', apply:()=>{ player.dashCD=Math.max(.3,player.dashCD-.15); }},
  {type:'heal', emoji:'❤️‍🩹', msg:'❤️‍🩹 Full Heal!', apply:()=>{ player.hp=player.maxHp; }},
  {type:'sight', emoji:'👁️', msg:'👁️ Far Sight! Increased vision range', apply:()=>{ player.sightRange+=2; }},
];

function initEntities() {
  const spawn = rooms[0];
  const sp = floorPos(spawn);
  player = {
    x:sp.x, y:sp.y, w:20, h:20, speed:160, hp:5, maxHp:5,
    dir:0, dashTimer:0, dashCD:.8, animT:0, facing:1, sightRange:5,
    stepT:0, moving:false
  };
  enemies=[]; mushrooms=[]; pickups=[]; projectiles=[]; particles2=[];
  chests=[]; notes=[]; trails=[];
  boss=null;
  inventory={common:0,rare:0,legendary:0,keys:0};
  dashCooldown=0; invincible=0;
  explored=new Set();
  msgQueue=[];
  stats={time:0,kills:0,damageTaken:0,chestsOpened:0,secretsFound:0,notesRead:0};
  gameTime=0;

  // Mushrooms
  totalMushrooms=0;
  for (let i=1;i<rooms.length-1;i++) {
    const r=rooms[i];
    const count=2+Math.floor(Math.random()*3);
    for (let j=0;j<count;j++) {
      const type=Math.random()<.08?'legendary':Math.random()<.25?'rare':'common';
      const pos=floorPos(r);
      mushrooms.push({x:pos.x,y:pos.y,type,collected:false,bobT:Math.random()*Math.PI*2});
      totalMushrooms++;
    }
  }
  // Extra legendaries in secret rooms
  for (const sr of secretRooms) {
    const pos=floorPos(sr);
    mushrooms.push({x:pos.x,y:pos.y,type:'legendary',collected:false,bobT:Math.random()*Math.PI*2});
    totalMushrooms++;
  }
  mushroomsNeeded=Math.ceil(totalMushrooms*.6);

  // Enemies
  for (let i=2;i<rooms.length-1;i++) {
    const r=rooms[i];
    if (Math.random()<.35) continue;
    const roll=Math.random();
    const type=roll<.15?'ghost':roll<.35?'charger':'patrol';
    const pos=floorPos(r);
    enemies.push({
      x:pos.x,y:pos.y,w:22,h:22,type,
      speed:type==='charger'?120:type==='ghost'?45:55,
      hp:type==='charger'?2:type==='ghost'?1:2,
      maxHp:type==='charger'?2:type==='ghost'?1:2,
      dir:Math.random()*Math.PI*2,animT:Math.random()*10,
      homeX:pos.x,homeY:pos.y,patrolR:Math.min(r.w,r.h)*TILE/2,
      retreatT:0,phaseT:0
    });
  }

  // Chests — in some rooms
  for (let i=3;i<rooms.length-2;i++) {
    if (Math.random()<.65) continue;
    const pos=floorPos(rooms[i]);
    chests.push({x:pos.x,y:pos.y,opened:false,loot:CHEST_LOOT[Math.floor(Math.random()*CHEST_LOOT.length)]});
  }
  // Guaranteed chest in each secret room
  for (const sr of secretRooms) {
    const pos=floorPos(sr);
    chests.push({x:pos.x,y:pos.y,opened:false,loot:CHEST_LOOT[Math.floor(Math.random()*CHEST_LOOT.length)]});
  }

  // Notes — scattered lore
  for (let i=2;i<rooms.length-2;i++) {
    if (Math.random()<.8) continue;
    const pos=floorPos(rooms[i]);
    notes.push({x:pos.x,y:pos.y,read:false,text:NOTES[Math.floor(Math.random()*NOTES.length)]});
  }

  // Key
  const keyRoom=rooms[Math.floor(rooms.length/2)];
  const keyPos=floorPos(keyRoom);
  pickups.push({x:keyPos.x,y:keyPos.y,type:'key',collected:false,bobT:0});

  // Boss
  boss={
    x:bossRoom.cx*TILE,y:bossRoom.cy*TILE,
    w:40,h:40,hp:20,maxHp:20,phase:1,
    attackT:0,animT:0,active:false,dead:false,
    speed:50,teleportT:0,summonT:0
  };

  gameState='play';
  showMsg('WASD move · SPACE dash · E interact · Find mushrooms, the key, and defeat the boss!',5);
}

function showMsg(text,dur=3){msgQueue.push({text,t:dur});}
function collected(){return inventory.common+inventory.rare+inventory.legendary;}

function addPart(x,y,color,n=6){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,sp=40+Math.random()*100;
    particles2.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.3+Math.random()*.3,color,r:2+Math.random()*2});
  }
}

function addTrail(x,y,color){
  trails.push({x,y,color,life:.3});
}

function updatePlayer(dt){
  const{dx,dy,dash,interact}=inp();
  player.animT+=dt;
  player.moving=!!(dx||dy);

  // Footstep sounds
  if(player.moving){
    player.stepT-=dt;
    if(player.stepT<=0){sndStep();player.stepT=.25;}
  }

  // Dash
  if(dashCooldown>0)dashCooldown-=dt;
  if(dash&&dashCooldown<=0&&(dx||dy)){
    player.dashTimer=.15;
    dashCooldown=player.dashCD;
    invincible=.2;
    sndDash();
    addPart(player.x,player.y,'#88ccff',4);
  }

  const spd=player.dashTimer>0?player.speed*3:player.speed;
  if(player.dashTimer>0){
    player.dashTimer-=dt;
    addTrail(player.x,player.y,'rgba(100,180,255,.5)');
  }

  let nx=player.x+dx*spd*dt;
  let ny=player.y+dy*spd*dt;
  if(dx)player.facing=dx>0?1:-1;

  // Wall collision
  if(!solid(Math.floor((nx-10)/TILE),Math.floor((player.y-10)/TILE))&&
     !solid(Math.floor((nx+10)/TILE),Math.floor((player.y+10)/TILE)))
    player.x=nx;
  if(!solid(Math.floor((player.x-10)/TILE),Math.floor((ny-10)/TILE))&&
     !solid(Math.floor((player.x+10)/TILE),Math.floor((ny+10)/TILE)))
    player.y=ny;

  // Dash breaks breakable walls
  if(player.dashTimer>0){
    const ptx=Math.floor(player.x/TILE),pty=Math.floor(player.y/TILE);
    for(const bw of breakableWalls){
      if(!bw.broken&&Math.abs(bw.tx-ptx)<=1&&Math.abs(bw.ty-pty)<=1){
        bw.broken=true;
        map[bw.ty][bw.tx]=1;
        addPart(bw.tx*TILE+TILE/2,bw.ty*TILE+TILE/2,'#aa8866',15);
        sndBreak();
        showMsg('💥 Secret room discovered!',3);
        stats.secretsFound++;
      }
    }
  }

  // Explore fog
  const tx=Math.floor(player.x/TILE),ty=Math.floor(player.y/TILE);
  const sr=player.sightRange;
  for(let ey=ty-sr;ey<=ty+sr;ey++)for(let ex=tx-sr;ex<=tx+sr;ex++){
    if(Math.hypot(ex-tx,ey-ty)<=sr)explored.add(ey*MAP_W+ex);
  }

  if(invincible>0)invincible-=dt;

  // Spike traps
  const curTile=tileAt(player.x,player.y);
  if(curTile===5){
    const trap=traps.find(t=>t.tx===Math.floor(player.x/TILE)&&t.ty===Math.floor(player.y/TILE));
    if(trap){
      const phase=(gameTime%trap.cycle)/trap.cycle;
      if(phase<.4&&invincible<=0){ // active phase
        hurtPlayer(1);
        sndTrap();
      }
    }
  }

  // Collect mushrooms
  for(const m of mushrooms){
    if(!m.collected&&Math.hypot(player.x-m.x,player.y-m.y)<25){
      m.collected=true;
      inventory[m.type]++;
      const pts=m.type==='legendary'?'🌈 Legendary!':m.type==='rare'?'🟣 Rare!':'🟤 +1';
      showMsg(pts,1.5);
      sndPick();
      addPart(m.x,m.y,m.type==='legendary'?'#ff44ff':m.type==='rare'?'#bb44ff':'#ddaa44',m.type==='legendary'?15:8);
      if(collected()>=mushroomsNeeded&&inventory.keys>0&&!boss.active)
        showMsg('The boss chamber rumbles... find the 👑 room!',4);
    }
  }

  // Collect pickups
  for(const p of pickups){
    if(!p.collected&&Math.hypot(player.x-p.x,player.y-p.y)<25){
      p.collected=true;
      if(p.type==='key'){inventory.keys++;showMsg('🗝️ Got the Boss Key!',3);sndPower();}
      if(p.type==='heart'){player.hp=Math.min(player.maxHp,player.hp+2);showMsg('❤️ +2 HP',2);sndPower();}
      addPart(p.x,p.y,'#ffdd44',10);
    }
  }

  // Interact: chests and notes
  if(interact){
    for(const c of chests){
      if(!c.opened&&Math.hypot(player.x-c.x,player.y-c.y)<35){
        c.opened=true;
        c.loot.apply();
        showMsg(c.loot.msg,3);
        sndChest();
        addPart(c.x,c.y,'#ffdd44',12);
        stats.chestsOpened++;
      }
    }
    for(const n of notes){
      if(!n.read&&Math.hypot(player.x-n.x,player.y-n.y)<35){
        n.read=true;
        showMsg('📜 "'+n.text+'"',5);
        sndNote();
        stats.notesRead++;
      }
    }
  }

  // Enter boss room
  if(!boss.active&&!boss.dead&&inventory.keys>0&&collected()>=mushroomsNeeded){
    const bx=bossRoom.x*TILE,by=bossRoom.y*TILE,bw=bossRoom.w*TILE,bh=bossRoom.h*TILE;
    if(player.x>bx&&player.x<bx+bw&&player.y>by&&player.y<by+bh){
      boss.active=true;
      gameState='bossfight';
      showMsg('🍄👑 MUSHROOM KING awakens!',3);
      sndBoss();
    }
  }
}

function hurtPlayer(dmg){
  if(invincible>0)return;
  player.hp-=dmg;
  invincible=.6;
  sndHurt();
  addPart(player.x,player.y,'#ff4444',8);
  stats.damageTaken+=dmg;
  if(player.hp<=0){gameState='dead';showMsg('You perished in the forest...',99);}
}

function updateEnemies(dt){
  for(const e of enemies){
    if(e.hp<=0)continue;
    e.animT+=dt;
    const dp=dist(e,player);

    if(e.type==='patrol'){
      e.dir+=(Math.random()-.5)*2*dt;
      e.x+=Math.cos(e.dir)*e.speed*dt;
      e.y+=Math.sin(e.dir)*e.speed*dt;
      if(Math.hypot(e.x-e.homeX,e.y-e.homeY)>e.patrolR)
        e.dir=Math.atan2(e.homeY-e.y,e.homeX-e.x);
      const ntx=Math.floor(e.x/TILE),nty=Math.floor(e.y/TILE);
      if(solid(ntx,nty)){e.dir+=Math.PI;e.x=e.homeX;e.y=e.homeY;}
    }

    if(e.type==='charger'){
      if(e.retreatT>0){
        e.retreatT-=dt;
        const a=Math.atan2(e.y-player.y,e.x-player.x);
        e.x+=Math.cos(a)*100*dt;e.y+=Math.sin(a)*100*dt;
      }else if(dp<160){
        const a=Math.atan2(player.y-e.y,player.x-e.x);
        e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;
      }else{
        e.dir+=(Math.random()-.5)*dt;
        e.x+=Math.cos(e.dir)*35*dt;e.y+=Math.sin(e.dir)*35*dt;
      }
      const ntx=Math.floor(e.x/TILE),nty=Math.floor(e.y/TILE);
      if(solid(ntx,nty)){e.dir+=Math.PI;e.x+=Math.cos(e.dir)*5;e.y+=Math.sin(e.dir)*5;}
    }

    if(e.type==='ghost'){
      // Ghosts phase through walls, drift toward player when close
      e.phaseT+=dt;
      if(dp<200){
        const a=Math.atan2(player.y-e.y,player.x-e.x);
        e.x+=Math.cos(a)*e.speed*dt;
        e.y+=Math.sin(a)*e.speed*dt;
      }else{
        e.x+=Math.sin(e.phaseT*.8)*20*dt;
        e.y+=Math.cos(e.phaseT*.6)*20*dt;
      }
    }

    // Hit player
    if(dp<22){
      hurtPlayer(1);
      if(e.type==='charger')e.retreatT=1.2;
    }

    // Dash kills
    if(player.dashTimer>0&&dp<30){
      e.hp--;
      addPart(e.x,e.y,'#88ff44',8);
      sfx(300,.1,'square',.1);
      if(e.hp<=0){
        addPart(e.x,e.y,'#ffaa00',12);
        stats.kills++;
        if(Math.random()<.3&&!solid(Math.floor(e.x/TILE),Math.floor(e.y/TILE)))
          pickups.push({x:e.x,y:e.y,type:'heart',collected:false,bobT:0});
      }
    }
  }
}

function updateBoss(dt){
  if(!boss.active||boss.dead)return;
  boss.animT+=dt;
  boss.attackT-=dt;
  boss.teleportT-=dt;
  boss.summonT-=dt;
  const dp=dist(boss,player);

  // Phase transitions
  if(boss.hp<=boss.maxHp*.3)boss.phase=3;
  else if(boss.hp<=boss.maxHp*.6)boss.phase=2;

  // Movement
  const a=Math.atan2(player.y-boss.y,player.x-boss.x);
  const spd=boss.phase===3?80:boss.speed;
  boss.x+=Math.cos(a)*spd*dt;
  boss.y+=Math.sin(a)*spd*dt;

  // Phase 3: teleport
  if(boss.phase>=3&&boss.teleportT<=0){
    boss.teleportT=4;
    addPart(boss.x,boss.y,'#ff44ff',15);
    sndTeleport();
    // Teleport to random spot in boss room
    const nx=bossRoom.x*TILE+TILE+Math.random()*(bossRoom.w-2)*TILE;
    const ny=bossRoom.y*TILE+TILE+Math.random()*(bossRoom.h-2)*TILE;
    boss.x=nx;boss.y=ny;
    addPart(boss.x,boss.y,'#ff44ff',15);
  }

  // Phase 3: summon minions
  if(boss.phase>=3&&boss.summonT<=0){
    boss.summonT=6;
    showMsg('👑 "Rise, my children!"',2);
    for(let i=0;i<3;i++){
      const sa=Math.random()*Math.PI*2;
      enemies.push({
        x:boss.x+Math.cos(sa)*60,y:boss.y+Math.sin(sa)*60,w:18,h:18,
        type:'patrol',speed:70,hp:1,maxHp:1,
        dir:sa,animT:0,homeX:boss.x,homeY:boss.y,patrolR:120,retreatT:0,phaseT:0
      });
    }
    addPart(boss.x,boss.y,'#aa44ff',20);
    sfx(150,.3,'sawtooth',.12);
  }

  // Shoot spores
  if(boss.attackT<=0){
    boss.attackT=boss.phase===3?.4:boss.phase===2?.7:1.2;
    const count=boss.phase===3?10:boss.phase===2?8:5;
    for(let i=0;i<count;i++){
      const pa=a+(i-count/2)*.25+(Math.random()-.5)*.15;
      const spd=boss.phase===3?220:180;
      projectiles.push({
        x:boss.x,y:boss.y,vx:Math.cos(pa)*spd,vy:Math.sin(pa)*spd,
        life:2.5,r:boss.phase===3?6:5,
        color:boss.phase===3?'#ff22ff':boss.phase===2?'#ff4488':'#88ff44'
      });
    }
    sfx(200,.15,'sawtooth',.08);
  }

  if(dp<35)hurtPlayer(1);

  // Dash damages boss
  if(player.dashTimer>0&&dp<40){
    boss.hp--;
    addPart(boss.x,boss.y,'#ffdd00',10);
    sfx(250,.15,'square',.12);
    shake(.15);
    if(boss.hp<=0){
      boss.dead=true;boss.active=false;
      gameState='win';
      sndWin();shake(.5);
      showMsg('🏆 The Mushroom King is defeated!',99);
      addPart(boss.x,boss.y,'#ffdd00',40);
    }
  }
}

function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    if(p.life<=0||solid(Math.floor(p.x/TILE),Math.floor(p.y/TILE))){
      projectiles.splice(i,1);continue;
    }
    if(Math.hypot(p.x-player.x,p.y-player.y)<15){
      hurtPlayer(1);
      projectiles.splice(i,1);
    }
  }
}

function updateTraps(dt){
  // Trap animation state is driven by gameTime in render
}

function updateParticles(dt){
  for(let i=particles2.length-1;i>=0;i--){
    const p=particles2[i];
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;p.life-=dt;
    if(p.life<=0)particles2.splice(i,1);
  }
  for(let i=trails.length-1;i>=0;i--){
    trails[i].life-=dt;
    if(trails[i].life<=0)trails.splice(i,1);
  }
}

function updateMsgs(dt){
  if(msgQueue.length){
    msgQueue[0].t-=dt;
    if(msgQueue[0].t<=0)msgQueue.shift();
  }
}
