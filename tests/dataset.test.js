import { describe, it, expect } from 'vitest';
import { POKEMON_LIST, getPokemon } from '../src/data/pokemonData.js';
import { TYPES } from '../src/data/typeChart.js';
import { MOVES, getMove } from '../src/data/moveData.js';
import { PokemonInstance } from '../src/game/PokemonInstance.js';

describe('Pokémon Dataset Gen 1–8', () => {
  it('1. Dataset contains Gen 1 through Gen 8 Pokémon up to #898', () => {
    expect(POKEMON_LIST.length).toBeGreaterThanOrEqual(898);

    const gensPresent = new Set(POKEMON_LIST.map(p => p.generation));
    for (let g = 1; g <= 8; g++) {
      expect(gensPresent.has(g)).toBe(true);
    }

    // Verify key Gen representatives
    expect(getPokemon(1).name).toBe('Bulbasaur'); // Gen 1
    expect(getPokemon(152).name).toBe('Chikorita'); // Gen 2
    expect(getPokemon(252).name).toBe('Treecko'); // Gen 3
    expect(getPokemon(387).name).toBe('Turtwig'); // Gen 4
    expect(getPokemon(494).name).toBe('Victini'); // Gen 5
    expect(getPokemon(650).name).toBe('Chespin'); // Gen 6
    expect(getPokemon(722).name).toBe('Rowlet'); // Gen 7
    expect(getPokemon(810).name).toBe('Grookey'); // Gen 8
    expect(getPokemon(898).name).toBe('Calyrex'); // Gen 8 cap
  });

  it('2. Pokémon IDs and Pokédex numbers are unique', () => {
    const ids = new Set();
    const nums = new Set();

    POKEMON_LIST.forEach(p => {
      expect(ids.has(p.id)).toBe(false);
      expect(nums.has(p.num)).toBe(false);
      ids.add(p.id);
      nums.add(p.num);
    });
  });

  it('3. Every Pokémon has valid official types', () => {
    POKEMON_LIST.forEach(p => {
      expect(Array.isArray(p.types)).toBe(true);
      expect(p.types.length).toBeGreaterThanOrEqual(1);
      expect(p.types.length).toBeLessThanOrEqual(2);
      p.types.forEach(t => {
        expect(TYPES.includes(t.toLowerCase())).toBe(true);
      });
    });
  });

  it('4. Every Pokémon has valid base stats', () => {
    POKEMON_LIST.forEach(p => {
      const { hp, attack, defense, specialAttack, specialDefense, speed, total } = p.baseStats;
      expect(hp).toBeGreaterThan(0);
      expect(attack).toBeGreaterThan(0);
      expect(defense).toBeGreaterThan(0);
      expect(specialAttack).toBeGreaterThan(0);
      expect(specialDefense).toBeGreaterThan(0);
      expect(speed).toBeGreaterThan(0);
      expect(total).toBe(hp + attack + defense + specialAttack + specialDefense + speed);
    });
  });

  it('5. Every battle Pokémon receives exactly four valid moves', () => {
    const charizard = new PokemonInstance('charizard');
    expect(charizard.moves.length).toBe(4);
    charizard.moves.forEach(m => {
      expect(m.name).toBeDefined();
      expect(m.type).toBeDefined();
      expect(TYPES.includes(m.type.toLowerCase())).toBe(true);
      expect(m.maxPp).toBeGreaterThan(0);
    });

    const mewtwo = new PokemonInstance('mewtwo');
    expect(mewtwo.moves.length).toBe(4);
  });
});
