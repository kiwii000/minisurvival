export type Phase = 'day' | 'dusk' | 'night';
export type Biome = 'meadow' | 'forest';

export interface Vec2 { x: number; y: number }

export interface Stats {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  sanity: number;
  maxSanity: number;
}

export interface ItemDef {
  id: string;
  displayName: string;
  stackSize: number;
  tags: string[];
  edible?: { hunger?: number; health?: number; sanity?: number };
  tool?: { kind: 'axe' | 'pickaxe' | 'weapon'; power: number };
  fuelValue?: number;
}

export interface InventorySlot { itemId: string; amount: number }

export interface Recipe {
  id: string;
  ingredients: Array<{ itemId: string; amount: number }>;
  output: { itemId: string; amount: number };
  station?: 'science';
  unlock?: 'starter' | 'science';
}

export interface NodeDef {
  type: 'tree' | 'boulder' | 'berry_bush' | 'grass_tuft' | 'sapling';
  maxHp: number;
  preferredTool?: 'axe' | 'pickaxe';
  dropTable: Array<{ itemId: string; min: number; max: number }>;
  regrowSeconds: number;
}

export interface NodeState {
  id: string;
  type: NodeDef['type'];
  x: number;
  y: number;
  hp: number;
  available: boolean;
  regrowAt?: number;
}

export interface EnemyState {
  id: string;
  x: number;
  y: number;
  health: number;
}

export interface SaveData {
  version: number;
  metadata: { day: number; playtime: number; status: 'alive' | 'dead' };
  worldSeed: number;
  timeOfDay: number;
  player: { x: number; y: number; stats: Stats; inventory: InventorySlot[]; equipment: Record<string, string | null> };
  nodes: NodeState[];
  structures: Array<{ id: string; type: 'campfire' | 'science'; x: number; y: number; fuel: number }>;
  enemies: EnemyState[];
}
