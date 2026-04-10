// Sichuan Majiang tiles (108: wan/tiao/tong only)
const SUITS = {
  wan: { name: '万', color: 'wan' },
  tiao: { name: '条', color: 'tiao' },
  tong: { name: '饼', color: 'tong' },
};
const SUIT_NAMES = { wan: '万', tiao: '条', tong: '饼' };
// Display characters for ranks
const NUM_CHARS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

function createTileSet() {
  const tiles = [];
  let id = 0;
  for (const suit of Object.keys(SUITS)) {
    for (let rank = 1; rank <= 9; rank++) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({ id: id++, suit, rank });
      }
    }
  }
  return tiles;
}

function tileKey(t) { return `${t.suit}_${t.rank}`; }
function tileName(t) { return `${NUM_CHARS[t.rank - 1]}${SUITS[t.suit].name}`; }

function tileSort(a, b) {
  const o = { wan: 0, tiao: 1, tong: 2 };
  return o[a.suit] !== o[b.suit] ? o[a.suit] - o[b.suit] : a.rank - b.rank;
}

function renderTile(t, opts = {}) {
  const div = document.createElement('div');
  div.className = `tile ${SUITS[t.suit].color}`;
  div.dataset.id = t.id;
  div.innerHTML = `<span class="num">${NUM_CHARS[t.rank - 1]}</span><span class="suit-char">${SUITS[t.suit].name}</span>`;
  if (opts.dimQue) div.classList.add('que-dim');
  if (opts.faceDown) div.classList.add('face-down');
  if (opts.onClick) div.addEventListener('click', () => opts.onClick(t));
  return div;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
