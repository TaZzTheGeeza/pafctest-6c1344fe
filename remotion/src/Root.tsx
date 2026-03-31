import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// Scene durations based on audio lengths (at 30fps) + padding
// 01-intro: 11.75s = 353f + 30f pad = 383
// 02-teams: 10.50s = 315f + 30f pad = 345
// 03-tournament: 10.91s = 327f + 30f pad = 357
// 04-shop: 9.24s = 277f + 30f pad = 307
// 05-pafctv: 10.45s = 314f + 30f pad = 344
// 06-raffle: 9.71s = 291f + 30f pad = 321
// 07-contact: 7.89s = 237f + 20f pad = 257
// 08-outro: 8.64s = 259f + 30f pad = 289
// Total: 2603 frames, minus transitions (7 * 20f = 140) = ~2463
// Add 60f intro black + 60f outro = ~2583

export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={2700}
    fps={30}
    width={1920}
    height={1080}
  />
);
