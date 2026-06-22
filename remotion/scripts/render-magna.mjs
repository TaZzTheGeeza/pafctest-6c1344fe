import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
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

console.log(`Rendering ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)}s)...`);

const mutedOutput = "/tmp/magna-muted.mp4";
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

const SCENES = [
  { dur: 132, audio: "ma-01.mp3" },
  { dur: 411, audio: "ma-02.mp3" },
  { dur: 378, audio: "ma-03.mp3" },
  { dur: 399, audio: "ma-04.mp3" },
  { dur: 393, audio: "ma-05.mp3" },
  { dur: 363, audio: "ma-06.mp3" },
  { dur: 384, audio: "ma-07.mp3" },
  { dur: 288, audio: "ma-08.mp3" },
  { dur: 318, audio: "ma-09.mp3" },
  { dur: 309, audio: "ma-10.mp3" },
  { dur: 285, audio: "ma-11.mp3" },
  { dur: 303, audio: "ma-12.mp3" },
  { dur: 225, audio: "ma-13.mp3" },
  { dur: 186, audio: "ma-14.mp3" },
];

const fps = 30;
const audioDir = path.resolve(__dirname, "../public/audio");

let pos = 0;
const starts = [];
for (let i = 0; i < SCENES.length; i++) {
  starts.push(pos / fps);
  pos += SCENES[i].dur;
}

const inputs = SCENES.map((s) => `-i "${path.join(audioDir, s.audio)}"`).join(" ");
let filters = SCENES.map((s, i) => {
  const delayMs = Math.round(starts[i] * 1000);
  return `[${i}:a]adelay=${delayMs}|${delayMs}[a${i}]`;
}).join("; ");
const mixInputs = SCENES.map((_, i) => `[a${i}]`).join("");
filters += `; ${mixInputs}amix=inputs=${SCENES.length}:dropout_transition=0:normalize=0[aout]`;

const finalOutput = "/mnt/documents/magna-alliance-overview.mp4";
const cmd = `ffmpeg -y -i "${mutedOutput}" ${inputs} -filter_complex "${filters}" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest "${finalOutput}"`;

console.log("Merging audio...");
execSync(cmd, { stdio: "inherit", timeout: 180_000 });

const stat = fs.statSync(finalOutput);
console.log(`Done! ${finalOutput} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
