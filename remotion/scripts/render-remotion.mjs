import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
  openBrowser,
} from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

console.log("Opening browser...");
const browser = await openBrowser("chrome", {
  browserExecutable:
    process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

console.log("Selecting composition...");
const composition = await selectComposition({
  serveUrl: bundled,
  id: "main",
  puppeteerInstance: browser,
});

console.log(`Rendering ${composition.durationInFrames} frames (muted)...`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: "/tmp/pafc-video-noaudio.mp4",
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
});

console.log("Done rendering! Closing browser...");
await browser.close({ silent: false });

// Now merge audio using system ffmpeg
console.log("Merging voiceover audio tracks...");
const audioDir = path.resolve(__dirname, "../public/audio");
const fps = 30;
const TRANS_DUR = 20;

// Calculate start times in seconds
const scenes = [
  { file: "01-intro.mp3", startFrame: 0 },
  { file: "02-teams.mp3", startFrame: 383 - TRANS_DUR },
  { file: "03-tournament.mp3", startFrame: 383 + 345 - 2 * TRANS_DUR },
  { file: "04-shop.mp3", startFrame: 383 + 345 + 357 - 3 * TRANS_DUR },
  { file: "05-pafctv.mp3", startFrame: 383 + 345 + 357 + 307 - 4 * TRANS_DUR },
  { file: "06-raffle.mp3", startFrame: 383 + 345 + 357 + 307 + 344 - 5 * TRANS_DUR },
  { file: "07-contact.mp3", startFrame: 383 + 345 + 357 + 307 + 344 + 321 - 6 * TRANS_DUR },
  { file: "08-outro.mp3", startFrame: 383 + 345 + 357 + 307 + 344 + 321 + 257 - 7 * TRANS_DUR },
];

// Build ffmpeg filter to mix all audio at correct timestamps
const inputs = scenes.map((s) => `-i ${audioDir}/${s.file}`).join(" ");
const delays = scenes.map((s, i) => {
  const delayMs = Math.round((s.startFrame / fps) * 1000);
  return `[${i}]adelay=${delayMs}|${delayMs}[a${i}]`;
}).join(";");
const mixInputs = scenes.map((_, i) => `[a${i}]`).join("");

const filterComplex = `${delays};${mixInputs}amix=inputs=${scenes.length}:duration=longest:normalize=0`;

const cmd = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -ac 2 -ar 44100 /tmp/pafc-merged-audio.aac`;
console.log("Running audio merge...");
execSync(cmd, { stdio: "inherit" });

// Combine video + audio
console.log("Combining video and audio...");
execSync(
  `ffmpeg -y -i /tmp/pafc-video-noaudio.mp4 -i /tmp/pafc-merged-audio.aac -c:v copy -c:a aac -shortest /mnt/documents/pafc-website-tour.mp4`,
  { stdio: "inherit" }
);

console.log("✅ Video saved to /mnt/documents/pafc-website-tour.mp4");
