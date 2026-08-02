// @ajan: cursor · @etiket: katman-1, kopru, a5-http, vitest
import { describe, expect, it } from "vitest";
import {
  DEFAULT_BRIDGE_HTTP_BASE,
  isAllowedBridgeBaseUrl,
  normalizeBridgeBaseUrl,
  parseBridgePipelineJson,
  parseBridgeStatusJson,
  resolveBridgeHttpConfig,
} from "../src/utils/bridgeHttp";

describe("bridgeHttp", () => {
  it("normalizes and allows only loopback", () => {
    expect(normalizeBridgeBaseUrl("")).toBe(DEFAULT_BRIDGE_HTTP_BASE);
    expect(normalizeBridgeBaseUrl("http://127.0.0.1:8077/")).toBe(
      "http://127.0.0.1:8077",
    );
    expect(isAllowedBridgeBaseUrl("http://127.0.0.1:8077")).toBe(true);
    expect(isAllowedBridgeBaseUrl("http://localhost:8077")).toBe(true);
    expect(isAllowedBridgeBaseUrl("http://evil.example:8077")).toBe(false);
    expect(isAllowedBridgeBaseUrl("ftp://127.0.0.1:8077")).toBe(false);
  });

  it("resolves opt-in config", () => {
    expect(
      resolveBridgeHttpConfig({ enabled: false, baseUrl: "" }).enabled,
    ).toBe(false);
    expect(
      resolveBridgeHttpConfig({ enabled: "true", baseUrl: "http://localhost:9" })
        .enabled,
    ).toBe(true);
  });

  it("parses status JSON into extras", () => {
    const parsed = parseBridgeStatusJson({
      ok: true,
      root: "C:/Kutuphane",
      maxLibraryPdfs: 99999,
      registry: { exists: true, occupiedCount: 20, nextKp: "KP003013" },
      diskIndex: {
        exists: true,
        manifestExists: true,
        totalPdfs: 20,
        uniqueKp: 20,
        issueCount: 0,
        scannedAt: "2026-08-01",
      },
      handoffPackage: {
        exists: true,
        itemCount: 20,
        generatedAt: "2026-08-01T14:17:57Z",
        schemaVersion: 1,
      },
    });
    expect(parsed?.occupiedCount).toBe(20);
    expect(parsed?.extras.diskIndex.totalPdfs).toBe(20);
    expect(parsed?.extras.handoff.itemCount).toBe(20);
  });

  it("parses pipeline categories", () => {
    const cats = parseBridgePipelineJson({
      ok: true,
      categories: [
        {
          category: "deneme",
          slug: "deneme",
          stages: [
            { stage: "extract", exists: true, done: 5, failed: 1 },
            { stage: "rename", exists: false, done: 0, failed: 0 },
            { stage: "validate", exists: true, done: 4, failed: 0 },
          ],
        },
      ],
    });
    expect(cats).toHaveLength(1);
    expect(cats[0].stages.map((s) => s.stage)).toEqual([
      "extract",
      "validate",
    ]);
    expect(cats[0].totalDone).toBe(9);
    expect(cats[0].totalFailed).toBe(1);
  });
});
