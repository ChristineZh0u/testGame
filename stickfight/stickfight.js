var c=document.getElementById('c'),ctx=c.getContext('2d');
var CW=750,CH=420,GRAV=0.55,GROUND=360;
var sfx=window.AudioContext?new AudioContext():null;
function beep(f,d,v){if(!sfx)return;try{var o=sfx.createOscillator(),g=sfx.createGain();o.connect(g);g.connect(sfx.destination);o.frequency.value=f;g.gain.value=v||0.08;o.start();g.gain.exponentialRampToValueAtTime(0.001,sfx.currentTime+d);o.stop(sfx.currentTime+d);}catch(e){}}
var keys={},paused=false,waitingToStart=true,shopOpen=false,countdown=0,countdownT=0;
var slowmo=0,slowmoScale=1;
document.addEventListener('keydown',function(e){
  if(e.key===' '&&shopOpen){closeShop();return;}
  if((e.key==='Escape'||e.key==='p'||e.key==='P')&&!waitingToStart&&!roundOver&&!shopOpen&&countdown<=0){paused=!paused;document.getElementById('msg').textContent=paused?'PAUSED':'';}
  if(e.key===' '&&waitingToStart&&!shopOpen){waitingToStart=false;countdown=3;countdownT=60;document.getElementById('msg').textContent='';}
  keys[e.key.toLowerCase()]=true;if(sfx&&sfx.state==='suspended')sfx.resume();e.preventDefault();});
document.addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=false;});
var particles=[],shakes=0,roundOver=false;
var wins1=0,wins2=0,roundNum=1,difficulty=1,coins=0;
var platforms=[],hazards=[],weaponDrops=[];
var items=[],itemTimer=0,p1,p2;
var upgrades={dmg:0,hp:0,spd:0,nrg:0,crit:0,lifesteal:0,armor:0,dodge:0};
var ALL_UPGRADES=[
  {id:'dmg',name:'Power Up',desc:'+15% damage',cost:2,max:5,color:'#f44'},
  {id:'hp',name:'Tough Body',desc:'+20 max HP',cost:2,max:5,color:'#0f0'},
  {id:'spd',name:'Swift Feet',desc:'+10% speed',cost:3,max:3,color:'#0ff'},
  {id:'nrg',name:'Chi Flow',desc:'+30% energy regen',cost:3,max:3,color:'#ff0'},
  {id:'crit',name:'Critical Eye',desc:'+12% crit chance (2x dmg)',cost:3,max:4,color:'#f0f'},
  {id:'lifesteal',name:'Vampiric',desc:'Heal 10% of dmg dealt',cost:4,max:3,color:'#a44'},
  {id:'armor',name:'Iron Skin',desc:'-10% damage taken',cost:3,max:4,color:'#aaa'},
  {id:'dodge',name:'Phantom',desc:'+8% dodge chance',cost:3,max:3,color:'#88f'}
];
var shopChoices=[];
var WEAPONS={sword:{name:'Sword',color:'#ccc',dmgMul:1.6,rangeMul:1.5},staff:{name:'Staff',color:'#a52',dmgMul:1.2,rangeMul:1.8},nunchuck:{name:'Nunchucks',color:'#fa0',dmgMul:1.3,rangeMul:1.0}};
var ATTACKS={punch:{dur:10,start:3,end:8,dmg:7,kx:4,ky:-1,range:35,h:18,hs:8,nrg:0},kick:{dur:16,start:5,end:12,dmg:13,kx:7,ky:-3,range:45,h:20,hs:14,nrg:0},uppercut:{dur:20,start:4,end:10,dmg:18,kx:3,ky:-12,range:30,h:30,hs:18,nrg:20},special:{dur:30,start:8,end:20,dmg:25,kx:10,ky:-6,range:55,h:25,hs:22,nrg:50},slam:{dur:25,start:5,end:20,dmg:20,kx:6,ky:-2,range:50,h:30,hs:16,nrg:10}};
var stages=[{name:'Dojo',bg1:'#0a0a1e',bg2:'#151530',gnd:'#252540'},{name:'Volcano',bg1:'#1a0500',bg2:'#2a0a00',gnd:'#3a1500'},{name:'Ice Cave',bg1:'#0a1520',bg2:'#102030',gnd:'#1a3040'},{name:'Storm',bg1:'#0a0a15',bg2:'#15152a',gnd:'#20203a'}];
function getStage(){return stages[(roundNum-1)%4];}
function isBoss(){return roundNum%5===0;}
function setDiff(d){difficulty=d;document.querySelectorAll('#diff button').forEach(function(b,i){b.className=i===d?'active':'';});wins1=0;wins2=0;roundNum=1;coins=0;upgrades={dmg:0,hp:0,spd:0,nrg:0,crit:0,lifesteal:0,armor:0,dodge:0};init();}
function rollShopChoices(){
  var avail=ALL_UPGRADES.filter(function(u){return upgrades[u.id]<u.max;});
  shopChoices=[];
  while(shopChoices.length<3&&avail.length>0){
    var i=Math.floor(Math.random()*avail.length);
    shopChoices.push(avail[i]);avail.splice(i,1);}
}
function openShop(){shopOpen=true;rollShopChoices();
  document.getElementById('shop').className='open';document.getElementById('shopCoins').textContent=coins;
  var el=document.getElementById('shopItems');el.innerHTML='';
  if(shopChoices.length===0){el.innerHTML='<div style="color:#888;font-size:16px">All upgrades maxed!</div>';return;}
  shopChoices.forEach(function(s){
    var canBuy=coins>=s.cost;
    var d=document.createElement('div');d.className='item';
    d.style.borderColor=s.color;d.style.opacity=canBuy?'1':'0.4';
    d.innerHTML='<div class=nm style="color:'+s.color+'">'+s.name+'</div><div class=ds>'+s.desc+'</div><div class=ds style="color:#666">Lv '+(upgrades[s.id]+1)+'/'+s.max+'</div><div class=ct>'+(canBuy?s.cost+' coins':'Need '+s.cost)+'</div>';
    if(canBuy)d.onclick=function(){
      coins-=s.cost;upgrades[s.id]++;
      document.getElementById('coins').textContent=coins;
      // flash feedback
      d.style.transition='all 0.3s';d.style.background='#0f0';d.style.color='#000';
      d.innerHTML='<div class=nm style="color:#000;font-size:16px">BOUGHT!</div><div class=ds style="color:#000">'+s.name+' Lv'+upgrades[s.id]+'</div>';
      d.style.pointerEvents='none';
      beep(523,0.1);beep(784,0.1);
      // update other items affordability
      setTimeout(function(){
        el.querySelectorAll('.item').forEach(function(item,idx){
          if(shopChoices[idx]&&shopChoices[idx].id!==s.id){
            item.style.opacity=coins>=shopChoices[idx].cost?'1':'0.4';}});
        document.getElementById('shopCoins').textContent=coins;},350);
    };
    el.appendChild(d);});}
function closeShop(){shopOpen=false;document.getElementById('shop').className='';init();}
function makePlayer(x,color,face){var mhp=100+upgrades.hp*20;
  return{x:x,y:GROUND,vy:0,vx:0,hp:mhp,maxHp:mhp,nrg:0,maxNrg:100,color:color,face:face,state:'idle',stateT:0,atk:null,atkT:0,atkHit:false,hitstun:0,combo:0,onGround:true,jumps:0,dashT:0,dashDir:0,lastLR:0,lastLRT:0,invuln:0,blocking:false,blockStart:0,weapon:null,weaponT:0,_jh:false,_ph:false,_kh:false,_uh:false,_sh:false,_lheld:false,_rheld:false};}
function init(){var boss=isBoss();p1=makePlayer(180,'#4af',1);p2=makePlayer(570,'#f44',-1);
  if(boss){p2.maxHp=200+roundNum*10;p2.hp=p2.maxHp;p2.color='#f0f';p2.isBoss=true;}
  p2.isAI=true;p2.aiT=0;particles=[];roundOver=false;items=[];itemTimer=0;weaponDrops=[];waitingToStart=true;
  randomizePlatforms();spawnHazards();
  var label=boss?'!! BOSS ROUND '+roundNum+' !!':'Round '+roundNum+' - '+getStage().name;
  document.getElementById('msg').textContent=label+' - Press SPACE!';
  document.getElementById('round').textContent=boss?'BOSS!':'Rnd '+roundNum;
  document.getElementById('coins').textContent=coins;}
function randomizePlatforms(){platforms=[{x:60+Math.random()*80,y:260+Math.random()*40,w:100+Math.random()*40},{x:510+Math.random()*80,y:260+Math.random()*40,w:100+Math.random()*40},{x:250+Math.random()*60,y:190+Math.random()*40,w:140+Math.random()*60}];}
function spawnHazards(){hazards=[];var s=(roundNum-1)%4;
  if(s===1){hazards.push({type:'lava',x:200,w:100},{type:'lava',x:450,w:100});}
  if(s===2){for(var i=0;i<3;i++)hazards.push({type:'icicle',x:150+i*200,y:-50-Math.random()*200,vy:0,active:false,timer:60+Math.floor(Math.random()*120)});}
  if(s===3){hazards.push({type:'lightning',x:CW/2,timer:120+Math.floor(Math.random()*120),warn:0});}}
function spawnItem(){var types=['heal','energy','bomb','speed'];items.push({x:100+Math.random()*(CW-200),y:50+Math.random()*100,type:types[Math.floor(Math.random()*types.length)],life:400});}
function spawnWeapon(){var wk=Object.keys(WEAPONS);weaponDrops.push({x:100+Math.random()*(CW-200),y:0,vy:1.5,type:wk[Math.floor(Math.random()*wk.length)],life:500});}
function doAttack(p,name){if(p.atk||p.hitstun>0||p.dashT>0||p.blocking)return;var a=ATTACKS[name];if(p.nrg<a.nrg)return;p.nrg-=a.nrg;p.atk=name;p.atkT=0;p.atkHit=false;p.state=name;p.stateT=0;}
function getAtkBox(p){if(!p.atk)return null;var a=ATTACKS[p.atk];if(p.atkT<a.start||p.atkT>a.end)return null;var rm=p.weapon?WEAPONS[p.weapon].rangeMul:1;if(p.atk==='slam'){return{x:p.x-25,y:p.y-10,w:50,h:20};}var hx=p.face===1?p.x+10:p.x-10-a.range*rm;var hy=p.atk==='uppercut'?p.y-65:p.atk==='kick'?p.y-20:p.y-45;return{x:hx,y:hy,w:a.range*rm,h:a.h};}
function boxHit(a,bx,by,bw,bh){return a&&a.x<bx+bw&&a.x+a.w>bx&&a.y<by+bh&&a.y+a.h>by;}
function hitFX(x,y,col,n){for(var i=0;i<(n||15);i++)particles.push({x:x,y:y,vx:(Math.random()-.5)*10,vy:(Math.random()-.5)*10,life:15+Math.random()*15,col:col,sz:2+Math.random()*4});shakes=10;}
function textFX(x,y,txt,col){particles.push({x:x,y:y,vx:0,vy:-2,life:40,col:col,sz:0,txt:txt});}
function onPlatform(p){if(p.vy<0)return false;for(var i=0;i<platforms.length;i++){var pl=platforms[i];if(p.x>pl.x&&p.x<pl.x+pl.w&&p.y>=pl.y-2&&p.y<=pl.y+6&&p.vy>=0)return pl;}return null;}
function updateHazards(){hazards.forEach(function(h){
  if(h.type==='lava'){[p1,p2].forEach(function(p){if(p.onGround&&p.x>h.x&&p.x<h.x+h.w&&p.hitstun<=0){p.hp=Math.max(0,p.hp-0.4);if(Math.random()<0.15)particles.push({x:p.x,y:GROUND-5,vx:(Math.random()-.5)*3,vy:-2-Math.random()*3,life:15,col:'#f80',sz:3});}});
    if(Math.random()<0.05)particles.push({x:h.x+Math.random()*h.w,y:GROUND-2,vx:(Math.random()-.5)*2,vy:-1-Math.random()*2,life:20,col:'#f40',sz:2});}
  if(h.type==='icicle'){h.timer--;if(h.timer<=0&&!h.active){h.active=true;h.vy=0;}
    if(h.active){h.vy+=0.3;h.y+=h.vy;[p1,p2].forEach(function(p){if(Math.abs(p.x-h.x)<15&&Math.abs((p.y-30)-h.y)<20&&p.hitstun<=0){p.hp=Math.max(0,p.hp-12);p.hitstun=12;p.vy=-6;hitFX(h.x,h.y,'#8cf',10);beep(300,0.1);}});
      if(h.y>=GROUND){hitFX(h.x,GROUND,'#8cf',8);h.y=-50-Math.random()*200;h.active=false;h.timer=80+Math.floor(Math.random()*120);h.vy=0;}}}
  if(h.type==='lightning'){h.timer--;if(h.timer<=20&&h.warn===0){h.x=100+Math.random()*(CW-200);h.warn=1;}
    if(h.timer<=0){[p1,p2].forEach(function(p){if(Math.abs(p.x-h.x)<30&&p.hitstun<=0){p.hp=Math.max(0,p.hp-18);p.hitstun=15;p.vy=-8;hitFX(h.x,p.y-30,'#ff0',20);beep(100,0.3,0.2);}});
      hitFX(h.x,GROUND,'#ff0',15);h.timer=100+Math.floor(Math.random()*120);h.warn=0;}}});}
// AI
function aiUpdate(ai,player){
  if(roundOver)return;ai.aiT++;
  var dx=player.x-ai.x,dy=player.y-ai.y,dist=Math.abs(dx);
  var react=[30,18,10,4][difficulty],aggro=[0.3,0.5,0.75,0.95][difficulty],dodge=[0.1,0.3,0.6,0.9][difficulty];
  if(player.atk&&dist<80&&Math.random()<dodge){if(ai.onGround&&ai.jumps<2){ai.vy=-10;ai.jumps++;ai.onGround=false;}ai.vx=dx>0?-5:5;return;}
  if(ai.aiT%react!==0)return;
  if(ai.hp<25&&dist<100&&Math.random()<0.4){ai.vx=dx>0?-4:4;return;}
  if(dist>120)ai.vx=dx>0?4:-4;else if(dist>50)ai.vx=dx>0?2.5:-2.5;else ai.vx=0;
  if(dy<-40&&ai.onGround&&Math.random()<0.5){ai.vy=-10;ai.jumps++;ai.onGround=false;}
  if(!ai.onGround&&ai.jumps<2&&dy<-60&&Math.random()<0.3){ai.vy=-9;ai.jumps++;}
  if(dist<55&&Math.random()<aggro){
    if(ai.nrg>=50&&Math.random()<0.2*difficulty)doAttack(ai,'special');
    else if(ai.nrg>=20&&Math.random()<0.3)doAttack(ai,'uppercut');
    else if(Math.random()<0.5)doAttack(ai,'kick');else doAttack(ai,'punch');}
  if(ai.isBoss&&dist<70&&Math.random()<0.3&&ai.nrg>=20)doAttack(ai,'uppercut');
  if(!ai.onGround&&dist<60&&Math.random()<0.3)doAttack(ai,'slam');
  for(var i=0;i<items.length;i++){var it=items[i];if(Math.abs(ai.x-it.x)<150&&Math.random()<0.3){ai.vx=it.x>ai.x?4:-4;if(it.y<ai.y-30&&ai.onGround){ai.vy=-10;ai.jumps++;ai.onGround=false;}}}
  for(var i=0;i<weaponDrops.length;i++){var wd=weaponDrops[i];if(!ai.weapon&&Math.abs(ai.x-wd.x)<120&&Math.random()<0.4){ai.vx=wd.x>ai.x?4:-4;}}}
function updatePlayer(p,o,kl,kr,ku,kp,kk,kupp,ksp,kblock){
  if(roundOver){p.vx*=0.9;p.vy+=GRAV;p.y=Math.min(p.y+p.vy,GROUND);return;}
  if(p.invuln>0)p.invuln--;
  var nrgRate=1+upgrades.nrg*0.3;
  if(!p.atk&&p.hitstun<=0)p.nrg=Math.min(p.maxNrg,p.nrg+0.15*nrgRate);
  if(p.weapon){p.weaponT--;if(p.weaponT<=0){p.weapon=null;textFX(p.x,p.y-70,'Weapon broke!','#888');}}
  if(p.hitstun>0){p.hitstun--;p.vx*=0.88;p.vy+=GRAV;p.y+=p.vy;p.x+=p.vx;
    var pl=onPlatform(p);if(pl){p.y=pl.y;p.vy=0;p.onGround=true;p.jumps=0;}
    if(p.y>=GROUND){p.y=GROUND;p.vy=0;p.onGround=true;p.jumps=0;}
    if(p.x<15)p.x=15;if(p.x>CW-15)p.x=CW-15;p.atk=null;p.state='hit';return;}
  var now=Date.now();
  if(p.dashT>0){p.dashT--;p.vx=p.dashDir*12;p.vy=0;p.invuln=2;
    if(p.dashT%2===0)particles.push({x:p.x,y:p.y-30,vx:0,vy:0,life:8,col:p.color,sz:5});
    p.vy+=GRAV;p.y+=p.vy;p.x+=p.vx;if(p.y>=GROUND){p.y=GROUND;p.vy=0;}
    if(p.x<15)p.x=15;if(p.x>CW-15)p.x=CW-15;return;}
  // blocking
  if(!p.isAI&&keys[kblock]&&!p.atk&&p.hitstun<=0){if(!p.blocking){p.blockStart=Date.now();}p.blocking=true;p.vx*=0.3;p.state='block';p.stateT++;}
  else{p.blocking=false;}
  if(p.isAI){aiUpdate(p,o);}
  else{
    var spd=4*(1+upgrades.spd*0.1);
    if(keys[kl]){if(!p._lheld&&p.lastLR===-1&&now-p.lastLRT<150&&p.onGround){p.dashT=10;p.dashDir=-1;p.lastLR=0;p.lastLRT=0;p._lheld=true;return;}if(!p._lheld){p.lastLR=-1;p.lastLRT=now;}p._lheld=true;p.vx=-spd;}
    else{p._lheld=false;if(keys[kr]){if(!p._rheld&&p.lastLR===1&&now-p.lastLRT<150&&p.onGround){p.dashT=10;p.dashDir=1;p.lastLR=0;p.lastLRT=0;p._rheld=true;return;}if(!p._rheld){p.lastLR=1;p.lastLRT=now;}p._rheld=true;p.vx=spd;}
    else{p._rheld=false;p.vx*=0.7;}}
    if(!p.onGround&&p.jumps>=2){if(p.x<=16&&keys[ku]&&!p._jh){p.vy=-10;p.vx=6;p._jh=true;}if(p.x>=CW-16&&keys[ku]&&!p._jh){p.vy=-10;p.vx=-6;p._jh=true;}}
    if(keys[ku]&&p.jumps<2&&!p._jh){p.vy=-10-(p.jumps===1?1:0);p.jumps++;p.onGround=false;p._jh=true;
      if(p.jumps===2)for(var i=0;i<5;i++)particles.push({x:p.x+(Math.random()-0.5)*10,y:p.y,vx:(Math.random()-.5)*3,vy:1+Math.random()*2,life:10,col:'#fff',sz:2});}
    if(!keys[ku])p._jh=false;
    if(keys[kp]&&!p._ph){doAttack(p,'punch');p._ph=true;}if(!keys[kp])p._ph=false;
    if(keys[kk]&&!p._kh){if(!p.onGround){doAttack(p,'slam');p.vy=12;}else{doAttack(p,'kick');}p._kh=true;}if(!keys[kk])p._kh=false;
    if(keys[kupp]&&!p._uh){doAttack(p,'uppercut');p._uh=true;}if(!keys[kupp])p._uh=false;
    if(keys[ksp]&&!p._sh){doAttack(p,'special');p._sh=true;}if(!keys[ksp])p._sh=false;}
  p.vy+=GRAV;p.x+=p.vx;p.y+=p.vy;
  var pl=onPlatform(p);if(pl){p.y=pl.y;p.vy=0;p.onGround=true;p.jumps=0;}
  if(p.y>=GROUND){if(!p.onGround&&p.vy>4){for(var i=0;i<6;i++)particles.push({x:p.x+(Math.random()-.5)*20,y:GROUND,vx:(Math.random()-.5)*4,vy:-Math.random()*3,life:12,col:'#888',sz:2});}
    if(p.atk==='slam'){shakes=12;beep(80,0.3,0.2);for(var i=0;i<15;i++)particles.push({x:p.x+(Math.random()-.5)*60,y:GROUND,vx:(Math.random()-.5)*8,vy:-2-Math.random()*5,life:20,col:'#fa0',sz:3+Math.random()*3});}
    p.y=GROUND;p.vy=0;p.onGround=true;p.jumps=0;}
  if(p.x<15)p.x=15;if(p.x>CW-15)p.x=CW-15;
  p.face=o.x>p.x?1:-1;
  if(p.atk){p.atkT++;var a=ATTACKS[p.atk];
    if(!p.atkHit){var ab=getAtkBox(p);
      if(ab&&o.invuln<=0&&boxHit(ab,o.x-15,o.y-60,30,60)){
        // dodge check (player upgrades only apply to p1)
        if(!o.isAI&&upgrades.dodge>0&&Math.random()<upgrades.dodge*0.08){textFX(o.x,o.y-70,'DODGE!','#88f');beep(600,0.05);p.atkHit=true;}
        else if(o.blocking){var parry=o.blockStart&&(Date.now()-o.blockStart)<150;
          if(parry){hitFX((p.x+o.x)/2,(p.y+o.y)/2-30,'gold',20);textFX(o.x,o.y-70,'PARRY!','gold');beep(1200,0.15);beep(600,0.1);p.hitstun=25;p.vx=-p.face*8;p.vy=-4;shakes=12;slowmo=30;slowmoScale=0.3;p.atkHit=true;}
          else{hitFX((p.x+o.x)/2,(p.y+o.y)/2-30,'#fff',8);textFX(o.x,o.y-70,'BLOCKED!','#fff');beep(800,0.05);o.vx=p.face*2;p.vx=-p.face*5;p.atkHit=true;}}
        else{p.atkHit=true;var dmg=a.dmg;
          if(!p.isAI)dmg*=(1+upgrades.dmg*0.15);
          if(p.weapon)dmg*=WEAPONS[p.weapon].dmgMul;
          if(!o.onGround)dmg=Math.floor(dmg*1.4);
          if(p.combo>2)dmg=Math.max(3,Math.floor(dmg*(1-p.combo*0.08)));
          // crit
          if(!p.isAI&&upgrades.crit>0&&Math.random()<upgrades.crit*0.12){dmg=Math.floor(dmg*2);textFX(o.x,o.y-85,'CRIT!','#f0f');beep(1200,0.1);}
          dmg=Math.floor(dmg);
          // armor
          if(!o.isAI&&upgrades.armor>0)dmg=Math.max(1,Math.floor(dmg*(1-upgrades.armor*0.1)));
          o.hp=Math.max(0,o.hp-dmg);o.hitstun=a.hs;o.vx=p.face*a.kx;o.vy=a.ky;o.combo=0;
          p.nrg=Math.min(p.maxNrg,p.nrg+dmg*0.6);
          // lifesteal
          if(!p.isAI&&upgrades.lifesteal>0){var heal=Math.floor(dmg*upgrades.lifesteal*0.1);p.hp=Math.min(p.maxHp,p.hp+heal);if(heal>0)textFX(p.x,p.y-85,'+'+heal,'#a44');}
          hitFX((p.x+o.x)/2,(p.y+o.y)/2-30,p.color);textFX(o.x,o.y-70,'-'+dmg,p.color);
          beep(150+Math.random()*300,0.12,0.15);p.combo++;
          if(p.combo===3){textFX(p.x,p.y-80,'COMBO!','gold');beep(880,0.2);}
          if(p.combo===5){textFX(p.x,p.y-80,'BRUTAL!','#f0f');beep(1000,0.3);}
          if(p.atk==='special'){hitFX(o.x,o.y-30,'gold',25);beep(100,0.3,0.2);shakes=15;}}}}
    if(p.atkT>=a.dur){p.atk=null;p.state='idle';p.stateT=0;}}
  else if(!p.blocking){if(Math.abs(p.vx)>1)p.state='walk';else p.state='idle';p.stateT++;}
  // item pickup
  for(var i=items.length-1;i>=0;i--){var it=items[i];
    if(Math.abs(p.x-it.x)<20&&Math.abs((p.y-30)-it.y)<20){
      if(it.type==='heal'){p.hp=Math.min(p.maxHp,p.hp+25);textFX(p.x,p.y-70,'+25HP','#0f0');beep(523,0.1);}
      else if(it.type==='energy'){p.nrg=Math.min(p.maxNrg,p.nrg+40);textFX(p.x,p.y-70,'+NRG','#ff0');beep(659,0.1);}
      else if(it.type==='bomb'){o.hp=Math.max(0,o.hp-20);o.hitstun=15;o.vy=-8;hitFX(o.x,o.y-30,'#f90',20);textFX(o.x,o.y-70,'BOOM!','#f90');beep(80,0.4,0.2);}
      else if(it.type==='speed'){p.dashT=20;p.dashDir=p.face;textFX(p.x,p.y-70,'ZOOM!','#0ff');}
      hitFX(it.x,it.y,'gold',10);items.splice(i,1);}}
  // weapon pickup
  for(var i=weaponDrops.length-1;i>=0;i--){var wd=weaponDrops[i];
    if(Math.abs(p.x-wd.x)<20&&Math.abs((p.y-30)-wd.y)<25){
      p.weapon=wd.type;p.weaponT=500;textFX(p.x,p.y-70,WEAPONS[wd.type].name+'!',WEAPONS[wd.type].color);beep(700,0.1);hitFX(wd.x,wd.y,'gold',8);weaponDrops.splice(i,1);}}}
// DRAWING
function drawStick(p){
  var x=p.x,y=p.y,f=p.face,t=Date.now()/1000;
  if(p.dashT>0){for(var g=1;g<=3;g++){ctx.globalAlpha=0.08*g;ctx.strokeStyle=p.color;ctx.lineWidth=3;ctx.lineCap='round';drawBody(x-f*g*10,y,f,p,0);}ctx.globalAlpha=1;}
  if(p.hitstun>0)ctx.strokeStyle=p.hitstun%3===0?'#fff':'#f44';
  else if(p.invuln>0&&p.invuln%2===0)ctx.strokeStyle='#fff';
  else ctx.strokeStyle=p.color;
  if(p.atk==='special'&&p.atkT>=ATTACKS.special.start&&p.atkT<=ATTACKS.special.end){ctx.strokeStyle='gold';ctx.shadowColor='gold';ctx.shadowBlur=15;}
  if(p.blocking){ctx.strokeStyle='#8af';}
  if(p.hp<25&&!p.atk)ctx.strokeStyle='hsl(0,100%,'+(50+Math.sin(t*8)*20)+'%)';
  if(p.isBoss){ctx.lineWidth=4;}else{ctx.lineWidth=3;}
  ctx.lineCap='round';drawBody(x,y,f,p,1);ctx.shadowBlur=0;}
function drawBody(x,y,f,p,full){
  var t=Date.now()/1000,bob=0;
  if(p.state==='walk')bob=Math.sin(p.stateT*0.3)*4;
  else if(p.state==='idle')bob=Math.sin(t*2.5)*2;
  if(p.hitstun>0)bob=Math.sin(p.hitstun*2)*4;
  if(!p.onGround)bob=-3;
  var sc=p.isBoss?1.3:1;
  var headY=y-55*sc+bob,bodyLean=0;
  if(p.state==='walk')bodyLean=f*3;if(p.dashT>0)bodyLean=f*8;if(p.blocking)bodyLean=-f*3;
  ctx.beginPath();ctx.arc(x+bodyLean,headY,9*sc,0,Math.PI*2);ctx.stroke();
  if(full){ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(x+bodyLean+f*3,headY-1,2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+bodyLean+f*6,headY-1,2,0,Math.PI*2);ctx.fill();
    if(p.hitstun>0){ctx.beginPath();ctx.arc(x+bodyLean+f*3,headY+4,3,0,Math.PI);ctx.stroke();}
    if(p.hp<30){ctx.fillStyle='#4af';ctx.beginPath();ctx.arc(x+bodyLean-f*6,headY-12+Math.sin(t*3)*3,2,0,Math.PI*2);ctx.fill();}}
  var nX=x+bodyLean,nY=headY+9*sc,hX=x,hY=y-18*sc+bob;
  ctx.beginPath();ctx.moveTo(nX,nY);ctx.quadraticCurveTo(x+bodyLean*0.5,nY+(hY-nY)*0.5,hX,hY);ctx.stroke();
  // legs with knees
  var lk=0,rk=0,lko=2,rko=2;
  if(p.state==='walk'){var wt=p.stateT*0.3;lk=Math.sin(wt)*25;rk=-lk;lko=Math.abs(Math.sin(wt))*8;rko=Math.abs(Math.sin(wt+Math.PI))*8;}
  if(p.state==='idle'){lk=-5;rk=5;}
  if(!p.onGround){lk=-f*8;rk=f*8;lko=12;rko=12;}
  if(p.blocking){lk=-f*10;rk=f*10;lko=8;rko=8;}
  if(p.atk==='kick'){var pr=p.atkT/ATTACKS.kick.dur;if(pr<0.2){rk=f*pr/0.2*10;rko=15;}else if(pr<0.5){rk=f*55;rko=5;}else{rk=f*55*(1-(pr-0.5)/0.5);rko=8;}lko=6;lk=-f*10;}
  if(p.atk==='uppercut'){var pr=p.atkT/ATTACKS.uppercut.dur;lk=-f*pr*20;lko=pr*15;}
  if(p.atk==='slam'){lk=-10;rk=10;lko=15;rko=15;}
  var lf={x:hX+lk,y:y},lkn={x:hX+lk*0.4-f*lko,y:hY+(y-hY)*0.55};
  ctx.beginPath();ctx.moveTo(hX,hY);ctx.lineTo(lkn.x,lkn.y);ctx.lineTo(lf.x,lf.y);ctx.stroke();
  var rf={x:hX+rk,y:y},rkn={x:hX+rk*0.4+f*rko,y:hY+(y-hY)*0.55};
  ctx.beginPath();ctx.moveTo(hX,hY);ctx.lineTo(rkn.x,rkn.y);ctx.lineTo(rf.x,rf.y);ctx.stroke();
  if(full&&p.atk==='kick'&&p.atkT>3&&p.atkT<12){ctx.globalAlpha=0.3;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(rf.x,rf.y,15,f>0?-0.5:Math.PI-0.5,f>0?0.5:Math.PI+0.5);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle=p.color;ctx.lineWidth=p.isBoss?4:3;}
  // arms
  var sY=nY+5,la={x:x-f*12,y:sY+18},ra={x:x+f*12,y:sY+18},le={x:x-f*5,y:sY+10},re={x:x+f*5,y:sY+10};
  if(p.state==='walk'){var wt=p.stateT*0.3;la={x:x+Math.sin(wt)*15,y:sY+12};ra={x:x-Math.sin(wt)*15,y:sY+12};le={x:x+Math.sin(wt)*7,y:sY+6};re={x:x-Math.sin(wt)*7,y:sY+6};}
  if(p.blocking){la={x:x-f*5,y:sY-10};ra={x:x+f*5,y:sY-5};le={x:x-f*2,y:sY};re={x:x+f*2,y:sY};}
  if(p.atk==='punch'){var pr=p.atkT/ATTACKS.punch.dur;if(pr<0.2){re={x:x-f*5,y:sY};ra={x:x-f*10,y:sY-5};}else if(pr<0.5){re={x:x+f*20,y:sY};ra={x:x+f*50,y:sY-2};}else{re={x:x+f*(50*(1-(pr-0.5)/0.5)*0.5),y:sY+2};ra={x:x+f*(50*(1-(pr-0.5)/0.5)),y:sY+5};}le={x:x-f*8,y:sY+5};la={x:x-f*15,y:sY+10};}
  if(p.atk==='kick'){le={x:x-f*12,y:sY-3};la={x:x-f*22,y:sY+5};re={x:x+f*5,y:sY+5};ra={x:x+f*8,y:sY+15};}
  if(p.atk==='uppercut'){var pr=p.atkT/ATTACKS.uppercut.dur;if(pr<0.2){re={x:x+f*5,y:sY+10};ra={x:x+f*5,y:sY+20};}else if(pr<0.5){re={x:x+f*8,y:sY-10};ra={x:x+f*10,y:sY-35};}else{var d=1-(pr-0.5)/0.5;re={x:x+f*8,y:sY-10*d};ra={x:x+f*10,y:sY-35*d+10};}le={x:x-f*10,y:sY+5};la={x:x-f*18,y:sY+10};}
  if(p.atk==='special'){var pr=p.atkT/ATTACKS.special.dur;if(pr<0.3){le={x:x,y:sY-10};la={x:x-f*5,y:sY-20};re={x:x,y:sY-10};ra={x:x+f*5,y:sY-20};}else{le={x:x+f*15,y:sY-3};la={x:x+f*40,y:sY};re={x:x+f*20,y:sY+3};ra={x:x+f*48,y:sY+5};}}
  if(p.atk==='slam'){la={x:x-15,y:sY+15};le={x:x-8,y:sY+5};ra={x:x+15,y:sY+15};re={x:x+8,y:sY+5};}
  ctx.beginPath();ctx.moveTo(nX,sY);ctx.lineTo(le.x,le.y);ctx.lineTo(la.x,la.y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(nX,sY);ctx.lineTo(re.x,re.y);ctx.lineTo(ra.x,ra.y);ctx.stroke();
  // weapon visual
  if(full&&p.weapon){var wc=WEAPONS[p.weapon].color;ctx.strokeStyle=wc;ctx.lineWidth=2;
    if(p.weapon==='sword'){ctx.beginPath();ctx.moveTo(ra.x,ra.y);ctx.lineTo(ra.x+f*25,ra.y-15);ctx.stroke();}
    if(p.weapon==='staff'){ctx.beginPath();ctx.moveTo(ra.x-f*10,ra.y+10);ctx.lineTo(ra.x+f*20,ra.y-20);ctx.stroke();}
    if(p.weapon==='nunchuck'){ctx.beginPath();ctx.moveTo(ra.x,ra.y);ctx.lineTo(ra.x+f*10+Math.sin(t*15)*8,ra.y-10+Math.cos(t*15)*8);ctx.stroke();}
    ctx.strokeStyle=p.color;ctx.lineWidth=p.isBoss?4:3;}
  // block shield
  if(full&&p.blocking){ctx.globalAlpha=0.3;ctx.fillStyle='#4af';ctx.beginPath();ctx.arc(x+f*15,y-35,20,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  // punch fist
  if(full&&p.atk==='punch'&&p.atkT>2&&p.atkT<8){ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(ra.x,ra.y,4,0,Math.PI*2);ctx.fill();}
  // uppercut trail
  if(full&&p.atk==='uppercut'&&p.atkT>3&&p.atkT<10){ctx.globalAlpha=0.3;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ra.x,ra.y,12,-Math.PI*0.8,-Math.PI*0.2);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle=p.color;ctx.lineWidth=p.isBoss?4:3;}
  // special energy
  if(full&&p.atk==='special'&&p.atkT>=ATTACKS.special.start){var sz=8+Math.sin(t*20)*3;ctx.globalAlpha=0.6;ctx.fillStyle='gold';ctx.beginPath();ctx.arc(x+f*48,sY+2,sz,0,Math.PI*2);ctx.fill();ctx.globalAlpha=0.3;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+f*48,sY+2,sz+5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  if(full&&p.combo>=3){ctx.fillStyle=p.combo>=5?'#f0f':'gold';ctx.font='bold '+(14+p.combo)+'px monospace';ctx.textAlign='center';ctx.fillText(p.combo+' HIT!',x,headY-18+Math.sin(t*6)*3);}}
function drawBar(x,y,w,val,max,col,bg){ctx.fillStyle=bg||'#222';ctx.fillRect(x,y,w,8);ctx.fillStyle=val>max*0.25?col:'#f44';ctx.fillRect(x,y,w*(val/max),8);ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.strokeRect(x,y,w,8);}
function frame(){
  requestAnimationFrame(frame);
  // countdown
  if(countdown>0){
    countdownT--;
    if(countdownT<=0){countdown--;countdownT=60;
      if(countdown>0)beep(330,0.1);
      else{beep(440,0.1);beep(660,0.1);document.getElementById('msg').textContent='FIGHT!';}}
    drawScene();
    // draw countdown number
    if(countdown>0){ctx.fillStyle='#fff';ctx.font='bold 80px monospace';ctx.textAlign='center';ctx.globalAlpha=countdownT/60;
      ctx.fillText(countdown,CW/2,CH/2+20);ctx.globalAlpha=1;}
    return;}
  if(paused||waitingToStart||shopOpen){
    if(waitingToStart)drawScene();return;}
  // slowmo
  if(slowmo>0){slowmo--;if(slowmo<=0)slowmoScale=1;}
  var doTick=slowmoScale>=1||Math.random()<slowmoScale;
  if(doTick){
  updatePlayer(p1,p2,'a','d','w','f','g','r','t','q');
  updatePlayer(p2,p1,'','','','','','','','');
  updateHazards();
  itemTimer++;if(itemTimer>300&&items.length<2){spawnItem();itemTimer=0;}
  if(itemTimer%400===200&&weaponDrops.length<1&&Math.random()<0.4)spawnWeapon();
  for(var i=items.length-1;i>=0;i--){items[i].life--;if(items[i].life<=0)items.splice(i,1);}
  for(var i=weaponDrops.length-1;i>=0;i--){weaponDrops[i].y+=weaponDrops[i].vy;weaponDrops[i].life--;if(weaponDrops[i].y>=GROUND-10)weaponDrops[i].vy=0;if(weaponDrops[i].life<=0)weaponDrops.splice(i,1);}
  }
  for(var i=0;i<particles.length;i++){var p=particles[i];if(!p.txt){p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;}else{p.y+=p.vy;}p.life--;p.vx*=0.95;}
  particles=particles.filter(function(p){return p.life>0;});
  if(shakes>0)shakes--;
  if(!roundOver&&(p1.hp<=0||p2.hp<=0)){
    roundOver=true;slowmo=90;slowmoScale=0.15;
    var loser=p1.hp<=0?p1:p2;
    if(p1.hp<=0)wins2++;else{wins1++;coins+=p2.isBoss?5:2;}
    document.getElementById('w1').textContent=wins1;document.getElementById('w2').textContent=wins2;document.getElementById('coins').textContent=coins;
    var w=p1.hp>0?'YOU':'CPU';
    document.getElementById('msg').textContent=w+' WIN'+(p1.hp>0?'':'S')+'! '+(p1.hp>0?'+'+((p2.isBoss?5:2))+' coins ':'')+'- Press SPACE';
    // big KO explosion
    for(var i=0;i<50;i++)particles.push({x:loser.x,y:loser.y-30,vx:(Math.random()-.5)*16,vy:(Math.random()-.5)*16,life:25+Math.random()*25,col:['#f44','#fa0','#ff0','gold','#fff'][Math.floor(Math.random()*5)],sz:3+Math.random()*5});
    shakes=20;beep(523,0.15);beep(659,0.15);beep(784,0.3);roundNum++;}
  if(roundOver&&keys[' ']&&slowmo<=0){keys[' ']=false;if(p1.hp>0&&roundNum%3===1&&coins>0)openShop();else init();}
  drawScene();}
function drawScene(){
  var sx=shakes>0?(Math.random()*8-4):0,sy=shakes>0?(Math.random()*8-4):0;
  ctx.save();ctx.translate(sx,sy);
  var st=getStage();var grad=ctx.createLinearGradient(0,0,0,CH);grad.addColorStop(0,st.bg1);grad.addColorStop(1,st.bg2);
  ctx.fillStyle=grad;ctx.fillRect(0,0,CW,CH);
  // stage name
  ctx.fillStyle='rgba(255,255,255,0.05)';ctx.font='bold 60px monospace';ctx.textAlign='center';ctx.fillText(st.name,CW/2,CH/2);
  // platforms
  for(var i=0;i<platforms.length;i++){var pl=platforms[i];ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(pl.x,pl.y,pl.w,8);ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(pl.x,pl.y,pl.w,3);}
  // ground
  ctx.fillStyle=st.gnd;ctx.fillRect(0,GROUND,CW,CH-GROUND);ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,GROUND);ctx.lineTo(CW,GROUND);ctx.stroke();
  // hazards
  hazards.forEach(function(h){
    if(h.type==='lava'){ctx.fillStyle='#f40';ctx.globalAlpha=0.5+Math.sin(Date.now()/300)*0.2;ctx.fillRect(h.x,GROUND-4,h.w,8);ctx.globalAlpha=1;}
    if(h.type==='icicle'){if(h.active){ctx.fillStyle='#8cf';ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.lineTo(h.x-6,h.y-18);ctx.lineTo(h.x+6,h.y-18);ctx.fill();}
      else if(h.timer<30){ctx.fillStyle='rgba(136,204,255,0.3)';ctx.beginPath();ctx.moveTo(h.x,0);ctx.lineTo(h.x-4,20);ctx.lineTo(h.x+4,20);ctx.fill();}}
    if(h.type==='lightning'){if(h.warn&&h.timer>0){ctx.fillStyle='rgba(255,255,0,'+(0.1+Math.sin(Date.now()/50)*0.1)+')';ctx.fillRect(h.x-25,0,50,GROUND);
      ctx.fillStyle='rgba(255,255,0,0.5)';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText('!!',h.x,30);}
      if(h.timer<=2&&h.timer>=0){ctx.strokeStyle='#ff0';ctx.lineWidth=3;ctx.globalAlpha=0.8;ctx.beginPath();ctx.moveTo(h.x,0);var ly=0;while(ly<GROUND){ly+=20+Math.random()*30;ctx.lineTo(h.x+(Math.random()-0.5)*40,Math.min(ly,GROUND));}ctx.stroke();ctx.globalAlpha=1;}}});
  // items
  for(var i=0;i<items.length;i++){var it=items[i],pulse=Math.sin(Date.now()/200)*0.2+0.8;
    ctx.globalAlpha=it.life<60?it.life/60:pulse;
    ctx.fillStyle=it.type==='heal'?'#0f0':it.type==='energy'?'#ff0':it.type==='bomb'?'#f90':'#0ff';
    ctx.beginPath();ctx.arc(it.x,it.y,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#000';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(it.type==='heal'?'+':it.type==='energy'?'E':it.type==='bomb'?'B':'S',it.x,it.y);ctx.globalAlpha=1;}
  // weapon drops
  for(var i=0;i<weaponDrops.length;i++){var wd=weaponDrops[i];
    ctx.globalAlpha=wd.life<60?wd.life/60:0.7+Math.sin(Date.now()/200)*0.3;
    ctx.fillStyle=WEAPONS[wd.type].color;ctx.beginPath();ctx.arc(wd.x,wd.y,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#000';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(wd.type[0].toUpperCase(),wd.x,wd.y);ctx.globalAlpha=1;
    ctx.fillStyle='#fff';ctx.font='9px monospace';ctx.fillText(WEAPONS[wd.type].name,wd.x,wd.y-15);}
  // bars
  drawBar(15,12,180,p1.hp,p1.maxHp,'#4af');drawBar(15,24,180,p1.nrg,p1.maxNrg,'#ff0','#1a1a00');
  var bw=p2.isBoss?250:180;drawBar(CW-bw-15,12,bw,p2.hp,p2.maxHp,'#f44');drawBar(CW-bw-15,24,bw,p2.nrg,p2.maxNrg,'#ff0','#1a1a00');
  ctx.fillStyle='#888';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText('HP',200,20);ctx.fillText('NRG',200,32);
  if(p1.weapon){ctx.fillStyle=WEAPONS[p1.weapon].color;ctx.fillText(WEAPONS[p1.weapon].name,15,44);}
  if(p2.isBoss){ctx.fillStyle='#f0f';ctx.font='bold 12px monospace';ctx.textAlign='right';ctx.fillText('BOSS',CW-15,44);}
  // fighters
  drawStick(p1);drawStick(p2);
  [p1,p2].forEach(function(p){var ab=getAtkBox(p);if(ab){ctx.globalAlpha=0.15;ctx.fillStyle=p.color;ctx.fillRect(ab.x,ab.y,ab.w,ab.h);ctx.globalAlpha=1;}});
  // particles
  for(var i=0;i<particles.length;i++){var p=particles[i];
    if(p.txt){ctx.globalAlpha=p.life/40;ctx.fillStyle=p.col;ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(p.txt,p.x,p.y);}
    else{ctx.globalAlpha=p.life/30;ctx.fillStyle=p.col;ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);}}
  ctx.globalAlpha=1;
  if(roundOver){ctx.globalAlpha=0.5;ctx.fillStyle='#000';ctx.fillRect(0,0,CW,CH);ctx.globalAlpha=1;
    ctx.fillStyle='#fff';ctx.font='bold 44px monospace';ctx.textAlign='center';
    ctx.fillText((p1.hp>0?'YOU':'CPU')+' WIN'+(p1.hp>0?'':'S')+'!',CW/2,CH/2-10);
    ctx.font='20px monospace';ctx.fillStyle='gold';ctx.fillText(wins1+' - '+wins2,CW/2,CH/2+25);}
  ctx.restore();}
init();frame();
