/** Tiny event bus so React UI and Phaser scenes can talk without importing each other. */
type Handler = (...args: unknown[]) => void;

class Bus {
  private handlers = new Map<string, Set<Handler>>();

  on(event: string, h: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(h);
    return () => this.off(event, h);
  }

  off(event: string, h: Handler) {
    this.handlers.get(event)?.delete(h);
  }

  emit(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.forEach((h) => h(...args));
  }
}

export const bridge = new Bus();

// Events used:
//  'return-world'  — React result screen → BattleScene: go back to WorldScene
//  'refresh-world' — React shop → WorldScene: re-join to pick up new avatar
