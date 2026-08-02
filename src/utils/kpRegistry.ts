// @ajan: cursor · @etiket: katman-1, kopru, b1, kp-parse, max-pdf, citation-key
// Pure KP helpers — no Zotero globals.
// Canonical KP###### policy mirrored in K2/K3 `src/utils/kpToken.ts` (same regex + MAX).

/** Align with kitap_arsiv.context.MAX_LIBRARY_PDFS */
export const MAX_LIBRARY_PDFS = 99_999;

export type KpRegistrySummary = {
  occupiedCount: number;
  nextKp: string;
  occupiedKeys: Set<string>;
};

export type KpMatchRow = {
  itemId: number;
  title: string;
  kp: string | null;
  /** Where KP was resolved from (never treat arbitrary citation keys as KP). */
  kpSource: "citation-key" | "title-or-extra" | null;
  inRegistry: boolean;
};

export {
  normalizeKp,
  extractKpFromText,
  parseKpRegistryJson,
  summarizeSelectedAgainstRegistry,
  resolveItemKp,
};

const KP_RE = /\bKP0*\d{1,6}\b/i;

function normalizeKp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = String(raw).trim().toUpperCase().match(/\bKP0*(\d{1,6})\b/);
  if (!m) return null;
  const num = Number(m[1]);
  if (!Number.isFinite(num) || num < 1 || num > MAX_LIBRARY_PDFS) return null;
  return `KP${String(num).padStart(6, "0")}`;
}

function extractKpFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = String(text).match(KP_RE);
  return m ? normalizeKp(m[0]) : null;
}

/**
 * Citation Key is only a KP when it itself matches KP######.
 * Otherwise fall back to KP tokens in title/extra — never invent KP from
 * arbitrary Better BibTeX keys.
 */
function resolveItemKp(opts: {
  citationKey: string | null | undefined;
  title?: string | null;
  extra?: string | null;
}): { kp: string | null; source: KpMatchRow["kpSource"] } {
  const fromKey = normalizeKp(opts.citationKey);
  if (fromKey) return { kp: fromKey, source: "citation-key" };
  const fromTitle = extractKpFromText(opts.title) || extractKpFromText(opts.extra);
  if (fromTitle) return { kp: fromTitle, source: "title-or-extra" };
  return { kp: null, source: null };
}

function parseKpRegistryJson(raw: unknown): KpRegistrySummary {
  const occupiedKeys = new Set<string>();
  let nextKp = "";
  let occupiedCount = 0;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.next_kp === "string") nextKp = obj.next_kp;
    const occupied = obj.occupied;
    if (occupied && typeof occupied === "object") {
      for (const key of Object.keys(occupied as object)) {
        const n = normalizeKp(key);
        if (n) {
          occupiedKeys.add(n);
          occupiedCount += 1;
        }
      }
    }
  }
  return { occupiedCount, nextKp, occupiedKeys };
}

function summarizeSelectedAgainstRegistry(
  rows: Array<{
    itemId: number;
    title: string;
    citationKey: string | null;
    extra?: string | null;
  }>,
  registry: KpRegistrySummary,
): {
  selected: number;
  withKp: number;
  inRegistry: number;
  missing: string[];
  details: KpMatchRow[];
} {
  const details: KpMatchRow[] = [];
  const missing: string[] = [];
  let withKp = 0;
  let inRegistry = 0;
  for (const row of rows) {
    const resolved = resolveItemKp({
      citationKey: row.citationKey,
      title: row.title,
      extra: row.extra,
    });
    const kp = resolved.kp;
    const hit = !!(kp && registry.occupiedKeys.has(kp));
    if (kp) withKp += 1;
    if (hit) inRegistry += 1;
    else if (kp) missing.push(kp);
    details.push({
      itemId: row.itemId,
      title: row.title,
      kp,
      kpSource: resolved.source,
      inRegistry: hit,
    });
  }
  return {
    selected: rows.length,
    withKp,
    inRegistry,
    missing: [...new Set(missing)].slice(0, 20),
    details,
  };
}
