// @ajan: cursor · @etiket: katman-1, kopru, b0, build
import { defineConfig } from "zotero-plugin-scaffold";
import pkg from "./package.json";

export default defineConfig({
  source: ["src", "addon"],
  dist: "build",
  name: pkg.config.addonName,
  id: pkg.config.addonID,
  namespace: pkg.config.addonRef,
  xpiName: pkg.name,
  updateURL: pkg.config.updateJSON,
  xpiDownloadLink: `https://github.com/sanaatchi/zotero-kutuphane-kopru-releases/releases/download/v{{version}}/{{xpiName}}.xpi`,
  build: {
    assets: ["addon/**/*.*"],
    define: {
      ...pkg.config,
      author: pkg.author,
      description: pkg.description,
      homepage: "https://github.com/sanaatchi/zotero-kutuphane-kopru-releases",
      buildVersion: pkg.version,
      buildTime: "{{buildTime}}",
    },
    esbuildOptions: [
      {
        entryPoints: ["src/index.ts"],
        define: {
          __env__: `"${process.env.NODE_ENV}"`,
        },
        bundle: true,
        target: "firefox115",
        outfile: `build/addon/content/scripts/${pkg.config.addonRef}.js`,
      },
    ],
    makeUpdateJson: {
      hash: true,
    },
  },
});
