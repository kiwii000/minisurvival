import { WORLD_H, WORLD_W } from '../config/constants';
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
  const spawn = { x: Math.floor(WORLD_W / 2) * 24, y: Math.floor(WORLD_H / 2) * 24 };
  for (let y = 0; y < WORLD_H; y += 1) {
    const row: Biome[] = [];
    for (let x = 0; x < WORLD_W; x += 1) {
      const biome: Biome = rng.next() > 0.45 ? 'meadow' : 'forest';
      row.push(biome);
      const dx = x * 24 - spawn.x;
      const dy = y * 24 - spawn.y;
      const inSafe = dx * dx + dy * dy < 180 * 180;
      const roll = rng.next();
      const id = `${x}_${y}`;
      if (inSafe && roll < 0.02) nodes.push({ id, type: 'sapling', x: x * 24, y: y * 24, hp: 1, available: true });
      if (inSafe && roll >= 0.02 && roll < 0.04) nodes.push({ id, type: 'grass_tuft', x: x * 24, y: y * 24, hp: 1, available: true });
      if (!inSafe && roll < 0.03) nodes.push({ id, type: 'tree', x: x * 24, y: y * 24, hp: 6, available: true });
      if (!inSafe && roll >= 0.03 && roll < 0.045) nodes.push({ id, type: 'boulder', x: x * 24, y: y * 24, hp: 7, available: true });
      if (!inSafe && roll >= 0.045 && roll < 0.065) nodes.push({ id, type: 'berry_bush', x: x * 24, y: y * 24, hp: 2, available: true });
    }
    biomes.push(row);
  }
  nodes.push({ id: 'spawn_tree', type: 'tree', x: spawn.x + 90, y: spawn.y + 30, hp: 6, available: true });
  nodes.push({ id: 'spawn_rock', type: 'boulder', x: spawn.x - 90, y: spawn.y + 30, hp: 7, available: true });
  nodes.push({ id: 'spawn_berries', type: 'berry_bush', x: spawn.x, y: spawn.y - 70, hp: 2, available: true });
  return { biomes, nodes, spawn };
}
