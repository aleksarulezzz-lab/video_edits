// Render all Reels with one bundle: node render_reels.mjs 1 2 3 ...
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const n of process.argv.slice(2)) {
  const composition = await selectComposition({ serveUrl, id: `Reel${n}`, browserExecutable });
  await renderMedia({ composition, serveUrl, browserExecutable, codec: "h264", crf: 16, concurrency: 3, imageFormat: "jpeg", jpegQuality: 92, outputLocation: `out/reels/reel_${n}.mp4` });
  console.log("done", n);
}
