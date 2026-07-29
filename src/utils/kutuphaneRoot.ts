// @ajan: cursor · @etiket: katman-1, kopru, path-normalize, windows-backslash
/** Normalize Kütüphane root for IOUtils / PathUtils (Windows-safe). */

export { normalizeKutuphaneRoot };

/**
 * Mozilla PathUtils on Windows rejects forward slashes
 * (NS_ERROR_FILE_UNRECOGNIZED_PATH). Drive/UNC paths must use `\`.
 */
function normalizeKutuphaneRoot(raw: unknown): string {
  if (typeof raw !== "string") return "";
  let s = raw.trim();
  // Accidental paste from status dialog / docs
  s = s.replace(/^(kök|root)\s*:\s*/i, "");
  // Strip wrapping quotes (straight or curly)
  s = s.replace(/^["'`“”‘’]+/, "").replace(/["'`“”‘’]+$/, "").trim();
  // file:///C:/Users/... → C:/Users/...
  if (/^file:\/\//i.test(s)) {
    s = s.replace(/^file:\/\/\/?/i, "");
    try {
      s = decodeURIComponent(s);
    } catch {
      /* keep raw */
    }
    s = s.trim();
  }
  if (!s) return "";

  const isWin =
    /^[a-zA-Z]:[\\/]/.test(s) ||
    /^[a-zA-Z]:$/.test(s) ||
    s.startsWith("\\\\");

  if (isWin) {
    s = s.replace(/\//g, "\\");
    // Drive root only: C:\
    if (/^[a-zA-Z]:\\?$/.test(s)) return `${s.slice(0, 2)}\\`;
    return s.replace(/\\+$/, "");
  }

  // POSIX absolute / relative — keep /
  if (s !== "/") s = s.replace(/\/+$/, "");
  return s;
}
