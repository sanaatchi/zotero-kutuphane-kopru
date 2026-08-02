// @ajan: cursor · @etiket: katman-1, kopru, b3, a3-dry-run, a4-category, package-import, handoff, hash-verify
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { normalizeKutuphaneRoot } from "../utils/kutuphaneRoot";
import { CATEGORY_KEY, SHA256_KEY } from "../utils/itemPaneFields";
import {
  countImportPlans,
  formatImportPlanLines,
  formatImportResultLines,
  planImportAction,
  type ImportRowPlan,
} from "../utils/packageImportReport";
import {
  IDEMP_KEY,
  IMPORT_STATUS_KEY,
  escapeLikeExact,
  isPathInsideRoot,
  parseExtraField,
  validateProcessedPackage,
  type PackageItem,
  type ValidatedPackage,
} from "../utils/processedPackage";

export { importProcessedPdfPackage, previewProcessedPdfPackage };

function alertDialog(message: string) {
  ztoolkit.getGlobal("alert")(message);
}

function getRootPath(): string {
  return normalizeKutuphaneRoot(getPref("kutuphaneRoot"));
}

function upsertExtraLine(extra: string, key: string, value: string): string {
  const re = new RegExp(`^${key}:\\s*.+$`, "im");
  const line = `${key}: ${value}`;
  if (re.test(extra)) return extra.replace(re, line);
  return (extra ? extra.replace(/\s*$/, "\n") : "") + line + "\n";
}

async function sha256Hex(path: string): Promise<string> {
  const CHUNK = 1024 * 1024;
  const stat = await IOUtils.stat(path);
  const size = Number(stat.size) || 0;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CcAny = (globalThis as any).Cc || (Components as any)?.classes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CiAny = (globalThis as any).Ci || (Components as any)?.interfaces;
    if (CcAny && CiAny) {
      const hasher = CcAny["@mozilla.org/security/hash;1"].createInstance(
        CiAny.nsICryptoHash,
      );
      hasher.init(CiAny.nsICryptoHash.SHA256);
      for (let offset = 0; offset < size; offset += CHUNK) {
        const chunk = await IOUtils.read(path, {
          offset,
          maxBytes: Math.min(CHUNK, size - offset),
        } as any);
        hasher.update(chunk, chunk.byteLength);
      }
      const binary = hasher.finish(false);
      return Array.from(binary as string, (c) =>
        ("0" + c.charCodeAt(0).toString(16)).slice(-2),
      ).join("");
    }
  } catch {
    /* fall through */
  }

  const bytes = await IOUtils.read(path);
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function resolveCanonicalPath(path: string): Promise<string> {
  try {
    const resolved = await (IOUtils as any).getFile?.(path);
    if (resolved?.path) return String(resolved.path);
  } catch {
    /* ignore */
  }
  return path;
}

async function probeFile(
  path: string,
  allowedRoot?: string,
): Promise<{ size: number; sha256: string; isFile: boolean } | null> {
  try {
    const canonical = await resolveCanonicalPath(path);
    if (allowedRoot && !isPathInsideRoot(canonical, allowedRoot)) {
      return null;
    }
    if (!(await IOUtils.exists(canonical))) return null;
    const stat = await IOUtils.stat(canonical);
    if ((stat as any).type && (stat as any).type !== "regular") return null;
    const sha256 = await sha256Hex(canonical);
    return { size: Number(stat.size), sha256, isFile: true };
  } catch {
    return null;
  }
}

async function attachmentMatchesPackage(
  item: Zotero.Item,
  row: PackageItem,
): Promise<boolean> {
  const kids = item.getAttachments();
  if (!kids.length) return false;
  for (const id of kids) {
    const att = Zotero.Items.get(id);
    if (!att) continue;
    let path = "";
    try {
      path = (await (att as any).getFilePathAsync?.()) || "";
    } catch {
      path = "";
    }
    if (!path) continue;
    const info = await probeFile(path, getRootPath() || undefined);
    if (!info) continue;
    if (info.sha256.toLowerCase() === row.sha256.toLowerCase()) {
      if (!row.size || info.size === row.size) return true;
    }
  }
  return false;
}

async function eraseAttachments(item: Zotero.Item): Promise<void> {
  const kids = item.getAttachments();
  for (const id of kids) {
    const att = Zotero.Items.get(id);
    if (att) await eraseItemQuiet(att);
  }
}

async function findItemByIdempotency(
  libraryID: number,
  key: string,
): Promise<Zotero.Item | null> {
  const escaped = escapeLikeExact(`${IDEMP_KEY}: ${key}`);
  const sql = `
    SELECT itemID FROM itemData
    JOIN itemDataValues USING (valueID)
    JOIN fields USING (fieldID)
    WHERE fields.fieldName = 'extra'
      AND itemDataValues.value LIKE ? ESCAPE '\\'
  `;
  try {
    const ids = (await Zotero.DB.queryAsync(sql, [`%${escaped}%`])) as
      | { itemID: number }[]
      | false;
    if (!ids || !ids.length) return null;
    for (const row of ids) {
      const item = Zotero.Items.get(row.itemID);
      if (!item || item.deleted || item.libraryID !== libraryID) continue;
      const extra = (item.getField("extra") as string) || "";
      if (parseExtraField(extra, IDEMP_KEY) === key) return item;
    }
  } catch (e) {
    ztoolkit.log("idempotency lookup failed", e);
  }
  return null;
}

async function eraseItemQuiet(item: Zotero.Item): Promise<void> {
  try {
    await Zotero.Items.erase(item.id);
  } catch (e) {
    ztoolkit.log("erase failed", e);
  }
}

async function ensureAttachment(
  item: Zotero.Item,
  row: PackageItem,
): Promise<void> {
  const mode =
    row.attachmentMode === "import" ? "importFromFile" : "linkFromFile";
  await (Zotero.Attachments as any)[mode]({
    file: row.path,
    parentItemID: item.id,
    title: "Full Text PDF",
    contentType: "application/pdf",
  });
}

async function createOrUpdateItem(
  libraryID: number,
  row: PackageItem,
): Promise<"created" | "skipped" | "repaired"> {
  const existing = await findItemByIdempotency(libraryID, row.idempotencyKey);
  if (existing) {
    const extra = (existing.getField("extra") as string) || "";
    const status = parseExtraField(extra, IMPORT_STATUS_KEY);
    const matches = await attachmentMatchesPackage(existing, row);
    if (status === "complete" && matches) return "skipped";
    try {
      if (!matches) {
        await eraseAttachments(existing);
        await ensureAttachment(existing, row);
      }
      if (!(await attachmentMatchesPackage(existing, row))) {
        throw new Error("attachment hash mismatch after repair");
      }
      let repairedExtra = extra;
      repairedExtra = upsertExtraLine(repairedExtra, IMPORT_STATUS_KEY, "complete");
      repairedExtra = upsertExtraLine(repairedExtra, SHA256_KEY, row.sha256);
      if (row.category) {
        repairedExtra = upsertExtraLine(repairedExtra, CATEGORY_KEY, row.category);
      }
      existing.setField("extra", repairedExtra);
      await existing.saveTx();
      return "repaired";
    } catch (e) {
      let failedExtra = upsertExtraLine(extra, IMPORT_STATUS_KEY, "failed");
      existing.setField("extra", failedExtra);
      await existing.saveTx();
      throw e;
    }
  }

  const item = new Zotero.Item("book");
  item.libraryID = libraryID;
  item.setField("title", row.title || row.kp);
  if (row.year) item.setField("date", row.year);
  if (row.creators?.length) {
    row.creators.forEach((name, idx) => {
      const parts = name.trim().split(/\s+/);
      const lastName = parts.pop() || name;
      const firstName = parts.join(" ");
      item.setCreator(idx, {
        creatorType: "author",
        firstName,
        lastName,
      });
    });
  }
  let extra = (item.getField("extra") as string) || "";
  extra = upsertExtraLine(extra, "Citation Key", row.kp);
  extra = upsertExtraLine(extra, IDEMP_KEY, row.idempotencyKey);
  extra = upsertExtraLine(extra, SHA256_KEY, row.sha256);
  if (row.category) {
    extra = upsertExtraLine(extra, CATEGORY_KEY, row.category);
  }
  extra = upsertExtraLine(extra, IMPORT_STATUS_KEY, "pending");
  item.setField("extra", extra);
  await item.saveTx();

  try {
    await ensureAttachment(item, row);
    if (!(await attachmentMatchesPackage(item, row))) {
      throw new Error("attachment hash mismatch after create");
    }
    let doneExtra = (item.getField("extra") as string) || "";
    doneExtra = upsertExtraLine(doneExtra, IMPORT_STATUS_KEY, "complete");
    item.setField("extra", doneExtra);
    await item.saveTx();
    return "created";
  } catch (e) {
    await eraseItemQuiet(item);
    throw e;
  }
}

async function loadValidatedPackage(
  root: string,
): Promise<
  | { ok: true; pkg: ValidatedPackage; path: string }
  | { ok: false; kind: "missing" | "invalid" | "error"; message: string }
> {
  const path = PathUtils.join(root, "zotero_handoff", "processed_pdf_package.json");
  if (!(await IOUtils.exists(path))) {
    return { ok: false, kind: "missing", message: path };
  }
  try {
    const raw = await IOUtils.readJSON(path);
    const itemsProbe: Record<
      string,
      { size: number; sha256: string; isFile: boolean }
    > = {};
    if (raw && typeof raw === "object" && Array.isArray((raw as any).items)) {
      for (const row of (raw as any).items) {
        if (row && typeof row.path === "string") {
          const info = await probeFile(row.path, root);
          if (info) itemsProbe[row.path] = info;
        }
      }
    }
    const validated = validateProcessedPackage(raw, {
      allowedRoot: root,
      fileInfo: itemsProbe,
    });
    if (!validated.ok) {
      return {
        ok: false,
        kind: "invalid",
        message: validated.errors
          .slice(0, 8)
          .map((e) => e.message)
          .join("\n"),
      };
    }
    return { ok: true, pkg: validated.package, path };
  } catch (e: any) {
    return {
      ok: false,
      kind: "error",
      message: e?.message || String(e),
    };
  }
}

async function planRow(
  libraryID: number,
  row: PackageItem,
): Promise<ImportRowPlan> {
  try {
    const existing = await findItemByIdempotency(libraryID, row.idempotencyKey);
    if (!existing) {
      return { kp: row.kp, action: "create" };
    }
    const extra = (existing.getField("extra") as string) || "";
    const status = parseExtraField(extra, IMPORT_STATUS_KEY);
    const matches = await attachmentMatchesPackage(existing, row);
    const action = planImportAction({
      hasExisting: true,
      importStatus: status,
      attachmentMatches: matches,
    });
    let detail: string | undefined;
    if (action === "repair") {
      if (!matches) detail = "attachment mismatch or missing";
      else if (status !== "complete") detail = `status=${status || "unset"}`;
    }
    return { kp: row.kp, action, detail };
  } catch (e: any) {
    return {
      kp: row.kp,
      action: "fail",
      detail: e?.message || String(e),
    };
  }
}

async function previewProcessedPdfPackage(): Promise<void> {
  const root = getRootPath();
  if (!root) {
    alertDialog(getString("status-no-root"));
    return;
  }
  if (!(await IOUtils.exists(root))) {
    alertDialog(getString("status-root-missing", { args: { path: root } }));
    return;
  }
  const loaded = await loadValidatedPackage(root);
  if (!loaded.ok) {
    if (loaded.kind === "missing") {
      alertDialog(getString("package-missing", { args: { path: loaded.message } }));
    } else if (loaded.kind === "invalid") {
      alertDialog(getString("package-invalid") + "\n" + loaded.message);
    } else {
      alertDialog(
        getString("status-error", { args: { message: loaded.message } }),
      );
    }
    return;
  }
  const libraryID = (Zotero.Libraries as any).userLibraryID as number;
  const plans: ImportRowPlan[] = [];
  for (const row of loaded.pkg.items) {
    plans.push(await planRow(libraryID, row));
  }
  const counts = countImportPlans(plans);
  const body = formatImportPlanLines(plans, { maxRows: 20 }).slice(1);
  alertDialog(
    [
      getString("package-preview-title"),
      getString("package-preview-summary", {
        args: {
          create: counts.create,
          repair: counts.repair,
          skip: counts.skip,
          fail: counts.fail,
          total: counts.total,
        },
      }),
      ...body,
    ].join("\n"),
  );
}

async function importProcessedPdfPackage(): Promise<void> {
  const root = getRootPath();
  if (!root) {
    alertDialog(getString("status-no-root"));
    return;
  }
  if (!(await IOUtils.exists(root))) {
    alertDialog(getString("status-root-missing", { args: { path: root } }));
    return;
  }
  const loaded = await loadValidatedPackage(root);
  if (!loaded.ok) {
    if (loaded.kind === "missing") {
      alertDialog(getString("package-missing", { args: { path: loaded.message } }));
    } else if (loaded.kind === "invalid") {
      alertDialog(getString("package-invalid") + "\n" + loaded.message);
    } else {
      alertDialog(
        getString("status-error", { args: { message: loaded.message } }),
      );
    }
    return;
  }
  const libraryID = (Zotero.Libraries as any).userLibraryID as number;
  const results: ImportRowPlan[] = [];
  for (const row of loaded.pkg.items) {
    try {
      const result = await createOrUpdateItem(libraryID, row);
      if (result === "skipped") {
        results.push({ kp: row.kp, action: "skip" });
      } else if (result === "repaired") {
        results.push({ kp: row.kp, action: "repair" });
      } else {
        results.push({ kp: row.kp, action: "create" });
      }
    } catch (e: any) {
      ztoolkit.log("import item failed", row.kp, e);
      results.push({
        kp: row.kp,
        action: "fail",
        detail: e?.message || String(e),
      });
    }
  }
  const created = results.filter((r) => r.action === "create").length;
  const repaired = results.filter((r) => r.action === "repair").length;
  const skipped = results.filter((r) => r.action === "skip").length;
  const failed = results.filter((r) => r.action === "fail").length;
  const reportBody = formatImportResultLines(results, { maxFailRows: 15 }).slice(
    1,
  );
  alertDialog(
    [
      getString("package-done", {
        args: {
          created: created + repaired,
          skipped,
          failed,
          total: results.length,
        },
      }),
      getString("package-done-detail", {
        args: { created, repaired, skipped, failed },
      }),
      ...reportBody,
    ].join("\n"),
  );
}
