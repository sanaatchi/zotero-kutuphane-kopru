// @ajan: cursor · @etiket: katman-1, kopru, a6-reverse-sync
/** Pure reverse-sync report — no writes, no Zotero globals. */

import { normalizeKp, resolveItemKp } from "./kpRegistry";

export type ReverseSyncItem = {
  itemId: number;
  title: string;
  citationKey: string | null;
  extra?: string | null;
};

export type ReverseSyncRow = {
  itemId: number;
  title: string;
  kp: string;
  inRegistry: boolean;
  onDisk: boolean | null; // null = disk index not available
};

export type ReverseSyncReport = {
  selected: number;
  withKp: number;
  withoutKp: number;
  missingFromRegistry: string[];
  missingFromDisk: string[];
  ok: string[];
  diskChecked: boolean;
  rows: ReverseSyncRow[];
};

export {
  occupiedKpFromDiskIndexFull,
  summarizeReverseSync,
  formatReverseSyncLines,
};

function occupiedKpFromDiskIndexFull(raw: unknown): Set<string> | null {
  if (!raw || typeof raw !== "object") return null;
  const records = (raw as Record<string, unknown>).records;
  if (!Array.isArray(records)) return null;
  const out = new Set<string>();
  for (const rec of records) {
    if (!rec || typeof rec !== "object") continue;
    const kp = normalizeKp((rec as Record<string, unknown>).kitap_id as string);
    if (kp) out.add(kp);
  }
  return out;
}

function summarizeReverseSync(
  items: ReverseSyncItem[],
  registryOccupied: Set<string>,
  diskOccupied: Set<string> | null,
): ReverseSyncReport {
  const rows: ReverseSyncRow[] = [];
  const missingFromRegistry: string[] = [];
  const missingFromDisk: string[] = [];
  const ok: string[] = [];
  let withKp = 0;
  let withoutKp = 0;

  for (const item of items) {
    const resolved = resolveItemKp({
      citationKey: item.citationKey,
      title: item.title,
      extra: item.extra,
    });
    if (!resolved.kp) {
      withoutKp += 1;
      continue;
    }
    withKp += 1;
    const inRegistry = registryOccupied.has(resolved.kp);
    let onDisk: boolean | null = null;
    if (diskOccupied) {
      onDisk = diskOccupied.has(resolved.kp);
    }
    rows.push({
      itemId: item.itemId,
      title: item.title,
      kp: resolved.kp,
      inRegistry,
      onDisk,
    });
    if (!inRegistry) missingFromRegistry.push(resolved.kp);
    else if (onDisk === false) missingFromDisk.push(resolved.kp);
    else if (inRegistry && (onDisk === true || onDisk === null)) {
      ok.push(resolved.kp);
    }
  }

  return {
    selected: items.length,
    withKp,
    withoutKp,
    missingFromRegistry: [...new Set(missingFromRegistry)].sort(),
    missingFromDisk: [...new Set(missingFromDisk)].sort(),
    ok: [...new Set(ok)].sort(),
    diskChecked: diskOccupied != null,
    rows,
  };
}

function formatReverseSyncLines(
  report: ReverseSyncReport,
  options?: {
    maxList?: number;
    arsivUrl?: string;
    syncHint?: string;
  },
): string[] {
  const maxList = options?.maxList ?? 15;
  const lines = [
    `reverse-sync · selected ${report.selected} · with KP ${report.withKp} · no KP ${report.withoutKp}`,
    `missing registry ${report.missingFromRegistry.length}` +
      (report.diskChecked
        ? ` · missing disk ${report.missingFromDisk.length}`
        : " · disk check skipped"),
    `aligned ${report.ok.length}`,
  ];
  if (report.missingFromRegistry.length) {
    lines.push("not in kp_registry:");
    for (const kp of report.missingFromRegistry.slice(0, maxList)) {
      lines.push(`  ${kp}`);
    }
    if (report.missingFromRegistry.length > maxList) {
      lines.push(
        `  …and ${report.missingFromRegistry.length - maxList} more`,
      );
    }
  }
  if (report.diskChecked && report.missingFromDisk.length) {
    lines.push("in registry but not on disk index:");
    for (const kp of report.missingFromDisk.slice(0, maxList)) {
      lines.push(`  ${kp}`);
    }
    if (report.missingFromDisk.length > maxList) {
      lines.push(`  …and ${report.missingFromDisk.length - maxList} more`);
    }
  }
  lines.push("no writes from bridge — fix in Python / arsiv_app");
  if (options?.syncHint) lines.push(options.syncHint);
  if (options?.arsivUrl) lines.push(`arsiv_app: ${options.arsivUrl}`);
  return lines;
}
