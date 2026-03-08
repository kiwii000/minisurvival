export type GameEvent = 'ItemCollected' | 'DamageTaken' | 'CraftCompleted' | 'NightStarted' | 'DayStarted' | 'PlayerDied';
type Handler = (payload?: unknown) => void;

export class EventBus {
  private listeners = new Map<GameEvent, Set<Handler>>();
  on(event: GameEvent, fn: Handler): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }
  emit(event: GameEvent, payload?: unknown): void { this.listeners.get(event)?.forEach((h) => h(payload)); }
}
