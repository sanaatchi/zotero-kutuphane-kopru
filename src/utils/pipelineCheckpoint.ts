// @ajan: cursor · @etiket: katman-1, kopru, b2, checkpoint
// Pure checkpoint helpers — no Zotero globals.

export type CheckpointSummary = {
  slug: string;
  fileName: string;
  version: number | null;
  updatedAt: string | null;
  doneCount: number;
  failedCount: number;
};

export {
  checkpointSlugFromFileName,
  summarizeCheckpointJson,
  formatCheckpointLines,
};

const CHECKPOINT_RE = /^(.+)_pipeline_checkpoint\.json$/i;

function checkpointSlugFromFileName(fileName: string): string | null {
  const base = fileName.replace(/^.*[\\/]/, "");
  const m = base.match(CHECKPOINT_RE);
  return m ? m[1] : null;
}

function countKeys(raw: unknown): number {
  if (Array.isArray(raw)) return raw.filter((x) => x != null && String(x)).length;
  if (raw && typeof raw === "object") return Object.keys(raw as object).length;
  return 0;
}

function summarizeCheckpointJson(
  fileName: string,
  raw: unknown,
): CheckpointSummary | null {
  const slug = checkpointSlugFromFileName(fileName);
  if (!slug) return null;
  if (!raw || typeof raw !== "object") {
    return {
      slug,
      fileName: fileName.replace(/^.*[\\/]/, ""),
      version: null,
      updatedAt: null,
      doneCount: 0,
      failedCount: 0,
    };
  }
  const obj = raw as Record<string, unknown>;
  let version: number | null = null;
  if (typeof obj.version === "number" && Number.isFinite(obj.version)) {
    version = obj.version;
  } else if (typeof obj.version === "string" && obj.version.trim()) {
    const n = Number(obj.version);
    version = Number.isFinite(n) ? n : null;
  }
  return {
    slug,
    fileName: fileName.replace(/^.*[\\/]/, ""),
    version,
    updatedAt: typeof obj.updated_at === "string" ? obj.updated_at : null,
    doneCount: countKeys(obj.done),
    failedCount: countKeys(obj.failed),
  };
}

function formatCheckpointLines(
  rows: CheckpointSummary[],
  options?: { maxRows?: number },
): string[] {
  if (!rows.length) return [];
  const maxRows = options?.maxRows ?? 12;
  const sorted = [...rows].sort((a, b) => a.slug.localeCompare(b.slug));
  return sorted.slice(0, maxRows).map((r) => {
    const when = r.updatedAt || "—";
    return `${r.slug}: done ${r.doneCount} · failed ${r.failedCount} · ${when}`;
  });
}
