// Complete Generation 1-8 Pokémon Dataset (Bulbasaur #1 to Calyrex #898)
import { POKEMON_LIST } from './pokemonList.js';

export { POKEMON_LIST };

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
