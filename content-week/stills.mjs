// Render review stills at given output seconds: node stills.mjs out/stills 3.5 15 60 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [outDir, ...times] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "Main", browserExecutable });
for (const t of times) {
  await renderStill({
    composition, serveUrl, browserExecutable, frame: Math.round(Number(t) * 25),
    output: `${outDir}/s_${String(t).padStart(7, "0")}.jpg`, scale: 0.5, imageFormat: "jpeg",
  });
  console.log("still", t);
}
