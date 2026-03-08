import type { NodeDef } from '../types/game';

export const NODE_DEFS: Record<string, NodeDef> = {
  tree: { type: 'tree', maxHp: 6, preferredTool: 'axe', regrowSeconds: 50, dropTable: [{ itemId: 'log', min: 2, max: 4 }, { itemId: 'twigs', min: 0, max: 1 }] },
  boulder: { type: 'boulder', maxHp: 7, preferredTool: 'pickaxe', regrowSeconds: 60, dropTable: [{ itemId: 'stone', min: 2, max: 4 }, { itemId: 'flint', min: 1, max: 2 }] },
  berry_bush: { type: 'berry_bush', maxHp: 2, regrowSeconds: 40, dropTable: [{ itemId: 'berries', min: 2, max: 3 }] },
  grass_tuft: { type: 'grass_tuft', maxHp: 1, regrowSeconds: 35, dropTable: [{ itemId: 'grass', min: 1, max: 2 }] },
  sapling: { type: 'sapling', maxHp: 1, regrowSeconds: 35, dropTable: [{ itemId: 'twigs', min: 1, max: 2 }] }
};
