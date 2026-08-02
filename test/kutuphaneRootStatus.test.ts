// @ajan: cursor · @etiket: katman-1, kopru, a2-status, vitest
import { describe, expect, it } from "vitest";
import {
  buildRootStatusExtras,
  formatRootStatusExtraLines,
  summarizeDiskIndexJson,
  summarizeHandoffPackageJson,
} from "../src/utils/kutuphaneRootStatus";

describe("kutuphaneRootStatus", () => {
  it("summarizes disk index JSON", () => {
    const s = summarizeDiskIndexJson(
      {
        scanned_at: "2026-08-01 19:01:21",
        total_pdfs: 20,
        unique_kp_on_disk: 20,
        issue_count: 0,
      },
      { exists: true, manifestExists: true },
    );
    expect(s.exists).toBe(true);
    expect(s.totalPdfs).toBe(20);
    expect(s.uniqueKp).toBe(20);
    expect(s.issueCount).toBe(0);
    expect(s.scannedAt).toContain("2026-08-01");
  });

  it("summarizes handoff package", () => {
    const s = summarizeHandoffPackageJson(
      {
        schemaVersion: 1,
        generatedAt: "2026-07-30T12:00:00Z",
        items: [{}, {}],
      },
      { exists: true },
    );
    expect(s.itemCount).toBe(2);
    expect(s.schemaVersion).toBe(1);
  });

  it("formats extras when missing", () => {
    const extras = buildRootStatusExtras({
      diskIndexRaw: null,
      diskIndexExists: false,
      manifestExists: false,
      handoffRaw: null,
      handoffExists: false,
    });
    const lines = formatRootStatusExtraLines(extras);
    expect(lines.some((l) => l.includes("99999"))).toBe(true);
    expect(lines.some((l) => l.includes("disk_pdf_index: missing"))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes("handoff package: missing"))).toBe(
      true,
    );
  });
});
