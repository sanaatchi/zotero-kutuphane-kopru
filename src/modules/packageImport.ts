// @ajan: cursor · @etiket: katman-1, kopru, b3, package-import, handoff, hash-verify
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import {
  IDEMP_KEY,
  IMPORT_STATUS_KEY,
  escapeLikeExact,
  parseExtraField,
  validateProcessedPackage,
  type PackageItem,
} from "../utils/processedPackage";

export { importProcessedPdfPackage };

function alertDialog(message: string) {
  ztoolkit.getGlobal("alert")(message);
}

function getRootPath(): string {
  const v = getPref("kutuphaneRoot");
  return typeof v === "string" ? v.trim() : "";
}

function upsertExtraLine(extra: string, key: string, value: string): string {
  const re = new RegExp(`^${key}:\\s*.+$`, "im");
  const line = `${key}: ${value}`;
  if (re.test(extra)) return extra.replace(re, line);
  return (extra ? extra.replace(/\s*$/, "\n") : "") + line + "\n";
}

async function sha256Hex(path: string): Promise<string> {
  const bytes = await IOUtils.read(path);
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function probeFile(
  path: string,
): Promise<{ size: number; sha256: string; isFile: boolean } | null> {
  try {
    if (!(await IOUtils.exists(path))) return null;
    const stat = await IOUtils.stat(path);
    if ((stat as any).type && (stat as any).type !== "regular") return null;
    const sha256 = await sha256Hex(path);
    return { size: Number(stat.size), sha256, isFile: true };
  } catch {
    return null;
  }
}

/** Mevcut ek paket SHA-256 / size ile uyuşuyor mu? */
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
    const info = await probeFile(path);
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
    // Incomplete / failed / wrong-or-missing attachment → repair.
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
      repairedExtra = upsertExtraLine(repairedExtra, "Kutuphane-SHA256", row.sha256);
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
  extra = upsertExtraLine(extra, "Kutuphane-SHA256", row.sha256);
  // Pending until attachment succeeds — retry can repair.
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

async function importProcessedPdfPackage(): Promise<void> {
  const root = getRootPath();
  if (!root) {
    alertDialog(getString("status-no-root"));
    return;
  }
  const path = PathUtils.join(root, "zotero_handoff", "processed_pdf_package.json");
  try {
    if (!(await IOUtils.exists(path))) {
      alertDialog(getString("package-missing", { args: { path } }));
      return;
    }
    const raw = await IOUtils.readJSON(path);
    const itemsProbe: Record<
      string,
      { size: number; sha256: string; isFile: boolean }
    > = {};
    if (raw && typeof raw === "object" && Array.isArray((raw as any).items)) {
      for (const row of (raw as any).items) {
        if (row && typeof row.path === "string") {
          const info = await probeFile(row.path);
          if (info) itemsProbe[row.path] = info;
        }
      }
    }
    const validated = validateProcessedPackage(raw, {
      allowedRoot: root,
      fileInfo: itemsProbe,
    });
    if (!validated.ok) {
      alertDialog(
        getString("package-invalid") +
          "\n" +
          validated.errors
            .slice(0, 5)
            .map((e) => e.message)
            .join("\n"),
      );
      return;
    }
    const libraryID = (Zotero.Libraries as any).userLibraryID as number;
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let repaired = 0;
    for (const row of validated.package.items) {
      try {
        const result = await createOrUpdateItem(libraryID, row);
        if (result === "skipped") skipped += 1;
        else if (result === "repaired") repaired += 1;
        else created += 1;
      } catch (e) {
        ztoolkit.log("import item failed", row.kp, e);
        failed += 1;
      }
    }
    alertDialog(
      getString("package-done", {
        args: {
          created: created + repaired,
          skipped,
          failed,
          total: validated.package.items.length,
        },
      }),
    );
  } catch (e: any) {
    alertDialog(
      getString("status-error", {
        args: { message: e?.message || String(e) },
      }),
    );
  }
}
