// @ajan: cursor · @etiket: katman-1, kopru, b3, package-validate, handoff
/** Pure ProcessedPdfPackage validation — no Zotero globals. */

import { MAX_LIBRARY_PDFS, normalizeKp } from "./kpRegistry";

export const PACKAGE_SCHEMA_VERSION = 1;
export const IDEMP_KEY = "Kutuphane-Idempotency";
export const IMPORT_STATUS_KEY = "Kutuphane-Import-Status";

export type AttachmentMode = "link" | "import";

export type PackageItem = {
  kp: string;
  path: string;
  sha256: string;
  size: number;
  title?: string;
  creators?: string[];
  year?: string;
  category?: string;
  attachmentMode: AttachmentMode;
  registryGeneration?: string;
  idempotencyKey: string;
};

export type ValidatedPackage = {
  schemaVersion: number;
  kutuphaneRoot: string;
  pipelineVersion: string;
  registryGeneration: string;
  itemCount: number;
  items: PackageItem[];
};

export type PackageValidationError = {
  code: string;
  message: string;
  index?: number;
};

export {
  validateProcessedPackage,
  isPathInsideRoot,
  expectedIdempotencyKey,
  escapeLikeExact,
  parseExtraField,
};

function isPathInsideRoot(filePath: string, root: string): boolean {
  const norm = (p: string) =>
    p.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  const f = norm(filePath);
  const r = norm(root);
  if (!r || !f) return false;
  return f === r || f.startsWith(r + "/");
}

function expectedIdempotencyKey(kp: string, sha256: string): string {
  return `${kp}:${sha256.toLowerCase()}`;
}

/** Escape `%` `_` `\` for SQLite LIKE with ESCAPE '\\'. */
function escapeLikeExact(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function parseExtraField(
  extra: string,
  key: string,
): string | null {
  const re = new RegExp(`^${key}:\\s*(.+)$`, "im");
  const m = extra.match(re);
  return m ? m[1].trim() : null;
}

function validateProcessedPackage(
  raw: unknown,
  opts: {
    allowedRoot: string;
    /** Map of absolute path → { size, sha256 } from filesystem probe. */
    fileInfo?: Record<string, { size: number; sha256: string; isFile: boolean }>;
  },
): { ok: true; package: ValidatedPackage } | { ok: false; errors: PackageValidationError[] } {
  const errors: PackageValidationError[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: [{ code: "root", message: "package root must be object" }] };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.schemaVersion !== PACKAGE_SCHEMA_VERSION) {
    errors.push({
      code: "schemaVersion",
      message: `unsupported schemaVersion=${String(obj.schemaVersion)}`,
    });
  }
  if (!Array.isArray(obj.items) || obj.items.length === 0) {
    errors.push({ code: "items", message: "items must be a non-empty array" });
  }
  const root =
    typeof obj.kutuphaneRoot === "string" && obj.kutuphaneRoot.trim()
      ? obj.kutuphaneRoot.trim()
      : opts.allowedRoot;
  const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  if (norm(root) !== norm(opts.allowedRoot)) {
    errors.push({
      code: "kutuphaneRoot",
      message: "package kutuphaneRoot outside pref root",
    });
  }
  if (typeof obj.itemCount === "number" && Array.isArray(obj.items) && obj.itemCount !== obj.items.length) {
    errors.push({
      code: "itemCount",
      message: `itemCount ${obj.itemCount} != items.length ${obj.items.length}`,
    });
  }
  if (errors.length) return { ok: false, errors };

  const itemsRaw = obj.items as unknown[];
  const seenKp = new Set<string>();
  const seenKey = new Set<string>();
  const items: PackageItem[] = [];

  itemsRaw.forEach((row, index) => {
    if (!row || typeof row !== "object") {
      errors.push({ code: "item", message: "item not object", index });
      return;
    }
    const r = row as Record<string, unknown>;
    const kp = normalizeKp(typeof r.kp === "string" ? r.kp : null);
    if (!kp) {
      errors.push({ code: "kp", message: `invalid or over-ceiling KP`, index });
      return;
    }
    if (seenKp.has(kp)) {
      errors.push({ code: "duplicateKp", message: `duplicate KP ${kp}`, index });
      return;
    }
    seenKp.add(kp);

    const path = typeof r.path === "string" ? r.path.trim() : "";
    if (!path) {
      errors.push({ code: "path", message: "missing path", index });
      return;
    }
    if (!isPathInsideRoot(path, opts.allowedRoot)) {
      errors.push({
        code: "pathTraversal",
        message: `path outside root: ${path}`,
        index,
      });
      return;
    }
    const sha =
      typeof r.sha256 === "string" ? r.sha256.trim().toLowerCase() : "";
    if (!/^[a-f0-9]{64}$/.test(sha)) {
      errors.push({ code: "sha256", message: "invalid sha256", index });
      return;
    }
    const size = typeof r.size === "number" && Number.isFinite(r.size) ? r.size : -1;
    if (size < 0) {
      errors.push({ code: "size", message: "invalid size", index });
      return;
    }
    const mode: AttachmentMode =
      r.attachmentMode === "import" ? "import" : "link";
    const idem =
      typeof r.idempotencyKey === "string" ? r.idempotencyKey.trim() : "";
    const expect = expectedIdempotencyKey(kp, sha);
    if (idem !== expect) {
      errors.push({
        code: "idempotencyKey",
        message: `idempotencyKey mismatch (expected ${expect})`,
        index,
      });
      return;
    }
    if (seenKey.has(idem)) {
      errors.push({
        code: "duplicateKey",
        message: `duplicate idempotencyKey`,
        index,
      });
      return;
    }
    seenKey.add(idem);

    if (opts.fileInfo) {
      const info = opts.fileInfo[path] || opts.fileInfo[path.replace(/\\/g, "/")];
      if (!info || !info.isFile) {
        errors.push({ code: "missingFile", message: `PDF missing: ${path}`, index });
        return;
      }
      if (info.size !== size) {
        errors.push({
          code: "sizeMismatch",
          message: `size mismatch for ${path}`,
          index,
        });
        return;
      }
      if (info.sha256.toLowerCase() !== sha) {
        errors.push({
          code: "hashMismatch",
          message: `sha256 mismatch for ${path}`,
          index,
        });
        return;
      }
    }

    // Ceiling already enforced by normalizeKp; keep explicit assert for clarity.
    const num = Number(kp.slice(2));
    if (num < 1 || num > MAX_LIBRARY_PDFS) {
      errors.push({ code: "kpCeiling", message: kp, index });
      return;
    }

    items.push({
      kp,
      path,
      sha256: sha,
      size,
      title: typeof r.title === "string" ? r.title : kp,
      creators: Array.isArray(r.creators)
        ? r.creators.filter((c): c is string => typeof c === "string")
        : [],
      year: typeof r.year === "string" ? r.year : "",
      category: typeof r.category === "string" ? r.category : "",
      attachmentMode: mode,
      registryGeneration:
        typeof r.registryGeneration === "string" ? r.registryGeneration : "",
      idempotencyKey: idem,
    });
  });

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    package: {
      schemaVersion: PACKAGE_SCHEMA_VERSION,
      kutuphaneRoot: root,
      pipelineVersion:
        typeof obj.pipelineVersion === "string" ? obj.pipelineVersion : "",
      registryGeneration:
        typeof obj.registryGeneration === "string"
          ? obj.registryGeneration
          : "",
      itemCount: items.length,
      items,
    },
  };
}
