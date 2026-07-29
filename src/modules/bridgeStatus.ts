// @ajan: cursor · @etiket: katman-1, kopru, b0, b1, b2, bridge
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import {
  parseKpRegistryJson,
  summarizeSelectedAgainstRegistry,
} from "../utils/kpRegistry";
import {
  formatCheckpointLines,
  summarizeCheckpointJson,
  type CheckpointSummary,
} from "../utils/pipelineCheckpoint";

export { showKutuphaneStatus, matchSelectedKps, showPipelineSummary };

const CITATION_KEY_LINE = /^Citation Key:\s*(.+)$/im;

function alertDialog(message: string) {
  ztoolkit.getGlobal("alert")(message);
}

function getRootPath(): string {
  const v = getPref("kutuphaneRoot");
  return typeof v === "string" ? v.trim() : "";
}

function citationKeyFromItem(item: Zotero.Item): string | null {
  const extra = (item.getField("extra") as string) || "";
  const m = extra.match(CITATION_KEY_LINE);
  // Only the Extra "Citation Key:" line — never invent KP from title here.
  return m ? m[1].trim() : null;
}

async function loadRegistry(root: string) {
  const path = PathUtils.join(root, "kp_registry.json");
  if (!(await IOUtils.exists(path))) {
    throw new Error(`kp_registry.json yok: ${path}`);
  }
  const raw = await IOUtils.readJSON(path);
  return parseKpRegistryJson(raw);
}

async function showKutuphaneStatus(): Promise<void> {
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
    const msg = [
      getString("status-ok", { args: { path: root } }),
      getString("status-registry", {
        args: { count: reg.occupiedCount, next: reg.nextKp || "—" },
      }),
    ].join("\n");
    alertDialog(msg);
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
    if (!/_pipeline_checkpoint\.json$/i.test(base)) continue;
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

async function showPipelineSummary(): Promise<void> {
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
      alertDialog(getString("pipeline-empty"));
      return;
    }
    const totalDone = rows.reduce((n, r) => n + r.doneCount, 0);
    const totalFailed = rows.reduce((n, r) => n + r.failedCount, 0);
    const lines = [
      getString("pipeline-title"),
      getString("pipeline-summary", {
        args: {
          files: rows.length,
          done: totalDone,
          failed: totalFailed,
        },
      }),
      ...formatCheckpointLines(rows),
    ];
    if (rows.length > 12) {
      lines.push(getString("pipeline-more", { args: { n: rows.length - 12 } }));
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
    alertDialog(lines.join("\n"));
  } catch (e: any) {
    alertDialog(
      getString("status-error", {
        args: { message: e?.message || String(e) },
      }),
    );
  }
}
