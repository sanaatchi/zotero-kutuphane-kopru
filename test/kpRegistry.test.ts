// @ajan: cursor · @etiket: katman-1, kopru, vitest
import { describe, expect, it } from "vitest";
import {
  extractKpFromText,
  normalizeKp,
  parseKpRegistryJson,
  resolveItemKp,
  summarizeSelectedAgainstRegistry,
} from "../src/utils/kpRegistry";

describe("kpRegistry helpers", () => {
  it("normalizes KP forms", () => {
    expect(normalizeKp("KP1353")).toBe("KP001353");
    expect(normalizeKp("kp001353")).toBe("KP001353");
    expect(normalizeKp("nope")).toBeNull();
  });

  it("rejects KP above MAX_LIBRARY_PDFS", () => {
    expect(normalizeKp("KP100000")).toBeNull();
    expect(normalizeKp("KP099999")).toBe("KP099999");
  });

  it("extracts KP from free text", () => {
    expect(extractKpFromText("Adorno - book - KP001353.pdf")).toBe("KP001353");
  });

  it("parses registry occupied keys", () => {
    const s = parseKpRegistryJson({
      next_kp: "KP011586",
      occupied: { KP001353: {}, KP1430: {} },
    });
    expect(s.nextKp).toBe("KP011586");
    expect(s.occupiedCount).toBe(2);
    expect(s.occupiedKeys.has("KP001353")).toBe(true);
    expect(s.occupiedKeys.has("KP001430")).toBe(true);
  });

  it("summarizes selection vs registry", () => {
    const reg = parseKpRegistryJson({
      next_kp: "KP2",
      occupied: { KP001353: {} },
    });
    const summary = summarizeSelectedAgainstRegistry(
      [
        { itemId: 1, title: "A", citationKey: "KP001353" },
        { itemId: 2, title: "B", citationKey: "KP009999" },
        { itemId: 3, title: "C", citationKey: null },
      ],
      reg,
    );
    expect(summary.selected).toBe(3);
    expect(summary.withKp).toBe(2);
    expect(summary.inRegistry).toBe(1);
    expect(summary.missing).toEqual(["KP009999"]);
  });

  it("does not treat arbitrary citation keys as KP", () => {
    const r = resolveItemKp({
      citationKey: "bergerson2020",
      title: "Book KP001353",
    });
    expect(r.kp).toBe("KP001353");
    expect(r.source).toBe("title-or-extra");
  });
});
