// ===== i18n =====
let LANG = 'zh';

const I18N = {
  zh: {
    title: '霓虹雀馆', subtitle: 'NEON SPARROW HOUSE',
    intro: '2077年，香港九龙城寨的地下雀馆。<br>你带着$10筹码走进来。<br>打8层，赢光所有人的钱。<br>输光了...就永远留在这里。',
    enter: '进入雀馆', restart: '重新开始', again: '再来一次', cont: '继续',
    floor: '楼层', remain: '剩余', tiles: '张', score: '本局',
    current: '当前', you: '你',
    queTitle: '定缺 — 选择要缺的花色',
    wan: '万', tiao: '条', tong: '饼', que: '缺',
    hu: '胡', peng: '碰', gang: '杠', pass: '过', swap: '🔄换牌', fast: '⏩快进',
    zimo: '自摸', dianpao: '点炮', pinghu: '平胡',
    angang: '暗杠', bugang: '补杠', minggang: '明杠',
    gameOver: 'GAME OVER', chipsBusted: '💀 筹码输光了',
    youFell: '你倒在了', floorF: 'F...', lostSoul: '九龙城寨又多了一个失踪者。',
    victory: '🏆 通关!', conquered: '你征服了霓虹雀馆',
    finalChips: '最终筹码', relics: '法宝',
    pickRelic: '选择法宝', pickRelicSub: '选一个带上楼',
    owned: '已有', ge: '个',
    gameEnd: '游戏结束', base: '基础',
    streak: '连胜', huazhu: '花猪', chajiao: '查叫', weiting: '未听', tingpai: '听牌',
    each: '每家', from: '来自',
    swapMsg: '点击一张手牌换掉', swapLeft: '剩', swapTimes: '次',
    swapDone: '换掉了', luckySwap: '好运符: 替换了2张缺门牌!',
    tingHint: '听牌',
    south: '南', east: '东', north: '北', west: '西',
  },
  en: {
    title: 'NEON SPARROW', subtitle: 'HOUSE',
    intro: '2077, underground majiang den in Kowloon Walled City.<br>You walk in with $10 chips.<br>Fight through 8 floors. Win everyone\'s money.<br>Go broke... and you stay here forever.',
    enter: 'Enter', restart: 'Restart', again: 'Play Again', cont: 'Continue',
    floor: 'Floor', remain: 'Left', tiles: '', score: 'Round',
    current: 'Turn', you: 'You',
    queTitle: 'Choose suit to discard first',
    wan: 'Wan', tiao: 'Tiao', tong: 'Tong', que: 'No-',
    hu: 'Win!', peng: 'Peng', gang: 'Gang', pass: 'Pass', swap: '🔄Swap', fast: '⏩Fast',
    zimo: 'Self-draw', dianpao: 'dealt in', pinghu: 'Basic',
    angang: 'Concealed Gang', bugang: 'Add Gang', minggang: 'Open Gang',
    gameOver: 'GAME OVER', chipsBusted: '💀 Out of chips',
    youFell: 'You fell on', floorF: 'F...', lostSoul: 'Another soul lost in Kowloon.',
    victory: '🏆 Victory!', conquered: 'You conquered the Neon Sparrow House',
    finalChips: 'Final chips', relics: 'Relics',
    pickRelic: 'Choose a Relic', pickRelicSub: 'Pick one to take upstairs',
    owned: 'Have', ge: '',
    gameEnd: 'Game Over', base: 'Base',
    streak: 'Win Streak', huazhu: 'Flower Pig', chajiao: 'No-ting Penalty', weiting: 'Not Ready', tingpai: 'Ready',
    each: 'each', from: 'from',
    swapMsg: 'Click a tile to swap', swapLeft: '', swapTimes: 'left',
    swapDone: 'Swapped', luckySwap: 'Lucky: replaced 2 tiles!',
    tingHint: 'Waiting for',
    south: 'S', east: 'E', north: 'N', west: 'W',
  }
};

function t(key) { return (I18N[LANG] && I18N[LANG][key]) || I18N.zh[key] || key; }

function setLang(lang) {
  LANG = lang;
  document.getElementById('lang-btn').textContent = lang === 'zh' ? 'EN' : '中文';
  // Update static UI
  document.getElementById('btn-hu').textContent = t('hu');
  document.getElementById('btn-peng').textContent = t('peng');
  document.getElementById('btn-gang').textContent = t('gang');
  document.getElementById('btn-pass').textContent = t('pass');
  document.getElementById('btn-swap').textContent = t('swap');
  document.getElementById('btn-fast').textContent = t('fast');
}
