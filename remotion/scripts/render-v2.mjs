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

console.log("Opening browser...");
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

const compositionId = process.argv[2] || "sales-pitch";
console.log(`Selecting composition: ${compositionId}`);
const composition = await selectComposition({
  serveUrl: bundled,
  id: compositionId,
  puppeteerInstance: browser,
});

console.log(`Rendering ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)}s)...`);

const mutedOutput = "/tmp/video-muted.mp4";
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: mutedOutput,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
});

await browser.close({ silent: false });

// Now merge audio tracks
console.log("Merging audio...");

const SCENES = [
  { dur: 446, audio: "01-intro.mp3" },
  { dur: 331, audio: "02-hub-overview.mp3" },
  { dur: 490, audio: "03-hub-chat.mp3" },
  { dur: 458, audio: "04-hub-availability.mp3" },
  { dur: 537, audio: "05-hub-payments.mp3" },
  { dur: 536, audio: "06-hub-meetings.mp3" },
  { dur: 478, audio: "07-hub-extras.mp3" },
  { dur: 354, audio: "08-tournament-intro.mp3" },
  { dur: 548, audio: "09-tournament-detail.mp3" },
  { dur: 510, audio: "10-tournament-admin.mp3" },
  { dur: 515, audio: "11-dashboard.mp3" },
  { dur: 483, audio: "12-sales-pitch.mp3" },
  { dur: 375, audio: "13-outro.mp3" },
];

const T = 20;
const fps = 30;
const audioDir = path.resolve(__dirname, "../public/audio");

// Build ffmpeg filter for concatenating audio with gaps
let filterParts = [];
let concatInputs = "";
let inputIdx = 0;

// Calculate start times in seconds
let pos = 0;
const starts = [];
for (let i = 0; i < SCENES.length; i++) {
  starts.push(pos / fps);
  if (i > 0) pos += SCENES[i - 1].dur - T;
  else pos = SCENES[0].dur - T;
}
// Recalculate properly
starts.length = 0;
pos = 0;
for (let i = 0; i < SCENES.length; i++) {
  starts.push(pos / fps);
  pos += SCENES[i].dur - T;
}

// Build inputs
let inputs = SCENES.map((s, i) => `-i "${path.join(audioDir, s.audio)}"`).join(" ");

// Build filter with adelay
let filters = SCENES.map((s, i) => {
  const delayMs = Math.round(starts[i] * 1000);
  return `[${i}:a]adelay=${delayMs}|${delayMs}[a${i}]`;
}).join("; ");

const mixInputs = SCENES.map((_, i) => `[a${i}]`).join("");
filters += `; ${mixInputs}amix=inputs=${SCENES.length}:dropout_transition=0:normalize=0[aout]`;

const finalOutput = "/mnt/documents/pafc-sales-pitch.mp4";
const cmd = `ffmpeg -y -i "${mutedOutput}" ${inputs} -filter_complex "${filters}" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest "${finalOutput}"`;

console.log("Running ffmpeg merge...");
execSync(cmd, { stdio: "inherit", timeout: 120_000 });

const stat = fs.statSync(finalOutput);
console.log(`Done! Output: ${finalOutput} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
