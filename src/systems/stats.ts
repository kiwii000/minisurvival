import type { Phase, Stats } from '../types/game';

export function clampStats(stats: Stats): Stats {
  return {
    ...stats,
    health: Math.max(0, Math.min(stats.health, stats.maxHealth)),
    hunger: Math.max(0, Math.min(stats.hunger, stats.maxHunger)),
    sanity: Math.max(0, Math.min(stats.sanity, stats.maxSanity))
  };
}

export function decayStats(stats: Stats, dt: number, phase: Phase, inDarkness: boolean, hostileNearby: boolean): Stats {
  const next = { ...stats };
  next.hunger -= dt * 0.8;
  if (next.hunger <= 0) next.health -= dt * 1.5;
  if ((phase === 'night' && inDarkness) || hostileNearby) next.sanity -= dt * 1.4;
  return clampStats(next);
}
