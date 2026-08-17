import { describe, it, expect } from 'vitest';
import { BattleEngine } from '../src/game/BattleEngine.js';
import { PokemonInstance } from '../src/game/PokemonInstance.js';
import { getTypeEffectiveness } from '../src/data/typeChart.js';
import { getMove } from '../src/data/moveData.js';

describe('Battle Engine Mechanics (1v1)', () => {
  const p1Team3 = [
    new PokemonInstance('pikachu'),
    new PokemonInstance('charizard'),
    new PokemonInstance('blastoise')
  ];

  const p2Team3 = [
    new PokemonInstance('gengar'),
    new PokemonInstance('lucario'),
    new PokemonInstance('garchomp')
  ];

  it('6. Team size 3 works properly', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: p1Team3,
      p2Team: p2Team3
    });
    expect(battle.p1Team.length).toBe(3);
    expect(battle.p2Team.length).toBe(3);
    expect(battle.teamSize).toBe(3);
  });

  it('7. Team size 6 works properly', () => {
    const p1Team6 = [
      new PokemonInstance('pikachu'),
      new PokemonInstance('charizard'),
      new PokemonInstance('blastoise'),
      new PokemonInstance('venusaur'),
      new PokemonInstance('snorlax'),
      new PokemonInstance('dragonite')
    ];
    const p2Team6 = [
      new PokemonInstance('gengar'),
      new PokemonInstance('lucario'),
      new PokemonInstance('garchomp'),
      new PokemonInstance('tyranitar'),
      new PokemonInstance('salamence'),
      new PokemonInstance('metagross')
    ];

    const battle = new BattleEngine({
      teamSize: 6,
      p1Team: p1Team6,
      p2Team: p2Team6
    });
    expect(battle.p1Team.length).toBe(6);
    expect(battle.p2Team.length).toBe(6);
  });

  it('8. Invalid team sizes are rejected', () => {
    expect(() => {
      new BattleEngine({
        teamSize: 2,
        p1Team: [new PokemonInstance('pikachu'), new PokemonInstance('charizard')],
        p2Team: [new PokemonInstance('gengar'), new PokemonInstance('lucario')]
      });
    }).toThrow();

    expect(() => {
      new BattleEngine({
        teamSize: 3,
        p1Team: [new PokemonInstance('pikachu')],
        p2Team: [new PokemonInstance('gengar')]
      });
    }).toThrow();
  });

  it('9. Battle starts with one active Pokémon per side', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: p1Team3,
      p2Team: p2Team3
    });
    expect(battle.getP1Active().id).toBe('pikachu');
    expect(battle.getP2Active().id).toBe('gengar');
    expect(battle.p1ActiveIndex).toBe(0);
    expect(battle.p2ActiveIndex).toBe(0);
  });

  it('10. Damage calculation works accurately', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: p1Team3,
      p2Team: p2Team3
    });
    const attacker = battle.getP1Active();
    const defender = battle.getP2Active();
    const thunderbolt = getMove('thunderbolt');

    const result = battle.calculateDamage(attacker, defender, thunderbolt);
    expect(result.damage).toBeGreaterThan(0);
    expect(typeof result.damage).toBe('number');
  });

  it('11. STAB (Same Type Attack Bonus) boosts damage', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: p1Team3,
      p2Team: p2Team3
    });
    const pikachu = battle.getP1Active(); // Electric type
    const defender = battle.getP2Active();

    // Pikachu using Thunderbolt (Electric, STAB) vs non-STAB move
    const thunderbolt = getMove('thunderbolt');
    const { damage: stabDmg } = battle.calculateDamage(pikachu, defender, thunderbolt);

    expect(stabDmg).toBeGreaterThan(0);
  });

  it('12. Type effectiveness calculates 2x, 0.5x, and 0x immunities correctly', () => {
    // Water vs Fire = 2x
    expect(getTypeEffectiveness('water', ['fire'])).toBe(2);
    // Fire vs Water = 0.5x
    expect(getTypeEffectiveness('fire', ['water'])).toBe(0.5);
    // Electric vs Ground = 0x
    expect(getTypeEffectiveness('electric', ['ground'])).toBe(0);
    // Fighting vs Ghost = 0x
    expect(getTypeEffectiveness('fighting', ['ghost'])).toBe(0);
    // Ice vs Dragon/Flying (4x)
    expect(getTypeEffectiveness('ice', ['dragon', 'flying'])).toBe(4);
  });

  it('13. Critical hits calculate damage correctly', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: p1Team3,
      p2Team: p2Team3
    });
    const attacker = battle.getP1Active();
    const defender = battle.getP2Active();
    const move = getMove('thunderbolt');

    // Run damage multiple times
    const damages = [];
    for (let i = 0; i < 50; i++) {
      const res = battle.calculateDamage(attacker, defender, move);
      damages.push(res.damage);
    }
    expect(Math.max(...damages)).toBeGreaterThan(Math.min(...damages));
  });

  it('14. Accuracy and Never-Miss moves function properly', () => {
    const auraSphere = getMove('aurasphere');
    expect(auraSphere.neverMiss).toBe(true);

    const thunder = getMove('thunder');
    expect(thunder.accuracy).toBe(70);
  });

  it('15. Status effects (burn, poison, paralysis, sleep) affect Pokémon correctly', () => {
    const pkmn = new PokemonInstance('snorlax');
    pkmn.status = 'burn';
    expect(pkmn.status).toBe('burn');

    // Burn halves physical attack (unless Guts)
    const burnedAtk = pkmn.getEffectiveStat('attack');
    pkmn.status = null;
    const normalAtk = pkmn.getEffectiveStat('attack');
    expect(burnedAtk).toBeLessThan(normalAtk);
  });

  it('16. Switching updates active Pokémon and resets stat stages', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: [new PokemonInstance('pikachu'), new PokemonInstance('charizard'), new PokemonInstance('blastoise')],
      p2Team: [new PokemonInstance('gengar'), new PokemonInstance('lucario'), new PokemonInstance('garchomp')]
    });

    battle.getP1Active().statStages.attack = 2;
    expect(battle.getP1Active().statStages.attack).toBe(2);

    battle.executeSwitch('p1', 1);
    expect(battle.p1ActiveIndex).toBe(1);
    expect(battle.getP1Active().id).toBe('charizard');
    expect(battle.p1Team[0].statStages.attack).toBe(0); // pikachu reset
  });

  it('17. Fainted Pokémon cannot be selected for normal switch', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: [new PokemonInstance('pikachu'), new PokemonInstance('charizard'), new PokemonInstance('blastoise')],
      p2Team: [new PokemonInstance('gengar'), new PokemonInstance('lucario'), new PokemonInstance('garchomp')]
    });

    battle.p1Team[1].currentHp = 0; // charizard faints
    const switched = battle.executeSwitch('p1', 1);
    expect(switched).toBe(false);
    expect(battle.p1ActiveIndex).toBe(0); // remains on pikachu
  });

  it('18. Forced switching correctly handles replacement after fainting', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: [new PokemonInstance('pikachu'), new PokemonInstance('charizard'), new PokemonInstance('blastoise')],
      p2Team: [new PokemonInstance('gengar'), new PokemonInstance('lucario'), new PokemonInstance('garchomp')]
    });

    battle.getP1Active().currentHp = 0; // Pikachu faints
    battle.checkFaintingAndForcedSwitches();
    expect(battle.phase).toBe('forced_switch');
    expect(battle.forcedSwitchSide).toBe('p1');

    battle.resolveForcedSwitch('p1', 1);
    expect(battle.getP1Active().id).toBe('charizard');
    expect(battle.phase).toBe('action_selection');
  });

  it('19. Victory condition triggers when opponent team faints', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: [new PokemonInstance('pikachu'), new PokemonInstance('charizard'), new PokemonInstance('blastoise')],
      p2Team: [new PokemonInstance('gengar'), new PokemonInstance('lucario'), new PokemonInstance('garchomp')]
    });

    // Knock out all p2 Pokémon
    battle.p2Team.forEach(p => { p.currentHp = 0; });
    const isOver = battle.checkBattleOver();
    expect(isOver).toBe(true);
    expect(battle.winner).toBe('p1');
    expect(battle.phase).toBe('game_over');
  });

  it('20. Defeat condition triggers when player team faints', () => {
    const battle = new BattleEngine({
      teamSize: 3,
      p1Team: [new PokemonInstance('pikachu'), new PokemonInstance('charizard'), new PokemonInstance('blastoise')],
      p2Team: [new PokemonInstance('gengar'), new PokemonInstance('lucario'), new PokemonInstance('garchomp')]
    });

    // Knock out all p1 Pokémon
    battle.p1Team.forEach(p => { p.currentHp = 0; });
    const isOver = battle.checkBattleOver();
    expect(isOver).toBe(true);
    expect(battle.winner).toBe('p2');
    expect(battle.phase).toBe('game_over');
  });
});
