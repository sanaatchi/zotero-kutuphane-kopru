// @ajan: cursor · @etiket: katman-1, kopru, b2, vitest
import { describe, expect, it } from "vitest";
import {
  checkpointSlugFromFileName,
  formatCheckpointLines,
  summarizeCheckpointJson,
} from "../src/utils/pipelineCheckpoint";

describe("pipelineCheckpoint helpers", () => {
  it("parses slug from checkpoint file name", () => {
    expect(
      checkpointSlugFromFileName("sanat_ve_felsefe_pipeline_checkpoint.json"),
    ).toBe("sanat_ve_felsefe");
    expect(checkpointSlugFromFileName("kp_registry.json")).toBeNull();
  });

  it("summarizes done/failed counts", () => {
    const s = summarizeCheckpointJson("bilim_pipeline_checkpoint.json", {
      version: 1,
      updated_at: "2026-07-19 14:11:45 UTC",
      done: ["a.pdf", "b.pdf"],
      failed: [],
    });
    expect(s?.slug).toBe("bilim");
    expect(s?.doneCount).toBe(2);
    expect(s?.failedCount).toBe(0);
    expect(s?.updatedAt).toContain("2026-07-19");
  });

  it("formats limited lines", () => {
    const lines = formatCheckpointLines(
      [
        {
          slug: "z",
          fileName: "z_pipeline_checkpoint.json",
          version: 1,
          updatedAt: "t",
          doneCount: 1,
          failedCount: 0,
        },
        {
          slug: "a",
          fileName: "a_pipeline_checkpoint.json",
          version: 1,
          updatedAt: null,
          doneCount: 3,
          failedCount: 1,
        },
      ],
      { maxRows: 12 },
    );
    expect(lines[0]).toContain("a:");
    expect(lines[0]).toContain("done 3");
    expect(lines[1]).toContain("z:");
  });
});
