import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export const MY_FAMILY_TOTAL = 3135;
const GOLD = "#d6a43b";
const OFF_WHITE = "#f5f1e8";
const SCREENSHOT = staticFile("screenshots/my-family-hires.png");

type SceneProps = {
  from: number;
  duration: number;
  eyebrow: string;
  title: string;
  body: string;
  x?: number;
  y?: number;
  scale?: number;
  align?: "left" | "right";
};

const ScreenshotScene: React.FC<SceneProps> = ({
  from,
  duration,
  eyebrow,
  title,
  body,
  x = 0,
  y = 0,
  scale = 1,
  align = "left",
}) => {
  const frame = useCurrentFrame() - from;
  const opacity = interpolate(frame, [0, 15, duration - 18, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(frame, [0, duration], [0, -24]);

  return (
    <Sequence from={from} durationInFrames={duration}>
      <AbsoluteFill style={{ backgroundColor: "#090909", overflow: "hidden", opacity }}>
        <Img
          src={SCREENSHOT}
          style={{
            position: "absolute",
            width: 1920 * scale,
            height: "auto",
            left: x,
            top: y + drift,
          }}
        />
        <AbsoluteFill
          style={{
            background:
              align === "left"
                ? "linear-gradient(90deg, rgba(5,5,5,.97) 0%, rgba(5,5,5,.88) 32%, rgba(5,5,5,.18) 64%, transparent 82%)"
                : "linear-gradient(270deg, rgba(5,5,5,.97) 0%, rgba(5,5,5,.88) 32%, rgba(5,5,5,.18) 64%, transparent 82%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 190,
            [align]: 110,
            width: 650,
            color: OFF_WHITE,
            fontFamily: "Arial, sans-serif",
            textAlign: align,
          }}
        >
          <div style={{ color: GOLD, fontSize: 25, fontWeight: 800, letterSpacing: 4, marginBottom: 22 }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 69, lineHeight: 1.02, fontWeight: 900, textTransform: "uppercase" }}>{title}</div>
          <div style={{ width: 90, height: 6, backgroundColor: GOLD, margin: align === "left" ? "30px 0" : "30px 0 30px auto" }} />
          <div style={{ fontSize: 31, lineHeight: 1.35, color: "#d5d1c8", fontWeight: 500 }}>{body}</div>
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [8, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#080808", overflow: "hidden" }}>
      <Img src={SCREENSHOT} style={{ width: 1920, height: "auto", opacity: 0.28, filter: "blur(1px)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(5,5,5,.96), rgba(5,5,5,.55))" }} />
      <div style={{ position: "absolute", left: 130, top: 255, width: 1100, opacity: reveal, transform: `translateY(${(1 - reveal) * 35}px)`, fontFamily: "Arial, sans-serif" }}>
        <div style={{ color: GOLD, fontSize: 28, letterSpacing: 6, fontWeight: 800 }}>NEW FOR PAFC PARENTS</div>
        <div style={{ color: OFF_WHITE, fontSize: 112, lineHeight: 1, fontWeight: 900, marginTop: 24 }}>MY FAMILY</div>
        <div style={{ color: "#ddd7ca", fontSize: 38, lineHeight: 1.35, marginTop: 30, maxWidth: 900 }}>
          One clear place for everything connected to your children at the club.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 50, [0, 25, 50], [1, 1.035, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#090909", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
      <div style={{ color: GOLD, fontSize: 27, letterSpacing: 6, fontWeight: 800 }}>PAFC PARENT DASHBOARD</div>
      <div style={{ color: OFF_WHITE, fontSize: 88, lineHeight: 1.05, fontWeight: 900, marginTop: 26, maxWidth: 1450 }}>
        LESS SEARCHING.<br />MORE TIME SUPPORTING THEM.
      </div>
      <div style={{ color: "#d5d1c8", fontSize: 32, marginTop: 34, maxWidth: 1050, lineHeight: 1.4 }}>
        Sign in and choose My Family to see the information that matters to your household.
      </div>
      <div style={{ marginTop: 52, transform: `scale(${pulse})`, color: "#101010", backgroundColor: GOLD, fontSize: 28, fontWeight: 900, padding: "22px 52px", borderRadius: 6 }}>
        pa-fc.uk
      </div>
    </AbsoluteFill>
  );
};

export const MainVideoMyFamily: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#090909" }}>
    <Sequence from={0} durationInFrames={300}><Intro /></Sequence>
    <ScreenshotScene from={300} duration={420} eyebrow="WHY IT WAS CREATED" title="No more hunting around" body="My Family brings each child's club information together, so parents can quickly see what needs attention and where to go next." x={-970} y={-210} scale={1.5} align="left" />
    <ScreenshotScene from={720} duration={435} eyebrow="WHAT NEEDS YOUR ATTENTION" title="Actions and alerts" body="See availability reminders, kit updates, payment prompts and club messages. Every item links directly to the right place." x={0} y={-250} scale={1.55} align="right" />
    <ScreenshotScene from={1155} duration={435} eyebrow="WHAT'S COMING UP" title="Fixtures and availability" body="View the next match for each linked child, check the real date, time and venue, then confirm availability in one tap." x={-1030} y={-220} scale={1.55} align="left" />
    <ScreenshotScene from={1590} duration={375} eyebrow="FOLLOW THEIR SEASON" title="Stats and match reports" body="Keep up with goals, assists, Player of the Match awards and the latest team reports, all connected to your child's team." x={-990} y={-780} scale={1.5} align="left" />
    <ScreenshotScene from={1965} duration={450} eyebrow="KEEP TRACK OF REQUESTS" title="Kit and shop orders" body="Follow kit requests from approval to collection, check shop order progress and see when something needs action." x={0} y={-870} scale={1.5} align="right" />
    <ScreenshotScene from={2415} duration={375} eyebrow="ONE FAMILY VIEW" title="Forms, events and shortcuts" body="Check forms and consents, this week's club activity and quick links to payments, kit, reports and your profile." x={-930} y={-1160} scale={1.45} align="left" />
    <Sequence from={2790} durationInFrames={345}><Outro /></Sequence>

    <Sequence from={12}><Audio src={staticFile("audio/my-family/intro.wav")} volume={1} /></Sequence>
    <Sequence from={315}><Audio src={staticFile("audio/my-family/purpose.wav")} volume={1} /></Sequence>
    <Sequence from={735}><Audio src={staticFile("audio/my-family/alerts.wav")} volume={1} /></Sequence>
    <Sequence from={1170}><Audio src={staticFile("audio/my-family/fixtures.wav")} volume={1} /></Sequence>
    <Sequence from={1605}><Audio src={staticFile("audio/my-family/stats.wav")} volume={1} /></Sequence>
    <Sequence from={1980}><Audio src={staticFile("audio/my-family/kit.wav")} volume={1} /></Sequence>
    <Sequence from={2430}><Audio src={staticFile("audio/my-family/forms.wav")} volume={1} /></Sequence>
    <Sequence from={2805}><Audio src={staticFile("audio/my-family/outro.wav")} volume={1} /></Sequence>
  </AbsoluteFill>
);