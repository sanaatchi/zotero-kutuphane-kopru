// @ajan: cursor · @etiket: katman-1, kopru, path-normalize, test
import { describe, expect, it } from "vitest";
import { normalizeKutuphaneRoot } from "../src/utils/kutuphaneRoot";

describe("normalizeKutuphaneRoot", () => {
  it("uses Windows backslashes for drive paths (IOUtils requirement)", () => {
    expect(
      normalizeKutuphaneRoot(String.raw`C:\Users\ibrah\Projeler\Kutuphane`),
    ).toBe(String.raw`C:\Users\ibrah\Projeler\Kutuphane`);
    expect(
      normalizeKutuphaneRoot("C:/Users/ibrah/Projeler/Kutuphane"),
    ).toBe(String.raw`C:\Users\ibrah\Projeler\Kutuphane`);
    expect(
      normalizeKutuphaneRoot("Kök: C:/Users/ibrah/Projeler/Kutuphane"),
    ).toBe(String.raw`C:\Users\ibrah\Projeler\Kutuphane`);
    expect(
      normalizeKutuphaneRoot('"C:/Users/ibrah/Projeler/Kutuphane"'),
    ).toBe(String.raw`C:\Users\ibrah\Projeler\Kutuphane`);
    expect(
      normalizeKutuphaneRoot("file:///C:/Users/ibrah/Projeler/Kutuphane"),
    ).toBe(String.raw`C:\Users\ibrah\Projeler\Kutuphane`);
  });

  it("keeps POSIX forward slashes", () => {
    expect(normalizeKutuphaneRoot("/home/user/Kutuphane")).toBe(
      "/home/user/Kutuphane",
    );
    expect(normalizeKutuphaneRoot("Root: /data/lib/")).toBe("/data/lib");
  });
});
