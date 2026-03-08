import type { ItemDef } from '../types/game';

export const ITEMS: Record<string, ItemDef> = {
  twigs: { id: 'twigs', displayName: 'Twigs', stackSize: 40, tags: ['resource'] },
  grass: { id: 'grass', displayName: 'Grass', stackSize: 40, tags: ['resource'] },
  flint: { id: 'flint', displayName: 'Flint', stackSize: 40, tags: ['resource'] },
  log: { id: 'log', displayName: 'Log', stackSize: 40, tags: ['resource', 'fuel'], fuelValue: 25 },
  stone: { id: 'stone', displayName: 'Stone', stackSize: 40, tags: ['resource'] },
  berries: { id: 'berries', displayName: 'Berries', stackSize: 20, tags: ['food'], edible: { hunger: 12, health: 2, sanity: 1 } },
  roasted_berries: { id: 'roasted_berries', displayName: 'Roasted Berries', stackSize: 20, tags: ['food'], edible: { hunger: 18, health: 4, sanity: 2 } },
  axe: { id: 'axe', displayName: 'Axe', stackSize: 1, tags: ['tool'], tool: { kind: 'axe', power: 2 } },
  pickaxe: { id: 'pickaxe', displayName: 'Pickaxe', stackSize: 1, tags: ['tool'], tool: { kind: 'pickaxe', power: 2 } },
  torch: { id: 'torch', displayName: 'Torch', stackSize: 1, tags: ['light', 'tool'], fuelValue: 45 },
  campfire_kit: { id: 'campfire_kit', displayName: 'Campfire Kit', stackSize: 5, tags: ['structure'] },
  science_kit: { id: 'science_kit', displayName: 'Science Machine Kit', stackSize: 2, tags: ['structure'] },
  claw: { id: 'claw', displayName: 'Claw', stackSize: 10, tags: ['loot'] }
};
