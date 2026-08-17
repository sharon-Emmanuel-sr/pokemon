import { POKEMON_LIST } from '../data/pokemonData.js';
import { getTypeEffectiveness } from '../data/typeChart.js';
import { ITEM_LIST } from '../data/itemData.js';

export class AIEngine {
  /**
   * Generates a balanced, randomized AI team of size 3 or 6 with valid items, moves, and abilities.
   */
  static generateTeam(teamSize = 3) {
    const validSize = teamSize === 6 ? 6 : 3;
    const shuffled = [...POKEMON_LIST].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, validSize);

    const competitiveItems = ['leftovers', 'lifeorb', 'choiceband', 'choicespecs', 'choicescarf', 'focussash', 'sitrusberry', 'lumBerry', 'assaultvest', 'expertbelt'];

    return selected.map(pk => {
      const item = competitiveItems[Math.floor(Math.random() * competitiveItems.length)];
      return {
        ...pk,
        level: 50,
        item: item,
        ability: pk.primaryAbility || pk.abilities[0] || 'pressure',
        moves: pk.defaultMoves && pk.defaultMoves.length === 4 ? pk.defaultMoves : ['tackle', 'protect', 'quickattack', 'bodyslam']
      };
    });
  }

  /**
   * Evaluates the best action for AI (side 'p2')
   * Returns { type: 'move', moveIndex: number } or { type: 'switch', targetIndex: number }
   */
  static chooseAction(battleEngine) {
    const aiActive = battleEngine.getP2Active();
    const playerActive = battleEngine.getP1Active();
    const aiTeam = battleEngine.p2Team;

    if (!aiActive || aiActive.isFainted()) {
      return this.chooseForcedSwitch(battleEngine);
    }

    // Evaluate all 4 moves
    let bestMoveIndex = 0;
    let highestScore = -999;

    aiActive.moves.forEach((move, idx) => {
      let score = 0;

      if (move.category === 'status') {
        // Boost status moves if opponent doesn't have a status
        if (move.statusEffect && !playerActive.status) {
          score += 60;
        } else if (move.statChanges && move.target === 'self') {
          // Setup moves (e.g. Swords Dance, Dragon Dance) are great if HP > 50%
          if (aiActive.getHpPercent() > 50) {
            score += 50;
          }
        } else if (move.healPercent && aiActive.getHpPercent() < 50) {
          // Recovery move when hurt
          score += 75;
        } else {
          score += 10;
        }
      } else {
        // Damaging move
        const { damage, effectiveness } = battleEngine.calculateDamage(aiActive, playerActive, move);
        score += damage;

        if (effectiveness > 1) score += 30;
        if (effectiveness === 0) score -= 100;

        // If move can knock out opponent, prioritize heavily!
        if (damage >= playerActive.currentHp) {
          score += 200;
        }
      }

      // Add slight randomness so AI is dynamic
      score += Math.random() * 5;

      if (score > highestScore) {
        highestScore = score;
        bestMoveIndex = idx;
      }
    });

    return { type: 'move', moveIndex: bestMoveIndex };
  }

  /**
   * Selects a healthy Pokémon when AI is forced to switch
   */
  static chooseForcedSwitch(battleEngine) {
    const aiTeam = battleEngine.p2Team;
    const playerActive = battleEngine.getP1Active();

    // Find all non-fainted team members
    const validIndexes = [];
    aiTeam.forEach((pk, idx) => {
      if (!pk.isFainted() && idx !== battleEngine.p2ActiveIndex) {
        validIndexes.push(idx);
      }
    });

    if (validIndexes.length === 0) {
      // Fallback (e.g. if only current fainted index remains)
      return { type: 'switch', targetIndex: 0 };
    }

    // Pick best type match against player active
    let bestIndex = validIndexes[0];
    let bestAdvantage = -999;

    for (const idx of validIndexes) {
      const candidate = aiTeam[idx];
      let advantage = 0;

      // Defensive type resistance
      const defMultiplier = getTypeEffectiveness(playerActive.types[0], candidate.types);
      if (defMultiplier < 1) advantage += 20;
      if (defMultiplier > 1) advantage -= 20;

      // Offensive type coverage
      const offMultiplier = getTypeEffectiveness(candidate.types[0], playerActive.types);
      if (offMultiplier > 1) advantage += 30;

      advantage += candidate.getHpPercent() / 10;

      if (advantage > bestAdvantage) {
        bestAdvantage = advantage;
        bestIndex = idx;
      }
    }

    return { type: 'switch', targetIndex: bestIndex };
  }
}
