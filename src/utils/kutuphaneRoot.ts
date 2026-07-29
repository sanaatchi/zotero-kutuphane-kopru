// @ajan: cursor · @etiket: katman-1, kopru, path-normalize
/** Normalize Kütüphane root for IOUtils / PathUtils (Windows-safe). */

export { normalizeKutuphaneRoot };

function normalizeKutuphaneRoot(raw: unknown): string {
  if (typeof raw !== "string") return "";
  let s = raw.trim();
  // Accidental paste from status dialog / docs
  s = s.replace(/^(kök|root)\s*:\s*/i, "");
  // Strip wrapping quotes (straight or curly)
  s = s.replace(/^["'`“”‘’]+/, "").replace(/["'`“”‘’]+$/, "").trim();
  if (!s) return "";
  // IOUtils on Windows rejects many backslash forms
  s = s.replace(/\\/g, "/");
  // Drop trailing slash (except drive root C:/)
  if (/^[a-zA-Z]:\/$/.test(s)) return s;
  s = s.replace(/\/+$/, "");
  return s;
}
