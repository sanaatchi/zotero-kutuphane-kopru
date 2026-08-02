// @ajan: cursor · @etiket: katman-1, kopru, a4-item-pane, fields
/** Pure ItemPane field helpers — no Zotero globals. */

import { normalizeKp } from "./kpRegistry";
import {
  IMPORT_STATUS_KEY,
  parseExtraField,
} from "./processedPackage";

export const CATEGORY_KEY = "Kutuphane-Category";
export const SHA256_KEY = "Kutuphane-SHA256";

export type ItemPaneExtraFields = {
  importStatus: string | null;
  category: string | null;
  sha256: string | null;
};

export type RegistryKpMeta = {
  category: string | null;
  slug: string | null;
};

export type ItemPaneDisplayRow = {
  key:
    | "kp"
    | "source"
    | "registry"
    | "import-status"
    | "category"
    | "sha256";
  value: string;
};

export {
  readExtraPaneFields,
  lookupRegistryKpMeta,
  shortSha256,
  mergeCategory,
  formatImportStatusLabel,
  buildItemPaneDisplayRows,
};

function readExtraPaneFields(extra: string): ItemPaneExtraFields {
  return {
    importStatus: parseExtraField(extra, IMPORT_STATUS_KEY),
    category: parseExtraField(extra, CATEGORY_KEY),
    sha256: parseExtraField(extra, SHA256_KEY),
  };
}

function lookupRegistryKpMeta(
  raw: unknown,
  kp: string | null | undefined,
): RegistryKpMeta {
  const empty: RegistryKpMeta = { category: null, slug: null };
  const key = normalizeKp(kp);
  if (!key || !raw || typeof raw !== "object") return empty;
  const occupied = (raw as Record<string, unknown>).occupied;
  if (!occupied || typeof occupied !== "object") return empty;
  const map = occupied as Record<string, unknown>;
  let entry = map[key];
  if (!entry) {
    // tolerate unpadded keys in older registries
    for (const [k, v] of Object.entries(map)) {
      if (normalizeKp(k) === key) {
        entry = v;
        break;
      }
    }
  }
  if (!entry || typeof entry !== "object") return empty;
  const obj = entry as Record<string, unknown>;
  return {
    category: typeof obj.category === "string" ? obj.category.trim() || null : null,
    slug: typeof obj.slug === "string" ? obj.slug.trim() || null : null,
  };
}

function shortSha256(sha: string | null | undefined): string | null {
  if (!sha) return null;
  const s = sha.trim().toLowerCase();
  if (s.length < 8) return s || null;
  return s.slice(0, 8);
}

/** Prefer Extra category; else registry. */
function mergeCategory(
  fromExtra: string | null,
  fromRegistry: string | null,
): string | null {
  return (fromExtra && fromExtra.trim()) || (fromRegistry && fromRegistry.trim()) || null;
}

function formatImportStatusLabel(
  status: string | null,
  noneLabel: string,
): string {
  if (!status) return noneLabel;
  return status.trim() || noneLabel;
}

function buildItemPaneDisplayRows(opts: {
  kp: string | null;
  kpNone: string;
  sourceLabel: string;
  registryLabel: string;
  importStatus: string | null;
  importNone: string;
  category: string | null;
  categoryNone: string;
  sha256: string | null;
  shaNone: string;
}): ItemPaneDisplayRow[] {
  return [
    { key: "kp", value: opts.kp || opts.kpNone },
    { key: "source", value: opts.sourceLabel },
    { key: "registry", value: opts.registryLabel },
    {
      key: "import-status",
      value: formatImportStatusLabel(opts.importStatus, opts.importNone),
    },
    { key: "category", value: opts.category || opts.categoryNone },
    {
      key: "sha256",
      value: shortSha256(opts.sha256) || opts.shaNone,
    },
  ];
}
