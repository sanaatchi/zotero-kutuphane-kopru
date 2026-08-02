// @ajan: cursor · @etiket: katman-1, kopru, a3-import-report
/** Pure import plan / report helpers — no Zotero globals. */

export type ImportAction = "create" | "skip" | "repair" | "fail";

export type ImportRowPlan = {
  kp: string;
  action: ImportAction;
  detail?: string;
};

export type ImportReportCounts = {
  create: number;
  skip: number;
  repair: number;
  fail: number;
  total: number;
};

export {
  planImportAction,
  countImportPlans,
  formatImportPlanLines,
  formatImportResultLines,
};

/** Decide action from idempotency hit + attachment match + import status. */
function planImportAction(opts: {
  hasExisting: boolean;
  importStatus: string | null;
  attachmentMatches: boolean;
}): ImportAction {
  if (!opts.hasExisting) return "create";
  if (opts.importStatus === "complete" && opts.attachmentMatches) {
    return "skip";
  }
  return "repair";
}

function countImportPlans(rows: ImportRowPlan[]): ImportReportCounts {
  const c: ImportReportCounts = {
    create: 0,
    skip: 0,
    repair: 0,
    fail: 0,
    total: rows.length,
  };
  for (const r of rows) {
    if (r.action === "create") c.create += 1;
    else if (r.action === "skip") c.skip += 1;
    else if (r.action === "repair") c.repair += 1;
    else c.fail += 1;
  }
  return c;
}

function formatImportPlanLines(
  rows: ImportRowPlan[],
  options?: { maxRows?: number },
): string[] {
  const maxRows = options?.maxRows ?? 20;
  const counts = countImportPlans(rows);
  const head = [
    `dry-run · create ${counts.create} · repair ${counts.repair} · skip ${counts.skip} · fail ${counts.fail} · total ${counts.total}`,
  ];
  const body = rows.slice(0, maxRows).map((r) => {
    const d = r.detail ? ` — ${r.detail}` : "";
    return `${r.kp}: ${r.action}${d}`;
  });
  if (rows.length > maxRows) {
    body.push(`…and ${rows.length - maxRows} more`);
  }
  return [...head, ...body];
}

function formatImportResultLines(
  rows: ImportRowPlan[],
  options?: { maxFailRows?: number },
): string[] {
  const maxFail = options?.maxFailRows ?? 15;
  const counts = countImportPlans(rows);
  const head = [
    `done · created ${counts.create} · repaired ${counts.repair} · skipped ${counts.skip} · failed ${counts.fail} · total ${counts.total}`,
  ];
  const fails = rows.filter((r) => r.action === "fail");
  if (!fails.length) return head;
  const body = fails.slice(0, maxFail).map((r) => {
    const d = r.detail ? ` — ${r.detail}` : "";
    return `${r.kp}: fail${d}`;
  });
  if (fails.length > maxFail) {
    body.push(`…and ${fails.length - maxFail} more failures`);
  }
  return [...head, "failures:", ...body];
}
