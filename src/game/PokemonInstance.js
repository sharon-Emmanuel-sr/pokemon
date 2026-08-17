import { getPokemon } from '../data/pokemonData.js';
import { getMove } from '../data/moveData.js';
import { getAbility } from '../data/abilityData.js';
import { getItem } from '../data/itemData.js';

export function calculateStat(base = 50, statName, level = 50) {
  if (statName === 'hp') {
    if (base === 1) return 1; // Shedinja
    return Math.floor(((2 * base + 31 + Math.floor(85 / 4)) * level) / 100) + level + 10;
  }
  return Math.floor((((2 * base + 31 + Math.floor(85 / 4)) * level) / 100) + 5);
}

export class PokemonInstance {
  constructor(pokemonIdOrData, options = {}) {
    let baseData = null;
    if (typeof pokemonIdOrData === 'string' || typeof pokemonIdOrData === 'number') {
      baseData = getPokemon(pokemonIdOrData);
    } else if (pokemonIdOrData && typeof pokemonIdOrData === 'object') {
      if (pokemonIdOrData.baseStats && pokemonIdOrData.num) {
        baseData = pokemonIdOrData;
      } else {
        baseData = getPokemon(pokemonIdOrData.id || pokemonIdOrData.num);
      }
    }

    if (!baseData) {
      baseData = getPokemon(1);
    }

    this.id = baseData.id || 'bulbasaur';
    this.num = baseData.num || 1;
    this.name = baseData.name || 'Bulbasaur';
    this.generation = baseData.generation || 1;
    this.types = Array.isArray(baseData.types) ? [...baseData.types] : ['normal'];
    this.originalTypes = [...this.types];
    this.level = options.level || pokemonIdOrData?.level || 50;

    // Base stats
    this.baseStats = baseData.baseStats ? { ...baseData.baseStats } : { hp: 70, attack: 70, defense: 70, specialAttack: 70, specialDefense: 70, speed: 70, total: 420 };

    // Calculated actual battle stats
    this.stats = pokemonIdOrData?.stats || {
      hp: calculateStat(this.baseStats.hp, 'hp', this.level),
      attack: calculateStat(this.baseStats.attack, 'attack', this.level),
      defense: calculateStat(this.baseStats.defense, 'defense', this.level),
      specialAttack: calculateStat(this.baseStats.specialAttack, 'specialAttack', this.level),
      specialDefense: calculateStat(this.baseStats.specialDefense, 'specialDefense', this.level),
      speed: calculateStat(this.baseStats.speed, 'speed', this.level)
    };

    this.maxHp = pokemonIdOrData?.maxHp || this.stats.hp;
    this.currentHp = options.currentHp !== undefined
      ? options.currentHp
      : (pokemonIdOrData?.currentHp !== undefined ? pokemonIdOrData.currentHp : this.maxHp);

    // Stat stages (-6 to +6)
    this.statStages = pokemonIdOrData?.statStages ? { ...pokemonIdOrData.statStages } : {
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0
    };

    // Ability
    let abilityName = options.ability;
    if (!abilityName && typeof pokemonIdOrData === 'object' && pokemonIdOrData.ability) {
      abilityName = pokemonIdOrData.ability.id || pokemonIdOrData.ability.name || pokemonIdOrData.ability;
    }
    if (!abilityName) {
      abilityName = baseData.primaryAbility || (Array.isArray(baseData.abilities) ? baseData.abilities[0] : 'Pressure');
    }
    this.ability = getAbility(abilityName);

    // Held Item
    let itemId = options.item || options.heldItem;
    if (!itemId && typeof pokemonIdOrData === 'object' && pokemonIdOrData.item) {
      itemId = pokemonIdOrData.item.id || pokemonIdOrData.item.name || pokemonIdOrData.item;
    }
    this.item = getItem(itemId || 'none');
    this.initialItem = this.item.id;

    // Moves (exactly 4 moves)
    let moveIds = options.moves || pokemonIdOrData?.moves || baseData.defaultMoves || ['tackle', 'quickattack', 'protect', 'bodyslam'];
    if (!Array.isArray(moveIds) || moveIds.length === 0) {
      moveIds = ['tackle', 'quickattack', 'protect', 'bodyslam'];
    }

    this.moves = moveIds.slice(0, 4).map(m => {
      const mId = typeof m === 'string' ? m : (m.id || m.name || 'tackle');
      const moveObj = getMove(mId);
      return {
        ...moveObj,
        maxPp: m.maxPp || moveObj.pp || 15,
        currentPp: m.currentPp !== undefined ? m.currentPp : (moveObj.pp || 15)
      };
    });

    // Ensure exactly 4 moves
    while (this.moves.length < 4) {
      const fallback = getMove('protect');
      this.moves.push({
        ...fallback,
        maxPp: fallback.pp || 10,
        currentPp: fallback.pp || 10
      });
    }

    // Visual assets
    this.sprite = baseData.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.num}.png`;
    this.artwork = baseData.artwork || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${this.num}.png`;
    this.animatedFront = baseData.animatedFront || `https://play.pokemonshowdown.com/sprites/ani/${this.id}.gif`;
    this.animatedBack = baseData.animatedBack || `https://play.pokemonshowdown.com/sprites/ani-back/${this.id}.gif`;

    // Status condition
    this.status = options.status || pokemonIdOrData?.status || null;
    this.sleepTurns = pokemonIdOrData?.sleepTurns || 0;
    this.toxicTurns = pokemonIdOrData?.toxicTurns || 0;
    this.isConfused = pokemonIdOrData?.isConfused || false;
    this.confusionTurns = pokemonIdOrData?.confusionTurns || 0;
    this.isProtected = pokemonIdOrData?.isProtected || false;
    this.choiceLockedMove = null;
  }

  isFainted() {
    return this.currentHp <= 0;
  }

  getHpPercent() {
    if (this.maxHp <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((this.currentHp / this.maxHp) * 100)));
  }

  getEffectiveStat(statName) {
    let base = this.stats[statName];
    if (!base) return 1;

    const stage = Math.max(-6, Math.min(6, this.statStages[statName] || 0));
    let multiplier = 1;
    if (stage > 0) {
      multiplier = (2 + stage) / 2;
    } else if (stage < 0) {
      multiplier = 2 / (2 - stage);
    }

    let val = Math.floor(base * multiplier);

    if (statName === 'attack') {
      if (this.ability.id === 'hugepower') val *= 2;
      if (this.item.id === 'choiceband') val = Math.floor(val * 1.5);
      if (this.status === 'burn' && this.ability.id !== 'guts') val = Math.floor(val * 0.5);
      if (this.status && this.ability.id === 'guts') val = Math.floor(val * 1.5);
    } else if (statName === 'specialAttack') {
      if (this.item.id === 'choicespecs') val = Math.floor(val * 1.5);
    } else if (statName === 'specialDefense') {
      if (this.item.id === 'assaultvest') val = Math.floor(val * 1.5);
    } else if (statName === 'speed') {
      if (this.item.id === 'choicescarf') val = Math.floor(val * 1.5);
      if (this.status === 'paralysis') val = Math.floor(val * 0.5);
    }

    return Math.max(1, val);
  }

  resetStatStages() {
    this.statStages = {
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0
    };
    this.isConfused = false;
    this.confusionTurns = 0;
    this.isProtected = false;
    this.choiceLockedMove = null;
    this.types = [...this.originalTypes];
  }

  toJSON() {
    return {
      id: this.id,
      num: this.num,
      name: this.name,
      level: this.level,
      types: this.types,
      stats: this.stats,
      maxHp: this.maxHp,
      currentHp: this.currentHp,
      statStages: this.statStages,
      ability: this.ability,
      item: this.item,
      moves: this.moves,
      sprite: this.sprite,
      artwork: this.artwork,
      animatedFront: this.animatedFront,
      animatedBack: this.animatedBack,
      status: this.status,
      isFainted: this.isFainted()
    };
  }
}
