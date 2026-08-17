import fs from 'fs';
import path from 'path';

function getGeneration(num) {
  if (num <= 151) return 1;
  if (num <= 251) return 2;
  if (num <= 386) return 3;
  if (num <= 493) return 4;
  if (num <= 649) return 5;
  if (num <= 721) return 6;
  if (num <= 809) return 7;
  if (num <= 898) return 8;
  return 8;
}

const TYPE_MOVEPOOLS = {
  normal: {
    physical: ['bodyslam', 'doubleedge', 'quickattack', 'extremespeed'],
    special: ['hyperbeam', 'triattack'],
    status: ['swordsdance', 'recover', 'protect']
  },
  fire: {
    physical: ['flareblitz', 'firepunch', 'pyroball'],
    special: ['flamethrower', 'fireblast', 'overheat'],
    status: ['willowisp', 'swordsdance']
  },
  water: {
    physical: ['waterfall', 'aquajet', 'liquidation'],
    special: ['surf', 'hydropump', 'scald', 'watershuriken'],
    status: ['recover', 'protect']
  },
  electric: {
    physical: ['wildcharge', 'thunderpunch'],
    special: ['thunderbolt', 'thunder', 'voltswitch'],
    status: ['thunderwave', 'calmmind']
  },
  grass: {
    physical: ['woodhammer', 'drumbeating'],
    special: ['energyball', 'leafstorm', 'gigadrain'],
    status: ['spore', 'leechseed', 'swordsdance']
  },
  ice: {
    physical: ['iciclecrash', 'iceshard', 'icepunch'],
    special: ['icebeam', 'blizzard'],
    status: ['calmmind', 'protect']
  },
  fighting: {
    physical: ['closecombat', 'machpunch', 'drainpunch'],
    special: ['focusblast', 'aurasphere'],
    status: ['bulkup', 'swordsdance']
  },
  poison: {
    physical: ['gunkshot', 'poisonjab'],
    special: ['sludgebomb'],
    status: ['toxic', 'protect']
  },
  ground: {
    physical: ['earthquake', 'highhorsepower'],
    special: ['earthpower'],
    status: ['stealthrock', 'bulkup']
  },
  flying: {
    physical: ['bravebird', 'acrobatics'],
    special: ['airslash', 'hurricane'],
    status: ['roost', 'swordsdance']
  },
  psychic: {
    physical: ['zenheadbutt'],
    special: ['psychic', 'psyshock'],
    status: ['calmmind', 'recover']
  },
  bug: {
    physical: ['uturn', 'megahorn'],
    special: ['bugbuzz'],
    status: ['quiverdance', 'swordsdance']
  },
  rock: {
    physical: ['stoneedge', 'rockslide'],
    special: ['powergem', 'meteorbeam'],
    status: ['stealthrock', 'swordsdance']
  },
  ghost: {
    physical: ['shadowclaw', 'shadowsneak', 'poltergeist'],
    special: ['shadowball'],
    status: ['willowisp', 'calmmind']
  },
  dragon: {
    physical: ['dragonclaw', 'outrage'],
    special: ['dracometeor', 'dragonpulse'],
    status: ['dragondance', 'calmmind']
  },
  dark: {
    physical: ['knockoff', 'suckerpunch', 'crunch', 'foulplay'],
    special: ['darkpulse'],
    status: ['nastyplot', 'swordsdance']
  },
  steel: {
    physical: ['ironhead', 'bulletpunch'],
    special: ['flashcannon'],
    status: ['swordsdance', 'bulkup']
  },
  fairy: {
    physical: ['playrough'],
    special: ['moonblast', 'dazzlinggleam'],
    status: ['calmmind', 'recover']
  }
};

const COVERAGE_MOVES = {
  physical: ['earthquake', 'closecombat', 'stoneedge', 'knockoff', 'ironhead', 'icepunch', 'firepunch', 'thunderpunch'],
  special: ['icebeam', 'thunderbolt', 'flamethrower', 'shadowball', 'earthpower', 'psychic', 'dazzlinggleam', 'focusblast']
};

function selectMovesForPokemon(types, stats) {
  const isPhysical = stats.attack >= stats.specialAttack;
  const selected = new Set();
  const learnable = new Set(['tackle', 'protect']);

  for (const t of types) {
    const typePool = TYPE_MOVEPOOLS[t.toLowerCase()];
    if (!typePool) continue;

    const primaryCategory = isPhysical ? typePool.physical : typePool.special;
    const secondaryCategory = isPhysical ? typePool.special : typePool.physical;

    if (primaryCategory && primaryCategory.length > 0) {
      selected.add(primaryCategory[0]);
      primaryCategory.forEach(m => learnable.add(m));
    }
    if (primaryCategory && primaryCategory.length > 1 && selected.size < 2) {
      selected.add(primaryCategory[1]);
    } else if (secondaryCategory && secondaryCategory.length > 0) {
      secondaryCategory.forEach(m => learnable.add(m));
    }

    if (typePool.status) {
      typePool.status.forEach(m => learnable.add(m));
    }
  }

  const statusCandidates = isPhysical
    ? ['swordsdance', 'dragondance', 'bulkup', 'willowisp', 'toxic', 'recover', 'protect']
    : ['calmmind', 'nastyplot', 'quiverdance', 'willowisp', 'toxic', 'recover', 'protect'];

  for (const st of statusCandidates) {
    if (selected.size < 3) {
      selected.add(st);
      learnable.add(st);
      break;
    }
  }

  const coveragePool = isPhysical ? COVERAGE_MOVES.physical : COVERAGE_MOVES.special;
  for (const cov of coveragePool) {
    if (selected.size >= 4) break;
    if (!selected.has(cov)) {
      selected.add(cov);
    }
    learnable.add(cov);
  }

  const fallbacks = ['bodyslam', 'quickattack', 'earthquake', 'thunderbolt', 'icebeam', 'flamethrower', 'protect'];
  for (const fb of fallbacks) {
    if (selected.size >= 4) break;
    selected.add(fb);
    learnable.add(fb);
  }

  return {
    defaultMoves: Array.from(selected).slice(0, 4),
    learnableMoves: Array.from(learnable)
  };
}

async function generateDataset() {
  console.log('Fetching Pokédex from Smogon repository...');
  const res = await fetch('https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/pokedex.ts');
  const text = await res.text();

  console.log('Parsing Pokémon entries...');
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const objectBody = text.slice(firstBrace, lastBrace + 1);

  const getPokedexObj = new Function(`return (${objectBody});`);
  const rawPokedex = getPokedexObj();

  const pokemonList = [];
  const processedNums = new Set();

  for (const key of Object.keys(rawPokedex)) {
    const entry = rawPokedex[key];
    if (!entry || typeof entry.num !== 'number' || entry.num <= 0) continue;
    if (entry.num > 898) continue; // Gen 1 through Gen 8 (Bulbasaur #1 to Calyrex #898)
    
    // Skip alternate forms / megas for the primary 898 list
    if (entry.forme && entry.forme !== '') {
      if (entry.forme.startsWith('Mega') || entry.forme.startsWith('Gmax') || entry.forme === 'Totem') {
        continue;
      }
    }

    if (processedNums.has(entry.num)) {
      continue;
    }
    processedNums.add(entry.num);

    const gen = getGeneration(entry.num);
    const types = entry.types.map(t => t.toLowerCase());
    const baseStats = {
      hp: entry.baseStats.hp,
      attack: entry.baseStats.atk,
      defense: entry.baseStats.def,
      specialAttack: entry.baseStats.spa,
      specialDefense: entry.baseStats.spd,
      speed: entry.baseStats.spe,
      total: entry.baseStats.hp + entry.baseStats.atk + entry.baseStats.def + entry.baseStats.spa + entry.baseStats.spd + entry.baseStats.spe
    };

    const abilityList = [];
    if (entry.abilities) {
      if (entry.abilities['0']) abilityList.push(entry.abilities['0']);
      if (entry.abilities['1']) abilityList.push(entry.abilities['1']);
      if (entry.abilities['H']) abilityList.push(entry.abilities['H']);
    }
    if (abilityList.length === 0) abilityList.push('Pressure');

    const cleanName = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const { defaultMoves, learnableMoves } = selectMovesForPokemon(types, baseStats);

    const pokemon = {
      id: cleanName,
      num: entry.num,
      name: entry.name,
      generation: gen,
      types: types,
      baseStats: baseStats,
      abilities: abilityList,
      primaryAbility: abilityList[0],
      heightm: entry.heightm || 1.0,
      weightkg: entry.weightkg || 20.0,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.num}.png`,
      artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.num}.png`,
      animatedFront: `https://play.pokemonshowdown.com/sprites/ani/${cleanName}.gif`,
      animatedBack: `https://play.pokemonshowdown.com/sprites/ani-back/${cleanName}.gif`,
      defaultMoves: defaultMoves,
      learnableMoves: learnableMoves
    };

    pokemonList.push(pokemon);
  }

  // Sort strictly by Pokédex number
  pokemonList.sort((a, b) => a.num - b.num);

  console.log(`Successfully parsed ${pokemonList.length} Pokémon across Gen 1-8!`);
  for (let g = 1; g <= 8; g++) {
    console.log(`Gen ${g} count: ${pokemonList.filter(p => p.generation === g).length}`);
  }

  const outputDir = path.resolve('src/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON
  fs.writeFileSync(path.join(outputDir, 'pokemonList.json'), JSON.stringify(pokemonList, null, 2));

  // Write JS module with helpful indexes
  const jsContent = `// Complete Generation 1-8 Pokémon Dataset (Bulbasaur #1 to Calyrex #898)
import pokemonListData from './pokemonList.json';

export const POKEMON_LIST = pokemonListData;

export const POKEMON_BY_ID = POKEMON_LIST.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

export const POKEMON_BY_NUM = POKEMON_LIST.reduce((acc, p) => {
  acc[p.num] = p;
  return acc;
}, {});

export function getPokemon(idOrNum) {
  if (typeof idOrNum === 'number') {
    return POKEMON_BY_NUM[idOrNum] || POKEMON_LIST[0];
  }
  if (!idOrNum) return POKEMON_LIST[0];
  const cleanId = String(idOrNum).toLowerCase().replace(/[^a-z0-9]/g, '');
  return POKEMON_BY_ID[cleanId] || POKEMON_BY_NUM[parseInt(idOrNum, 10)] || POKEMON_LIST[0];
}

export function filterPokemon({ search = '', generation = null, type = null }) {
  return POKEMON_LIST.filter(p => {
    if (generation && p.generation !== Number(generation)) return false;
    if (type && !p.types.includes(type.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase().trim();
      const numMatch = String(p.num) === q || String(p.num).padStart(3, '0') === q;
      const nameMatch = p.name.toLowerCase().includes(q);
      return numMatch || nameMatch;
    }
    return true;
  });
}
`;

  fs.writeFileSync(path.join(outputDir, 'pokemonData.js'), jsContent);
  console.log('Saved pokemonList.json and pokemonData.js successfully!');
}

generateDataset().catch(console.error);
