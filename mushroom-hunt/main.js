// main.js — game loop and init
function init() {
  genMap();
  initEntities();
}

let lastT = 0;
function loop(now) {
  const dt = Math.min(.05, (now-(lastT||now))/1000);
  lastT = now;

  if (gameState==='play'||gameState==='bossfight') {
    gameTime += dt;
    stats.time = gameTime;
    updatePlayer(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateMsgs(dt);
    updateCam(player.x, player.y, dt);
  }

  if ((gameState==='dead'||gameState==='win') && keys['r']) init();

  drawWorld(now);
  drawHUD();
  clearJust();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', ()=>AC.resume(), {once:true});

init();
requestAnimationFrame(loop);
