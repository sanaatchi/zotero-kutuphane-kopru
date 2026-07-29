// @ajan: cursor · @etiket: katman-1, kopru, ztoolkit
import {
  BasicTool,
  UITool,
  MenuManager,
  ProgressWindowHelper,
  unregister,
} from "zotero-plugin-toolkit";
import { config } from "../../package.json";

export { createZToolkit };

function createZToolkit() {
  const _ztoolkit = new MyToolkit();
  _ztoolkit.basicOptions.log.prefix = `[${config.addonName}]`;
  _ztoolkit.basicOptions.log.disableConsole = __env__ === "production";
  _ztoolkit.basicOptions.api.pluginID = config.addonID;
  _ztoolkit.ProgressWindow.setIconURI(
    "default",
    `chrome://${config.addonRef}/content/icons/favicon.png`,
  );
  return _ztoolkit;
}

class MyToolkit extends BasicTool {
  UI: UITool;
  Menu: MenuManager;
  ProgressWindow: typeof ProgressWindowHelper;

  constructor() {
    super();
    this.UI = new UITool(this);
    this.Menu = new MenuManager(this);
    this.ProgressWindow = ProgressWindowHelper;
  }

  unregisterAll() {
    unregister(this);
  }
}
