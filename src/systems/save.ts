import type { SaveData } from '../types/game';

const PREFIX = 'mini_survival_slot_';

export function saveSlot(slot: number, data: SaveData): void {
  localStorage.setItem(`${PREFIX}${slot}`, JSON.stringify(data));
}

export function loadSlot(slot: number): SaveData | null {
  const raw = localStorage.getItem(`${PREFIX}${slot}`);
  return raw ? JSON.parse(raw) as SaveData : null;
}

export function getSlotMetadata(slot: number): SaveData['metadata'] | null {
  const data = loadSlot(slot);
  return data?.metadata ?? null;
}
