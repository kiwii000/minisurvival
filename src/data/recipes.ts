import type { Recipe } from '../types/game';

export const RECIPES: Recipe[] = [
  { id: 'axe', unlock: 'starter', ingredients: [{ itemId: 'twigs', amount: 1 }, { itemId: 'flint', amount: 1 }], output: { itemId: 'axe', amount: 1 } },
  { id: 'pickaxe', unlock: 'starter', ingredients: [{ itemId: 'twigs', amount: 1 }, { itemId: 'flint', amount: 2 }], output: { itemId: 'pickaxe', amount: 1 } },
  { id: 'torch', unlock: 'starter', ingredients: [{ itemId: 'twigs', amount: 2 }, { itemId: 'grass', amount: 2 }], output: { itemId: 'torch', amount: 1 } },
  { id: 'campfire', unlock: 'starter', ingredients: [{ itemId: 'log', amount: 2 }, { itemId: 'stone', amount: 4 }], output: { itemId: 'campfire_kit', amount: 1 } },
  { id: 'science_machine', unlock: 'science', station: 'science', ingredients: [{ itemId: 'log', amount: 4 }, { itemId: 'stone', amount: 4 }], output: { itemId: 'science_kit', amount: 1 } },
  { id: 'roasted_berries', unlock: 'starter', ingredients: [{ itemId: 'berries', amount: 1 }], output: { itemId: 'roasted_berries', amount: 1 } }
];
