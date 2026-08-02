// @ajan: cursor · @etiket: katman-1, kopru, a3-import-report, vitest
import { describe, expect, it } from "vitest";
import {
  countImportPlans,
  formatImportPlanLines,
  formatImportResultLines,
  planImportAction,
} from "../src/utils/packageImportReport";

describe("packageImportReport", () => {
  it("plans create/skip/repair", () => {
    expect(
      planImportAction({
        hasExisting: false,
        importStatus: null,
        attachmentMatches: false,
      }),
    ).toBe("create");
    expect(
      planImportAction({
        hasExisting: true,
        importStatus: "complete",
        attachmentMatches: true,
      }),
    ).toBe("skip");
    expect(
      planImportAction({
        hasExisting: true,
        importStatus: "pending",
        attachmentMatches: true,
      }),
    ).toBe("repair");
    expect(
      planImportAction({
        hasExisting: true,
        importStatus: "complete",
        attachmentMatches: false,
      }),
    ).toBe("repair");
  });

  it("formats dry-run and result lines", () => {
    const rows = [
      { kp: "KP000001", action: "create" as const },
      { kp: "KP000002", action: "skip" as const },
      {
        kp: "KP000003",
        action: "fail" as const,
        detail: "hash mismatch",
      },
      { kp: "KP000004", action: "repair" as const, detail: "status=pending" },
    ];
    expect(countImportPlans(rows)).toEqual({
      create: 1,
      skip: 1,
      repair: 1,
      fail: 1,
      total: 4,
    });
    const plan = formatImportPlanLines(rows, { maxRows: 10 });
    expect(plan[0]).toContain("dry-run");
    expect(plan.some((l) => l.startsWith("KP000001: create"))).toBe(true);
    const result = formatImportResultLines(rows, { maxFailRows: 10 });
    expect(result[0]).toContain("failed 1");
    expect(result.some((l) => l.includes("KP000003: fail"))).toBe(true);
  });
});
