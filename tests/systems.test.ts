import { describe, expect, it } from 'vitest';
import { clampStats, decayStats } from '../src/systems/stats';
import { RECIPES } from '../src/data/recipes';
import { generateWorld } from '../src/systems/worldgen';
import { Inventory } from '../src/systems/inventory';

describe('stats', () => {
  it('clamps stats bounds', () => {
    const clamped = clampStats({ health: 200, maxHealth: 100, hunger: -5, maxHunger: 100, sanity: 105, maxSanity: 100 });
    expect(clamped.health).toBe(100);
    expect(clamped.hunger).toBe(0);
    expect(clamped.sanity).toBe(100);
  });

  it('decays with darkness', () => {
    const start = { health: 100, maxHealth: 100, hunger: 100, maxHunger: 100, sanity: 100, maxSanity: 100 };
    const after = decayStats(start, 10, 'night', true, true);
    expect(after.hunger).toBeLessThan(100);
    expect(after.sanity).toBeLessThan(100);
  });
});

describe('recipe validation', () => {
  it('has unique recipe ids and positive ingredient amounts', () => {
    const ids = new Set<string>();
    for (const recipe of RECIPES) {
      expect(ids.has(recipe.id)).toBe(false);
      ids.add(recipe.id);
      recipe.ingredients.forEach((i) => expect(i.amount).toBeGreaterThan(0));
    }
  });
});

describe('deterministic worldgen', () => {
  it('creates same world for same seed', () => {
    const a = generateWorld(42);
    const b = generateWorld(42);
    expect(a.nodes.slice(0, 20)).toEqual(b.nodes.slice(0, 20));
  });
});

describe('inventory roundtrip as save/load primitive', () => {
  it('reconstructs equivalent stack counts', () => {
    const inv = new Inventory(10);
    inv.add('twigs', 13);
    inv.add('grass', 5);
    const raw = inv.toJSON();
    const restored = new Inventory(10);
    restored.fromJSON(raw);
    expect(restored.count('twigs')).toBe(13);
    expect(restored.count('grass')).toBe(5);
  });
});
