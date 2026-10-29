// Stills for several compositions with one bundle: node reel_stills.mjs out/dir Reel1:2,10,30 Reel2:5
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [outDir, ...specs] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const sp of specs) {
  const [id, ts] = sp.split(":");
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  for (const t of ts.split(",")) {
    await renderStill({ composition, serveUrl, browserExecutable, frame: Math.min(composition.durationInFrames - 1, Math.round(Number(t) * 25)),
      output: `${outDir}/${id}_${String(t).padStart(6, "0")}.jpg`, scale: 0.4, imageFormat: "jpeg" });
  }
  console.log("ok", id);
}
