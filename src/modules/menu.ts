// @ajan: cursor · @etiket: katman-1, kopru, b0, b2, b3, a3-dry-run, a6-reverse-sync, menu
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import {
  matchSelectedKps,
  showKutuphaneStatus,
  showPipelineSummary,
  showReverseSyncReport,
} from "./bridgeStatus";
import {
  importProcessedPdfPackage,
  previewProcessedPdfPackage,
} from "./packageImport";

export { initItemMenu };

function initItemMenu(_win: Window) {
  const rootIcon = `chrome://${config.addonRef}/content/icons/favicon.png`;

  ztoolkit.Menu.register("item", {
    tag: "menu",
    id: `${config.addonRef}-root-item-menu`,
    label: getString("menu-root"),
    icon: rootIcon,
    children: [
      {
        tag: "menuitem",
        label: getString("menu-match-kp"),
        commandListener: () => {
          void matchSelectedKps();
        },
      },
      {
        tag: "menuitem",
        label: getString("menu-reverse-sync"),
        commandListener: () => {
          void showReverseSyncReport();
        },
      },
    ],
  });

  ztoolkit.Menu.register("menuTools", {
    tag: "menu",
    id: `${config.addonRef}-root-tools-menu`,
    label: getString("menu-root"),
    icon: rootIcon,
    children: [
      {
        tag: "menuitem",
        label: getString("menu-status"),
        commandListener: () => {
          void showKutuphaneStatus();
        },
      },
      {
        tag: "menuitem",
        label: getString("menu-pipeline"),
        commandListener: () => {
          void showPipelineSummary();
        },
      },
      {
        tag: "menuitem",
        label: getString("menu-match-kp"),
        commandListener: () => {
          void matchSelectedKps();
        },
      },
      {
        tag: "menuitem",
        label: getString("menu-reverse-sync"),
        commandListener: () => {
          void showReverseSyncReport();
        },
      },
      {
        tag: "menuitem",
        label: getString("menu-preview-package"),
        commandListener: () => {
          void previewProcessedPdfPackage();
        },
      },
      {
        tag: "menuitem",
        label: getString("menu-import-package"),
        commandListener: () => {
          void importProcessedPdfPackage();
        },
      },
    ],
  });
}
