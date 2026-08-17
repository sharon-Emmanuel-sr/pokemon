// Pokemon Abilities dataset with effect descriptions
export const ABILITIES = {
  intimidate: {
    id: 'intimidate',
    name: 'Intimidate',
    description: 'Lowers the opposing Pokémon Attack stat upon entering battle.'
  },
  levitate: {
    id: 'levitate',
    name: 'Levitate',
    description: 'By floating in the air, the Pokémon receives full immunity to all Ground-type moves.'
  },
  speedboost: {
    id: 'speedboost',
    name: 'Speed Boost',
    description: 'Its Speed stat is boosted by one stage at the end of each turn.'
  },
  blaze: {
    id: 'blaze',
    name: 'Blaze',
    description: 'Powers up Fire-type moves by 50% when the Pokémon HP is low (<= 33%).'
  },
  torrent: {
    id: 'torrent',
    name: 'Torrent',
    description: 'Powers up Water-type moves by 50% when the Pokémon HP is low (<= 33%).'
  },
  overgrow: {
    id: 'overgrow',
    name: 'Overgrow',
    description: 'Powers up Grass-type moves by 50% when the Pokémon HP is low (<= 33%).'
  },
  adaptability: {
    id: 'adaptability',
    name: 'Adaptability',
    description: 'Powers up moves of the same type as the Pokémon (STAB becomes 2.0x instead of 1.5x).'
  },
  hugepower: {
    id: 'hugepower',
    name: 'Huge Power',
    description: 'Doubles the Pokémon Attack stat.'
  },
  magicbounce: {
    id: 'magicbounce',
    name: 'Magic Bounce',
    description: 'Reflects status-changing and hazard moves back to the user.'
  },
  sturdy: {
    id: 'sturdy',
    name: 'Sturdy',
    description: 'It cannot be knocked out with one hit if at full HP. One HP will remain.'
  },
  regenerator: {
    id: 'regenerator',
    name: 'Regenerator',
    description: 'Restores a little HP (33%) when withdrawn from battle.'
  },
  technician: {
    id: 'technician',
    name: 'Technician',
    description: 'Powers up the Pokémon weaker moves (base power <= 60 boosted by 50%).'
  },
  moxie: {
    id: 'moxie',
    name: 'Moxie',
    description: 'The Pokémon shows moxie, and that boosts the Attack stat after knocking out any Pokémon.'
  },
  sheerforce: {
    id: 'sheerforce',
    name: 'Sheer Force',
    description: 'Removes additional effects to increase the power of moves when attacking.'
  },
  multiscale: {
    id: 'multiscale',
    name: 'Multiscale',
    description: 'Reduces the amount of damage the Pokémon takes while its HP is full.'
  },
  libero: {
    id: 'libero',
    name: 'Libero',
    description: 'Changes the Pokémon type to the type of the move it is about to use.'
  },
  protean: {
    id: 'protean',
    name: 'Protean',
    description: 'Changes the Pokémon type to the type of the move it is about to use.'
  },
  chlorophyll: {
    id: 'chlorophyll',
    name: 'Chlorophyll',
    description: 'Boosts the Pokémon Speed stat in sunshine.'
  },
  swiftswim: {
    id: 'swiftswim',
    name: 'Swift Swim',
    description: 'Boosts the Pokémon Speed stat in rain.'
  },
  static: {
    id: 'static',
    name: 'Static',
    description: 'The Pokémon is charged with static electricity, so contact with it may cause paralysis.'
  },
  guts: {
    id: 'guts',
    name: 'Guts',
    description: 'Boosts the Attack stat by 50% if the Pokémon has a status condition.'
  },
  drizzle: {
    id: 'drizzle',
    name: 'Drizzle',
    description: 'The Pokémon makes it rain when it enters a battle.'
  },
  drought: {
    id: 'drought',
    name: 'Drought',
    description: 'Turns the sunlight harsh when the Pokémon enters a battle.'
  },
  infiltrator: {
    id: 'infiltrator',
    name: 'Infiltrator',
    description: 'Passes through the opposing Pokémon barriers and strikes.'
  },
  prankster: {
    id: 'prankster',
    name: 'Prankster',
    description: 'Gives priority to a status move (+1 priority).'
  },
  unaware: {
    id: 'unaware',
    name: 'Unaware',
    description: 'When attacking or defending, the Pokémon ignores the target stat changes.'
  },
  pressure: {
    id: 'pressure',
    name: 'Pressure',
    description: 'The Pokémon raises opposing Pokémon PP usage.'
  },
  innerfocus: {
    id: 'innerfocus',
    name: 'Inner Focus',
    description: 'The Pokémon intense focus prevents it from flinching.'
  },
  synchronize: {
    id: 'synchronize',
    name: 'Synchronize',
    description: 'The attacker will receive the same status condition if it inflicts a burn, poison, or paralysis to the Pokémon.'
  },
  naturalcure: {
    id: 'naturalcure',
    name: 'Natural Cure',
    description: 'All status conditions heal when the Pokémon switches out.'
  }
};

export function getAbility(id) {
  if (!id) return { id: 'none', name: 'None', description: 'No ability' };
  const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ABILITIES[cleanId] || { id: cleanId, name: id, description: 'Standard battle ability' };
}
