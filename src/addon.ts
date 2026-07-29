// @ajan: cursor · @etiket: katman-1, kopru, b0, addon
import { config } from "../package.json";
import { createZToolkit } from "./utils/ztoolkit";
import hooks from "./hooks";

class Addon {
  public data: {
    alive: boolean;
    env: "development" | "production";
    config: typeof config;
    ztoolkit: ZToolkit;
    locale?: { current: any };
  };
  public hooks: typeof hooks;
  public api: Record<string, never>;

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      config,
      ztoolkit: createZToolkit(),
    };
    this.hooks = hooks;
    this.api = {};
  }
}

export default Addon;
