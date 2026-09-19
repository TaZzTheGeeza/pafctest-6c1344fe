import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: oswald } = loadOswald("normal", { weights: ["500", "700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const GOLD = "#c9a84c";
const PAPER = "#f5f1e8";
const MUTED = "#d8d4ca";
const FPS = 30;

// Every scene includes the full narration duration plus 1.5 seconds of breathing room.
const scenes = [410, 407, 299, 439, 363, 333, 345, 373];
export const HOMEWORK_PARENT_TOTAL = scenes.reduce((sum, value) => sum + value, 0);

type BaseSceneProps = {
  audio: string;
  kicker: string;
  title: string;
  body: string;
  number: string;
};

const Grain: React.FC = () => (
  <AbsoluteFill
    style={{
      opacity: 0.15,
      backgroundImage: `radial-gradient(circle at 2px 2px, ${GOLD} 1px, transparent 0)`,
      backgroundSize: "46px 46px",
    }}
  />
);

const TextBlock: React.FC<BaseSceneProps & { align?: "left" | "right" }> = ({
  kicker,
  title,
  body,
  number,
  align = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - 4, fps, durationInFrames: 30, config: { damping: 200 } });
  const left = align === "left" ? 108 : 1050;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 190,
        width: 755,
        color: PAPER,
        fontFamily: inter,
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 34}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, color: GOLD, fontFamily: oswald, fontSize: 25, fontWeight: 700 }}>
        <span style={{ width: 52, height: 52, border: `1px solid ${GOLD}`, display: "grid", placeItems: "center" }}>{number}</span>
        <span>{kicker.toUpperCase()}</span>
      </div>
      <div style={{ fontFamily: oswald, fontSize: 78, fontWeight: 700, lineHeight: 1.02, textTransform: "uppercase", marginTop: 28 }}>{title}</div>
      <div style={{ width: 112 * reveal, height: 7, backgroundColor: GOLD, margin: "28px 0" }} />
      <div style={{ color: MUTED, fontSize: 30, lineHeight: 1.4, maxWidth: 700 }}>{body}</div>
    </div>
  );
};

const Footer: React.FC = () => (
  <div style={{ position: "absolute", left: 108, right: 108, bottom: 48, display: "flex", justifyContent: "space-between", fontFamily: oswald, fontSize: 19, color: "#8d887d" }}>
    <span>PAFC PARENT HUB</span><span style={{ color: GOLD }}>PRACTICAL HOMEWORK</span>
  </div>
);

const ScreenshotScene: React.FC<BaseSceneProps & { image: string; crop?: "top" | "middle" | "bottom"; align?: "left" | "right" }> = ({
  image,
  crop = "top",
  align = "left",
  ...text
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [0, -24], { extrapolateRight: "clamp" });
  const y = crop === "top" ? -42 : crop === "middle" ? -390 : -790;
  const shotLeft = align === "left" ? 720 : -70;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(145deg, #050505 0%, #11100d 60%, #17140b 100%)", overflow: "hidden" }}>
      <Grain />
      <div style={{ position: "absolute", left: shotLeft, top: y + drift, width: 1280, height: 1800, border: `1px solid ${GOLD}66`, boxShadow: "0 28px 90px rgba(0,0,0,.62)", overflow: "hidden" }}>
        <Img src={staticFile(`screenshots/homework-parent/${image}`)} style={{ width: 1280, height: 1800, objectFit: "cover", objectPosition: "top" }} />
      </div>
      <AbsoluteFill style={{ background: align === "left" ? "linear-gradient(90deg, #050505 0%, #050505 38%, transparent 69%)" : "linear-gradient(270deg, #050505 0%, #050505 38%, transparent 69%)" }} />
      <TextBlock {...text} align={align} />
      <Footer />
      <Audio src={staticFile(`audio/homework-parent/${text.audio}.wav`)} />
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - 5, fps, durationInFrames: 38, config: { damping: 17, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", overflow: "hidden" }}>
      <Img src={staticFile("screenshots/homework-parent/01-homework-overview.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", opacity: 0.46, transform: `scale(${1 + frame / 12000})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(5,5,5,.98) 0%, rgba(5,5,5,.8) 48%, rgba(5,5,5,.12) 100%)" }} />
      <div style={{ position: "absolute", left: 120, top: 220, width: 1120, color: PAPER, fontFamily: inter, opacity: reveal, transform: `translateY(${(1 - reveal) * 40}px)` }}>
        <div style={{ color: GOLD, fontFamily: oswald, fontSize: 28, fontWeight: 700 }}>NEW FOR PAFC FAMILIES</div>
        <div style={{ fontFamily: oswald, fontSize: 116, lineHeight: 0.96, fontWeight: 700, marginTop: 24 }}>PRACTICE.<br />PROGRESS. PROUD.</div>
        <div style={{ width: 128 * reveal, height: 8, backgroundColor: GOLD, margin: "32px 0" }} />
        <div style={{ color: MUTED, fontSize: 36, lineHeight: 1.35, maxWidth: 940 }}>Practical football homework is coming gradually to the PAFC Hub.</div>
      </div>
      <Audio src={staticFile("audio/homework-parent/01-intro.wav")} />
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [5, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(145deg, #050505, #1b1609)", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: inter, color: PAPER }}>
      <Grain />
      <div style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 28}px)`, maxWidth: 1480 }}>
        <div style={{ color: GOLD, fontFamily: oswald, fontSize: 28, fontWeight: 700 }}>PAFC PRACTICAL HOMEWORK</div>
        <div style={{ fontFamily: oswald, fontSize: 96, fontWeight: 700, lineHeight: 1.02, margin: "30px 0" }}>MORE TOUCHES.<br />MORE CONFIDENCE.</div>
        <div style={{ color: MUTED, fontSize: 34, lineHeight: 1.4 }}>Look out for new activities in your child's team Hub.</div>
      </div>
      <Audio src={staticFile("audio/homework-parent/08-close.wav")} />
    </AbsoluteFill>
  );
};

export const MainVideoHomeworkParents: React.FC = () => {
  let at = 0;
  const next = (duration: number) => { const from = at; at += duration; return from; };
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <Sequence from={next(scenes[0])} durationInFrames={scenes[0]}><Intro /></Sequence>
      <Sequence from={next(scenes[1])} durationInFrames={scenes[1]}>
        <ScreenshotScene image="02-active-task-u14s-gold.png" audio="02-open" number="01" kicker="Everything in one place" title="Open their homework" body="The task, instructions, deadline and questions appear in your child's team Hub." />
      </Sequence>
      <Sequence from={next(scenes[2])} durationInFrames={scenes[2]}>
        <ScreenshotScene image="02-active-task-u14s-gold.png" audio="03-watch" number="02" kicker="Watch together" title="Learn before they practise" body="Any coaching clip plays inside the homework page, keeping the whole activity together." crop="middle" align="right" />
      </Sequence>
      <Sequence from={next(scenes[3])} durationInFrames={scenes[3]}>
        <ScreenshotScene image="02-active-task-u14s-gold.png" audio="04-practise" number="03" kicker="The practical part" title="Ball out. Give it a go." body="A safe space and a few minutes are enough. Effort and improvement matter more than perfection." crop="middle" />
      </Sequence>
      <Sequence from={next(scenes[4])} durationInFrames={scenes[4]}>
        <ScreenshotScene image="02-active-task-u14s-gold.png" audio="05-proof" number="04" kicker="Share their effort" title="Record and upload" body="Take a short photo or video and upload it securely. Only their coaches can see it." crop="bottom" align="right" />
      </Sequence>
      <Sequence from={next(scenes[5])} durationInFrames={scenes[5]}>
        <ScreenshotScene image="02-active-task-u14s-gold.png" audio="06-answers" number="05" kicker="Reflect and complete" title="Answer the questions" body="Help your child record their score and what they learned, then mark the activity complete." crop="middle" />
      </Sequence>
      <Sequence from={next(scenes[6])} durationInFrames={scenes[6]}>
        <ScreenshotScene image="../homework-video/04-manage-review.png" audio="07-feedback" number="06" kicker="Encouragement matters" title="Coach feedback follows" body="Coaches can review the work, leave encouragement, like brilliant effort and choose their weekly star." align="right" />
      </Sequence>
      <Sequence from={next(scenes[7])} durationInFrames={scenes[7]}><Outro /></Sequence>
    </AbsoluteFill>
  );
};
