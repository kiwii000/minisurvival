import type { InventorySlot } from '../types/game';
import { ITEMS } from '../data/items';

export class Inventory {
  slots: Array<InventorySlot | null>;
  constructor(size = 20) { this.slots = Array.from({ length: size }, () => null); }

  count(itemId: string): number { return this.slots.reduce((s, slot) => s + (slot?.itemId === itemId ? slot.amount : 0), 0); }

  add(itemId: string, amount: number): boolean {
    const def = ITEMS[itemId];
    if (!def) return false;
    let left = amount;
    for (const slot of this.slots) {
      if (slot && slot.itemId === itemId && slot.amount < def.stackSize) {
        const take = Math.min(left, def.stackSize - slot.amount);
        slot.amount += take;
        left -= take;
      }
    }
    for (let i = 0; i < this.slots.length && left > 0; i += 1) {
      if (!this.slots[i]) {
        const take = Math.min(left, def.stackSize);
        this.slots[i] = { itemId, amount: take };
        left -= take;
      }
    }
    return left === 0;
  }

  remove(itemId: string, amount: number): boolean {
    if (this.count(itemId) < amount) return false;
    let left = amount;
    for (let i = 0; i < this.slots.length && left > 0; i += 1) {
      const slot = this.slots[i];
      if (!slot || slot.itemId !== itemId) continue;
      const take = Math.min(slot.amount, left);
      slot.amount -= take;
      left -= take;
      if (slot.amount <= 0) this.slots[i] = null;
    }
    return true;
  }

  hasIngredients(ingredients: Array<{ itemId: string; amount: number }>): boolean {
    return ingredients.every((i) => this.count(i.itemId) >= i.amount);
  }

  toJSON(): InventorySlot[] { return this.slots.filter((s): s is InventorySlot => Boolean(s)); }

  fromJSON(items: InventorySlot[]): void {
    this.slots = Array.from({ length: this.slots.length }, () => null);
    for (const slot of items) this.add(slot.itemId, slot.amount);
  }
}
