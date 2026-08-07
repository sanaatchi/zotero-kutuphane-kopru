// @ajan: cursor · @etiket: katman-1, kopru, vitest, extra-rmw
import { describe, expect, it } from "vitest";
import {
  applyFailedImportStatus,
  applyRepairExtraFields,
  upsertExtraLine,
} from "../src/utils/packageImportExtra";

describe("packageImportExtra", () => {
  it("upsertExtraLine preserves peer lines", () => {
    const base =
      "Citation Key: KP001353\nZPDF-Validated-Path: C:\\x.pdf\nKutuphane-Import-Status: pending\n";
    const next = upsertExtraLine(base, "Kutuphane-Import-Status", "complete");
    expect(next).toContain("ZPDF-Validated-Path: C:\\x.pdf");
    expect(next).toMatch(/^Kutuphane-Import-Status: complete$/m);
    expect(next).toContain("Citation Key: KP001353");
  });

  it("applyRepairExtraFields merges onto fresh Extra (keeps ZPDF-*)", () => {
    const fresh =
      "Citation Key: KP001353\nZPDF-Validated-Path: D:\\lib\\book.pdf\nZPDF-Mismatch-Reason: none\n";
    const r = applyRepairExtraFields(fresh, {
      kp: "KP001353",
      sha256: "abc",
      category: "felsefe",
    });
    expect(r.ckAction).toBe("same");
    expect(r.extra).toContain("ZPDF-Validated-Path: D:\\lib\\book.pdf");
    expect(r.extra).toContain("ZPDF-Mismatch-Reason: none");
    expect(r.extra).toMatch(/^Kutuphane-Import-Status: complete$/m);
    expect(r.extra).toMatch(/^Kutuphane-SHA256: abc$/m);
    expect(r.extra).toMatch(/^Kutuphane-Category: felsefe$/m);
  });

  it("applyRepairExtraFields keeps different valid KP (fail-closed)", () => {
    const fresh = "Citation Key: KP000042\nZPDF-Validated-Path: x.pdf\n";
    const r = applyRepairExtraFields(fresh, {
      kp: "KP001353",
      sha256: "deadbeef",
    });
    expect(r.ckAction).toBe("keep-existing-kp");
    expect(r.extra).toMatch(/^Citation Key: KP000042$/m);
    expect(r.extra).toContain("ZPDF-Validated-Path: x.pdf");
    expect(r.extra).toMatch(/^Kutuphane-Import-Status: complete$/m);
  });

  it("applyFailedImportStatus preserves peer Extra lines", () => {
    const fresh =
      "ZPDF-Validated-Path: y.pdf\nKutuphane-Import-Status: pending\n";
    const failed = applyFailedImportStatus(fresh);
    expect(failed).toContain("ZPDF-Validated-Path: y.pdf");
    expect(failed).toMatch(/^Kutuphane-Import-Status: failed$/m);
  });
});
