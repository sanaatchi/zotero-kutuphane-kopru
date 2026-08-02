// @ajan: cursor · @etiket: katman-1, kopru, b2, checkpoint, a1-stages
// Pure checkpoint helpers — no Zotero globals.
// Matches Python stage_resume: extract → {slug}_pipeline_checkpoint.json
// other stages → {slug}_{stage}_checkpoint.json

export const PIPELINE_STAGES = [
  "extract",
  "spellcheck",
  "validate",
  "quality",
  "rename",
  "database",
  "metadata",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type CheckpointSummary = {
  slug: string;
  stage: PipelineStage;
  fileName: string;
  version: number | null;
  updatedAt: string | null;
  doneCount: number;
  failedCount: number;
};

/** One category with all known stage rows (missing stages omitted). */
export type CategoryPipelineSummary = {
  slug: string;
  stages: CheckpointSummary[];
  totalDone: number;
  totalFailed: number;
};

export {
  checkpointSlugFromFileName,
  parseCheckpointFileName,
  summarizeCheckpointJson,
  groupCheckpointsBySlug,
  formatCheckpointLines,
  formatCategoryPipelineLines,
};

const EXTRACT_RE = /^(.+)_pipeline_checkpoint\.json$/i;
const STAGE_RE = new RegExp(
  `^(.+)_(${PIPELINE_STAGES.filter((s) => s !== "extract").join("|")})_checkpoint\\.json$`,
  "i",
);

function checkpointSlugFromFileName(fileName: string): string | null {
  return parseCheckpointFileName(fileName)?.slug ?? null;
}

function parseCheckpointFileName(
  fileName: string,
): { slug: string; stage: PipelineStage } | null {
  const base = fileName.replace(/^.*[\\/]/, "");
  const stageMatch = base.match(STAGE_RE);
  if (stageMatch) {
    return {
      slug: stageMatch[1],
      stage: stageMatch[2].toLowerCase() as PipelineStage,
    };
  }
  const extractMatch = base.match(EXTRACT_RE);
  if (extractMatch) {
    return { slug: extractMatch[1], stage: "extract" };
  }
  return null;
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
  const parsed = parseCheckpointFileName(fileName);
  if (!parsed) return null;
  const baseName = fileName.replace(/^.*[\\/]/, "");
  if (!raw || typeof raw !== "object") {
    return {
      slug: parsed.slug,
      stage: parsed.stage,
      fileName: baseName,
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
    slug: parsed.slug,
    stage: parsed.stage,
    fileName: baseName,
    version,
    updatedAt: typeof obj.updated_at === "string" ? obj.updated_at : null,
    doneCount: countKeys(obj.done),
    failedCount: countKeys(obj.failed),
  };
}

function groupCheckpointsBySlug(
  rows: CheckpointSummary[],
): CategoryPipelineSummary[] {
  const bySlug = new Map<string, CheckpointSummary[]>();
  for (const row of rows) {
    const list = bySlug.get(row.slug) || [];
    list.push(row);
    bySlug.set(row.slug, list);
  }
  const stageOrder = new Map(
    PIPELINE_STAGES.map((s, i) => [s, i] as const),
  );
  const out: CategoryPipelineSummary[] = [];
  for (const [slug, stages] of bySlug) {
    stages.sort(
      (a, b) =>
        (stageOrder.get(a.stage) ?? 99) - (stageOrder.get(b.stage) ?? 99),
    );
    out.push({
      slug,
      stages,
      totalDone: stages.reduce((n, s) => n + s.doneCount, 0),
      totalFailed: stages.reduce((n, s) => n + s.failedCount, 0),
    });
  }
  out.sort((a, b) => a.slug.localeCompare(b.slug));
  return out;
}

/** Legacy flat lines (one file = one row). Prefer formatCategoryPipelineLines. */
function formatCheckpointLines(
  rows: CheckpointSummary[],
  options?: { maxRows?: number },
): string[] {
  if (!rows.length) return [];
  const maxRows = options?.maxRows ?? 12;
  const sorted = [...rows].sort((a, b) => {
    const c = a.slug.localeCompare(b.slug);
    if (c !== 0) return c;
    return (
      PIPELINE_STAGES.indexOf(a.stage) - PIPELINE_STAGES.indexOf(b.stage)
    );
  });
  return sorted.slice(0, maxRows).map((r) => {
    const when = r.updatedAt || "—";
    return `${r.slug}/${r.stage}: done ${r.doneCount} · failed ${r.failedCount} · ${when}`;
  });
}

function formatCategoryPipelineLines(
  categories: CategoryPipelineSummary[],
  options?: { maxCategories?: number },
): string[] {
  if (!categories.length) return [];
  const maxCategories = options?.maxCategories ?? 12;
  return categories.slice(0, maxCategories).map((cat) => {
    const parts = cat.stages.map(
      (s) => `${s.stage} ${s.doneCount}/${s.failedCount}`,
    );
    return `${cat.slug}: ${parts.join(" · ")}`;
  });
}
