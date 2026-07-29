// @ajan: cursor · @etiket: katman-1, kopru, b3, package-validate, test
import { describe, expect, it } from "vitest";
import {
  escapeLikeExact,
  expectedIdempotencyKey,
  isPathInsideRoot,
  parseExtraField,
  validateProcessedPackage,
} from "../src/utils/processedPackage";

const ROOT = "C:/Users/ibrah/Projeler/Kutuphane";

function baseItem(over: Record<string, unknown> = {}) {
  const kp = "KP000128";
  const sha = "a".repeat(64);
  return {
    kp,
    path: `${ROOT}/Kitaplar/Bilim/a.pdf`,
    sha256: sha,
    size: 10,
    attachmentMode: "link",
    idempotencyKey: expectedIdempotencyKey(kp, sha),
    ...over,
  };
}

describe("processedPackage validation", () => {
  it("accepts a valid package with matching file info", () => {
    const item = baseItem();
    const raw = {
      schemaVersion: 1,
      kutuphaneRoot: ROOT,
      pipelineVersion: "kutuphane-6plus1",
      itemCount: 1,
      items: [item],
    };
    const res = validateProcessedPackage(raw, {
      allowedRoot: ROOT,
      fileInfo: {
        [item.path as string]: {
          size: 10,
          sha256: item.sha256 as string,
          isFile: true,
        },
      },
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.package.items[0].kp).toBe("KP000128");
  });

  it("rejects path outside root", () => {
    const item = baseItem({ path: "C:/Windows/evil.pdf" });
    const res = validateProcessedPackage(
      { schemaVersion: 1, items: [item], itemCount: 1, kutuphaneRoot: ROOT },
      { allowedRoot: ROOT },
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.some((e) => e.code === "pathTraversal")).toBe(true);
  });

  it("rejects hash mismatch", () => {
    const item = baseItem();
    const res = validateProcessedPackage(
      { schemaVersion: 1, items: [item], itemCount: 1, kutuphaneRoot: ROOT },
      {
        allowedRoot: ROOT,
        fileInfo: {
          [item.path as string]: {
            size: 10,
            sha256: "b".repeat(64),
            isFile: true,
          },
        },
      },
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.some((e) => e.code === "hashMismatch")).toBe(true);
  });

  it("rejects KP over ceiling", () => {
    const item = baseItem({ kp: "KP100000", idempotencyKey: "KP100000:" + "a".repeat(64) });
    const res = validateProcessedPackage(
      { schemaVersion: 1, items: [item], itemCount: 1, kutuphaneRoot: ROOT },
      { allowedRoot: ROOT },
    );
    expect(res.ok).toBe(false);
  });

  it("rejects idempotency key mismatch", () => {
    const item = baseItem({ idempotencyKey: "KP000128:deadbeef" });
    const res = validateProcessedPackage(
      { schemaVersion: 1, items: [item], itemCount: 1, kutuphaneRoot: ROOT },
      { allowedRoot: ROOT },
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.some((e) => e.code === "idempotencyKey")).toBe(true);
  });

  it("escapes LIKE wildcards", () => {
    expect(escapeLikeExact("a%b_c\\d")).toBe("a\\%b\\_c\\\\d");
  });

  it("parses extra fields exactly", () => {
    const extra = "Citation Key: foo\nKutuphane-Idempotency: KP000001:abc\n";
    expect(parseExtraField(extra, "Kutuphane-Idempotency")).toBe("KP000001:abc");
  });

  it("isPathInsideRoot handles windows separators", () => {
    expect(isPathInsideRoot(`${ROOT}\\Kitaplar\\a.pdf`, ROOT)).toBe(true);
    expect(isPathInsideRoot("D:/other/a.pdf", ROOT)).toBe(false);
  });
});
