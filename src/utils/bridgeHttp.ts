// @ajan: cursor · @etiket: katman-1, kopru, a5-http, bridge-api
/** Pure HTTP bridge helpers — no Zotero / fetch globals. */

import { MAX_LIBRARY_PDFS } from "./kpRegistry";
import type { RootStatusExtras } from "./kutuphaneRootStatus";
import {
  PIPELINE_STAGES,
  type CategoryPipelineSummary,
  type CheckpointSummary,
  type PipelineStage,
} from "./pipelineCheckpoint";

export const DEFAULT_BRIDGE_HTTP_BASE = "http://127.0.0.1:8077";
export const BRIDGE_HTTP_TIMEOUT_MS = 4000;

export type BridgeHttpConfig = {
  enabled: boolean;
  baseUrl: string;
};

export type ParsedBridgeStatus = {
  root: string;
  maxLibraryPdfs: number;
  occupiedCount: number;
  nextKp: string;
  extras: RootStatusExtras;
};

export {
  normalizeBridgeBaseUrl,
  isAllowedBridgeBaseUrl,
  resolveBridgeHttpConfig,
  parseBridgeStatusJson,
  parseBridgePipelineJson,
};

function normalizeBridgeBaseUrl(raw: string | null | undefined): string {
  const s = String(raw || "").trim().replace(/\/+$/, "");
  return s || DEFAULT_BRIDGE_HTTP_BASE;
}

/** Only loopback HTTP(S) — no remote SSRF from prefs. */
function isAllowedBridgeBaseUrl(baseUrl: string): boolean {
  try {
    const u = new URL(normalizeBridgeBaseUrl(baseUrl));
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return (
      host === "127.0.0.1" ||
      host === "localhost" ||
      host === "[::1]" ||
      host === "::1"
    );
  } catch {
    return false;
  }
}

function resolveBridgeHttpConfig(opts: {
  enabled: unknown;
  baseUrl: unknown;
}): BridgeHttpConfig {
  const enabled =
    opts.enabled === true ||
    opts.enabled === 1 ||
    opts.enabled === "true" ||
    opts.enabled === "1";
  return {
    enabled,
    baseUrl: normalizeBridgeBaseUrl(
      typeof opts.baseUrl === "string" ? opts.baseUrl : "",
    ),
  };
}

function asInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}

function parseBridgeStatusJson(raw: unknown): ParsedBridgeStatus | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.ok === false) return null;
  const reg =
    obj.registry && typeof obj.registry === "object"
      ? (obj.registry as Record<string, unknown>)
      : {};
  const disk =
    obj.diskIndex && typeof obj.diskIndex === "object"
      ? (obj.diskIndex as Record<string, unknown>)
      : {};
  const handoff =
    obj.handoffPackage && typeof obj.handoffPackage === "object"
      ? (obj.handoffPackage as Record<string, unknown>)
      : {};
  const diskExists = disk.exists === true;
  const handoffExists = handoff.exists === true;
  return {
    root: typeof obj.root === "string" ? obj.root : "",
    maxLibraryPdfs: asInt(obj.maxLibraryPdfs) ?? MAX_LIBRARY_PDFS,
    occupiedCount: asInt(reg.occupiedCount) ?? 0,
    nextKp: typeof reg.nextKp === "string" ? reg.nextKp : "",
    extras: {
      maxLibraryPdfs: asInt(obj.maxLibraryPdfs) ?? MAX_LIBRARY_PDFS,
      diskIndex: {
        exists: diskExists,
        manifestExists: disk.manifestExists === true,
        totalPdfs: asInt(disk.totalPdfs),
        uniqueKp: asInt(disk.uniqueKp),
        scannedAt: typeof disk.scannedAt === "string" ? disk.scannedAt : null,
        issueCount: asInt(disk.issueCount),
      },
      handoff: {
        exists: handoffExists,
        itemCount: asInt(handoff.itemCount),
        generatedAt:
          typeof handoff.generatedAt === "string" ? handoff.generatedAt : null,
        schemaVersion: asInt(handoff.schemaVersion),
      },
    },
  };
}

function parseBridgePipelineJson(raw: unknown): CategoryPipelineSummary[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.categories)) return [];
  const stageSet = new Set<string>(PIPELINE_STAGES);
  const out: CategoryPipelineSummary[] = [];
  for (const cat of obj.categories) {
    if (!cat || typeof cat !== "object") continue;
    const c = cat as Record<string, unknown>;
    const slug =
      (typeof c.slug === "string" && c.slug) ||
      (typeof c.category === "string" && c.category) ||
      "";
    if (!slug) continue;
    const stagesRaw = Array.isArray(c.stages) ? c.stages : [];
    const stages: CheckpointSummary[] = [];
    for (const s of stagesRaw) {
      if (!s || typeof s !== "object") continue;
      const row = s as Record<string, unknown>;
      const stageName =
        typeof row.stage === "string" ? row.stage.toLowerCase() : "";
      if (!stageSet.has(stageName)) continue;
      if (row.exists === false) continue;
      stages.push({
        slug,
        stage: stageName as PipelineStage,
        fileName: `http:${stageName}`,
        version: null,
        updatedAt: null,
        doneCount: asInt(row.done) ?? 0,
        failedCount: asInt(row.failed) ?? 0,
      });
    }
    stages.sort(
      (a, b) =>
        PIPELINE_STAGES.indexOf(a.stage) - PIPELINE_STAGES.indexOf(b.stage),
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
