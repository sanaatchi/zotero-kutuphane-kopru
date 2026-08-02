// @ajan: cursor · @etiket: katman-1, kopru, a4-item-pane, vitest
import { describe, expect, it } from "vitest";
import {
  buildItemPaneDisplayRows,
  lookupRegistryKpMeta,
  mergeCategory,
  readExtraPaneFields,
  shortSha256,
} from "../src/utils/itemPaneFields";

describe("itemPaneFields", () => {
  it("reads Extra import/category/sha", () => {
    const fields = readExtraPaneFields(
      [
        "Citation Key: KP001353",
        "Kutuphane-Import-Status: complete",
        "Kutuphane-Category: felsefe",
        "Kutuphane-SHA256: abcdef0123456789ffff",
      ].join("\n"),
    );
    expect(fields.importStatus).toBe("complete");
    expect(fields.category).toBe("felsefe");
    expect(fields.sha256).toBe("abcdef0123456789ffff");
    expect(shortSha256(fields.sha256)).toBe("abcdef01");
  });

  it("looks up registry category and merges", () => {
    const meta = lookupRegistryKpMeta(
      {
        occupied: {
          KP001353: { category: "zotero fork için deneme", slug: "zotero_fork" },
        },
      },
      "KP1353",
    );
    expect(meta.category).toBe("zotero fork için deneme");
    expect(meta.slug).toBe("zotero_fork");
    expect(mergeCategory(null, meta.category)).toBe("zotero fork için deneme");
    expect(mergeCategory("from-extra", meta.category)).toBe("from-extra");
  });

  it("builds six display rows", () => {
    const rows = buildItemPaneDisplayRows({
      kp: "KP001353",
      kpNone: "(none)",
      sourceLabel: "Citation Key",
      registryLabel: "In registry",
      importStatus: "complete",
      importNone: "(not imported)",
      category: "felsefe",
      categoryNone: "(none)",
      sha256: "deadbeefcafebabe",
      shaNone: "(none)",
    });
    expect(rows.map((r) => r.key)).toEqual([
      "kp",
      "source",
      "registry",
      "import-status",
      "category",
      "sha256",
    ]);
    expect(rows.find((r) => r.key === "sha256")?.value).toBe("deadbeef");
    expect(rows.find((r) => r.key === "import-status")?.value).toBe("complete");
  });
});
