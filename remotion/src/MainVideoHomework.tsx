import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: oswald } = loadOswald("normal", { weights: ["500", "700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const GOLD = "#c9a84c";
const INK = "#050505";
const PAPER = "#f5f1e8";
const TRANSITION = 18;

const scenes = [225, 315, 270, 315, 330, 390];
export const HOMEWORK_TOTAL = scenes.reduce((sum, duration) => sum + duration, 0) - TRANSITION * (scenes.length - 1);

type SceneProps = {
  image: string;
  audio: string;
  number: string;
  kicker: string;
  title: string;
  body: string;
  imageWidth?: number;
  imageX?: number;
  imageY?: number;
  reverse?: boolean;
};

const FeatureScene: React.FC<SceneProps> = ({
  image,
  audio,
  number,
  kicker,
  title,
  body,
  imageWidth = 1180,
  imageX = 650,
  imageY = 95,
  reverse = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 28 });
  const imageDrift = interpolate(frame, [0, durationInFrames], [0, -22], { extrapolateRight: "clamp" });
  const accent = interpolate(frame, [10, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textLeft = reverse ? 1080 : 105;
  const shotLeft = reverse ? 55 : imageX;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(145deg, #050505 0%, #10100e 58%, #17140b 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.18, backgroundImage: "radial-gradient(circle at 2px 2px, #c9a84c 1px, transparent 0)", backgroundSize: "44px 44px" }} />
      <div style={{ position: "absolute", left: shotLeft, top: imageY + imageDrift, width: imageWidth, height: 890, overflow: "hidden", border: `1px solid ${GOLD}66`, boxShadow: "0 28px 90px rgba(0,0,0,.58)" }}>
        <Img src={staticFile(`screenshots/homework-video/${image}`)} style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: INK }} />
      </div>
      <div style={{ position: "absolute", left: reverse ? 930 : 0, top: 0, bottom: 0, width: 990, background: reverse ? "linear-gradient(270deg, #050505 50%, transparent 100%)" : "linear-gradient(90deg, #050505 50%, transparent 100%)" }} />
      <div style={{ position: "absolute", left: textLeft, top: 205, width: 720, transform: `translateY(${(1 - entrance) * 32}px)`, opacity: entrance, fontFamily: inter, color: PAPER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, color: GOLD, fontFamily: oswald, fontSize: 25, fontWeight: 700, letterSpacing: 2 }}>
          <span style={{ border: `1px solid ${GOLD}`, width: 54, height: 54, display: "grid", placeItems: "center" }}>{number}</span>
          {kicker.toUpperCase()}
        </div>
        <h2 style={{ fontFamily: oswald, fontWeight: 700, fontSize: 78, lineHeight: 1.02, letterSpacing: 0, textTransform: "uppercase", margin: "30px 0 24px" }}>{title}</h2>
        <div style={{ width: 112 * accent, height: 7, backgroundColor: GOLD, marginBottom: 30 }} />
        <p style={{ fontSize: 30, lineHeight: 1.42, margin: 0, color: "#d8d4ca", maxWidth: 660 }}>{body}</p>
      </div>
      <div style={{ position: "absolute", left: 105, right: 105, bottom: 55, display: "flex", justifyContent: "space-between", color: "#8d887d", fontFamily: oswald, fontSize: 20, letterSpacing: 1 }}>
        <span>PAFC COACH DASHBOARD</span><span style={{ color: GOLD }}>HOMEWORK</span>
      </div>
      <Audio src={staticFile(`audio/homework-video/${audio}`)} volume={1} />
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 120 }, durationInFrames: 35 });
  const line = interpolate(frame, [10, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(145deg, #050505, #19150a)", fontFamily: inter, color: PAPER, overflow: "hidden" }}>
      <Img src={staticFile("screenshots/homework-video/01-overview.png")} style={{ position: "absolute", width: 1500, right: -250, top: -370, opacity: 0.3, transform: `scale(${1 + frame / 9000})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, #050505 0%, rgba(5,5,5,.96) 42%, rgba(5,5,5,.25) 100%)" }} />
      <div style={{ position: "absolute", left: 125, top: 205, width: 1120, opacity: reveal, transform: `translateY(${(1 - reveal) * 45}px)` }}>
        <div style={{ color: GOLD, fontFamily: oswald, fontSize: 28, fontWeight: 700, letterSpacing: 3 }}>NEW COACH FEATURE</div>
        <h1 style={{ fontFamily: oswald, fontSize: 126, lineHeight: 0.94, margin: "28px 0", letterSpacing: 0 }}>HOMEWORK<br />MADE SIMPLE</h1>
        <div style={{ width: 130 * line, height: 8, backgroundColor: GOLD, marginBottom: 34 }} />
        <p style={{ fontSize: 36, lineHeight: 1.35, maxWidth: 900, color: "#dad5cb" }}>Build, send and review player homework from one place.</p>
      </div>
      <Audio src={staticFile("audio/homework-video/01-intro.wav")} volume={1} />
    </AbsoluteFill>
  );
};

export const MainVideoHomework: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={scenes[0]}><Intro /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={linearTiming({ durationInFrames: TRANSITION })} />
    <TransitionSeries.Sequence durationInFrames={scenes[1]}>
      <FeatureScene image="02-ai-builder-close.png" audio="02-ai.wav" number="01" kicker="Start with an idea" title="Let AI build the first draft" body="A few words can become a complete task, instructions and question sheet, ready for you to check and send." imageWidth={980} imageX={820} imageY={85} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: TRANSITION })} />
    <TransitionSeries.Sequence durationInFrames={scenes[2]}>
      <FeatureScene image="02-ai-builder-close.png" audio="03-builder.wav" number="02" kicker="Make it yours" title="Choose the team and task" body="Set the team, deadline and clear practice instructions. Everything stays editable before it reaches parents." imageWidth={980} imageX={70} imageY={82} reverse />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: TRANSITION })} />
    <TransitionSeries.Sequence durationInFrames={scenes[3]}>
      <FeatureScene image="03-task-sheet-close.png" audio="04-media.wav" number="03" kicker="Show, don't just tell" title="Add coaching video" body="Attach your own drill media or embed a YouTube clip for match reviews and demonstrations, without sending families elsewhere." imageWidth={900} imageX={900} imageY={55} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={linearTiming({ durationInFrames: TRANSITION })} />
    <TransitionSeries.Sequence durationInFrames={scenes[4]}>
      <FeatureScene image="03-task-sheet-close.png" audio="05-questions.wav" number="04" kicker="Check understanding" title="Build question sheets" body="Mix multiple choice, written answers, true or false, numbers and select-all questions. Correct answers can mark themselves." imageWidth={860} imageX={55} imageY={-145} reverse />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={linearTiming({ durationInFrames: TRANSITION })} />
    <TransitionSeries.Sequence durationInFrames={scenes[5]}>
      <FeatureScene image="01-overview.png" audio="06-finish.wav" number="05" kicker="Keep players engaged" title="Review, respond and reward" body="Parents are notified automatically. Review proof and answers, leave feedback, like great work and choose your Homework Star of the Week." imageWidth={1260} imageX={690} imageY={-230} />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);