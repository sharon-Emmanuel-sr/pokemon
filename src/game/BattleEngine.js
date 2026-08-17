import { getTypeEffectiveness } from '../data/typeChart.js';
import { PokemonInstance } from './PokemonInstance.js';

export class BattleEngine {
  constructor(options = {}) {
    this.teamSize = options.teamSize || 3;
    if (this.teamSize !== 3 && this.teamSize !== 6) {
      throw new Error(`Invalid team size: ${this.teamSize}. Must be 3 or 6.`);
    }

    this.p1Name = options.p1Name || 'Player 1';
    this.p2Name = options.p2Name || 'Player 2';

    this.p1Team = (options.p1Team || []).map(p => p instanceof PokemonInstance ? p : new PokemonInstance(p));
    this.p2Team = (options.p2Team || []).map(p => p instanceof PokemonInstance ? p : new PokemonInstance(p));

    if (this.p1Team.length !== this.teamSize || this.p2Team.length !== this.teamSize) {
      throw new Error(`Both teams must have exactly ${this.teamSize} Pokémon.`);
    }

    this.p1ActiveIndex = 0;
    this.p2ActiveIndex = 0;
    this.turn = 1;
    this.phase = 'action_selection'; // 'action_selection' | 'forced_switch' | 'game_over'
    this.forcedSwitchSide = null; // 'p1' | 'p2' | 'both' | null
    this.winner = null; // 'p1' | 'p2' | 'draw' | null
    this.log = [];
    this.weather = 'none'; // 'none' | 'sun' | 'rain' | 'sand' | 'hail'
    this.weatherTurns = 0;

    // Trigger on-entry abilities for starting active Pokemon
    this.triggerEntryAbilities();
  }

  getP1Active() {
    return this.p1Team[this.p1ActiveIndex];
  }

  getP2Active() {
    return this.p2Team[this.p2ActiveIndex];
  }

  addLog(message, type = 'info', extra = {}) {
    this.log.push({
      turn: this.turn,
      message,
      type,
      ...extra
    });
  }

  triggerEntryAbilities() {
    const p1 = this.getP1Active();
    const p2 = this.getP2Active();

    if (p1 && !p1.isFainted()) {
      this.handleEntryAbility(p1, p2, 'p1', 'p2');
    }
    if (p2 && !p2.isFainted()) {
      this.handleEntryAbility(p2, p1, 'p2', 'p1');
    }
  }

  handleEntryAbility(pokemon, opponent, side, oppSide) {
    const abId = pokemon.ability.id;
    if (abId === 'intimidate') {
      this.addLog(`${pokemon.name}'s Intimidate cut ${opponent.name}'s Attack!`, 'ability');
      this.applyStatChange(opponent, 'attack', -1, oppSide);
    } else if (abId === 'drizzle') {
      this.weather = 'rain';
      this.weatherTurns = 5;
      this.addLog(`${pokemon.name}'s Drizzle made it rain!`, 'weather');
    } else if (abId === 'drought') {
      this.weather = 'sun';
      this.weatherTurns = 5;
      this.addLog(`${pokemon.name}'s Drought intensified the sun!`, 'weather');
    }
  }

  applyStatChange(target, stat, stages, side) {
    const current = target.statStages[stat] || 0;
    const next = Math.max(-6, Math.min(6, current + stages));
    const diff = next - current;
    target.statStages[stat] = next;

    const statLabels = {
      attack: 'Attack',
      defense: 'Defense',
      specialAttack: 'Sp. Atk',
      specialDefense: 'Sp. Def',
      speed: 'Speed',
      accuracy: 'Accuracy',
      evasion: 'Evasion'
    };

    const label = statLabels[stat] || stat;
    if (diff > 1) {
      this.addLog(`${target.name}'s ${label} rose sharply!`, 'stat_up');
    } else if (diff === 1) {
      this.addLog(`${target.name}'s ${label} rose!`, 'stat_up');
    } else if (diff === -1) {
      this.addLog(`${target.name}'s ${label} fell!`, 'stat_down');
    } else if (diff < -1) {
      this.addLog(`${target.name}'s ${label} fell harshly!`, 'stat_down');
    } else {
      this.addLog(`${target.name}'s ${label} won't go any ${stages > 0 ? 'higher' : 'lower'}!`, 'info');
    }
  }

  calculateDamage(attacker, defender, move) {
    if (move.category === 'status') return { damage: 0, effectiveness: 1, isCrit: false };

    const isPhysical = move.category === 'physical';
    let atk = isPhysical ? attacker.getEffectiveStat('attack') : attacker.getEffectiveStat('specialAttack');
    
    // Psyshock targets physical defense with special attack
    const targetsDefense = isPhysical || move.targetsDefense;
    let def = targetsDefense ? defender.getEffectiveStat('defense') : defender.getEffectiveStat('specialDefense');

    // Foul Play uses defender's attack
    if (move.usesTargetAttack) {
      atk = defender.getEffectiveStat('attack');
    }

    const level = attacker.level || 50;
    const basePower = move.power || 40;

    // Base damage formula
    let damage = Math.floor((Math.floor((2 * level) / 5 + 2) * basePower * (atk / def)) / 50) + 2;

    // Weather modifiers
    if (this.weather === 'sun') {
      if (move.type === 'fire') damage = Math.floor(damage * 1.5);
      if (move.type === 'water') damage = Math.floor(damage * 0.5);
    } else if (this.weather === 'rain') {
      if (move.type === 'water') damage = Math.floor(damage * 1.5);
      if (move.type === 'fire') damage = Math.floor(damage * 0.5);
    }

    // Critical hit (1/24 standard base chance)
    let critRatio = move.critRatio || 0;
    let critChance = critRatio === 1 ? 0.125 : 0.0417;
    let isCrit = Math.random() < critChance;
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }

    // STAB (Same Type Attack Bonus)
    let stab = 1.0;
    if (attacker.types.includes(move.type.toLowerCase())) {
      stab = attacker.ability.id === 'adaptability' ? 2.0 : 1.5;
    }
    damage = Math.floor(damage * stab);

    // Type effectiveness
    // Ground immunity check against Levitate
    let effectiveness = getTypeEffectiveness(move.type, defender.types);
    if (move.type === 'ground' && defender.ability.id === 'levitate') {
      effectiveness = 0;
    }

    damage = Math.floor(damage * effectiveness);

    // Abilities & Items modifiers
    if (attacker.item.id === 'lifeorb') {
      damage = Math.floor(damage * 1.3);
    }
    if (attacker.item.id === 'expertbelt' && effectiveness > 1) {
      damage = Math.floor(damage * 1.2);
    }
    if (defender.ability.id === 'multiscale' && defender.currentHp === defender.maxHp) {
      damage = Math.floor(damage * 0.5);
    }

    // Blaze / Torrent / Overgrow pinches
    if (attacker.currentHp <= Math.floor(attacker.maxHp / 3)) {
      if (attacker.ability.id === 'blaze' && move.type === 'fire') damage = Math.floor(damage * 1.5);
      if (attacker.ability.id === 'torrent' && move.type === 'water') damage = Math.floor(damage * 1.5);
      if (attacker.ability.id === 'overgrow' && move.type === 'grass') damage = Math.floor(damage * 1.5);
    }

    // Random roll [0.85, 1.00]
    const randomMultiplier = (Math.floor(Math.random() * 16) + 85) / 100;
    damage = Math.floor(damage * randomMultiplier);

    if (effectiveness > 0 && damage < 1) {
      damage = 1;
    }

    return { damage, effectiveness, isCrit };
  }

  /**
   * Submits both player actions for the turn and resolves them.
   * action: { type: 'move', moveIndex: 0 } | { type: 'switch', targetIndex: 1 }
   */
  resolveTurn(p1Action, p2Action) {
    if (this.phase !== 'action_selection') {
      throw new Error(`Cannot resolve turn during phase: ${this.phase}`);
    }

    this.addLog(`--- Turn ${this.turn} ---`, 'turn_start');

    // Reset Protect state for both active Pokemon
    const p1 = this.getP1Active();
    const p2 = this.getP2Active();
    p1.isProtected = false;
    p2.isProtected = false;

    // Determine turn order
    const actions = [
      { side: 'p1', oppSide: 'p2', actor: p1, target: p2, action: p1Action },
      { side: 'p2', oppSide: 'p1', actor: p2, target: p1, action: p2Action }
    ];

    // Priority calculation
    const getPriority = (item) => {
      if (item.action.type === 'switch') return 6; // Switches go first
      if (item.action.type === 'move') {
        const move = item.actor.moves[item.action.moveIndex] || item.actor.moves[0];
        let p = move.priority || 0;
        if (item.actor.ability.id === 'prankster' && move.category === 'status') {
          p += 1;
        }
        return p;
      }
      return 0;
    };

    actions.sort((a, b) => {
      const prioA = getPriority(a);
      const prioB = getPriority(b);
      if (prioA !== prioB) return prioB - prioA;

      // Speed tie-breaker
      const spdA = a.actor.getEffectiveStat('speed');
      const spdB = b.actor.getEffectiveStat('speed');
      if (spdA !== spdB) return spdB - spdA;
      return Math.random() < 0.5 ? -1 : 1;
    });

    // Execute actions in order
    for (const item of actions) {
      // If winner already found, stop
      if (this.checkBattleOver()) break;

      // Re-fetch current actor & target in case a switch or faint occurred
      const currentActor = item.side === 'p1' ? this.getP1Active() : this.getP2Active();
      const currentTarget = item.side === 'p1' ? this.getP2Active() : this.getP1Active();

      // If the actor fainted earlier this turn, they cannot act
      if (currentActor.isFainted()) continue;

      if (item.action.type === 'switch') {
        this.executeSwitch(item.side, item.action.targetIndex);
      } else if (item.action.type === 'move') {
        this.executeMove(item.side, item.oppSide, currentActor, currentTarget, item.action.moveIndex);
      }
    }

    // End of Turn Effects
    if (!this.checkBattleOver()) {
      this.resolveEndOfTurn();
    }

    // Check for fainted Pokémon requiring forced switches
    this.checkFaintingAndForcedSwitches();

    if (!this.winner) {
      this.turn += 1;
    }

    return this.getState();
  }

  executeSwitch(side, targetIndex) {
    const team = side === 'p1' ? this.p1Team : this.p2Team;
    const currentActiveIndex = side === 'p1' ? this.p1ActiveIndex : this.p2ActiveIndex;
    const oldPokemon = team[currentActiveIndex];
    const newPokemon = team[targetIndex];

    if (!newPokemon || newPokemon.isFainted() || targetIndex === currentActiveIndex) {
      return false;
    }

    // Regenerator ability check
    if (oldPokemon && oldPokemon.ability.id === 'regenerator' && !oldPokemon.isFainted()) {
      const heal = Math.floor(oldPokemon.maxHp / 3);
      oldPokemon.currentHp = Math.min(oldPokemon.maxHp, oldPokemon.currentHp + heal);
      this.addLog(`${oldPokemon.name}'s Regenerator restored some HP!`, 'heal');
    }

    // Natural Cure
    if (oldPokemon && oldPokemon.ability.id === 'naturalcure') {
      oldPokemon.status = null;
    }

    oldPokemon.resetStatStages();

    if (side === 'p1') {
      this.p1ActiveIndex = targetIndex;
    } else {
      this.p2ActiveIndex = targetIndex;
    }

    const trainer = side === 'p1' ? this.p1Name : this.p2Name;
    this.addLog(`${trainer} withdrew ${oldPokemon.name} and sent out ${newPokemon.name}!`, 'switch', {
      side,
      pokemon: newPokemon.name
    });

    // Trigger entry ability of new Pokemon
    const opponent = side === 'p1' ? this.getP2Active() : this.getP1Active();
    const oppSide = side === 'p1' ? 'p2' : 'p1';
    this.handleEntryAbility(newPokemon, opponent, side, oppSide);

    return true;
  }

  executeMove(side, oppSide, attacker, defender, moveIndex) {
    const move = attacker.moves[moveIndex] || attacker.moves[0];
    if (!move) return;

    // Check status prevention (Sleep, Freeze, Paralysis, Confusion)
    if (attacker.status === 'sleep') {
      attacker.sleepTurns = (attacker.sleepTurns || 0) + 1;
      if (attacker.sleepTurns >= 3 || Math.random() < 0.33) {
        attacker.status = null;
        attacker.sleepTurns = 0;
        this.addLog(`${attacker.name} woke up!`, 'status_cure');
      } else {
        this.addLog(`${attacker.name} is fast asleep!`, 'status_fail');
        return;
      }
    }

    if (attacker.status === 'freeze') {
      if (Math.random() < 0.2) {
        attacker.status = null;
        this.addLog(`${attacker.name} thawed out!`, 'status_cure');
      } else {
        this.addLog(`${attacker.name} is frozen solid!`, 'status_fail');
        return;
      }
    }

    if (attacker.status === 'paralysis') {
      if (Math.random() < 0.25) {
        this.addLog(`${attacker.name} is fully paralyzed and cannot move!`, 'status_fail');
        return;
      }
    }

    if (attacker.isConfused) {
      attacker.confusionTurns = (attacker.confusionTurns || 0) + 1;
      if (attacker.confusionTurns >= 4 || Math.random() < 0.3) {
        attacker.isConfused = false;
        attacker.confusionTurns = 0;
        this.addLog(`${attacker.name} snapped out of confusion!`, 'status_cure');
      } else {
        this.addLog(`${attacker.name} is confused!`, 'status_info');
        if (Math.random() < 0.33) {
          // Hurt itself in confusion (40 power typeless physical damage)
          const confDmg = Math.max(1, Math.floor((Math.floor((2 * 50) / 5 + 2) * 40 * (attacker.getEffectiveStat('attack') / attacker.getEffectiveStat('defense'))) / 50) + 2);
          attacker.currentHp = Math.max(0, attacker.currentHp - confDmg);
          this.addLog(`${attacker.name} hurt itself in its confusion for ${confDmg} HP!`, 'damage', { targetSide: side, damage: confDmg });
          return;
        }
      }
    }

    // Libero / Protean
    if ((attacker.ability.id === 'libero' || attacker.ability.id === 'protean') && move.type) {
      attacker.types = [move.type];
      this.addLog(`${attacker.name}'s ${attacker.ability.name} changed its type to ${move.type.toUpperCase()}!`, 'ability');
    }

    // PP usage
    if (move.currentPp > 0) {
      move.currentPp -= 1;
    }

    this.addLog(`${attacker.name} used ${move.name}!`, 'move_use', {
      side,
      moveName: move.name,
      moveType: move.type
    });

    // Protect move
    if (move.protects) {
      attacker.isProtected = true;
      this.addLog(`${attacker.name} protected itself!`, 'protect');
      return;
    }

    // Target is protected
    if (move.target === 'opponent' && defender.isProtected) {
      this.addLog(`${defender.name} protected itself from the attack!`, 'protect');
      return;
    }

    // Accuracy check
    if (!move.neverMiss && move.accuracy && move.accuracy < 100) {
      const hitRoll = Math.random() * 100;
      if (hitRoll > move.accuracy) {
        this.addLog(`${attacker.name}'s attack missed!`, 'miss');
        return;
      }
    }

    // Self Healing Moves (e.g. Recover, Roost)
    if (move.healPercent) {
      const healAmount = Math.floor(attacker.maxHp * move.healPercent);
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
      this.addLog(`${attacker.name} regained health! (+${healAmount} HP)`, 'heal');
      return;
    }

    // Self Stat Boosting Moves (e.g. Swords Dance, Calm Mind)
    if (move.statChanges && move.target === 'self') {
      for (const [stat, stages] of Object.entries(move.statChanges)) {
        this.applyStatChange(attacker, stat, stages, side);
      }
      return;
    }

    // Status Inflicting Moves (e.g. Thunder Wave, Will-O-Wisp, Spore, Toxic)
    if (move.category === 'status' && move.statusEffect) {
      if (move.statusEffect === 'burn' && defender.types.includes('fire')) {
        this.addLog(`It doesn't affect ${defender.name}...`, 'immune');
        return;
      }
      if ((move.statusEffect === 'poison' || move.statusEffect === 'badly-poison') && (defender.types.includes('poison') || defender.types.includes('steel'))) {
        this.addLog(`It doesn't affect ${defender.name}...`, 'immune');
        return;
      }
      if (move.statusEffect === 'paralysis' && defender.types.includes('electric')) {
        this.addLog(`It doesn't affect ${defender.name}...`, 'immune');
        return;
      }

      if (defender.status) {
        this.addLog(`It had no effect (already statused)!`, 'info');
        return;
      }

      defender.status = move.statusEffect;
      this.addLog(`${defender.name} was afflicted with ${move.statusEffect}!`, 'status_inflict');
      this.handleLumBerry(defender);
      return;
    }

    // Damage Calculation
    const { damage, effectiveness, isCrit } = this.calculateDamage(attacker, defender, move);

    if (effectiveness === 0) {
      this.addLog(`It doesn't affect ${defender.name}...`, 'immune');
      return;
    }

    // Apply Damage with Focus Sash & Sturdy checks
    let actualDamage = damage;
    if (defender.currentHp === defender.maxHp && actualDamage >= defender.currentHp) {
      if (defender.item.id === 'focussash') {
        actualDamage = defender.currentHp - 1;
        defender.item = { id: 'none', name: 'None' }; // consume sash
        this.addLog(`${defender.name} hung on with its Focus Sash!`, 'item');
      } else if (defender.ability.id === 'sturdy') {
        actualDamage = defender.currentHp - 1;
        this.addLog(`${defender.name} hung on with Sturdy!`, 'ability');
      }
    }

    defender.currentHp = Math.max(0, defender.currentHp - actualDamage);

    if (isCrit) {
      this.addLog(`A critical hit!`, 'crit');
    }

    if (effectiveness > 1) {
      this.addLog(`It's super effective!`, 'super_effective');
    } else if (effectiveness < 1 && effectiveness > 0) {
      this.addLog(`It's not very effective...`, 'not_effective');
    }

    this.addLog(`${defender.name} lost ${actualDamage} HP! (${defender.getHpPercent()}% remaining)`, 'damage', {
      targetSide: oppSide,
      damage: actualDamage
    });

    // Check Sitrus Berry
    this.handleSitrusBerry(defender);

    // Recoil (e.g. Flare Blitz, Brave Bird, Double-Edge)
    if (move.recoil && actualDamage > 0) {
      const recoilDmg = Math.max(1, Math.floor(actualDamage * move.recoil));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoilDmg);
      this.addLog(`${attacker.name} is hit with recoil! (-${recoilDmg} HP)`, 'recoil', {
        targetSide: side,
        damage: recoilDmg
      });
    }

    // Life Orb recoil
    if (attacker.item.id === 'lifeorb' && actualDamage > 0 && !attacker.isFainted()) {
      const loDmg = Math.max(1, Math.floor(attacker.maxHp * 0.1));
      attacker.currentHp = Math.max(0, attacker.currentHp - loDmg);
      this.addLog(`${attacker.name} lost some HP due to its Life Orb!`, 'item');
    }

    // Rocky Helmet
    if (defender.item.id === 'rockyhelmet' && move.category === 'physical' && !attacker.isFainted()) {
      const rhDmg = Math.max(1, Math.floor(attacker.maxHp / 6));
      attacker.currentHp = Math.max(0, attacker.currentHp - rhDmg);
      this.addLog(`${attacker.name} was hurt by ${defender.name}'s Rocky Helmet!`, 'item');
    }

    // Drain moves (e.g. Giga Drain, Drain Punch)
    if (move.drainPercent && actualDamage > 0 && !attacker.isFainted()) {
      const heal = Math.max(1, Math.floor(actualDamage * move.drainPercent));
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
      this.addLog(`${attacker.name} restored HP! (+${heal} HP)`, 'heal');
    }

    // Self Stat drops (e.g. Draco Meteor, Close Combat, Leaf Storm)
    if (move.selfStatChanges && !attacker.isFainted()) {
      for (const [stat, stages] of Object.entries(move.selfStatChanges)) {
        this.applyStatChange(attacker, stat, stages, side);
      }
    }

    // Target secondary stat drops
    if (move.targetStatChanges && !defender.isFainted() && move.statChance) {
      if (Math.random() <= move.statChance) {
        for (const [stat, stages] of Object.entries(move.targetStatChanges)) {
          this.applyStatChange(defender, stat, stages, oppSide);
        }
      }
    }

    // Secondary Status infliction (e.g. Flamethrower burn, Thunderbolt paralyze)
    if (move.statusEffect && move.statusChance && !defender.isFainted() && !defender.status) {
      if (Math.random() <= move.statusChance) {
        defender.status = move.statusEffect;
        this.addLog(`${defender.name} was afflicted with ${move.statusEffect}!`, 'status_inflict');
        this.handleLumBerry(defender);
      }
    }

    // Moxie check if defender faints
    if (defender.isFainted() && attacker.ability.id === 'moxie' && !attacker.isFainted()) {
      this.applyStatChange(attacker, 'attack', 1, side);
    }
  }

  handleSitrusBerry(pokemon) {
    if (pokemon.item.id === 'sitrusberry' && pokemon.currentHp > 0 && pokemon.currentHp <= Math.floor(pokemon.maxHp * 0.5)) {
      const heal = Math.floor(pokemon.maxHp * 0.25);
      pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
      pokemon.item = { id: 'none', name: 'None' }; // consumed
      this.addLog(`${pokemon.name} restored health using its Sitrus Berry! (+${heal} HP)`, 'item');
    }
  }

  handleLumBerry(pokemon) {
    if (pokemon.item.id === 'lumberry' && pokemon.status) {
      const cured = pokemon.status;
      pokemon.status = null;
      pokemon.item = { id: 'none', name: 'None' }; // consumed
      this.addLog(`${pokemon.name}'s Lum Berry cured its ${cured}!`, 'item');
    }
  }

  resolveEndOfTurn() {
    const actives = [
      { pokemon: this.getP1Active(), side: 'p1' },
      { pokemon: this.getP2Active(), side: 'p2' }
    ];

    for (const { pokemon, side } of actives) {
      if (pokemon.isFainted()) continue;

      // Status damage
      if (pokemon.status === 'burn') {
        const burnDmg = Math.max(1, Math.floor(pokemon.maxHp / 16));
        pokemon.currentHp = Math.max(0, pokemon.currentHp - burnDmg);
        this.addLog(`${pokemon.name} is hurt by its burn! (-${burnDmg} HP)`, 'status_damage', { targetSide: side });
      } else if (pokemon.status === 'poison') {
        const pDmg = Math.max(1, Math.floor(pokemon.maxHp / 8));
        pokemon.currentHp = Math.max(0, pokemon.currentHp - pDmg);
        this.addLog(`${pokemon.name} is hurt by poison! (-${pDmg} HP)`, 'status_damage', { targetSide: side });
      } else if (pokemon.status === 'badly-poison') {
        pokemon.toxicTurns = (pokemon.toxicTurns || 0) + 1;
        const toxDmg = Math.max(1, Math.floor((pokemon.maxHp / 16) * pokemon.toxicTurns));
        pokemon.currentHp = Math.max(0, pokemon.currentHp - toxDmg);
        this.addLog(`${pokemon.name} is hurt by toxic poison! (-${toxDmg} HP)`, 'status_damage', { targetSide: side });
      }

      // Leftovers recovery
      if (pokemon.item.id === 'leftovers' && pokemon.currentHp > 0 && pokemon.currentHp < pokemon.maxHp) {
        const leftHeal = Math.max(1, Math.floor(pokemon.maxHp / 16));
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + leftHeal);
        this.addLog(`${pokemon.name} restored a little HP with Leftovers! (+${leftHeal} HP)`, 'item');
      }

      // Speed Boost ability
      if (pokemon.ability.id === 'speedboost' && pokemon.currentHp > 0) {
        this.applyStatChange(pokemon, 'speed', 1, side);
      }
    }

    // Weather countdown
    if (this.weatherTurns > 0) {
      this.weatherTurns -= 1;
      if (this.weatherTurns === 0) {
        this.addLog(`The weather returned to normal.`, 'weather');
        this.weather = 'none';
      }
    }
  }

  checkBattleOver() {
    const p1Alive = this.p1Team.some(p => !p.isFainted());
    const p2Alive = this.p2Team.some(p => !p.isFainted());

    if (!p1Alive && !p2Alive) {
      this.winner = 'draw';
      this.phase = 'game_over';
      this.addLog(`Both teams have fainted! It's a draw!`, 'game_over');
      return true;
    } else if (!p1Alive) {
      this.winner = 'p2';
      this.phase = 'game_over';
      this.addLog(`${this.p2Name} wins the battle!`, 'game_over');
      return true;
    } else if (!p2Alive) {
      this.winner = 'p1';
      this.phase = 'game_over';
      this.addLog(`${this.p1Name} wins the battle!`, 'game_over');
      return true;
    }

    return false;
  }

  checkFaintingAndForcedSwitches() {
    if (this.checkBattleOver()) return;

    const p1Fainted = this.getP1Active().isFainted();
    const p2Fainted = this.getP2Active().isFainted();

    if (p1Fainted && p2Fainted) {
      this.phase = 'forced_switch';
      this.forcedSwitchSide = 'both';
      this.addLog(`Both active Pokémon fainted! Both trainers must send out a Pokémon!`, 'faint');
    } else if (p1Fainted) {
      this.phase = 'forced_switch';
      this.forcedSwitchSide = 'p1';
      this.addLog(`${this.getP1Active().name} fainted! ${this.p1Name} must choose a Pokémon to send out!`, 'faint');
    } else if (p2Fainted) {
      this.phase = 'forced_switch';
      this.forcedSwitchSide = 'p2';
      this.addLog(`${this.getP2Active().name} fainted! ${this.p2Name} must choose a Pokémon to send out!`, 'faint');
    } else {
      this.phase = 'action_selection';
      this.forcedSwitchSide = null;
    }
  }

  /**
   * Executes a forced replacement for a fainted Pokémon
   */
  resolveForcedSwitch(side, targetIndex) {
    if (this.phase !== 'forced_switch') {
      throw new Error(`Cannot execute forced switch during phase: ${this.phase}`);
    }

    const team = side === 'p1' ? this.p1Team : this.p2Team;
    const target = team[targetIndex];
    if (!target || target.isFainted()) {
      throw new Error(`Cannot switch to fainted or invalid Pokémon at index ${targetIndex}`);
    }

    if (side === 'p1') {
      this.p1ActiveIndex = targetIndex;
      const newPk = this.getP1Active();
      this.addLog(`${this.p1Name} sent out ${newPk.name}!`, 'switch', { side: 'p1', pokemon: newPk.name });
      this.handleEntryAbility(newPk, this.getP2Active(), 'p1', 'p2');
    } else if (side === 'p2') {
      this.p2ActiveIndex = targetIndex;
      const newPk = this.getP2Active();
      this.addLog(`${this.p2Name} sent out ${newPk.name}!`, 'switch', { side: 'p2', pokemon: newPk.name });
      this.handleEntryAbility(newPk, this.getP1Active(), 'p2', 'p1');
    }

    // Check if other side still needs a forced switch
    if (this.forcedSwitchSide === 'both') {
      if (side === 'p1' && this.getP2Active().isFainted()) {
        this.forcedSwitchSide = 'p2';
        return this.getState();
      }
      if (side === 'p2' && this.getP1Active().isFainted()) {
        this.forcedSwitchSide = 'p1';
        return this.getState();
      }
    }

    this.phase = 'action_selection';
    this.forcedSwitchSide = null;
    return this.getState();
  }

  getState() {
    return {
      teamSize: this.teamSize,
      p1Name: this.p1Name,
      p2Name: this.p2Name,
      turn: this.turn,
      phase: this.phase,
      forcedSwitchSide: this.forcedSwitchSide,
      winner: this.winner,
      weather: this.weather,
      p1ActiveIndex: this.p1ActiveIndex,
      p2ActiveIndex: this.p2ActiveIndex,
      p1Team: this.p1Team.map(p => p.toJSON()),
      p2Team: this.p2Team.map(p => p.toJSON()),
      log: [...this.log]
    };
  }
}
