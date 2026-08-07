// @ajan: cursor · @etiket: katman-1, kopru, extra-rmw, package-import
/**
 * Pure Extra builders for package import repair — call with a *fresh*
 * `item.getField("extra")` after any await (attachment I/O), so peer
 * writers (K2 ZPDF-*) are not overwritten by a stale snapshot.
 */
import { CATEGORY_KEY, SHA256_KEY } from "./itemPaneFields";
import {
  mergePackageCitationKey,
  type CitationKeyMergeAction,
} from "./kpRegistry";
import { IMPORT_STATUS_KEY } from "./processedPackage";

export type RepairExtraRow = {
  kp: string;
  sha256: string;
  category?: string | null;
};

export function upsertExtraLine(
  extra: string,
  key: string,
  value: string,
): string {
  const re = new RegExp(`^${key}:\\s*.+$`, "im");
  const line = `${key}: ${value}`;
  if (re.test(extra)) return extra.replace(re, line);
  return (extra ? extra.replace(/\s*$/, "\n") : "") + line + "\n";
}

/** Apply Kutuphane-* / Citation Key lines onto a fresh Extra string. */
export function applyRepairExtraFields(
  freshExtra: string,
  row: RepairExtraRow,
): { extra: string; ckAction: CitationKeyMergeAction } {
  const ck = mergePackageCitationKey(freshExtra, row.kp);
  let extra = ck.extra;
  extra = upsertExtraLine(extra, IMPORT_STATUS_KEY, "complete");
  extra = upsertExtraLine(extra, SHA256_KEY, row.sha256);
  if (row.category) {
    extra = upsertExtraLine(extra, CATEGORY_KEY, row.category);
  }
  return { extra, ckAction: ck.action };
}

export function applyFailedImportStatus(freshExtra: string): string {
  return upsertExtraLine(freshExtra, IMPORT_STATUS_KEY, "failed");
}
