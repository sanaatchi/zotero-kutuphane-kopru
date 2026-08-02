// @ajan: cursor · @etiket: katman-1, kopru, b2, vitest, a1-stages
import { describe, expect, it } from "vitest";
import {
  checkpointSlugFromFileName,
  formatCategoryPipelineLines,
  formatCheckpointLines,
  groupCheckpointsBySlug,
  parseCheckpointFileName,
  summarizeCheckpointJson,
} from "../src/utils/pipelineCheckpoint";

describe("pipelineCheckpoint helpers", () => {
  it("parses extract and stage file names", () => {
    expect(
      checkpointSlugFromFileName("sanat_ve_felsefe_pipeline_checkpoint.json"),
    ).toBe("sanat_ve_felsefe");
    expect(
      parseCheckpointFileName("sanat_ve_felsefe_pipeline_checkpoint.json"),
    ).toEqual({ slug: "sanat_ve_felsefe", stage: "extract" });
    expect(
      parseCheckpointFileName("bilim_validate_checkpoint.json"),
    ).toEqual({ slug: "bilim", stage: "validate" });
    expect(
      parseCheckpointFileName("tarih_spellcheck_checkpoint.json"),
    ).toEqual({ slug: "tarih", stage: "spellcheck" });
    expect(checkpointSlugFromFileName("kp_registry.json")).toBeNull();
    expect(parseCheckpointFileName("bilim_unknown_checkpoint.json")).toBeNull();
  });

  it("summarizes done/failed counts with stage", () => {
    const s = summarizeCheckpointJson("bilim_pipeline_checkpoint.json", {
      version: 1,
      updated_at: "2026-07-19 14:11:45 UTC",
      done: ["a.pdf", "b.pdf"],
      failed: [],
    });
    expect(s?.slug).toBe("bilim");
    expect(s?.stage).toBe("extract");
    expect(s?.doneCount).toBe(2);
    expect(s?.failedCount).toBe(0);
    expect(s?.updatedAt).toContain("2026-07-19");

    const v = summarizeCheckpointJson("bilim_validate_checkpoint.json", {
      version: 4,
      done: { a: 1 },
      failed: { b: 1 },
    });
    expect(v?.stage).toBe("validate");
    expect(v?.doneCount).toBe(1);
    expect(v?.failedCount).toBe(1);
  });

  it("groups by slug and formats stage lines", () => {
    const rows = [
      summarizeCheckpointJson("z_pipeline_checkpoint.json", {
        done: ["a"],
        failed: [],
      })!,
      summarizeCheckpointJson("a_pipeline_checkpoint.json", {
        done: ["x", "y", "z"],
        failed: ["f"],
      })!,
      summarizeCheckpointJson("a_validate_checkpoint.json", {
        done: ["x"],
        failed: [],
      })!,
    ];
    const cats = groupCheckpointsBySlug(rows);
    expect(cats.map((c) => c.slug)).toEqual(["a", "z"]);
    expect(cats[0].stages.map((s) => s.stage)).toEqual([
      "extract",
      "validate",
    ]);
    expect(cats[0].totalDone).toBe(4);
    expect(cats[0].totalFailed).toBe(1);

    const lines = formatCategoryPipelineLines(cats, { maxCategories: 12 });
    expect(lines[0]).toContain("a:");
    expect(lines[0]).toContain("extract 3/1");
    expect(lines[0]).toContain("validate 1/0");

    const flat = formatCheckpointLines(rows, { maxRows: 12 });
    expect(flat[0]).toContain("a/extract:");
  });
});
