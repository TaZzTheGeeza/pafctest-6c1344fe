import {
  AbsoluteFill,
  Sequence,
  Audio,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: oswald } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});
const { fontFamily: inter } = loadInter("normal", {
  weights: ["300", "400", "600", "700"],
  subsets: ["latin"],
});

const GOLD = "#d4af37";
const GOLD_BRIGHT = "#f0c75a";
const BLACK = "#0a0a0a";
const INK = "#141414";
const OFFWHITE = "#f4f1ea";
const MUTED = "#8a8378";

const SCENES = [
  { dur: 132, audio: "ma-01.mp3" }, // hook
  { dur: 411, audio: "ma-02.mp3" }, // problem
  { dur: 378, audio: "ma-03.mp3" }, // reveal
  { dur: 399, audio: "ma-04.mp3" }, // hub
  { dur: 393, audio: "ma-05.mp3" }, // tournament
  { dur: 363, audio: "ma-06.mp3" }, // shop
  { dur: 384, audio: "ma-07.mp3" }, // meetings
  { dur: 288, audio: "ma-08.mp3" }, // news
  { dur: 318, audio: "ma-09.mp3" }, // showcase/awards
  { dur: 309, audio: "ma-10.mp3" }, // raffle/subs
  { dur: 285, audio: "ma-11.mp3" }, // safeguarding
  { dur: 303, audio: "ma-12.mp3" }, // white-label
  { dur: 225, audio: "ma-13.mp3" }, // proof
  { dur: 186, audio: "ma-14.mp3" }, // magna outro
];

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.dur, 0);

// -------- shared helpers
function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function BgGrain() {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 20%, #1a1812 0%, ${BLACK} 60%)`,
      }}
    />
  );
}

function GoldRule({ delay = 0, w = 200 }: { delay?: number; w?: number }) {
  const f = useCurrentFrame() - delay;
  const width = interpolate(f, [0, 24], [0, w], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        width,
        height: 3,
        background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`,
        boxShadow: `0 0 16px ${GOLD}66`,
      }}
    />
  );
}

function KickerLabel({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const f = useCurrentFrame() - delay;
  const o = interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const y = interpolate(f, [0, 18], [10, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${y}px)`,
        fontFamily: inter,
        fontSize: 22,
        letterSpacing: 8,
        color: GOLD,
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function BigDisplay({
  children,
  delay = 0,
  size = 180,
  color = OFFWHITE,
}: {
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
}) {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 18, stiffness: 110 } });
  const o = interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${(1 - s) * 30}px)`,
        fontFamily: oswald,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 0.95,
        color,
        letterSpacing: -2,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function Body({
  children,
  delay = 0,
  size = 30,
  color = MUTED,
  maxWidth = 900,
}: {
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
  maxWidth?: number;
}) {
  const f = useCurrentFrame() - delay;
  const o = interpolate(f, [0, 22], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <div
      style={{
        opacity: o,
        fontFamily: inter,
        fontWeight: 300,
        fontSize: size,
        lineHeight: 1.45,
        color,
        maxWidth,
      }}
    >
      {children}
    </div>
  );
}

function ModuleCard({
  delay,
  title,
  bullets,
  index,
}: {
  delay: number;
  title: string;
  bullets: string[];
  index: number;
}) {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 22, stiffness: 130 } });
  return (
    <div
      style={{
        opacity: interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        transform: `translateY(${(1 - s) * 40}px)`,
        background: INK,
        border: `1px solid ${GOLD}33`,
        borderRadius: 14,
        padding: "28px 32px",
        minWidth: 320,
        boxShadow: `0 24px 60px -20px ${GOLD}22`,
      }}
    >
      <div
        style={{
          fontFamily: inter,
          fontSize: 14,
          color: GOLD,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        {String(index).padStart(2, "0")} · Module
      </div>
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 42,
          color: OFFWHITE,
          textTransform: "uppercase",
          marginBottom: 14,
          letterSpacing: -0.5,
        }}
      >
        {title}
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          fontFamily: inter,
          fontSize: 20,
          color: MUTED,
          lineHeight: 1.7,
        }}
      >
        {bullets.map((b, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: GOLD }} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------- scenes
function Scene01() {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 20, 110, 132], [0, 1, 1, 0]);
  return (
    <AbsoluteFill style={{ background: BLACK, justifyContent: "center", alignItems: "center" }}>
      <BgGrain />
      <div style={{ opacity: o, textAlign: "center", padding: 80 }}>
        <KickerLabel>For grassroots clubs</KickerLabel>
        <div style={{ height: 30 }} />
        <div
          style={{
            fontFamily: oswald,
            fontWeight: 700,
            fontSize: 130,
            color: OFFWHITE,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: -2,
          }}
        >
          Running a club
          <br />
          <span style={{ color: GOLD }}>shouldn't feel like</span>
          <br />
          running a business.
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Scene02() {
  const f = useCurrentFrame();
  const pains = [
    { t: "WhatsApp chaos", d: 30 },
    { t: "Subs in spreadsheets", d: 70 },
    { t: "Lost availability replies", d: 110 },
    { t: "Photos on Dropbox", d: 150 },
    { t: "A website nobody updates", d: 190 },
    { t: "A tournament weekend that eats 3 months", d: 230 },
  ];
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <BgGrain />
      <div style={{ position: "absolute", top: 80, left: 100 }}>
        <KickerLabel>The reality</KickerLabel>
        <div style={{ height: 16 }} />
        <BigDisplay size={110}>The job is too big.</BigDisplay>
      </div>
      <div style={{ position: "absolute", left: 100, top: 360, display: "flex", flexDirection: "column", gap: 18 }}>
        {pains.map((p, i) => {
          const sub = f - p.d;
          const o = interpolate(sub, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(sub, [0, 18], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div
              key={i}
              style={{
                opacity: o,
                transform: `translateX(${x}px)`,
                display: "flex",
                alignItems: "center",
                gap: 22,
                fontFamily: inter,
                fontSize: 38,
                color: OFFWHITE,
                fontWeight: 300,
              }}
            >
              <span
                style={{
                  fontFamily: oswald,
                  color: GOLD,
                  fontSize: 28,
                  width: 60,
                  textAlign: "right",
                  opacity: 0.7,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ width: 60, height: 1, background: GOLD, opacity: 0.5 }} />
              <span>{p.t}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Scene03() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ring = spring({ frame: f - 10, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill
      style={{
        background: BLACK,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <BgGrain />
      {/* radial pulse */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          border: `1px solid ${GOLD}55`,
          transform: `scale(${0.3 + ring * 0.7})`,
          opacity: interpolate(f, [0, 30, 280, 378], [0, 0.7, 0.7, 0]),
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          border: `1px solid ${GOLD}99`,
          transform: `scale(${0.5 + ring * 0.6})`,
          opacity: interpolate(f, [10, 40, 280, 378], [0, 0.8, 0.8, 0]),
        }}
      />
      <div style={{ textAlign: "center", zIndex: 2 }}>
        <KickerLabel delay={20}>Introducing</KickerLabel>
        <div style={{ height: 26 }} />
        <BigDisplay delay={36} size={170}>
          The Magna Alliance
        </BigDisplay>
        <BigDisplay delay={56} size={170} color={GOLD}>
          Club Platform
        </BigDisplay>
        <div style={{ height: 30 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoldRule delay={90} w={300} />
        </div>
        <div style={{ height: 24 }} />
        <Body delay={110} size={28} color={MUTED} maxWidth={900}>
          One platform. Every job your club actually does.
        </Body>
      </div>
    </AbsoluteFill>
  );
}

function ModuleScene({
  index,
  kicker,
  title,
  tagline,
  bullets,
  accentSide = "right",
}: {
  index: number;
  kicker: string;
  title: string;
  tagline: string;
  bullets: string[];
  accentSide?: "left" | "right";
}) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardSpring = spring({ frame: f - 30, fps, config: { damping: 22, stiffness: 110 } });
  const isLeft = accentSide === "left";
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <BgGrain />
      {/* huge index number */}
      <div
        style={{
          position: "absolute",
          [isLeft ? "right" : "left"]: -40,
          bottom: -80,
          fontFamily: oswald,
          fontSize: 600,
          fontWeight: 700,
          color: GOLD,
          opacity: interpolate(f, [0, 30], [0, 0.07], { extrapolateRight: "clamp" }),
          lineHeight: 0.8,
        }}
      >
        {String(index).padStart(2, "0")}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: isLeft ? "row-reverse" : "row",
          gap: 80,
          padding: "100px 100px",
          alignItems: "center",
          height: "100%",
        }}
      >
        <div style={{ flex: 1 }}>
          <KickerLabel>{kicker}</KickerLabel>
          <div style={{ height: 18 }} />
          <BigDisplay size={120}>{title}</BigDisplay>
          <div style={{ height: 24 }} />
          <GoldRule delay={28} w={160} />
          <div style={{ height: 26 }} />
          <Body delay={36} size={32} color={OFFWHITE} maxWidth={760}>
            {tagline}
          </Body>
        </div>
        <div
          style={{
            flex: 1,
            opacity: interpolate(f, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            transform: `translateY(${(1 - cardSpring) * 40}px) perspective(1400px) rotateY(${isLeft ? 6 : -6}deg)`,
          }}
        >
          <ModuleCard delay={40} title={title} bullets={bullets} index={index} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Scene12WhiteLabel() {
  const f = useCurrentFrame();
  const brands = [
    { name: "Lions FC", c1: "#d4af37", c2: "#0a0a0a", sport: "Football" },
    { name: "Highfield RFC", c1: "#0c5a3a", c2: "#f5f1e8", sport: "Rugby" },
    { name: "Riverside CC", c1: "#1a3e7c", c2: "#ffffff", sport: "Cricket" },
    { name: "Park Hockey Club", c1: "#c1272d", c2: "#1c1c1c", sport: "Hockey" },
    { name: "Citadel Netball", c1: "#7c2bbf", c2: "#fde68a", sport: "Netball" },
  ];
  const idx = Math.min(brands.length - 1, Math.floor((f - 30) / 50));
  const cur = brands[Math.max(0, idx)];
  return (
    <AbsoluteFill style={{ background: BLACK, justifyContent: "center", alignItems: "center" }}>
      <BgGrain />
      <div style={{ textAlign: "center" }}>
        <KickerLabel>White-labelled</KickerLabel>
        <div style={{ height: 22 }} />
        <BigDisplay size={130}>Your colours.</BigDisplay>
        <BigDisplay delay={20} size={130} color={GOLD}>
          Your badge. Your sport.
        </BigDisplay>
        <div style={{ height: 40 }} />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 30,
            background: cur.c2,
            color: cur.c1,
            padding: "26px 60px",
            borderRadius: 16,
            fontFamily: oswald,
            fontSize: 64,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: -1,
            boxShadow: `0 30px 80px -20px ${cur.c1}55`,
            transition: "none",
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: cur.c1,
              color: cur.c2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            ★
          </div>
          {cur.name}
        </div>
        <div style={{ height: 16 }} />
        <div style={{ fontFamily: inter, color: MUTED, fontSize: 24, letterSpacing: 3, textTransform: "uppercase" }}>
          {cur.sport}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Scene13Proof() {
  return (
    <AbsoluteFill style={{ background: BLACK, justifyContent: "center", alignItems: "center" }}>
      <BgGrain />
      <div style={{ textAlign: "center", padding: 80 }}>
        <KickerLabel>This isn't a template.</KickerLabel>
        <div style={{ height: 24 }} />
        <BigDisplay size={130}>It's a real platform,</BigDisplay>
        <BigDisplay delay={18} size={130} color={GOLD}>
          running a real club.
        </BigDisplay>
        <div style={{ height: 36 }} />
        <div style={{ display: "flex", gap: 60, justifyContent: "center", marginTop: 20 }}>
          {[
            { n: "13", l: "Teams U6–U15" },
            { n: "400+", l: "Members" },
            { n: "2", l: "Tournaments hosted" },
            { n: "100%", l: "Live in production" },
          ].map((s, i) => {
            const f = useCurrentFrame();
            const o = interpolate(f, [40 + i * 10, 60 + i * 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div key={i} style={{ opacity: o, textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: oswald,
                    fontWeight: 700,
                    fontSize: 100,
                    color: GOLD,
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontFamily: inter,
                    color: MUTED,
                    fontSize: 18,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    marginTop: 8,
                  }}
                >
                  {s.l}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function MagnaLogo({ delay = 0 }: { delay?: number }) {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 18, stiffness: 110 } });
  const o = interpolate(f, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ruleW = interpolate(f, [10, 40], [0, 520], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: o, transform: `translateY(${(1 - s) * 20}px)`, textAlign: "center" }}>
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 110,
          color: OFFWHITE,
          letterSpacing: 14,
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        MAGNA
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, margin: "14px 0" }}>
        <div style={{ width: ruleW / 2, height: 2, background: GOLD }} />
        <div
          style={{
            width: 16,
            height: 16,
            transform: "rotate(45deg)",
            background: GOLD,
            boxShadow: `0 0 18px ${GOLD}`,
          }}
        />
        <div style={{ width: ruleW / 2, height: 2, background: GOLD }} />
      </div>
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 500,
          fontSize: 60,
          color: GOLD,
          letterSpacing: 22,
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        ALLIANCE
      </div>
    </div>
  );
}

function Scene14Outro() {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 20, 160, 186], [0, 1, 1, 0]);
  return (
    <AbsoluteFill style={{ background: BLACK, justifyContent: "center", alignItems: "center" }}>
      <BgGrain />
      <div style={{ opacity: o, textAlign: "center" }}>
        <MagnaLogo delay={6} />
        <div style={{ height: 50 }} />
        <div
          style={{
            fontFamily: inter,
            color: MUTED,
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          One platform · Every job · Every club
        </div>
        <div style={{ height: 38 }} />
        <div
          style={{
            display: "inline-block",
            padding: "18px 44px",
            border: `2px solid ${GOLD}`,
            color: GOLD,
            fontFamily: oswald,
            fontSize: 30,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Book a demo · magna-alliance.com
        </div>
      </div>
    </AbsoluteFill>
  );
}

// -------- master
export const MainVideoMagna: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      {/* audio */}
      {(() => {
        let pos = 0;
        return SCENES.map((s, i) => {
          const at = pos;
          pos += s.dur;
          return (
            <Sequence key={`a-${i}`} from={at} durationInFrames={s.dur}>
              <Audio src={staticFile(`audio/${s.audio}`)} />
            </Sequence>
          );
        });
      })()}

      <Series>
        <Series.Sequence durationInFrames={SCENES[0].dur}>
          <Scene01 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[1].dur}>
          <Scene02 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[2].dur}>
          <Scene03 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[3].dur}>
          <ModuleScene
            index={1}
            kicker="Module 01 · The Hub"
            title="Your private team space."
            tagline="Chat, availability, carpool, attendance, payments and guardian sign-offs — everything coaches chase every week, automated in one place."
            bullets={["Real-time team chat", "RSVP & availability", "Carpool board", "Subs & match fees", "Push + email + SMS"]}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[4].dur}>
          <ModuleScene
            index={2}
            accentSide="left"
            kicker="Module 02 · Tournament Hub"
            title="Run a tournament without losing a weekend."
            tagline="Digital entries, group draws, live fixtures on a custom pitch map and photo sales straight to parents — already battle-tested."
            bullets={["Online team entries", "Auto group draws", "Live fixture board", "Photo gallery + sales", "Bank-pay checkout"]}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[5].dur}>
          <ModuleScene
            index={3}
            kicker="Module 03 · Club Shop"
            title="A real revenue stream."
            tagline="Kit, training tops and badges sold online — personalised with player initials, fulfilled through Shopify."
            bullets={["Shopify-powered", "Personalised line items", "Cart with attributes", "Order sync to admin"]}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[6].dur}>
          <ModuleScene
            index={4}
            accentSide="left"
            kicker="Module 04 · Meetings"
            title="One-click club meetings."
            tagline="Triple-delivered invites by push, email and notification. RSVP tracked, Jitsi room ready, no more lost links."
            bullets={["Jitsi video room", "Push + email + in-app", "RSVP tracking", "Recurring AGMs"]}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[7].dur}>
          <ModuleScene
            index={5}
            kicker="Module 05 · News & Programme"
            title="A flipbook matchday programme."
            tagline="AI-assisted articles and a beautiful 95-degree flipbook reveal — your club on the front page, every week."
            bullets={["AI editorial drafts", "Flipbook UI", "Match reports", "Player features"]}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[8].dur}>
          <ModuleScene
            index={6}
            accentSide="left"
            kicker="Module 06 · Showcase & Awards"
            title="Memories kids actually keep."
            tagline="Trading cards, Player of the Match flips, career stats and end-of-season awards voted by parents."
            bullets={["Trading cards", "POTM flip cards", "Career stats", "Awards voting"]}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[9].dur}>
          <ModuleScene
            index={7}
            kicker="Module 07 · Raffle & Fundraising"
            title="Compliant fundraising, on autopilot."
            tagline="Instant Bank Pay raffles with animated draw videos, monthly subs and one-off payments — collected automatically."
            bullets={["GoCardless bank pay", "Animated raffle draw", "Monthly subs", "Treasurer board"]}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[10].dur}>
          <ModuleScene
            index={8}
            accentSide="left"
            kicker="Module 08 · Safeguarding & Admin"
            title="Built to FA standards."
            tagline="Anonymous reports, granular role-based access, GDPR-compliant data — ready for inspection from day one."
            bullets={["Anonymous reporting", "RBAC roles", "Welfare officer", "UK GDPR compliant"]}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[11].dur}>
          <Scene12WhiteLabel />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[12].dur}>
          <Scene13Proof />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES[13].dur}>
          <Scene14Outro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
