// ===== Roguelike Layer: 霓虹雀馆 =====
const OPPONENTS = [
  { name: '阿蛇', emoji: '🐍', style: 'qingyise',
    opener: ['今晚只打一门','清一色，懂？','一条路走到黑'],
    peng: ['蛇要吃了','嘶~','给我'],
    gang: ['蛇吞象!','通通吃掉','嘶嘶嘶'],
    hu: ['蛇出洞了!','一条龙!','毒到你了吧'],
    zimo: ['闷声吃肉','蛇王驾到','嘶~~~'],
    react: ['切...','下次咬死你','哼'],
    reactPeng: ['又碰...','烦','嘶'],
    reactGang: ['杠什么杠','讨厌','哼'],
    reactHu: ['不可能!','运气而已','下次咬死你'] },
  { name: '黑客', emoji: '👩‍💻', style: 'balanced',
    opener: ['防火墙?不存在的','已入侵你的WiFi','你密码是123456吧'],
    peng: ['拦截成功','黑进去了','你的牌我都知道'],
    gang: ['DDoS攻击!','系统崩溃!','给爷爬'],
    hu: ['已破解','你被黑了','game over, noob'],
    zimo: ['开挂而已','这波是脚本','代码写得好'],
    react: ['菜','这也行?','lag了吧'],
    reactPeng: ['脚本小子','一般般','无聊'],
    reactGang: ['外挂吧?','举报了','开G了?'],
    reactHu: ['肯定作弊','不可能','查一下后台'] },
  { name: '老千', emoji: '🃏', style: 'pengpeng',
    opener: ['来来来，公平竞争','我从不出千','信我'],
    peng: ['碰!意外意外','巧了','纯靠运气'],
    gang: ['哎呀又杠了','手气而已','不好意思啊'],
    hu: ['纯属巧合','运气运气','我也没想到'],
    zimo: ['天意如此','我发誓没出千','哈哈哈哈'],
    react: ['有意思','你也会两手啊','嗯?'],
    reactPeng: ['哟~','学我呢?','还行'],
    reactGang: ['好家伙','有点东西','嗯?'],
    reactHu: ['这...','不是吧','你出千了吧?'] },
  { name: '铁手', emoji: '🦾', style: 'aggressive',
    opener: ['废话少说','打牌!','快!'],
    peng: ['碰!','拿来!','我的!'],
    gang: ['杠!!!','给钱!','哈!'],
    hu: ['胡了!起立!','赢了!','爽!'],
    zimo: ['自摸!!!','全部给钱!!!','哈哈哈!'],
    react: ['...','tch','再来'],
    reactPeng: ['哼','无所谓','切'],
    reactGang: ['...!','烦!','tch!'],
    reactHu: ['可恶!','再来!','不服!'] },
  { name: '幽灵', emoji: '👻', style: 'qingyise',
    opener: ['...','嘘...','你看不见我'],
    peng: ['...碰','嘘','(无声)'],
    gang: ['...杠','(阴笑)','嘿嘿'],
    hu: ['...胡了','消失~','(冷笑)'],
    zimo: ['...','幽灵不需要运气','再见'],
    react: ['...','(叹气)','无所谓'],
    reactPeng: ['...','(盯)','嗯'],
    reactGang: ['...','(飘走)','(无表情)'],
    reactHu: ['...','(消失)','(沉默)'] },
  { name: '赌神', emoji: '🎰', style: 'balanced',
    opener: ['赌的就是命','今晚我做庄','都是小场面'],
    peng: ['小意思','正常操作','碰'],
    gang: ['杠，基本操作','小case','收'],
    hu: ['赌神从不失手','意料之中','这就是实力'],
    zimo: ['天选之人','赌神!','命运在我手中'],
    react: ['有点东西','不错不错','嗯'],
    reactPeng: ['还行','一般般','嗯'],
    reactGang: ['有点意思','不错','哦?'],
    reactHu: ['运气不错','下把看我的','嗯'] },
  { name: '妈妈桑', emoji: '💅', style: 'pengpeng',
    opener: ['来~坐坐','别紧张嘛','姐姐教你打牌'],
    peng: ['姐要了~','这个归我','乖~'],
    gang: ['杠~谢谢哦','发财啦~','开心~'],
    hu: ['姐赢了~','请客吃饭吧','谢谢宝贝们'],
    zimo: ['姐就是厉害~','自摸~么么哒','哎呀~'],
    react: ['哎呀~','宝贝好厉害','嗯哼'],
    reactPeng: ['哟~','宝贝也会碰呀','嗯~'],
    reactGang: ['好厉害~','发财了呀','哎呀'],
    reactHu: ['讨厌~','人家不开心了','哼~'] },
  { name: '九龙', emoji: '🐉', style: 'aggressive',
    opener: ['九龙城寨的规矩','输了别哭','坐下'],
    peng: ['碰','拿走','嗯'],
    gang: ['杠。收钱','刮风了','下雨了'],
    hu: ['胡。结账','龙抬头','散了'],
    zimo: ['自摸。三家付钱','龙王驾到','跪下'],
    react: ['还行','有胆量','哼'],
    reactPeng: ['嗯','随便','无所谓'],
    reactGang: ['哦','有点意思','嗯'],
    reactHu: ['哼','下次没这么好运','记住了'] },
];

const RELICS = [
  { id: 'xray', icon: '👁', name: '透视眼', nameEn: 'X-Ray', desc: '看到一个对手的手牌', descEn: 'See one opponent\'s hand', apply(g) { g._xrayCount = Math.max(g._xrayCount||0, 1); } },
  { id: 'pot', icon: '🏺', name: '聚宝盆', nameEn: 'Gold Pot', desc: '杠牌收入x2(可叠加)', descEn: 'Gang income x2 (stacks)', apply(g) { g._gangMulti = (g._gangMulti||1)*2; } },
  { id: 'shield', icon: '🛡', name: '铁壁', nameEn: 'Shield', desc: '输钱减少30%(可叠加)', descEn: 'Reduce losses 30% (stacks)', apply(g) { g._shield = Math.max(0.1,(g._shield||1)-0.3); } },
  { id: 'swap', icon: '🔄', name: '换牌术', nameEn: 'Tile Swap', desc: '每局可换1张手牌(可叠加)', descEn: 'Swap 1 tile/round (stacks)', apply(g) { g._swapMax = (g._swapMax||0)+1; g._canSwap = true; } },
  { id: 'luck', icon: '🍀', name: '好运符', nameEn: 'Lucky Charm', desc: '起手少2张缺门牌', descEn: 'Start with 2 fewer void tiles', apply(g) { g._luckyDeal = true; } },
  { id: 'interest', icon: '📈', name: '利息', nameEn: 'Interest', desc: '每局开始+$5(可叠加)', descEn: '+$5 per round (stacks)', apply(g) { g._healPerRound = (g._healPerRound||0)+5; } },
  { id: 'double', icon: '⚡', name: '双倍赌注', nameEn: 'Double Down', desc: '赢钱x2(可叠加)', descEn: 'Winnings x2 (stacks)', apply(g) { g._winMulti = (g._winMulti||1)*2; } },
  { id: 'ting', icon: '📡', name: '扫描仪', nameEn: 'Scanner', desc: '显示所有人的听牌', descEn: 'Show all players\' waits', apply(g) { g._scanTing = true; } },
  { id: 'combo', icon: '🔥', name: '连胜火焰', nameEn: 'Win Streak', desc: '连胜时额外+底分x连胜数(可叠加)', descEn: '+base×streak per win (stacks)', apply(g) { g._comboBonus = (g._comboBonus||0)+1; } },
  { id: 'magnet', icon: '🧲', name: '吸金石', nameEn: 'Magnet', desc: '碰/杠时额外+$1(可叠加)', descEn: '+$1 per peng/gang (stacks)', apply(g) { g._meldBonus = (g._meldBonus||0)+1; } },
  { id: 'armor', icon: '💎', name: '钻石甲', nameEn: 'Diamond', desc: '每局最多输底分x8', descEn: 'Max loss = base×8', apply(g) { g._lossLimit = true; } },
  // === Combo relics ===
  { id: 'qys_boost', icon: '🌈', name: '清一色大师', nameEn: 'Flush Master', desc: '清一色额外+底分x10(可叠加)', descEn: 'Flush bonus +base×10 (stacks)', apply(g) { g._qysBonus = (g._qysBonus||0)+10; } },
  { id: 'zimo_boost', icon: '🎯', name: '自摸达人', nameEn: 'Self-Draw Pro', desc: '自摸额外+底分x5(可叠加)', descEn: 'Self-draw +base×5 (stacks)', apply(g) { g._zimoBonus = (g._zimoBonus||0)+5; } },
  { id: 'gang_chain', icon: '⛓', name: '连杠', nameEn: 'Gang Chain', desc: '每次杠后下次杠收入+50%(可叠加)', descEn: 'Each gang +50% next gang (stacks)', apply(g) { g._gangChain = (g._gangChain||0)+0.5; } },
  { id: 'peng_refund', icon: '🔁', name: '碰碰返利', nameEn: 'Peng Cashback', desc: '碰牌时返还底分x1(可叠加)', descEn: 'Peng refund base×1 (stacks)', apply(g) { g._pengRefund = (g._pengRefund||0)+1; } },
  { id: 'insurance', icon: '📋', name: '保险', nameEn: 'Insurance', desc: '点炮时只付一半(可叠加)', descEn: 'Pay half when dealt in (stacks)', apply(g) { g._insurance = Math.max(0.1,(g._insurance||1)-0.5); } },
  { id: 'greed', icon: '👑', name: '贪婪王冠', nameEn: 'Greed Crown', desc: '胡牌番数+1(可叠加)', descEn: '+1 fan when winning (stacks)', apply(g) { g._extraFan = (g._extraFan||0)+1; } },
  { id: 'vampire', icon: '🧛', name: '吸血鬼', nameEn: 'Vampire', desc: '胡牌时回复赢钱的20%(可叠加)', descEn: 'Heal 20% of winnings (stacks)', apply(g) { g._vampHeal = (g._vampHeal||0)+0.2; } },
  { id: 'snowball', icon: '☃️', name: '雪球', nameEn: 'Snowball', desc: '每赢$100,永久底分+1(自动)', descEn: 'Every $100 won, +1 base (auto)', apply(g) { g._snowball = true; } },
  { id: 'tax', icon: '🏦', name: '收税官', nameEn: 'Tax Man', desc: 'AI每次杠你也收底分x1(可叠加)', descEn: 'Earn base×1 when AI gangs (stacks)', apply(g) { g._gangTax = (g._gangTax||0)+1; } },
  // === New: probability & sequence relics ===
  { id: 'gang_luck', icon: '🎲', name: '杠运', nameEn: 'Gang Luck', desc: '起手更容易拿到4张一样的牌', descEn: 'Higher chance of quads in hand', apply(g) { g._gangLuck = (g._gangLuck||0)+1; } },
  { id: 'pair_luck', icon: '🎎', name: '对子运', nameEn: 'Pair Luck', desc: '起手更多对子', descEn: 'More pairs in starting hand', apply(g) { g._pairLuck = (g._pairLuck||0)+1; } },
  { id: 'seq_luck', icon: '📶', name: '顺子运', nameEn: 'Sequence Luck', desc: '起手更多连着的牌', descEn: 'More sequences in starting hand', apply(g) { g._seqLuck = (g._seqLuck||0)+1; } },
  { id: 'seq_bonus', icon: '🔗', name: '连环计', nameEn: 'Chain Bonus', desc: '每多1个顺子,胡牌+底分x3(可叠加)', descEn: '+base×3 per sequence in hand (stacks)', apply(g) { g._seqBonus = (g._seqBonus||0)+3; } },
];

const EVENTS = [
  { title: '🎲 地下赌局', desc: '一个神秘人邀你对赌。',
    choices: [
      { text: '赌! (55%赢$15)', cls: 'danger', fn(r) { if (Math.random()>0.45) { r.addMoney(15); return '赢了! +$15'; } else { r.addMoney(-10); return '输了... -$10'; } } },
      { text: '算了', cls: 'safe', fn() { return '明智的选择。'; } },
    ]},
  { title: '💎 黑市交易', desc: '有人低价出售筹码。',
    choices: [
      { text: '买入 (+$20)', cls: 'safe', fn(r) { r.addMoney(20); return '好deal! +$20'; } },
    ]},
  { title: '🔧 改装店', desc: '老板说可以帮你"调整运气"。',
    choices: [
      { text: '花$5试试', cls: 'danger', fn(r) { r.addMoney(-5); if(Math.random()>0.4){r.addMoney(15);return '改装成功! 净赚$10';} return '什么都没变... -$5'; } },
      { text: '离开', cls: 'safe', fn() { return '下次再来。'; } },
    ]},
  { title: '🎰 老虎机', desc: '投$10试试运气？',
    choices: [
      { text: '投币!', cls: 'danger', fn(r) { r.addMoney(-10); if(Math.random()>0.65){r.addMoney(35);return '🎰 JACKPOT! 净赚$25!';} return '什么都没中... -$10'; } },
      { text: '路过', cls: 'safe', fn() { return '赌博害人。'; } },
    ]},
  { title: '🍜 大排档', desc: '吃碗云吞面休息一下。',
    choices: [
      { text: '吃面 (+$5)', cls: 'safe', fn(r) { r.addMoney(5); return '好吃! +$5'; } },
    ]},
];

// Powerful starter relics — pick 1 at the beginning
const STARTER_RELICS = [
  { id: 's_dragon', icon: '🐲', name: '龙脉', nameEn: 'Dragon Vein', desc: '所有番数+2', descEn: '+2 fan to all wins', apply(g) { g._extraFan = (g._extraFan||0)+2; } },
  { id: 's_golden', icon: '🌟', name: '金手指', nameEn: 'Golden Touch', desc: '起手必有1个对子+1个刻子', descEn: 'Start with a pair + triplet', apply(g) { g._goldenDeal = true; } },
  { id: 's_ghost', icon: '👻', name: '鬼眼', nameEn: 'Ghost Eye', desc: '看到一个对手的手牌(可与透视眼叠加)', descEn: 'See 1 opponent\'s hand (stacks with X-Ray)', apply(g) { g._xrayCount = (g._xrayCount||0)+1; } },
  { id: 's_bank', icon: '🏦', name: '瑞士银行', nameEn: 'Swiss Bank', desc: '起始$50，每局利息+$10', descEn: 'Start $50, +$10/round', apply(g) { g._healPerRound = (g._healPerRound||0)+10; } },
  { id: 's_chaos', icon: '🎪', name: '混沌之心', nameEn: 'Chaos Heart', desc: '每局随机获得一个临时法宝', descEn: 'Random temp relic each round', apply(g) { g._chaos = true; } },
  { id: 's_thief', icon: '🗝', name: '神偷', nameEn: 'Master Thief', desc: '每局可换3张牌', descEn: 'Swap 3 tiles/round', apply(g) { g._swapMax = 3; g._canSwap = true; } },
  { id: 's_chameleon', icon: '🦎', name: '变色龙', nameEn: 'Chameleon', desc: '每局可变3张牌的花色', descEn: 'Change 3 tiles\' suit/round', apply(g) { g._chameleon = 3; } },
];

// Relic unlock tiers — relics unlock as you reach higher floors
const RELIC_TIERS = {
  // tier 0: always available
  0: ['shield','swap','luck','interest','magnet','peng_refund','pair_luck'],
  // tier 1: unlock at 3F
  3: ['pot','combo','armor','insurance','xray','gang_luck','seq_luck'],
  // tier 2: unlock at 5F
  5: ['double','ting','zimo_boost','qys_boost','gang_chain','tax','seq_bonus'],
  // tier 3: unlock at 7F
  7: ['greed','vampire','snowball'],
};

function relicName(r) { return LANG==='en' && r.nameEn ? r.nameEn : r.name; }
function relicDesc(r) { return LANG==='en' && r.descEn ? r.descEn : r.desc; }

class RogueGame {
  constructor() {
    this.floor = 1;
    this.maxFloor = 8;
    this.money = 10;
    this.relics = [];
    this.winStreak = 0;
    this.state = 'title';
  }

  showTitle() {
    this.state = 'title';
    const el = document.getElementById('rogue-screen');
    el.style.display = 'flex';
    el.innerHTML = `<div class="rogue-panel">
      <h1>${t('title')}</h1>
      <h2>${t('subtitle')}</h2>
      <p>${t('intro')}</p>
      <button class="event-btn danger" onclick="rogue.showStarterPick()">${t('enter')}</button>
    </div>`;
    this.updateUI();
  }

  showStarterPick() {
    const picks = [...STARTER_RELICS].sort(() => Math.random()-0.5).slice(0,3);
    const el = document.getElementById('rogue-screen');
    const zh = LANG==='zh';
    let html = `<div class="rogue-panel">
      <h2>${zh?'选择你的天赋':'Choose your Gift'}</h2>
      <p style="color:#888">${zh?'强力起始法宝，决定你的打法':'A powerful starter relic to define your style'}</p>
      <div class="relic-cards">`;
    picks.forEach((r,i) => {
      html += `<div class="relic-card" onclick="rogue.pickStarter(${i})" style="border-color:rgba(255,215,0,0.4)">
        <div class="relic-icon" style="font-size:42px">${r.icon}</div>
        <div class="relic-name" style="color:#ffd700">${relicName(r)}</div>
        <div class="relic-desc">${relicDesc(r)}</div>
      </div>`;
    });
    html += '</div></div>';
    el.innerHTML = html;
    this._starterPicks = picks;
  }

  pickStarter(i) {
    const r = this._starterPicks[i];
    this.startRun(r);
  }

  startRun(starterRelic) {
    this.floor = 1;
    this.money = 10;
    this.relics = [];
    this.winStreak = 0;
    // Reset all game relic flags
    game._gangMulti=1; game._shield=1; game._canSwap=false; game._luckyDeal=false;
    game._healPerRound=0; game._winMulti=1; game._xrayCount=0; game._scanTing=false;
    game._comboBonus=0; game._meldBonus=0; game._lossLimit=false; game._doubleStakes=false;
    game._qysBonus=0; game._zimoBonus=0; game._gangChain=0; game._pengRefund=0;
    game._insurance=1; game._extraFan=0; game._vampHeal=0; game._snowball=false;
    game._snowballBase=0; game._gangTax=0; game._swapMax=0; game._goldenDeal=false;
    game._chaos=false; game._gangLuck=0; game._pairLuck=0; game._seqLuck=0; game._seqBonus=0; game._chameleon=0;
    // Apply starter relic
    if (starterRelic) {
      this.relics.push(starterRelic);
      starterRelic.apply(game);
      if (starterRelic.id === 's_bank') this.money = 50;
    }
    this.startFloor();
  }

  startFloor() {
    this.state = 'playing';
    document.getElementById('rogue-screen').style.display = 'none';

    // Difficulty scaling: exponential base score — late game is insane
    // 1F:$1, 2F:$2, 3F:$5, 4F:$15, 5F:$50, 6F:$150, 7F:$500, 8F:$2000
    const baseTable = [5, 10, 20, 50, 100, 500, 1000, 5000];
    BASE = baseTable[Math.min(this.floor-1, baseTable.length-1)];


    // Interest relic
    if (game._healPerRound) {
      this.addMoney(game._healPerRound);
      this.showFloater(`📈 +$${game._healPerRound}`);
    }

    // 混沌之心: random temp relic each round
    if (game._chaos) {
      const tempPool = RELICS.filter(r=>!['snowball','armor'].includes(r.id));
      const temp = tempPool[Math.floor(Math.random()*tempPool.length)];
      temp.apply(game);
      this._chaosTemp = temp;
      // Show after a delay so it doesn't get overwritten
      const name = relicName(temp);
      setTimeout(() => {
        const el = document.getElementById('msg-bar');
        el.textContent = `🎪 混沌之心: ${name}!`;
        setTimeout(() => el.textContent = '', 3000);
      }, 1000);
    }

    // Boss floors: tougher opponents
    const pool = [...OPPONENTS];
    let ops;
    if (this.floor >= 7) {
      const bosses = pool.filter(o => o.style==='aggressive'||o.name==='赌神');
      const rest = pool.filter(o => !bosses.includes(o));
      ops = [...bosses.sort(()=>Math.random()-0.5).slice(0,2), ...rest.sort(()=>Math.random()-0.5).slice(0,1)];
    } else {
      ops = pool.sort(()=>Math.random()-0.5).slice(0,3);
    }
    this.opponents = [null, ops[0], ops[1], ops[2]];
    document.getElementById('name-1').textContent = `${ops[0].emoji}${ops[0].name}`;
    document.getElementById('name-2').textContent = `${ops[1].emoji}${ops[1].name}`;
    document.getElementById('name-3').textContent = `${ops[2].emoji}${ops[2].name}`;
    this.updateUI();
    game.start();
  }

  onGameEnd(scores) {
    this._chaosTemp = null;
    this.updateUI();
    let base = scores[0];
    const won = base > 0;
    let breakdown = [`基础: ${base>=0?'+':''}$${base}`];

    if (won) {
      // 👑 贪婪王冠 / 🐲 龙脉: already applied in doWin via _extraFan

      // 🌈 清一色大师: bonus if any win was qingyise
      if (game._qysBonus && game.winDetails.some(w=>w.fans.some(f=>f.name.includes('清')))) {
        const bonus = BASE * game._qysBonus;
        base += bonus;
        breakdown.push(`🌈清一色大师: +$${bonus}`);
      }

      // 🎯 自摸达人: bonus if self-draw win
      if (game._zimoBonus && game.winDetails.some(w=>w.winner===0&&w.selfDraw)) {
        const bonus = BASE * game._zimoBonus;
        base += bonus;
        breakdown.push(`🎯自摸达人: +$${bonus}`);
      }

      // 🔗 连环计: bonus per sequence in winning hand
      if (game._seqBonus && game.winDetails.some(w=>w.winner===0)) {
        // Count sequences in player's hand
        const h = game.hands[0], c = {};
        h.forEach(t=>{ const k=tileKey(t); c[k]=(c[k]||0)+1; });
        let seqs = 0;
        for (const k of Object.keys(c).sort()) {
          const [s,rr]=k.split('_'), r=+rr;
          const k2=`${s}_${r+1}`,k3=`${s}_${r+2}`;
          if ((c[k2]||0)>0&&(c[k3]||0)>0) seqs++;
        }
        if (seqs>0) {
          const bonus = BASE * game._seqBonus * seqs;
          base += bonus;
          breakdown.push(`🔗连环计 ${seqs}顺: +$${bonus}`);
        }
      }

      // ⚡ 双倍赌注
      if (game._winMulti > 1) {
        const old = base;
        base = base * game._winMulti;
        breakdown.push(`⚡双倍赌注 x${game._winMulti}: +$${base - old}`);
      }

      // 🔥 连胜火焰
      this.winStreak++;
      if (game._comboBonus && this.winStreak > 1) {
        const bonus = BASE * game._comboBonus * this.winStreak;
        base += bonus;
        breakdown.push(`🔥连胜x${this.winStreak}: +$${bonus}`);
      }

      // 🧛 吸血鬼: heal % of winnings
      if (game._vampHeal) {
        const heal = Math.floor(base * game._vampHeal);
        base += heal;
        breakdown.push(`🧛吸血鬼 +${Math.round(game._vampHeal*100)}%: +$${heal}`);
      }

      // ☃️ 雪球: permanent base increase
      if (game._snowball) {
        const earned = base;
        const bonusBase = Math.floor(earned / 100);
        if (bonusBase > 0) {
          game._snowballBase = (game._snowballBase||0) + bonusBase;
          breakdown.push(`☃️雪球: 永久底分+${bonusBase}`);
        }
      }
    } else {
      this.winStreak = 0;

      // 📋 保险: pay less when dealt in
      if (game._insurance && game._insurance < 1) {
        const old = base;
        base = Math.ceil(base * game._insurance);
        breakdown.push(`📋保险: 减免$${base - old}`);
      }

      // 🛡 铁壁
      if (game._shield < 1) {
        const old = base;
        base = Math.ceil(base * game._shield);
        breakdown.push(`🛡铁壁: 减免$${base - old}`);
      }

      // 💎 钻石甲
      if (game._lossLimit) {
        const limit = -(BASE * 8);
        if (base < limit) {
          base = limit;
          breakdown.push(`💎钻石甲: 最多输$${-limit}`);
        }
      }
    }

    const final = base;
    this.addMoney(final);

    // Show breakdown popup
    this.showBreakdown(breakdown, final, won);

    // Store next action, triggered by player clicking "继续"
    if (this.money <= 0) { this._nextAction = () => this.gameOver(); }
    else if (this.floor >= this.maxFloor && this.money >= 100000) { this._nextAction = () => this.victory(); }
    else {
      this._nextAction = () => this.showFloorChoice();
    }
  }

  showFloorChoice() {
    const entryTable = [10, 20, 50, 100, 500, 1000, 5000, 100000];
    const nextEntry = entryTable[Math.min(this.floor, entryTable.length-1)];
    const canGoUp = this.money >= nextEntry;
    const el = document.getElementById('rogue-screen');
    el.style.display = 'flex';
    const zh = LANG==='zh';
    let html = `<div class="rogue-panel">
      <h2>${this.floor}F</h2>
      <p style="color:#ff0">💰 $${this.money}</p>`;
    if (canGoUp) {
      html += `<p>${zh?`可以上${this.floor+1}F了！`:'Ready for '+(this.floor+1)+'F!'}</p>
      <div class="event-choices">
        <button class="event-btn danger" onclick="rogue.goUpFloor()">${zh?`上${this.floor+1}F`:'Go Up'}</button>
        <button class="event-btn safe" onclick="rogue.stayFloor()">${zh?'留在这层':'Stay'}</button>
      </div>`;
    } else {
      html += `<p style="color:#888">${zh?`上${this.floor+1}F需要身价`:'Need'} $${nextEntry} (${zh?'还差':'need'} $${nextEntry-this.money})</p>
      <div class="event-choices">
        <button class="event-btn safe" onclick="rogue.stayFloor()">${zh?'继续在这层打':'Keep Playing'}</button>
      </div>`;
    }
    html += '</div>';
    el.innerHTML = html;
  }

  goUpFloor() {
    this.floor++;
    const r = Math.random();
    if (r > 0.66) this.showEvent();
    else if (r > 0.33) this.showShop();
    else this.showRelicPick();
  }

  stayFloor() {
    // Stay on same floor, play again
    document.getElementById('rogue-screen').style.display = 'none';
    this.startFloor();
  }

  proceed() {
    document.getElementById('modal').style.display = 'none';
    if (this._nextAction) { this._nextAction(); this._nextAction = null; }
  }

  showBreakdown(lines, total, won) {
    const el = document.getElementById('center-msg');
    const color = won ? '#00ff88' : '#ff0055';
    let html = lines.map(l => `<div style="font-size:1.2vw">${l}</div>`).join('');
    html += `<div style="font-size:2vw;color:${color};margin-top:0.3vw">${total>=0?'+':''}$${total}</div>`;
    if (this.winStreak > 1) html += `<div style="font-size:1vw;color:#ff8800">🔥 ${this.winStreak}连胜!</div>`;
    el.innerHTML = html;
    el.style.animation = 'none'; el.offsetHeight;
    el.style.animation = 'centerPop 3s ease-out forwards';
  }

  showFloater(text) {
    const el = document.getElementById('center-msg');
    el.textContent = text;
    el.style.animation = 'none'; el.offsetHeight;
    el.style.animation = 'centerPop 2s ease-out forwards';
  }

  getAvailableRelics() {
    const nonStackable = ['xray','luck','ting','armor','snowball'];
    const ownedIds = this.relics.map(r=>r.id);
    // Unlock tiers based on current floor
    let unlockedIds = [];
    for (const [tier, ids] of Object.entries(RELIC_TIERS)) {
      if (this.floor >= +tier) unlockedIds.push(...ids);
    }
    return RELICS.filter(r => unlockedIds.includes(r.id) && (!nonStackable.includes(r.id) || !ownedIds.includes(r.id)));
  }

  showRelicPick() {
    this.state = 'relic';
    const available = this.getAvailableRelics();
    const ownedIds = this.relics.map(r=>r.id);
    const picks = [...available].sort(() => Math.random() - 0.5).slice(0, 3);
    const el = document.getElementById('rogue-screen');
    el.style.display = 'flex';
    let html = `<div class="rogue-panel">
      <h2>${this.floor}F — ${t('pickRelic')}</h2>
      <p>💰 $${this.money} ${this.winStreak>1?`| 🔥${this.winStreak}${t('streak')}`:''}</p>
      <div class="relic-cards">`;
    picks.forEach((r, i) => {
      const count = ownedIds.filter(id=>id===r.id).length;
      const stackLabel = count > 0 ? ` <span style="color:#ff0">[${t('owned')}${count}${t('ge')}]</span>` : '';
      html += `<div class="relic-card" onclick="rogue.pickRelic(${i})">
        <div class="relic-icon">${r.icon}</div>
        <div class="relic-name">${relicName(r)}${stackLabel}</div>
        <div class="relic-desc">${relicDesc(r)}</div>
      </div>`;
    });
    html += '</div>';
    // Show current relics
    if (this.relics.length) {
      html += `<div style="margin-top:16px;font-size:13px;color:#888">${t('relics')}: ${this.relics.map(r=>`<span style="color:#0ff">${r.icon}${relicName(r)}</span>`).join(' ')}</div>`;
    }
    html += '</div>';
    el.innerHTML = html;
    this._relicPicks = picks;
  }

  pickRelic(i) {
    const r = this._relicPicks[i];
    this.relics.push(r);
    r.apply(game);
    SFX.hu();
    this.updateUI();
    this.startFloor();
  }

  showShop() {
    const available = this.getAvailableRelics();
    const ownedIds = this.relics.map(r=>r.id);
    const items = [...available].sort(() => Math.random() - 0.5).slice(0, 4);
    const prices = { xray:15, pot:12, shield:12, swap:8, luck:10, interest:10, double:18, ting:15, combo:10, magnet:8, armor:15, qys_boost:14, zimo_boost:12, gang_chain:10, peng_refund:8, insurance:12, greed:20, vampire:16, snowball:25, tax:10, gang_luck:12, pair_luck:10, seq_luck:10, seq_bonus:14 };

    const el = document.getElementById('rogue-screen');
    el.style.display = 'flex';
    let html = `<div class="rogue-panel">
      <h2>🏪 ${LANG==='en'?'Black Market':'黑市商店'}</h2>
      <p style="color:#ff0">💰 $${this.money}</p>
      <div class="relic-cards">`;
    items.forEach((r, i) => {
      const count = ownedIds.filter(id=>id===r.id).length;
      const basePrice = prices[r.id] || 10;
      const price = Math.round(basePrice * Math.pow(1.8, count)); // 1.8x per stack
      const canBuy = this.money >= price;
      const stackLabel = count > 0 ? ` <span style="color:#ff0">[${t('owned')}${count}${t('ge')}]</span>` : '';
      html += `<div class="relic-card${canBuy?'':' sold-out'}" onclick="${canBuy?`rogue.buyRelic(${i})`:''}">
        <div class="relic-icon">${r.icon}</div>
        <div class="relic-name">${relicName(r)}${stackLabel}</div>
        <div class="relic-desc">${relicDesc(r)}</div>
        <div style="margin-top:6px;color:${canBuy?'#0f0':'#f00'};font-size:14px">$${price}</div>
      </div>`;
    });
    html += `</div>
      <button class="event-btn safe" onclick="rogue.leaveShop()" style="margin-top:16px">${LANG==='en'?'Leave':'离开'}</button>`;
    if (this.relics.length) {
      html += `<div style="margin-top:12px;font-size:13px;color:#888">${t('relics')}: ${this.relics.map(r=>`<span style="color:#0ff">${r.icon}${relicName(r)}</span>`).join(' ')}</div>`;
    }
    html += '</div>';
    el.innerHTML = html;
    this._shopItems = items;
    this._shopPrices = prices;
  }

  buyRelic(i) {
    const r = this._shopItems[i];
    const basePrice = this._shopPrices[r.id] || 10;
    const count = this.relics.filter(x=>x.id===r.id).length;
    const price = Math.round(basePrice * Math.pow(1.8, count));
    if (this.money < price) return;
    this.addMoney(-price);
    this.relics.push(r);
    r.apply(game);
    SFX.hu();
    this.updateUI();
    // Refresh shop
    this.showShop();
  }

  leaveShop() {
    this.startFloor();
  }

  showEvent() {
    this.state = 'event';
    const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const el = document.getElementById('rogue-screen');
    el.style.display = 'flex';
    let html = `<div class="rogue-panel">
      <h2>${evt.title}</h2>
      <p>${evt.desc}</p>
      <p style="color:#ff0">💰 $${this.money}</p>
      <div class="event-choices">`;
    evt.choices.forEach((c, i) => {
      html += `<button class="event-btn ${c.cls}" onclick="rogue.resolveEvent(${i})">${c.text}</button>`;
    });
    html += '</div><div id="event-result" style="margin-top:12px;color:#0ff"></div></div>';
    el.innerHTML = html;
    this._eventChoices = evt.choices;
  }

  resolveEvent(i) {
    const result = this._eventChoices[i].fn(this);
    document.getElementById('event-result').textContent = result;
    this.updateUI();
    if (this.money <= 0) { setTimeout(() => this.gameOver(), 1500); return; }
    setTimeout(() => this.showRelicPick(), 1500);
  }

  addMoney(n) {
    this.money = Math.max(0, this.money + n);
    this.updateUI();
  }

  gameOver() {
    this.state = 'gameover';
    const el = document.getElementById('rogue-screen');
    el.style.display = 'flex';
    el.innerHTML = `<div class="rogue-panel">
      <h1 style="color:#ff0055">${t('gameOver')}</h1>
      <h2>${t('chipsBusted')}</h2>
      <p>${t('youFell')} ${this.floor}${t('floorF')}<br>${t('lostSoul')}</p>
      <p style="color:#888">${t('relics')}: ${this.relics.map(r=>r.icon).join(' ')||'-'}</p>
      <button class="event-btn danger" onclick="rogue.showTitle()">${t('restart')}</button>
    </div>`;
  }

  victory() {
    this.state = 'victory';
    const el = document.getElementById('rogue-screen');
    el.style.display = 'flex';
    el.innerHTML = `<div class="rogue-panel">
      <h1 style="color:#ff0">${t('victory')}</h1>
      <h2>${t('conquered')}</h2>
      <p>💰 ${t('finalChips')}: $${this.money}</p>
      <p>${t('relics')}: ${this.relics.map(r=>`${r.icon}${r.name}`).join(' ')}</p>
      <button class="event-btn danger" onclick="rogue.showTitle()">${t('again')}</button>
    </div>`;
    SFX.hu();
  }

  updateUI() {
    document.getElementById('floor-info').textContent = `${this.floor}F / ${this.maxFloor}F`;
    document.getElementById('hp-text').textContent = `$${this.money}`;
    document.getElementById('hp-fill').style.width = `${Math.min(100, (this.money/10)*100)}%`;
    const fill = document.getElementById('hp-fill');
    if (this.money > 30) fill.style.background = 'linear-gradient(90deg, #00ff88, #00cc66)';
    else if (this.money > 15) fill.style.background = 'linear-gradient(90deg, #ffaa00, #ff6600)';
    else fill.style.background = 'linear-gradient(90deg, #ff0044, #cc0033)';
    // Relics display with names
    const rd = document.getElementById('relics-display');
    let badges = this.relics.map(r => `<span class="relic-badge"><span class="relic-label">${relicName(r)}</span><span class="relic-tooltip">${relicName(r)}: ${relicDesc(r)}</span></span>`);
    if (this._chaosTemp) {
      badges.push(`<span class="relic-badge" style="border-color:rgba(255,0,255,0.4)"><span class="relic-label" style="color:#f0f">${relicName(this._chaosTemp)}(${LANG==='en'?'temp':'暂时'})</span><span class="relic-tooltip">${relicName(this._chaosTemp)}: ${relicDesc(this._chaosTemp)}</span></span>`);
    }
    rd.innerHTML = badges.join('');
    // Streak
    const streak = this.winStreak > 1 ? ` | 🔥${this.winStreak}` : '';
    const entryTable = [10, 20, 50, 100, 500, 1000, 5000, 100000];
    const nextEntry = this.floor < this.maxFloor ? entryTable[this.floor] : 0;
    const nextStr = nextEntry > 0 ? ` | ${LANG==='en'?'Next req':'到下层所需身价'}: $${nextEntry}` : '';
    document.getElementById('floor-info').textContent = `${this.floor}F/${this.maxFloor}F | 底$${typeof BASE!=='undefined'?BASE:1}${streak}${nextStr}`;
  }
}

const rogue = new RogueGame();

const _origEndGame = MajiangGame.prototype.endGame;
MajiangGame.prototype.endGame = function() {
  _origEndGame.call(this);
  if (rogue.state === 'playing') rogue.onGameEnd(this.scores);
};

window.addEventListener('load', () => rogue.showTitle());
