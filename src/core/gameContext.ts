import type { EnemyState, NodeState, Phase, Stats } from '../types/game';
import { EventBus } from './eventBus';
import { Inventory } from '../systems/inventory';

export class GameContext {
  eventBus = new EventBus();
  seed = 1337;
  timeOfDay = 0;
  day = 1;
  playtime = 0;
  phase: Phase = 'day';
  scienceBuilt = false;
  stats: Stats = { health: 100, maxHealth: 100, hunger: 100, maxHunger: 100, sanity: 100, maxSanity: 100 };
  inventory = new Inventory(20);
  equipment: Record<string, string | null> = { hand: null, body: null };
  nodes: NodeState[] = [];
  structures: Array<{ id: string; type: 'campfire' | 'science'; x: number; y: number; fuel: number }> = [];
  enemies: EnemyState[] = [];
}

export const gameContext = new GameContext();
