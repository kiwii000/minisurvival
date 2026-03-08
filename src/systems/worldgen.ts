import { TILE_SIZE, WORLD_H, WORLD_W } from '../config/constants';
import { RNG } from '../core/rng';
import type { Biome, NodeState } from '../types/game';

export interface WorldData {
  biomes: Biome[][];
  nodes: NodeState[];
  spawn: { x: number; y: number };
}

export function generateWorld(seed: number): WorldData {
  const rng = new RNG(seed);
  const biomes: Biome[][] = [];
  const nodes: NodeState[] = [];
  const spawn = { x: Math.floor(WORLD_W / 2) * TILE_SIZE, y: Math.floor(WORLD_H / 2) * TILE_SIZE };

  for (let y = 0; y < WORLD_H; y += 1) {
    const row: Biome[] = [];
    for (let x = 0; x < WORLD_W; x += 1) {
      const biome: Biome = rng.next() > 0.42 ? 'meadow' : 'forest';
      row.push(biome);

      const dx = x * TILE_SIZE - spawn.x;
      const dy = y * TILE_SIZE - spawn.y;
      const inSafe = dx * dx + dy * dy < 180 * 180;
      const roll = rng.next();
      const id = `${x}_${y}`;

      if (inSafe && roll < 0.012) nodes.push({ id, type: 'sapling', x: x * TILE_SIZE, y: y * TILE_SIZE, hp: 1, available: true });
      else if (inSafe && roll < 0.024) nodes.push({ id, type: 'grass_tuft', x: x * TILE_SIZE, y: y * TILE_SIZE, hp: 1, available: true });
      else if (!inSafe && biome === 'forest' && roll < 0.022) nodes.push({ id, type: 'tree', x: x * TILE_SIZE, y: y * TILE_SIZE, hp: 6, available: true });
      else if (!inSafe && roll < 0.030) nodes.push({ id, type: 'boulder', x: x * TILE_SIZE, y: y * TILE_SIZE, hp: 7, available: true });
      else if (!inSafe && biome === 'meadow' && roll < 0.040) nodes.push({ id, type: 'berry_bush', x: x * TILE_SIZE, y: y * TILE_SIZE, hp: 2, available: true });
    }
    biomes.push(row);
  }

  nodes.push({ id: 'spawn_tree', type: 'tree', x: spawn.x + 90, y: spawn.y + 30, hp: 6, available: true });
  nodes.push({ id: 'spawn_rock', type: 'boulder', x: spawn.x - 90, y: spawn.y + 30, hp: 7, available: true });
  nodes.push({ id: 'spawn_berries', type: 'berry_bush', x: spawn.x, y: spawn.y - 70, hp: 2, available: true });
  nodes.push({ id: 'spawn_grass', type: 'grass_tuft', x: spawn.x + 70, y: spawn.y - 40, hp: 1, available: true });
  nodes.push({ id: 'spawn_sapling', type: 'sapling', x: spawn.x - 70, y: spawn.y - 40, hp: 1, available: true });

  return { biomes, nodes, spawn };
}
