// Sound effects using Web Audio API (no external files)
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let _actx;
function actx() { if (!_actx) _actx = new AudioCtx(); return _actx; }

const SFX = {
  // Tile place/discard - short click
  discard() {
    const c = actx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = 800;
    g.gain.setValueAtTime(0.3, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.08);
  },

  // Draw tile - soft tap
  draw() {
    const c = actx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = 600;
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.06);
  },

  // Peng - two knocks
  peng() {
    const c = actx();
    [0, 0.1].forEach(t => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'square'; o.frequency.value = 400;
      g.gain.setValueAtTime(0.25, c.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.1);
      o.connect(g); g.connect(c.destination);
      o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.1);
    });
  },

  // Gang - heavy thud
  gang() {
    const c = actx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = 200;
    o.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.2);
    g.gain.setValueAtTime(0.35, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.25);
  },

  // Hu - victory fanfare
  hu() {
    const c = actx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t = c.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 0.3);
    });
  },

  // Game start
  start() {
    const c = actx();
    [440, 554, 659].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      const t = c.currentTime + i * 0.08;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 0.2);
    });
  },

  // Button click
  click() {
    const c = actx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = 1000;
    g.gain.setValueAtTime(0.1, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.04);
  },
};
