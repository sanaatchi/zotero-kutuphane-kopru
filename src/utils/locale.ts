// @ajan: cursor · @etiket: katman-1, kopru, locale
import { config } from "../../package.json";

export { initLocale, getString };

function initLocale() {
  const l10n = new (
    typeof Localization === "undefined"
      ? ztoolkit.getGlobal("Localization")
      : Localization
  )([`${config.addonRef}-addon.ftl`], true);
  addon.data.locale = { current: l10n };
}

function getString(localString: string): string;
function getString(
  localeString: string,
  options: { args?: Record<string, unknown> },
): string;
function getString(...inputs: any[]) {
  const localeString = inputs[0] as string;
  const options = (inputs[1] || {}) as {
    args?: Record<string, unknown>;
  };
  const id = `${config.addonRef}-${localeString}`;
  const pattern = addon.data.locale?.current.formatMessagesSync([
    { id, args: options.args },
  ])[0];
  return pattern?.value || id;
}
