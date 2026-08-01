// @ajan: cursor · @etiket: katman-1, kopru, item-pane, kp, native
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { normalizeKutuphaneRoot } from "../utils/kutuphaneRoot";
import {
  parseKpRegistryJson,
  resolveItemKp,
} from "../utils/kpRegistry";

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

async function registryOccupied(root: string): Promise<Set<string> | null> {
  if (!root) return null;
  const path = PathUtils.join(root, "kp_registry.json");
  try {
    if (!(await IOUtils.exists(path))) return null;
    const raw = await IOUtils.readJSON(path);
    return parseKpRegistryJson(raw).occupiedKeys;
  } catch {
    return null;
  }
}

function fillBody(
  body: HTMLElement,
  lines: Array<{ label: string; value: string }>,
): void {
  body.replaceChildren();
  body.style.display = "flex";
  body.style.flexDirection = "column";
  body.style.gap = "4px";
  body.style.padding = "4px 0";
  for (const row of lines) {
    const line = body.ownerDocument.createElement("div");
    line.style.fontSize = "12px";
    line.style.lineHeight = "1.35";
    const lab = body.ownerDocument.createElement("span");
    lab.textContent = `${row.label}: `;
    lab.style.opacity = "0.7";
    const val = body.ownerDocument.createElement("span");
    val.textContent = row.value;
    val.style.fontWeight = "600";
    line.append(lab, val);
    body.append(line);
  }
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
          {
            label: getString("pane-kp-label"),
            value: getString("pane-kp-none"),
          },
        ]);
        return;
      }
      const title =
        item.getDisplayTitle?.() || (item.getField("title") as string) || "";
      const extra = (item.getField("extra") as string) || "";
      const resolved = resolveItemKp({
        citationKey: citationKeyFromItem(item),
        title,
        extra,
      });
      fillBody(body, [
        {
          label: getString("pane-kp-label"),
          value: resolved.kp || getString("pane-kp-none"),
        },
        {
          label: getString("pane-kp-source"),
          value: resolved.source
            ? getString(`pane-kp-source-${resolved.source}`)
            : "—",
        },
        {
          label: getString("pane-kp-registry"),
          value: getString("pane-kp-registry-pending"),
        },
      ]);
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
      const root = getRootPath();
      let registryLabel = getString("pane-kp-registry-no-root");
      if (root) {
        const occupied = await registryOccupied(root);
        if (!occupied) {
          registryLabel = getString("pane-kp-registry-missing");
        } else if (!resolved.kp) {
          registryLabel = getString("pane-kp-registry-na");
        } else if (occupied.has(resolved.kp)) {
          registryLabel = getString("pane-kp-registry-yes");
        } else {
          registryLabel = getString("pane-kp-registry-no");
        }
      }
      fillBody(body, [
        {
          label: getString("pane-kp-label"),
          value: resolved.kp || getString("pane-kp-none"),
        },
        {
          label: getString("pane-kp-source"),
          value: resolved.source
            ? getString(`pane-kp-source-${resolved.source}`)
            : "—",
        },
        {
          label: getString("pane-kp-registry"),
          value: registryLabel,
        },
      ]);
    },
  });
}

function unregisterKpItemPaneSection(): void {
  if (!registeredId) return;
  Zotero.ItemPaneManager.unregisterSection(registeredId);
  registeredId = undefined;
}
