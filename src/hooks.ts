// @ajan: cursor · @etiket: katman-1, kopru, b0, hooks
import { config, homepage } from "../package.json";
import { getString, initLocale } from "./utils/locale";
import { initItemMenu } from "./modules/menu";

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
  await onMainWindowLoad(window);
}

async function onMainWindowLoad(win: Window): Promise<void> {
  initItemMenu(win);
}

async function onMainWindowUnload(_win: Window): Promise<void> {
  ztoolkit.unregisterAll();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  addon.data.alive = false;
  // @ts-ignore
  delete Zotero[config.addonInstance];
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
};
