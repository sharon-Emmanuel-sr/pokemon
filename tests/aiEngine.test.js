import { describe, it, expect } from 'vitest';
import { AIEngine } from '../src/game/AIEngine.js';
import { BattleEngine } from '../src/game/BattleEngine.js';
import { PokemonInstance } from '../src/game/PokemonInstance.js';

describe('AI Engine (VS AI)', () => {
  it('21. AI team size matches selected size (3 and 6)', () => {
    const team3 = AIEngine.generateTeam(3);
    expect(team3.length).toBe(3);
    team3.forEach(pk => {
      expect(pk.moves.length).toBe(4);
      expect(pk.item).toBeDefined();
      expect(pk.ability).toBeDefined();
    });

    const team6 = AIEngine.generateTeam(6);
    expect(team6.length).toBe(6);
    team6.forEach(pk => {
      expect(pk.moves.length).toBe(4);
      expect(pk.item).toBeDefined();
      expect(pk.ability).toBeDefined();
    });
  });

  it('22. AI selects valid move or switch actions and never chooses fainted Pokémon', () => {
    const p1Team = [
      new PokemonInstance('charizard'),
      new PokemonInstance('blastoise'),
      new PokemonInstance('venusaur')
    ];
    const p2Team = [
      new PokemonInstance('pikachu'),
      new PokemonInstance('lucario'),
      new PokemonInstance('gengar')
    ];

    const battle = new BattleEngine({
      teamSize: 3,
      p1Team,
      p2Team
    });

    // AI chooses turn action
    const action = AIEngine.chooseAction(battle);
    expect(action).toBeDefined();
    expect(action.type).toBe('move');
    expect(action.moveIndex).toBeGreaterThanOrEqual(0);
    expect(action.moveIndex).toBeLessThan(4);

    // AI forced switch when active Pokémon faints
    battle.p2Team[0].currentHp = 0; // Pikachu faints
    battle.p2Team[1].currentHp = 0; // Lucario also fainted
    // Only Gengar (index 2) is alive
    const forcedSwitch = AIEngine.chooseForcedSwitch(battle);
    expect(forcedSwitch.type).toBe('switch');
    expect(forcedSwitch.targetIndex).toBe(2); // Must pick Gengar, not fainted Pikachu/Lucario!
  });
});
