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

export const ASSET_MANIFEST = {
  player_idle: { color: 0xf2f2ff, size: 14 },
  enemy_idle: { color: 0xff7777, size: 12 },
  tree: { color: 0x2e8b57, size: 18 },
  boulder: { color: 0x7f8c8d, size: 16 },
  berry_bush: { color: 0x8e44ad, size: 14 },
  grass_tuft: { color: 0x9acd32, size: 10 },
  sapling: { color: 0x556b2f, size: 12 },
  campfire: { color: 0xffa500, size: 12 },
  science: { color: 0x00bfff, size: 12 }
} as const;
