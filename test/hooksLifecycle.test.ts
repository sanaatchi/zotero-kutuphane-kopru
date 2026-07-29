// @ajan: cursor · @etiket: katman-1, kopru, multi-window, test
import { describe, expect, it, beforeEach } from "vitest";

/**
 * Window-set lifecycle mirror of hooks.ts (pure, no Zotero).
 * Keeps process-global menus until the last tracked window unloads.
 */
function createLifecycle() {
  const loaded = new Set<object>();
  let menus = false;
  let unregisterCount = 0;
  return {
    load(win: object) {
      if (loaded.has(win)) return;
      loaded.add(win);
      if (!menus) menus = true;
    },
    unload(win: object) {
      loaded.delete(win);
      if (loaded.size === 0) {
        menus = false;
        unregisterCount += 1;
      }
    },
    get size() {
      return loaded.size;
    },
    get menus() {
      return menus;
    },
    get unregisterCount() {
      return unregisterCount;
    },
  };
}

describe("multi-window lifecycle", () => {
  let life: ReturnType<typeof createLifecycle>;
  beforeEach(() => {
    life = createLifecycle();
  });

  it("keeps menus when first of two windows closes", () => {
    const a = {};
    const b = {};
    life.load(a);
    life.load(b);
    life.unload(a);
    expect(life.size).toBe(1);
    expect(life.menus).toBe(true);
    expect(life.unregisterCount).toBe(0);
  });

  it("unregisters only after last window", () => {
    const a = {};
    const b = {};
    life.load(a);
    life.load(b);
    life.unload(a);
    life.unload(b);
    expect(life.size).toBe(0);
    expect(life.menus).toBe(false);
    expect(life.unregisterCount).toBe(1);
  });

  it("ignores duplicate load of same window", () => {
    const a = {};
    life.load(a);
    life.load(a);
    expect(life.size).toBe(1);
    life.unload(a);
    expect(life.unregisterCount).toBe(1);
  });
});
