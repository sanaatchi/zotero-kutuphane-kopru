// @ajan: cursor · @etiket: katman-1, kopru, b0, b1, b2, bridge, a1-stages, a2-status, a5-http, a6-reverse-sync, path-normalize
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { normalizeKutuphaneRoot } from "../utils/kutuphaneRoot";
import {
  parseKpRegistryJson,
  summarizeSelectedAgainstRegistry,
} from "../utils/kpRegistry";
import {
  DISK_INDEX_BASENAME,
  DISK_INDEX_MANIFEST_BASENAME,
  HANDOFF_DIR,
  HANDOFF_PACKAGE_BASENAME,
  buildRootStatusExtras,
} from "../utils/kutuphaneRootStatus";
import {
  formatCategoryPipelineLines,
  groupCheckpointsBySlug,
  parseCheckpointFileName,
  summarizeCheckpointJson,
  type CheckpointSummary,
} from "../utils/pipelineCheckpoint";
import {
  BRIDGE_HTTP_TIMEOUT_MS,
  DEFAULT_BRIDGE_HTTP_BASE,
  isAllowedBridgeBaseUrl,
  normalizeBridgeBaseUrl,
  parseBridgePipelineJson,
  parseBridgeStatusJson,
  resolveBridgeHttpConfig,
} from "../utils/bridgeHttp";
import {
  formatReverseSyncLines,
  occupiedKpFromDiskIndexFull,
  summarizeReverseSync,
} from "../utils/reverseSyncReport";

export {
  showKutuphaneStatus,
  matchSelectedKps,
  showPipelineSummary,
  showReverseSyncReport,
};

const CITATION_KEY_LINE = /^Citation Key:\s*(.+)$/im;

function alertDialog(message: string) {
  ztoolkit.getGlobal("alert")(message);
}

function getRootPath(): string {
  return normalizeKutuphaneRoot(getPref("kutuphaneRoot"));
}

function getBridgeConfig() {
  return resolveBridgeHttpConfig({
    enabled: getPref("bridgeHttpEnabled"),
    baseUrl: getPref("bridgeHttpBaseUrl"),
  });
}

function citationKeyFromItem(item: Zotero.Item): string | null {
  const extra = (item.getField("extra") as string) || "";
  const m = extra.match(CITATION_KEY_LINE);
  // Only the Extra "Citation Key:" line — never invent KP from title here.
  return m ? m[1].trim() : null;
}

async function fetchBridgeJson(
  path: string,
): Promise<{ ok: true; data: unknown } | { ok: false; message: string }> {
  const cfg = getBridgeConfig();
  if (!cfg.enabled) return { ok: false, message: "disabled" };
  if (!isAllowedBridgeBaseUrl(cfg.baseUrl)) {
    return { ok: false, message: `blocked base URL: ${cfg.baseUrl}` };
  }
  const url = `${cfg.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), BRIDGE_HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { ok: false, message: `HTTP ${res.status}` };
    }
    return { ok: true, data: await res.json() };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  } finally {
    clearTimeout(timer);
  }
}

async function loadRegistry(root: string) {
  const path = PathUtils.join(root, "kp_registry.json");
  if (!(await IOUtils.exists(path))) {
    throw new Error(`kp_registry.json yok: ${path}`);
  }
  const raw = await IOUtils.readJSON(path);
  return parseKpRegistryJson(raw);
}

async function probeRootStatusExtras(root: string) {
  const diskPath = PathUtils.join(root, DISK_INDEX_BASENAME);
  const manifPath = PathUtils.join(root, DISK_INDEX_MANIFEST_BASENAME);
  const handoffPath = PathUtils.join(
    root,
    HANDOFF_DIR,
    HANDOFF_PACKAGE_BASENAME,
  );
  const diskIndexExists = await IOUtils.exists(diskPath);
  const manifestExists = await IOUtils.exists(manifPath);
  const handoffExists = await IOUtils.exists(handoffPath);
  let diskIndexRaw: unknown | null = null;
  let handoffRaw: unknown | null = null;
  if (diskIndexExists) {
    try {
      diskIndexRaw = await IOUtils.readJSON(diskPath);
    } catch {
      diskIndexRaw = null;
    }
  }
  if (handoffExists) {
    try {
      handoffRaw = await IOUtils.readJSON(handoffPath);
    } catch {
      handoffRaw = null;
    }
  }
  return buildRootStatusExtras({
    diskIndexRaw,
    diskIndexExists,
    manifestExists,
    handoffRaw,
    handoffExists,
  });
}

function formatStatusMessage(
  root: string,
  occupiedCount: number,
  nextKp: string,
  extras: ReturnType<typeof buildRootStatusExtras>,
  sourceLine?: string,
): string {
  const di = extras.diskIndex;
  const ho = extras.handoff;
  const lines = [
    getString("status-ok", { args: { path: root } }),
    getString("status-registry", {
      args: { count: occupiedCount, next: nextKp || "—" },
    }),
    getString("status-max-pdfs", {
      args: { max: extras.maxLibraryPdfs },
    }),
    di.exists
      ? getString("status-disk-index-ok", {
          args: {
            pdfs: di.totalPdfs ?? "?",
            kp: di.uniqueKp ?? "?",
            issues: di.issueCount ?? "?",
            when: di.scannedAt || "—",
          },
        })
      : getString("status-disk-index-missing"),
    di.manifestExists
      ? getString("status-disk-manifest-ok")
      : getString("status-disk-manifest-missing"),
    ho.exists
      ? getString("status-handoff-ok", {
          args: {
            items: ho.itemCount ?? "?",
            when: ho.generatedAt || "—",
          },
        })
      : getString("status-handoff-missing"),
  ];
  if (sourceLine) lines.push(sourceLine);
  return lines.join("\n");
}

async function showKutuphaneStatus(): Promise<void> {
  const cfg = getBridgeConfig();
  if (cfg.enabled) {
    const http = await fetchBridgeJson("/api/bridge/status");
    if (http.ok) {
      const parsed = parseBridgeStatusJson(http.data);
      if (parsed) {
        const root = parsed.root || getRootPath() || "(http)";
        alertDialog(
          formatStatusMessage(
            root,
            parsed.occupiedCount,
            parsed.nextKp,
            parsed.extras,
            getString("status-via-http", { args: { base: cfg.baseUrl } }),
          ),
        );
        return;
      }
    }
    // fall through to disk with note
    const root = getRootPath();
    if (!root) {
      alertDialog(
        [
          getString("status-no-root"),
          getString("status-http-fallback", {
            args: { message: http.ok ? "invalid JSON" : http.message },
          }),
        ].join("\n"),
      );
      return;
    }
    try {
      if (!(await IOUtils.exists(root))) {
        alertDialog(
          [
            getString("status-root-missing", { args: { path: root } }),
            getString("status-http-fallback", {
              args: { message: http.ok ? "invalid JSON" : http.message },
            }),
          ].join("\n"),
        );
        return;
      }
      const reg = await loadRegistry(root);
      const extras = await probeRootStatusExtras(root);
      alertDialog(
        formatStatusMessage(
          root,
          reg.occupiedCount,
          reg.nextKp,
          extras,
          getString("status-http-fallback", {
            args: { message: http.ok ? "invalid JSON" : http.message },
          }),
        ),
      );
      return;
    } catch (e: any) {
      alertDialog(
        getString("status-error", {
          args: { message: e?.message || String(e) },
        }),
      );
      return;
    }
  }

  const root = getRootPath();
  if (!root) {
    alertDialog(getString("status-no-root"));
    return;
  }
  try {
    if (!(await IOUtils.exists(root))) {
      alertDialog(getString("status-root-missing", { args: { path: root } }));
      return;
    }
    const reg = await loadRegistry(root);
    const extras = await probeRootStatusExtras(root);
    alertDialog(
      formatStatusMessage(root, reg.occupiedCount, reg.nextKp, extras),
    );
  } catch (e: any) {
    alertDialog(
      getString("status-error", {
        args: { message: e?.message || String(e) },
      }),
    );
  }
}

async function listCheckpointSummaries(root: string): Promise<CheckpointSummary[]> {
  const children = await IOUtils.getChildren(root);
  const out: CheckpointSummary[] = [];
  for (const path of children) {
    const base = path.replace(/^.*[\\/]/, "");
    // extract: *_pipeline_checkpoint.json · stages: *_{stage}_checkpoint.json
    if (!parseCheckpointFileName(base)) continue;
    try {
      const raw = await IOUtils.readJSON(path);
      const summary = summarizeCheckpointJson(base, raw);
      if (summary) out.push(summary);
    } catch {
      // skip unreadable checkpoint
    }
  }
  return out;
}

function formatPipelineAlert(
  categories: ReturnType<typeof groupCheckpointsBySlug>,
  fileCount: number,
  sourceLine?: string,
): string {
  const totalDone = categories.reduce((n, c) => n + c.totalDone, 0);
  const totalFailed = categories.reduce((n, c) => n + c.totalFailed, 0);
  const lines = [
    getString("pipeline-title"),
    getString("pipeline-summary", {
      args: {
        files: categories.length,
        done: totalDone,
        failed: totalFailed,
      },
    }),
    getString("pipeline-stages-hint", {
      args: { files: fileCount },
    }),
    ...formatCategoryPipelineLines(categories, { maxCategories: 12 }),
  ];
  if (categories.length > 12) {
    lines.push(
      getString("pipeline-more", { args: { n: categories.length - 12 } }),
    );
  }
  if (sourceLine) lines.push(sourceLine);
  return lines.join("\n");
}

async function showPipelineSummary(): Promise<void> {
  const cfg = getBridgeConfig();
  if (cfg.enabled) {
    const http = await fetchBridgeJson("/api/bridge/pipeline");
    if (http.ok) {
      const categories = parseBridgePipelineJson(http.data);
      if (categories.length) {
        const fileCount = categories.reduce((n, c) => n + c.stages.length, 0);
        alertDialog(
          formatPipelineAlert(
            categories,
            fileCount,
            getString("status-via-http", { args: { base: cfg.baseUrl } }),
          ),
        );
        return;
      }
      if (
        http.data &&
        typeof http.data === "object" &&
        Array.isArray((http.data as any).categories) &&
        (http.data as any).categories.length === 0
      ) {
        alertDialog(
          [
            getString("pipeline-empty"),
            getString("status-via-http", { args: { base: cfg.baseUrl } }),
          ].join("\n"),
        );
        return;
      }
    }
    // disk fallback
  }

  const root = getRootPath();
  if (!root) {
    alertDialog(getString("status-no-root"));
    return;
  }
  try {
    if (!(await IOUtils.exists(root))) {
      alertDialog(getString("status-root-missing", { args: { path: root } }));
      return;
    }
    const rows = await listCheckpointSummaries(root);
    if (!rows.length) {
      const note =
        cfg.enabled
          ? getString("status-http-fallback", {
              args: { message: "empty or unreachable" },
            })
          : "";
      alertDialog(
        note
          ? [getString("pipeline-empty"), note].join("\n")
          : getString("pipeline-empty"),
      );
      return;
    }
    const categories = groupCheckpointsBySlug(rows);
    alertDialog(
      formatPipelineAlert(
        categories,
        rows.length,
        cfg.enabled
          ? getString("status-http-fallback", {
              args: { message: "disk" },
            })
          : undefined,
      ),
    );
  } catch (e: any) {
    alertDialog(
      getString("status-error", {
        args: { message: e?.message || String(e) },
      }),
    );
  }
}

async function matchSelectedKps(): Promise<void> {
  const root = getRootPath();
  if (!root) {
    alertDialog(getString("status-no-root"));
    return;
  }
  const pane = Zotero.getActiveZoteroPane?.() ?? null;
  const items =
    pane
      ?.getSelectedItems()
      ?.filter((i: Zotero.Item) => i.isRegularItem()) ?? [];
  if (!items.length) {
    alertDialog(getString("match-empty"));
    return;
  }
  try {
    const reg = await loadRegistry(root);
    const rows = items.map((item: Zotero.Item) => {
      const title =
        item.getDisplayTitle?.() || (item.getField("title") as string) || "—";
      const extra = (item.getField("extra") as string) || "";
      return {
        itemId: item.id,
        title,
        citationKey: citationKeyFromItem(item),
        extra,
      };
    });
    const summary = summarizeSelectedAgainstRegistry(rows, reg);
    const lines = [
      getString("match-title"),
      getString("match-summary", {
        args: {
          selected: summary.selected,
          withKp: summary.withKp,
          inRegistry: summary.inRegistry,
          missing: summary.missing.length,
        },
      }),
    ];
    if (summary.missing.length) {
      lines.push(
        getString("match-missing-list", {
          args: { keys: summary.missing.join(", ") },
        }),
      );
    }
    if (summary.withKp < summary.selected) {
      lines.push(getString("match-bbt-hint"));
    }
    alertDialog(lines.join("\n"));
  } catch (e: any) {
    alertDialog(
      getString("status-error", {
        args: { message: e?.message || String(e) },
      }),
    );
  }
}

function arsivAppHintUrl(): string {
  const base = normalizeBridgeBaseUrl(
    typeof getPref("bridgeHttpBaseUrl") === "string"
      ? (getPref("bridgeHttpBaseUrl") as string)
      : DEFAULT_BRIDGE_HTTP_BASE,
  );
  return isAllowedBridgeBaseUrl(base) ? base : DEFAULT_BRIDGE_HTTP_BASE;
}

async function loadDiskOccupied(root: string): Promise<Set<string> | null> {
  const fullPath = PathUtils.join(root, "disk_pdf_index_full.json");
  try {
    if (!(await IOUtils.exists(fullPath))) return null;
    const raw = await IOUtils.readJSON(fullPath);
    return occupiedKpFromDiskIndexFull(raw);
  } catch {
    return null;
  }
}

async function showReverseSyncReport(): Promise<void> {
  const root = getRootPath();
  if (!root) {
    alertDialog(getString("status-no-root"));
    return;
  }
  const pane = Zotero.getActiveZoteroPane?.() ?? null;
  const items =
    pane
      ?.getSelectedItems()
      ?.filter((i: Zotero.Item) => i.isRegularItem()) ?? [];
  if (!items.length) {
    alertDialog(getString("match-empty"));
    return;
  }
  try {
    if (!(await IOUtils.exists(root))) {
      alertDialog(getString("status-root-missing", { args: { path: root } }));
      return;
    }
    const reg = await loadRegistry(root);
    const diskOccupied = await loadDiskOccupied(root);
    const mapped = items.map((item: Zotero.Item) => {
      const title =
        item.getDisplayTitle?.() || (item.getField("title") as string) || "—";
      const extra = (item.getField("extra") as string) || "";
      return {
        itemId: item.id,
        title,
        citationKey: citationKeyFromItem(item),
        extra,
      };
    });
    const report = summarizeReverseSync(
      mapped,
      reg.occupiedKeys,
      diskOccupied,
    );
    const body = formatReverseSyncLines(report, {
      maxList: 15,
      arsivUrl: arsivAppHintUrl(),
      syncHint: "python _sync_kp_registry.py --check",
    });
    alertDialog(
      [
        getString("reverse-title"),
        getString("reverse-summary", {
          args: {
            selected: report.selected,
            withKp: report.withKp,
            missingReg: report.missingFromRegistry.length,
            missingDisk: report.diskChecked
              ? report.missingFromDisk.length
              : "—",
          },
        }),
        ...body.slice(1),
        getString("reverse-no-write"),
        getString("reverse-arsiv-hint", {
          args: { url: arsivAppHintUrl() },
        }),
      ].join("\n"),
    );
  } catch (e: any) {
    alertDialog(
      getString("status-error", {
        args: { message: e?.message || String(e) },
      }),
    );
  }
}
