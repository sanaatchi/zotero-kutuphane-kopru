// @ajan: cursor · @etiket: katman-1, kopru, path-normalize, test
import { describe, expect, it } from "vitest";
import { normalizeKutuphaneRoot } from "../src/utils/kutuphaneRoot";

describe("normalizeKutuphaneRoot", () => {
  it("converts backslashes and strips paste prefixes", () => {
    expect(
      normalizeKutuphaneRoot(String.raw`C:\Users\ibrah\Projeler\Kutuphane`),
    ).toBe("C:/Users/ibrah/Projeler/Kutuphane");
    expect(
      normalizeKutuphaneRoot("Kök: C:\\Users\\ibrah\\Projeler\\Kutuphane"),
    ).toBe("C:/Users/ibrah/Projeler/Kutuphane");
    expect(
      normalizeKutuphaneRoot('"C:/Users/ibrah/Projeler/Kutuphane"'),
    ).toBe("C:/Users/ibrah/Projeler/Kutuphane");
  });
});
