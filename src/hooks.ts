// @ajan: cursor · @etiket: katman-1, kopru, b0, hooks, multi-window, item-pane
import { config, homepage } from "../package.json";
import { getString, initLocale } from "./utils/locale";
import { initItemMenu } from "./modules/menu";
import {
  registerKpItemPaneSection,
  unregisterKpItemPaneSection,
} from "./modules/itemPaneKp";

/** Window-identity lifecycle — unregisterAll only when last tracked window closes. */
const loadedWindows = new Set<Window>();
let processMenusRegistered = false;
let itemPaneRegistered = false;

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();
  Zotero.PreferencePanes.register({
    pluginID: config.addonID,
    src: rootURI + "content/preferences.xhtml",
    label: getString("prefs-title"),
    helpURL: homepage,
    image: `chrome://${config.addonRef}/content/icons/favicon.png`,
  });
  if (!itemPaneRegistered) {
    registerKpItemPaneSection();
    itemPaneRegistered = true;
  }
  await onMainWindowLoad(window);
}

async function onMainWindowLoad(win: Window): Promise<void> {
  if (loadedWindows.has(win)) return;
  loadedWindows.add(win);
  if (!processMenusRegistered) {
    initItemMenu(win);
    processMenusRegistered = true;
  }
}

async function onMainWindowUnload(win: Window): Promise<void> {
  loadedWindows.delete(win);
  if (loadedWindows.size === 0) {
    ztoolkit.unregisterAll();
    processMenusRegistered = false;
  }
}

function onShutdown(): void {
  unregisterKpItemPaneSection();
  itemPaneRegistered = false;
  ztoolkit.unregisterAll();
  processMenusRegistered = false;
  loadedWindows.clear();
  addon.data.alive = false;
  // @ts-ignore
  delete Zotero[config.addonInstance];
}

/** Test helper — current tracked main-window count. */
export function trackedMainWindowCount(): number {
  return loadedWindows.size;
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
};
