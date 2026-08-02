// @ajan: cursor · @etiket: katman-1, kopru, a6-reverse-sync, vitest
import { describe, expect, it } from "vitest";
import {
  formatReverseSyncLines,
  occupiedKpFromDiskIndexFull,
  summarizeReverseSync,
} from "../src/utils/reverseSyncReport";

describe("reverseSyncReport", () => {
  it("parses disk full index KP set", () => {
    const set = occupiedKpFromDiskIndexFull({
      records: [
        { kitap_id: "KP001353" },
        { kitap_id: "KP1430" },
        { kitap_id: "nope" },
      ],
    });
    expect(set?.has("KP001353")).toBe(true);
    expect(set?.has("KP001430")).toBe(true);
    expect(set?.size).toBe(2);
  });

  it("reports registry and disk gaps without inventing writes", () => {
    const registry = new Set(["KP001353", "KP001430"]);
    const disk = new Set(["KP001353"]);
    const report = summarizeReverseSync(
      [
        {
          itemId: 1,
          title: "A - KP001353",
          citationKey: "KP001353",
        },
        {
          itemId: 2,
          title: "B",
          citationKey: "KP001430",
        },
        {
          itemId: 3,
          title: "C - KP009999",
          citationKey: "KP009999",
        },
        { itemId: 4, title: "no kp", citationKey: "smith2020" },
      ],
      registry,
      disk,
    );
    expect(report.withKp).toBe(3);
    expect(report.withoutKp).toBe(1);
    expect(report.missingFromRegistry).toEqual(["KP009999"]);
    expect(report.missingFromDisk).toEqual(["KP001430"]);
    expect(report.ok).toEqual(["KP001353"]);
    const lines = formatReverseSyncLines(report, {
      arsivUrl: "http://127.0.0.1:8077",
      syncHint: "python _sync_kp_registry.py --check",
    });
    expect(lines.some((l) => l.includes("no writes"))).toBe(true);
    expect(lines.some((l) => l.includes("8077"))).toBe(true);
  });
});
