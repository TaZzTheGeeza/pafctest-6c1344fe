import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SCENES = [
  { audio: "yc-01.mp3", dur: 114 },
  { audio: "yc-02.mp3", dur: 198 },
  { audio: "yc-03.mp3", dur: 207 },
  { audio: "yc-04.mp3", dur: 1041 },
  { audio: "yc-05.mp3", dur: 966 },
  { audio: "yc-06.mp3", dur: 198 },
  { audio: "yc-07.mp3", dur: 192 },
  { audio: "yc-08.mp3", dur: 171 },
  { audio: "yc-09.mp3", dur: 174 },
  { audio: "yc-10.mp3", dur: 195 },
  { audio: "yc-11.mp3", dur: 156 },
  { audio: "yc-12.mp3", dur: 156 },
  { audio: "yc-13.mp3", dur: 240 },
];
const FPS = 30;
const audioDir = path.join(ROOT, "public/audio");

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.resolve(ROOT, "src/index.ts"),
  webpackOverride: (c) => c,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "your-club-overview",
  puppeteerInstance: browser,
});

console.log(`Rendering ${composition.durationInFrames} frames (${(composition.durationInFrames/FPS).toFixed(1)}s)...`);
const mutedOutput = "/tmp/yc-muted.mp4";
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: mutedOutput,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 2,
});
await browser.close({ silent: false });

let pos = 0;
const starts = [];
for (const s of SCENES) {
  starts.push((pos + 6) / FPS);
  pos += s.dur;
}

const inputs = SCENES.map((s) => `-i "${path.join(audioDir, s.audio)}"`).join(" ");
let filters = SCENES.map((s, i) => {
  const ms = Math.round(starts[i] * 1000);
  return `[${i + 1}:a]adelay=${ms}|${ms},volume=1.0[a${i}]`;
}).join("; ");
filters += `; ${SCENES.map((_, i) => `[a${i}]`).join("")}amix=inputs=${SCENES.length}:dropout_transition=0:normalize=0[aout]`;

const finalOutput = "/mnt/documents/your-club-overview.mp4";
const cmd = `ffmpeg -y -i "${mutedOutput}" ${inputs} -filter_complex "${filters}" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest "${finalOutput}"`;
console.log("Merging audio...");
execSync(cmd, { stdio: "inherit", timeout: 240_000 });
console.log(`Done: ${finalOutput} (${(fs.statSync(finalOutput).size/1024/1024).toFixed(1)} MB)`);
