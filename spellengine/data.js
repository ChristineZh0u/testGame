// ── DATA DEFINITIONS — HOME DEFENSE THEME ─────────────────────────

const RARITY_COLORS = {
  common:    { border: '#888888', bg: '#1a1a2e', label: '★', labelColor: '#888' },
  uncommon:  { border: '#44cc44', bg: '#1a2e1a', label: '★★', labelColor: '#44cc44' },
  rare:      { border: '#4488ff', bg: '#1a1a3e', label: '★★★', labelColor: '#4488ff' },
  epic:      { border: '#aa44ff', bg: '#2a1a3e', label: '★★★★', labelColor: '#aa44ff' },
  legendary: { border: '#ffd700', bg: '#2e2a1a', label: '★★★★★', labelColor: '#ffd700' },
};

const SPELLS = {
  SlipperThrow: {
    name: 'Slipper Throw', type: 'spell', rarity: 'common', trigger: 'every_x_seconds', triggerVal: 2.5,
    effect: 'spawn_projectile', cooldown: 2.5, tags: ['physical', 'projectile'],
    desc: 'Throw a slipper at nearest bug', damage: 15, color: '#cc8844', emoji: '🩴', params: { speed: 4, range: 250 }
  },
  SprayOrbit: {
    name: 'Bug Spray', type: 'spell', rarity: 'common', trigger: 'every_x_seconds', triggerVal: 2,
    effect: 'spawn_orbiting_projectile', cooldown: 2, tags: ['chemical', 'orbit', 'projectile'],
    desc: 'Orbiting spray cloud', damage: 12, color: '#88cc44', emoji: '🧴', params: { speed: 2.5, range: 80 }
  },
  ToiletPaperOrb: {
    name: 'TP Orbit', type: 'spell', rarity: 'common', trigger: 'every_x_seconds', triggerVal: 3,
    effect: 'spawn_orbiting_projectile', cooldown: 3, tags: ['paper', 'orbit'],
    desc: 'Orbiting toilet paper roll', damage: 10, color: '#eeeecc', emoji: '🧻', params: { speed: 2, range: 100 }
  },
  Sneeze: {
    name: 'Sneeze Blast', type: 'spell', rarity: 'common', trigger: 'on_damage_taken', triggerVal: 0,
    effect: 'area_damage', cooldown: 4, tags: ['allergy'],
    desc: 'Sneeze AoE when bitten', damage: 20, color: '#ffdd44', emoji: '🤧', params: { radius: 90 }
  },
  VacuumOrbit: {
    name: 'Roomba', type: 'spell', rarity: 'uncommon', trigger: 'every_x_seconds', triggerVal: 2.5,
    effect: 'spawn_orbiting_projectile', cooldown: 2.5, tags: ['physical', 'orbit', 'projectile'],
    desc: 'Orbiting roomba sucks up bugs', damage: 14, color: '#666688', emoji: '🤖', params: { speed: 3, range: 90 }
  },
  AirFreshener: {
    name: 'Air Freshener', type: 'spell', rarity: 'uncommon', trigger: 'every_x_seconds', triggerVal: 4,
    effect: 'frost_ring', cooldown: 4, tags: ['chemical', 'orbit'],
    desc: 'Scented cloud slows bugs', damage: 8, color: '#cc88ff', emoji: '🌸', params: { radius: 110, slowDuration: 2 }
  },
  CatCall: {
    name: 'Cat Call', type: 'spell', rarity: 'uncommon', trigger: 'every_x_seconds', triggerVal: 3,
    effect: 'chain_lightning', cooldown: 3, tags: ['cat', 'projectile'],
    desc: 'Cat pounces on 3 bugs', damage: 18, color: '#ffaa44', emoji: '🐱', params: { chains: 3, range: 150 }
  },
  Antihistamine: {
    name: 'Antihistamine', type: 'spell', rarity: 'uncommon', trigger: 'on_enemy_killed', triggerVal: 0,
    effect: 'heal_player', cooldown: 3, tags: ['medicine'],
    desc: 'Heal on kill', damage: 0, color: '#44ff88', emoji: '💊', params: { heal: 5 }
  },
  PoopFling: {
    name: 'Poop Fling', type: 'spell', rarity: 'uncommon', trigger: 'every_x_seconds', triggerVal: 3.5,
    effect: 'spawn_projectile', cooldown: 3.5, tags: ['gross', 'projectile'],
    desc: 'Piercing poop through bugs', damage: 20, color: '#886622', emoji: '💩', params: { speed: 5, range: 350, pierce: true }
  },
  BleachBomb: {
    name: 'Bleach Bomb', type: 'spell', rarity: 'rare', trigger: 'every_x_seconds', triggerVal: 5,
    effect: 'area_damage', cooldown: 5, tags: ['chemical', 'allergy'],
    desc: 'Large chemical AoE', damage: 30, color: '#44ddcc', emoji: '🧪', params: { radius: 140 }
  },
  StaticSocks: {
    name: 'Static Socks', type: 'spell', rarity: 'rare', trigger: 'every_x_seconds', triggerVal: 6,
    effect: 'static_field', cooldown: 6, tags: ['physical'],
    desc: 'Zaps nearby bugs for %HP', damage: 0, color: '#aaffee', emoji: '🧦', params: { radius: 130, percent: 0.15 }
  },
  AllergyAttack: {
    name: 'Allergy Attack', type: 'spell', rarity: 'rare', trigger: 'on_low_hp', triggerVal: 0.3,
    effect: 'area_damage', cooldown: 8, tags: ['allergy', 'gross'],
    desc: 'Massive sneeze when low HP', damage: 50, color: '#ff4444', emoji: '🤮', params: { radius: 120 }
  },
  CatNap: {
    name: 'Cat Nap Echo', type: 'spell', rarity: 'epic', trigger: 'on_spell_trigger', triggerVal: 0,
    effect: 'repeat_last_spell', cooldown: 6, tags: ['cat'],
    desc: 'Cat repeats your last action', damage: 0, color: '#ffcc88', emoji: '😺', params: {}
  },
  FlushNuke: {
    name: 'Toilet Flush', type: 'spell', rarity: 'legendary', trigger: 'every_x_seconds', triggerVal: 7,
    effect: 'meteor', cooldown: 7, tags: ['gross', 'physical'],
    desc: 'Flush hits densest bug cluster', damage: 60, color: '#4488ff', emoji: '🚽', params: { radius: 90 }
  },
};

const RELICS = {
  Tissues: {
    name: 'Tissue Box', type: 'relic', rarity: 'common', desc: 'XP pickup range +50%',
    effect: 'xp_range', params: { percent: 0.5 }, tags: []
  },
  RunningShoes: {
    name: 'Running Shoes', type: 'relic', rarity: 'common', desc: 'Move speed +20%',
    effect: 'speed_boost', params: { percent: 0.2 }, tags: []
  },
  CatTreats: {
    name: 'Cat Treats', type: 'relic', rarity: 'common', desc: 'Heal 1 HP per kill',
    effect: 'vampirism', params: { heal: 1 }, tags: ['cat']
  },
  CoffeeMug: {
    name: 'Coffee Mug', type: 'relic', rarity: 'uncommon', desc: 'All cooldowns -20%',
    effect: 'reduce_cooldowns', params: { percent: 0.2 }, tags: []
  },
  SpicyFood: {
    name: 'Spicy Food', type: 'relic', rarity: 'uncommon', desc: 'All damage +15%',
    effect: 'damage_boost', params: { percent: 0.15 }, tags: []
  },
  DoorLock: {
    name: 'Door Lock', type: 'relic', rarity: 'uncommon', desc: 'Block 1 hit every 15s',
    effect: 'shield', params: { interval: 15 }, tags: []
  },
  Candle: {
    name: 'Scented Candle', type: 'relic', rarity: 'uncommon', desc: 'Chemical spells +25% damage',
    effect: 'tag_damage_boost', params: { tag: 'chemical', percent: 0.25 }, tags: ['chemical']
  },
  CatCollar: {
    name: 'Cat Collar', type: 'relic', rarity: 'uncommon', desc: 'Cat spells +25% damage',
    effect: 'tag_damage_boost', params: { tag: 'cat', percent: 0.25 }, tags: ['cat']
  },
  Cactus: {
    name: 'Cactus', type: 'relic', rarity: 'rare', desc: 'Reflect 20 damage when bitten',
    effect: 'thorns', params: { damage: 20, radius: 60 }, tags: []
  },
  ExtraTP: {
    name: 'Extra TP Roll', type: 'relic', rarity: 'rare', desc: 'Orbit spells +1 extra projectile',
    effect: 'extra_orbit', params: {}, tags: ['orbit']
  },
  JunkDrawer: {
    name: 'Junk Drawer', type: 'relic', rarity: 'epic', desc: '+1 reward choice per level-up',
    effect: 'extra_reward', params: {}, tags: []
  },
  ExpiredMilk: {
    name: 'Expired Milk', type: 'relic', rarity: 'legendary', desc: '+40% damage, -30% max HP',
    effect: 'glass_cannon', params: { dmgBoost: 0.4, hpPenalty: 0.3 }, tags: []
  },
};

const RULES = {
  SpringCleaning: {
    name: 'Spring Cleaning', type: 'rule', rarity: 'uncommon', desc: 'AoE spells hit 20% larger area',
    effect: 'cascade', params: { bonus: 0.2 }, tags: []
  },
  Adrenaline: {
    name: 'Adrenaline', type: 'rule', rarity: 'rare', desc: 'Each kill in 3s adds +5% damage',
    effect: 'momentum', params: { window: 3, bonus: 0.05 }, tags: []
  },
  CatReflex: {
    name: 'Cat Reflex', type: 'rule', rarity: 'rare', desc: '20% chance to re-trigger on kill',
    effect: 'kill_retrigger', params: { chance: 0.2 }, tags: []
  },
  TimeWarp: {
    name: 'Time Warp', type: 'rule', rarity: 'rare', desc: 'Combos trigger slow motion for 2s',
    effect: 'combo_slow', params: { duration: 2 }, tags: []
  },
  PanicMode: {
    name: 'Panic Mode', type: 'rule', rarity: 'epic', desc: 'Below 50% HP: spells 2x speed',
    effect: 'overclock', params: { threshold: 0.5 }, tags: []
  },
  CleanFreak: {
    name: 'Clean Freak', type: 'rule', rarity: 'epic', desc: 'Shared tags = 2x damage',
    effect: 'pair_tag_bonus', params: { multiplier: 2 }, tags: []
  },
  Hoarder: {
    name: 'Hoarder', type: 'rule', rarity: 'legendary', desc: 'Newest spell counts as all tags',
    effect: 'wildcard_tags', params: {}, tags: []
  },
};

const CHARACTERS = [
  {
    id: 'dad', name: 'Slipper Dad',
    desc: 'Starts with Slipper Throw. Physical spells deal +25% damage.',
    startSpell: 'SlipperThrow', bonus: { type: 'tag_damage', tag: 'physical', percent: 0.25 }, color: '#cc8844', emoji: '👨'
  },
  {
    id: 'mom', name: 'Spray Mom',
    desc: 'Starts with Bug Spray + Coffee Mug. Cooldowns recover 15% faster.',
    startSpell: 'SprayOrbit', startRelic: 'CoffeeMug', bonus: { type: 'cooldown_reduce', percent: 0.15 }, color: '#44ccaa', emoji: '👩'
  },
  {
    id: 'kid', name: 'Cat Kid',
    desc: 'Starts with TP Orbit + Cat Call. Cat spells deal +20% damage.',
    startSpell: 'ToiletPaperOrb', startSpell2: 'CatCall', bonus: { type: 'tag_damage', tag: 'cat', percent: 0.2 }, color: '#ffaa44', emoji: '🧒'
  },
];

const ENEMY_TYPES = {
  swarm:    { name: 'Ant',       hp: 15,  speed: 1.2, damage: 5,  xp: 3,   radius: 8,  color: '#664422', emoji: '🐜' },
  charger:  { name: 'Cockroach', hp: 25,  speed: 2.5, damage: 10, xp: 6,   radius: 10, color: '#885533', emoji: '🪳', spawns: true },
  splitter: { name: 'Fly',       hp: 40,  speed: 1.0, damage: 8,  xp: 8,   radius: 12, color: '#446644', emoji: '🪰', splits: true },
  shielded: { name: 'Beetle',    hp: 60,  speed: 0.7, damage: 12, xp: 12,  radius: 12, color: '#4466aa', emoji: '🪲', armor: 0.5 },
  exploder: { name: 'Stink Bug', hp: 20,  speed: 1.8, damage: 30, xp: 10,  radius: 10, color: '#aaaa44', emoji: '🦟', explodes: true },
  elite:    { name: 'Spider',    hp: 80,  speed: 0.8, damage: 15, xp: 20,  radius: 14, color: '#aa4444', emoji: '🕷️' },
  boss:     { name: 'RAT',       hp: 500, speed: 0.5, damage: 25, xp: 100, radius: 30, color: '#888888', emoji: '🐀' },
};

const WAVE_EVENTS = [
  { name: 'Ant Colony',      desc: '🐜 Ant Colony!',        spawn: 'swarm',    count: 20 },
  { name: 'Roach Rush',      desc: '🪳 Roach Rush!',        spawn: 'charger',  count: 8 },
  { name: 'Fly Swarm',       desc: '🪰 Fly Swarm!',         spawn: 'splitter', count: 6 },
  { name: 'Stink Bomb',      desc: '🦟 Stink Bugs!',        spawn: 'exploder', count: 10 },
  { name: 'Spider Nest',     desc: '🕷️ Spider Nest!',       spawn: 'elite',    count: 4 },
  { name: 'Beetle Invasion',  desc: '🪲 Beetle Invasion!',   spawn: 'shielded', count: 6 },
];

const COMBO_THRESHOLDS = [
  { count: 3, effect: 'shockwave', damage: 20, radius: 120, desc: '💨 Sneeze Wave!' },
  { count: 5, effect: 'shockwave', damage: 40, radius: 200, desc: '🌪️ Cleaning Frenzy!' },
  { count: 8, effect: 'spirit', duration: 8, desc: '🐱 Cat Summoned!' },
];
