// @ajan: cursor · @etiket: katman-1, kopru, item-pane, kp, a4-fields, native
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { normalizeKutuphaneRoot } from "../utils/kutuphaneRoot";
import {
  parseKpRegistryJson,
  resolveItemKp,
} from "../utils/kpRegistry";
import {
  buildItemPaneDisplayRows,
  lookupRegistryKpMeta,
  mergeCategory,
  readExtraPaneFields,
} from "../utils/itemPaneFields";

export { registerKpItemPaneSection, unregisterKpItemPaneSection };

const CITATION_KEY_LINE = /^Citation Key:\s*(.+)$/im;

let registeredId: string | false | undefined;

function citationKeyFromItem(item: Zotero.Item): string | null {
  const extra = (item.getField("extra") as string) || "";
  const m = extra.match(CITATION_KEY_LINE);
  return m ? m[1].trim() : null;
}

function getRootPath(): string {
  return normalizeKutuphaneRoot(getPref("kutuphaneRoot"));
}

async function loadRegistryRaw(root: string): Promise<unknown | null> {
  if (!root) return null;
  const path = PathUtils.join(root, "kp_registry.json");
  try {
    if (!(await IOUtils.exists(path))) return null;
    return await IOUtils.readJSON(path);
  } catch {
    return null;
  }
}

function labelForRowKey(key: string): string {
  switch (key) {
    case "kp":
      return getString("pane-kp-label");
    case "source":
      return getString("pane-kp-source");
    case "registry":
      return getString("pane-kp-registry");
    case "import-status":
      return getString("pane-kp-import-status");
    case "category":
      return getString("pane-kp-category");
    case "sha256":
      return getString("pane-kp-sha");
    default:
      return key;
  }
}

function fillBody(
  body: HTMLElement,
  rows: Array<{ key: string; value: string }>,
): void {
  body.replaceChildren();
  body.style.display = "flex";
  body.style.flexDirection = "column";
  body.style.gap = "4px";
  body.style.padding = "4px 0";
  for (const row of rows) {
    const line = body.ownerDocument.createElement("div");
    line.style.fontSize = "12px";
    line.style.lineHeight = "1.35";
    const lab = body.ownerDocument.createElement("span");
    lab.textContent = `${labelForRowKey(row.key)}: `;
    lab.style.opacity = "0.7";
    const val = body.ownerDocument.createElement("span");
    val.textContent = row.value;
    val.style.fontWeight = "600";
    line.append(lab, val);
    body.append(line);
  }
}

function sourceLabel(
  source: "citation-key" | "title-or-extra" | null,
): string {
  if (!source) return "—";
  return getString(`pane-kp-source-${source}`);
}

function syncRows(item: Zotero.Item) {
  const title =
    item.getDisplayTitle?.() || (item.getField("title") as string) || "";
  const extra = (item.getField("extra") as string) || "";
  const resolved = resolveItemKp({
    citationKey: citationKeyFromItem(item),
    title,
    extra,
  });
  const fields = readExtraPaneFields(extra);
  return buildItemPaneDisplayRows({
    kp: resolved.kp,
    kpNone: getString("pane-kp-none"),
    sourceLabel: sourceLabel(resolved.source),
    registryLabel: getString("pane-kp-registry-pending"),
    importStatus: fields.importStatus,
    importNone: getString("pane-kp-import-none"),
    category: fields.category,
    categoryNone: getString("pane-kp-category-none"),
    sha256: fields.sha256,
    shaNone: getString("pane-kp-sha-none"),
  });
}

function registerKpItemPaneSection(): void {
  if (registeredId) return;
  const icon = `chrome://${config.addonRef}/content/icons/favicon.png`;
  registeredId = Zotero.ItemPaneManager.registerSection({
    paneID: "kutuphane-kp",
    pluginID: config.addonID,
    header: {
      l10nID: `${config.addonRef}-pane-kp-header`,
      icon,
    },
    sidenav: {
      l10nID: `${config.addonRef}-pane-kp-sidenav`,
      icon,
    },
    onItemChange: ({ item, setEnabled }) => {
      setEnabled(!!item && item.isRegularItem());
      return true;
    },
    onRender: ({ body, item }) => {
      if (!item || !item.isRegularItem()) {
        fillBody(body, [
          { key: "kp", value: getString("pane-kp-none") },
        ]);
        return;
      }
      fillBody(body, syncRows(item));
    },
    onAsyncRender: async ({ body, item }) => {
      if (!item || !item.isRegularItem()) return;
      const title =
        item.getDisplayTitle?.() || (item.getField("title") as string) || "";
      const extra = (item.getField("extra") as string) || "";
      const resolved = resolveItemKp({
        citationKey: citationKeyFromItem(item),
        title,
        extra,
      });
      const fields = readExtraPaneFields(extra);
      const root = getRootPath();
      let registryLabel = getString("pane-kp-registry-no-root");
      let registryCategory: string | null = null;
      if (root) {
        const raw = await loadRegistryRaw(root);
        if (!raw) {
          registryLabel = getString("pane-kp-registry-missing");
        } else {
          const occupied = parseKpRegistryJson(raw).occupiedKeys;
          if (!resolved.kp) {
            registryLabel = getString("pane-kp-registry-na");
          } else if (occupied.has(resolved.kp)) {
            registryLabel = getString("pane-kp-registry-yes");
          } else {
            registryLabel = getString("pane-kp-registry-no");
          }
          registryCategory = lookupRegistryKpMeta(raw, resolved.kp).category;
        }
      }
      fillBody(
        body,
        buildItemPaneDisplayRows({
          kp: resolved.kp,
          kpNone: getString("pane-kp-none"),
          sourceLabel: sourceLabel(resolved.source),
          registryLabel,
          importStatus: fields.importStatus,
          importNone: getString("pane-kp-import-none"),
          category: mergeCategory(fields.category, registryCategory),
          categoryNone: getString("pane-kp-category-none"),
          sha256: fields.sha256,
          shaNone: getString("pane-kp-sha-none"),
        }),
      );
    },
  });
}

function unregisterKpItemPaneSection(): void {
  if (!registeredId) return;
  Zotero.ItemPaneManager.unregisterSection(registeredId);
  registeredId = undefined;
}
