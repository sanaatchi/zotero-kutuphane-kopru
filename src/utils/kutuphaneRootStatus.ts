// @ajan: cursor · @etiket: katman-1, kopru, a2-status, disk-index, handoff
/** Pure root status helpers — align with /api/bridge/status fields (disk-side). */

import { MAX_LIBRARY_PDFS } from "./kpRegistry";

export const DISK_INDEX_BASENAME = "disk_pdf_index.json";
export const DISK_INDEX_MANIFEST_BASENAME = "disk_pdf_index.manifest.json";
export const HANDOFF_DIR = "zotero_handoff";
export const HANDOFF_PACKAGE_BASENAME = "processed_pdf_package.json";

export type DiskIndexSummary = {
  exists: boolean;
  manifestExists: boolean;
  totalPdfs: number | null;
  uniqueKp: number | null;
  scannedAt: string | null;
  issueCount: number | null;
};

export type HandoffPackageSummary = {
  exists: boolean;
  itemCount: number | null;
  generatedAt: string | null;
  schemaVersion: number | null;
};

export type RootStatusExtras = {
  maxLibraryPdfs: number;
  diskIndex: DiskIndexSummary;
  handoff: HandoffPackageSummary;
};

export {
  summarizeDiskIndexJson,
  summarizeHandoffPackageJson,
  buildRootStatusExtras,
  formatRootStatusExtraLines,
};

function asFiniteInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}

function summarizeDiskIndexJson(
  raw: unknown,
  opts: { exists: boolean; manifestExists: boolean },
): DiskIndexSummary {
  const { exists, manifestExists } = opts;
  if (!exists || !raw || typeof raw !== "object") {
    return {
      exists,
      manifestExists,
      totalPdfs: null,
      uniqueKp: null,
      scannedAt: null,
      issueCount: null,
    };
  }
  const obj = raw as Record<string, unknown>;
  return {
    exists,
    manifestExists,
    totalPdfs: asFiniteInt(obj.total_pdfs) ?? asFiniteInt(obj.record_count),
    uniqueKp: asFiniteInt(obj.unique_kp_on_disk),
    scannedAt: typeof obj.scanned_at === "string" ? obj.scanned_at : null,
    issueCount: asFiniteInt(obj.issue_count),
  };
}

function summarizeHandoffPackageJson(
  raw: unknown,
  opts: { exists: boolean },
): HandoffPackageSummary {
  const { exists } = opts;
  if (!exists || !raw || typeof raw !== "object") {
    return {
      exists,
      itemCount: null,
      generatedAt: null,
      schemaVersion: null,
    };
  }
  const obj = raw as Record<string, unknown>;
  let itemCount = asFiniteInt(obj.itemCount);
  if (itemCount == null && Array.isArray(obj.items)) {
    itemCount = obj.items.length;
  }
  return {
    exists,
    itemCount,
    generatedAt:
      typeof obj.generatedAt === "string" ? obj.generatedAt : null,
    schemaVersion: asFiniteInt(obj.schemaVersion),
  };
}

function buildRootStatusExtras(opts: {
  diskIndexRaw: unknown | null;
  diskIndexExists: boolean;
  manifestExists: boolean;
  handoffRaw: unknown | null;
  handoffExists: boolean;
}): RootStatusExtras {
  return {
    maxLibraryPdfs: MAX_LIBRARY_PDFS,
    diskIndex: summarizeDiskIndexJson(opts.diskIndexRaw, {
      exists: opts.diskIndexExists,
      manifestExists: opts.manifestExists,
    }),
    handoff: summarizeHandoffPackageJson(opts.handoffRaw, {
      exists: opts.handoffExists,
    }),
  };
}

/** Locale-free lines for tests; UI wraps with getString. */
function formatRootStatusExtraLines(extras: RootStatusExtras): string[] {
  const di = extras.diskIndex;
  const ho = extras.handoff;
  const diskLine = !di.exists
    ? "disk_pdf_index: missing"
    : `disk_pdf_index: ${di.totalPdfs ?? "?"} PDFs · KP ${di.uniqueKp ?? "?"} · issues ${di.issueCount ?? "?"}${di.scannedAt ? ` · ${di.scannedAt}` : ""}`;
  const manif = di.manifestExists
    ? "disk_pdf_index.manifest: ok"
    : "disk_pdf_index.manifest: missing";
  const handoffLine = !ho.exists
    ? "handoff package: missing"
    : `handoff package: ${ho.itemCount ?? "?"} items${ho.generatedAt ? ` · ${ho.generatedAt}` : ""}`;
  return [
    `max library PDFs: ${extras.maxLibraryPdfs}`,
    diskLine,
    manif,
    handoffLine,
  ];
}
