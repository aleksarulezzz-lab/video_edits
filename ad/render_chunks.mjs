// Render frame ranges of Main with one bundle: node render_chunks.mjs 0-3999 12000-15848
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";

const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "Main", browserExecutable });
for (const r of process.argv.slice(2)) {
  const [a, b] = r.split("-").map(Number);
  await renderMedia({
    composition, serveUrl, browserExecutable, codec: "h264", audioCodec: "pcm-16", crf: 16, concurrency: 3,
    frameRange: [a, b], outputLocation: `out/chunk_${a}.mkv`, imageFormat: "jpeg", jpegQuality: 92,
    onProgress: ({ progress }) => { if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`${r} ${Math.round(progress * 100)}%\n`); },
  });
  console.log("done", r);
}
