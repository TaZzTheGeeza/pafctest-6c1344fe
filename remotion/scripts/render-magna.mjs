import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Mirror of SCENES from MainVideoMagna.tsx — keep in sync
const SCENES = [
  { audio: "ma-01.mp3", dur: 135 },
  { audio: "ma-02.mp3", dur: 195 },
  { audio: "ma-03.mp3", dur: 255 },
  { audio: "ma-04.mp3", dur: 240 },
  { audio: "ma-05.mp3", dur: 225 },
  { audio: "ma-06.mp3", dur: 220 },
  { audio: "ma-07.mp3", dur: 220 },
  { audio: "ma-08.mp3", dur: 230 },
  { audio: "ma-09.mp3", dur: 255 },
  { audio: "ma-10.mp3", dur: 225 },
  { audio: "ma-11.mp3", dur: 225 },
  { audio: "ma-12.mp3", dur: 230 },
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
  id: "magna-overview",
  puppeteerInstance: browser,
});

console.log(`Rendering ${composition.durationInFrames} frames (${(composition.durationInFrames/FPS).toFixed(1)}s)...`);
const mutedOutput = "/tmp/magna2-muted.mp4";
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

// Compute sequential audio offsets — each VO starts at its scene's start frame + small lead-in
let pos = 0;
const starts = [];
for (const s of SCENES) {
  starts.push((pos + 6) / FPS); // 0.2s lead-in within the scene
  pos += s.dur;
}

const inputs = SCENES.map((s) => `-i "${path.join(audioDir, s.audio)}"`).join(" ");
let filters = SCENES.map((s, i) => {
  const ms = Math.round(starts[i] * 1000);
  return `[${i + 1}:a]adelay=${ms}|${ms},volume=1.0[a${i}]`;
}).join("; ");
filters += `; ${SCENES.map((_, i) => `[a${i}]`).join("")}amix=inputs=${SCENES.length}:dropout_transition=0:normalize=0[aout]`;

const finalOutput = "/mnt/documents/magna-alliance-overview.mp4";
const cmd = `ffmpeg -y -i "${mutedOutput}" ${inputs} -filter_complex "${filters}" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest "${finalOutput}"`;
console.log("Merging audio...");
execSync(cmd, { stdio: "inherit", timeout: 240_000 });
console.log(`Done: ${finalOutput} (${(fs.statSync(finalOutput).size/1024/1024).toFixed(1)} MB)`);
