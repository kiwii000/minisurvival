export const TILE_SIZE = 24;
export const WORLD_W = 60;
export const WORLD_H = 40;
export const START_SEED = 1337;

export const DAY_LENGTH = 180;
export const DUSK_LENGTH = 60;
export const NIGHT_LENGTH = 90;

export const PLAYER_SPEED = 150;
export const INTERACT_RANGE = 36;

export const AUTOSAVE_SECONDS = 45;
export const SAVE_VERSION = 2;

export const PALETTE = {
  meadowA: 0x86b886,
  meadowB: 0x7db07d,
  forestA: 0x648f64,
  forestB: 0x577f57,
  dirtPatch: 0x6a6951,
  duskTint: 0x7f6f92,
  nightTint: 0x1a2233,
  hudText: '#ecf1f8',
  promptText: '#ffe4a8'
} as const;

export const ASSET_IDS = {
  player: 'player_idle',
  enemy: 'enemy_idle',
  tree: 'tree',
  boulder: 'boulder',
  berryBush: 'berry_bush',
  grassTuft: 'grass_tuft',
  sapling: 'sapling',
  campfire: 'campfire',
  science: 'science'
} as const;
