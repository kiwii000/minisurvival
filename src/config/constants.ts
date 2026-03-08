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
export const SAVE_VERSION = 1;

export const PALETTE = {
  meadowA: 0x8fbf8f,
  meadowB: 0x9bc997,
  forestA: 0x6c966c,
  forestB: 0x769f73,
  duskTint: 0x8e7ca6,
  nightTint: 0x1e2438,
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
