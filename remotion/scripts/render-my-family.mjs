import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const serveUrl = await bundle({
  entryPoint: path.resolve(here, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl,
  id: "my-family-explainer-v2",
  puppeteerInstance: browser,
});

await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: "/mnt/documents/my-family-explainer-v4-clean-voice.mp4",
  puppeteerInstance: browser,
  concurrency: 1,
  crf: 18,
});

await browser.close({ silent: false });