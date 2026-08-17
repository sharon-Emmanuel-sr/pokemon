// Competitive Pokémon held items dataset
export const ITEMS = {
  none: {
    id: 'none',
    name: 'None',
    description: 'No held item.'
  },
  leftovers: {
    id: 'leftovers',
    name: 'Leftovers',
    description: 'Restores 1/16 (6.25%) of the holder maximum HP at the end of every turn.'
  },
  lifeorb: {
    id: 'lifeorb',
    name: 'Life Orb',
    description: 'Boosts the power of attacks by 30%, but at the cost of 10% max HP per attack.'
  },
  choiceband: {
    id: 'choiceband',
    name: 'Choice Band',
    description: 'Boosts Attack by 50%, locking user into the first move selected until switched.'
  },
  choicespecs: {
    id: 'choicespecs',
    name: 'Choice Specs',
    description: 'Boosts Special Attack by 50%, locking user into the first move selected until switched.'
  },
  choicescarf: {
    id: 'choicescarf',
    name: 'Choice Scarf',
    description: 'Boosts Speed by 50%, locking user into the first move selected until switched.'
  },
  focussash: {
    id: 'focussash',
    name: 'Focus Sash',
    description: 'If holder has full HP, prevents 1-hit KO and leaves with 1 HP (consumed).'
  },
  sitrusberry: {
    id: 'sitrusberry',
    name: 'Sitrus Berry',
    description: 'Restores 25% max HP when holder falls below 50% HP (consumed).'
  },
  lumberry: {
    id: 'lumberry',
    name: 'Lum Berry',
    description: 'Immediately cures any status condition (burn, freeze, paralysis, poison, sleep) (consumed).'
  },
  assaultvest: {
    id: 'assaultvest',
    name: 'Assault Vest',
    description: 'Raises Special Defense by 50%.'
  },
  heavydutyboots: {
    id: 'heavydutyboots',
    name: 'Heavy-Duty Boots',
    description: 'Protects the holder from entry hazards such as Stealth Rock.'
  },
  expertbelt: {
    id: 'expertbelt',
    name: 'Expert Belt',
    description: 'Boosts the power of super-effective moves by 20%.'
  },
  rockyhelmet: {
    id: 'rockyhelmet',
    name: 'Rocky Helmet',
    description: 'If hit by a physical attack, the attacker takes damage equal to 1/6 of its max HP.'
  }
};

export const ITEM_LIST = Object.values(ITEMS);

export function getItem(id) {
  if (!id) return ITEMS.none;
  const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ITEMS[cleanId] || ITEMS.none;
}
