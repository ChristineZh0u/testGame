// engine.js — core systems: input, camera, audio, collision
const C = document.getElementById('c'), X = C.getContext('2d');
let W, H;
function resize() { W = C.width = innerWidth; H = C.height = innerHeight; }
resize(); onresize = resize;

// Input
const keys = {}, keysJust = {};
onkeydown = e => { keysJust[e.key.toLowerCase()] = !keys[e.key.toLowerCase()]; keys[e.key.toLowerCase()] = true; };
onkeyup = e => { keys[e.key.toLowerCase()] = false; keysJust[e.key.toLowerCase()] = false; };
function clearJust() { for (const k in keysJust) keysJust[k]=false; }
function inp() {
  let dx=0, dy=0;
  if (keys['w']||keys['arrowup']) dy=-1;
  if (keys['s']||keys['arrowdown']) dy=1;
  if (keys['a']||keys['arrowleft']) dx=-1;
  if (keys['d']||keys['arrowright']) dx=1;
  if (dx&&dy) { dx*=.707; dy*=.707; }
  return {dx,dy,dash:keys[' '],interact:keysJust['e']||keysJust['enter']};
}

// Camera with screen shake
const cam = { x:0, y:0, shakeX:0, shakeY:0, shakeT:0 };
function updateCam(tx, ty, dt) {
  cam.x += (tx - W/2 - cam.x) * Math.min(1, 5*dt);
  cam.y += (ty - H/2 - cam.y) * Math.min(1, 5*dt);
  if (cam.shakeT > 0) {
    cam.shakeT -= dt;
    const intensity = cam.shakeT * 40;
    cam.shakeX = (Math.random()-.5) * intensity;
    cam.shakeY = (Math.random()-.5) * intensity;
  } else { cam.shakeX = cam.shakeY = 0; }
}
function shake(dur=.2) { cam.shakeT = Math.max(cam.shakeT, dur); }

// Audio
const AC = new (window.AudioContext||window.webkitAudioContext)();
function sfx(freq, dur, type='sine', vol=.12) {
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(vol,AC.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+dur);
  o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime+dur);
}
function sndPick(){ sfx(700,.06); sfx(1100,.08,'triangle'); }
function sndHurt(){ sfx(150,.25,'sawtooth',.2); sfx(100,.3,'square',.1); shake(.25); }
function sndDash(){ sfx(400,.1,'triangle',.08); }
function sndPower(){ sfx(500,.08); sfx(800,.1); sfx(1100,.08); }
function sndBoss(){ sfx(80,.5,'sawtooth',.15); sfx(120,.4,'square',.1); shake(.5); }
function sndWin(){ [500,700,900,1100,1300].forEach((f,i)=>setTimeout(()=>sfx(f,.2,'triangle',.15),i*80)); }
function sndChest(){ sfx(400,.1); sfx(600,.1,'triangle'); sfx(900,.15,'triangle',.15); }
function sndStep(){ sfx(100+Math.random()*50,.03,'triangle',.03); }
function sndTrap(){ sfx(200,.15,'square',.15); sfx(150,.2,'sawtooth',.1); shake(.15); }
function sndBreak(){ sfx(120,.2,'sawtooth',.12); sfx(80,.25,'square',.08); shake(.1); }
function sndNote(){ sfx(600,.15,'sine',.1); sfx(800,.1,'triangle',.08); }
function sndTeleport(){ sfx(1200,.15,'sine',.1); sfx(800,.2,'triangle',.08); sfx(400,.25,'sine',.06); }

// Collision
function dist(a,b) { return Math.hypot(a.x-b.x, a.y-b.y); }

// Timer util
let gameTime = 0;
