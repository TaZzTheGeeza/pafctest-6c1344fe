import {
  AbsoluteFill,
  Sequence,
  Audio,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { loadFont } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { SceneFeatureHighlight } from "./scenes/SceneFeatureHighlight";

const { fontFamily: oswald } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});
const { fontFamily: inter } = loadInter("normal", {
  weights: ["300", "400", "600"],
  subsets: ["latin"],
});

const GOLD = "#d4af37";
const GOLD_DIM = "#a8862b";
const CRIMSON = "#c8102e";
const BLACK = "#0a0a0a";
const OFFWHITE = "#f4f1ea";

const T = 18;

const SCENES = [
  { dur: 282, audio: "sales-01.mp3" }, // problem hook
  { dur: 285, audio: "sales-02.mp3" }, // problem deepen
  { dur: 198, audio: "sales-03.mp3" }, // reveal
  { dur: 299, audio: "sales-04.mp3" }, // hub
  { dur: 281, audio: "sales-05.mp3" }, // payments
  { dur: 315, audio: "sales-06.mp3" }, // tournaments/raffle/shop/tv
  { dur: 285, audio: "sales-07.mp3" }, // PAFC proof
  { dur: 266, audio: "sales-08.mp3" }, // white-label
  { dur: 280, audio: "sales-09.mp3" }, // CTA
];

export const TOTAL_FRAMES =
  SCENES.reduce((a, s) => a + s.dur, 0) - (SCENES.length - 1) * T;

function audioStarts() {
  const starts: number[] = [0];
  let pos = 0;
  for (let i = 1; i < SCENES.length; i++) {
    pos += SCENES[i - 1].dur - T;
    starts.push(pos);
  }
  return starts;
}

// ──────────────────────────────────────────────────────────
// Scene 1 — PROBLEM HOOK: chaotic message bubbles
// ──────────────────────────────────────────────────────────
const CHAOS_MESSAGES = [
  "Is training on?",
  "What time kick off?",
  "Who's bringing the kit?",
  "Did anyone pay subs?",
  "Pitch number??",
  "Where's the consent form?",
  "Match cancelled?",
  "Can someone lift Jack?",
  "Score from u9s?",
  "When's the photo?",
  "Anyone got bibs?",
  "Subs reminder pls",
  "What colour socks?",
  "Free Saturday?",
];

const SceneProblemHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: BLACK, overflow: "hidden" }}>
      {/* chaotic bubbles */}
      {CHAOS_MESSAGES.map((m, i) => {
        const delay = i * 6;
        const t = Math.max(0, frame - delay);
        const op = interpolate(t, [0, 10, 60, 90], [0, 0.85, 0.85, 0], {
          extrapolateRight: "clamp",
        });
        const y = interpolate(t, [0, 90], [0, -40]);
        const seed = (i * 9301 + 49297) % 233280;
        const x = (seed % 1600) + 80;
        const yPos = ((seed * 7) % 800) + 80;
        const rot = ((seed % 14) - 7);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: yPos + y,
              transform: `rotate(${rot}deg)`,
              background: "#1f2a3a",
              color: OFFWHITE,
              padding: "12px 20px",
              borderRadius: 18,
              borderBottomLeftRadius: i % 2 ? 18 : 4,
              fontFamily: inter,
              fontSize: 22,
              fontWeight: 400,
              opacity: op,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              maxWidth: 320,
            }}
          >
            {m}
          </div>
        );
      })}

      {/* center darken */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
        }}
      />

      {/* title */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `scale(${0.85 + titleIn * 0.15})`,
            opacity: titleIn,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: oswald,
              fontWeight: 700,
              fontSize: 140,
              lineHeight: 0.95,
              color: OFFWHITE,
              letterSpacing: "-0.02em",
            }}
          >
            RUNNING A CLUB
          </div>
          <div
            style={{
              fontFamily: oswald,
              fontWeight: 700,
              fontSize: 140,
              lineHeight: 0.95,
              color: CRIMSON,
              letterSpacing: "-0.02em",
              marginTop: -10,
            }}
          >
            IS CHAOS.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────
// Scene 2 — PROBLEM STATS
// ──────────────────────────────────────────────────────────
const StatLine: React.FC<{ delay: number; big: string; label: string }> = ({
  delay,
  big,
  label,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 16 } });
  const op = interpolate(s, [0, 1], [0, 1]);
  const x = interpolate(s, [0, 1], [-60, 0]);
  return (
    <div style={{ opacity: op, transform: `translateX(${x}px)`, marginBottom: 36 }}>
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 110,
          lineHeight: 1,
          color: GOLD,
          letterSpacing: "-0.02em",
        }}
      >
        {big}
      </div>
      <div
        style={{
          fontFamily: inter,
          fontWeight: 300,
          fontSize: 28,
          color: OFFWHITE,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const SceneProblemStats: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(135deg, rgba(200,16,46,0.15) 0%, transparent 50%, rgba(212,175,55,0.08) 100%)",
        }}
      />
      <AbsoluteFill
        style={{ padding: "120px 140px", justifyContent: "center" }}
      >
        <div
          style={{
            fontFamily: inter,
            fontWeight: 600,
            fontSize: 22,
            color: CRIMSON,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          The cost of admin chaos
        </div>
        <StatLine delay={4} big="6+ HOURS" label="Volunteer admin per week" />
        <StatLine delay={28} big="40%" label="Subs paid late or missed" />
        <StatLine delay={52} big="200+" label="WhatsApp pings a week" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────
// Scene 3 — REVEAL
// ──────────────────────────────────────────────────────────
const SceneReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame, [0, 4, 12], [0, 1, 0], {
    extrapolateRight: "clamp",
  });
  const s = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const lineW = interpolate(s, [0, 1], [0, 100]);
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      {/* radial gold */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(212,175,55,0.18) 0%, transparent 70%)",
        }}
      />
      {/* flash */}
      <AbsoluteFill style={{ background: OFFWHITE, opacity: flash }} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontFamily: inter,
            fontWeight: 600,
            fontSize: 22,
            color: GOLD,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            opacity: s,
            marginBottom: 24,
          }}
        >
          Introducing
        </div>
        <div
          style={{
            fontFamily: oswald,
            fontWeight: 700,
            fontSize: 180,
            lineHeight: 0.95,
            color: OFFWHITE,
            textAlign: "center",
            letterSpacing: "-0.02em",
            transform: `scale(${0.9 + s * 0.1})`,
            opacity: s,
          }}
        >
          THE COMPLETE
          <br />
          <span style={{ color: GOLD }}>CLUB PLATFORM</span>
        </div>
        <div
          style={{
            width: `${lineW}%`,
            maxWidth: 600,
            height: 3,
            background: GOLD,
            marginTop: 32,
          }}
        />
        <div
          style={{
            fontFamily: inter,
            fontWeight: 300,
            fontSize: 28,
            color: OFFWHITE,
            opacity: s,
            marginTop: 28,
            letterSpacing: "0.1em",
          }}
        >
          One system. Every job done.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────
// Scene 6 — MONTAGE (tournaments / raffle / shop / TV)
// ──────────────────────────────────────────────────────────
const SceneMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tiles = [
    { src: "screenshots/tournament-overview.png", label: "TOURNAMENTS" },
    { src: "screenshots/raffle-create.png", label: "RAFFLES" },
    { src: "screenshots/05-shop.png", label: "CLUB SHOP" },
    { src: "screenshots/06-pafctv.png", label: "CLUB TV" },
  ];
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 20% 80%, rgba(212,175,55,0.12) 0%, transparent 60%)",
        }}
      />
      <AbsoluteFill style={{ padding: "80px 100px" }}>
        <div
          style={{
            fontFamily: inter,
            fontWeight: 600,
            fontSize: 20,
            color: GOLD,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          And so much more
        </div>
        <div
          style={{
            fontFamily: oswald,
            fontWeight: 700,
            fontSize: 90,
            color: OFFWHITE,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            marginBottom: 48,
          }}
        >
          A FULL ECOSYSTEM.
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 28,
            flex: 1,
          }}
        >
          {tiles.map((t, i) => {
            const delay = 4 + i * 10;
            const s = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16 },
            });
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 12,
                  transform: `scale(${0.85 + s * 0.15})`,
                  opacity: s,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                }}
              >
                <Img
                  src={staticFile(t.src)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 24,
                    left: 28,
                    fontFamily: oswald,
                    fontWeight: 700,
                    fontSize: 48,
                    color: GOLD,
                    letterSpacing: "0.05em",
                  }}
                >
                  {t.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────
// Scene 7 — PAFC PROOF
// ──────────────────────────────────────────────────────────
const SceneProof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const heroS = spring({ frame, fps, config: { damping: 18 } });
  const stats = [
    { delay: 24, n: "2", l: "Sold-out tournaments" },
    { delay: 42, n: "200+", l: "Teams hosted" },
    { delay: 60, n: "1,500+", l: "Parents using the platform" },
    { delay: 78, n: "5★", l: "Coach & committee feedback" },
  ];
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      {/* hero image */}
      <AbsoluteFill style={{ opacity: 0.35, transform: `scale(${1 + heroS * 0.05})` }}>
        <Img
          src={staticFile("screenshots/01-homepage.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      <AbsoluteFill style={{ padding: "100px 120px", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: inter,
            fontWeight: 600,
            fontSize: 20,
            color: GOLD,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            marginBottom: 18,
            opacity: heroS,
          }}
        >
          Battle-tested
        </div>
        <div
          style={{
            fontFamily: oswald,
            fontWeight: 700,
            fontSize: 96,
            color: OFFWHITE,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            opacity: heroS,
          }}
        >
          BUILT BY <span style={{ color: GOLD }}>PETERBOROUGH</span>
          <br />
          ATHLETIC F.C.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 40,
            marginTop: 80,
          }}
        >
          {stats.map((st, i) => {
            const s = spring({
              frame: frame - st.delay,
              fps,
              config: { damping: 14 },
            });
            return (
              <div
                key={i}
                style={{
                  opacity: s,
                  transform: `translateY(${(1 - s) * 30}px)`,
                  borderLeft: `3px solid ${GOLD}`,
                  paddingLeft: 18,
                }}
              >
                <div
                  style={{
                    fontFamily: oswald,
                    fontWeight: 700,
                    fontSize: 78,
                    color: OFFWHITE,
                    lineHeight: 1,
                  }}
                >
                  {st.n}
                </div>
                <div
                  style={{
                    fontFamily: inter,
                    fontWeight: 400,
                    fontSize: 17,
                    color: OFFWHITE,
                    opacity: 0.75,
                    marginTop: 6,
                    letterSpacing: "0.05em",
                  }}
                >
                  {st.l}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────
// Scene 8 — WHITE LABEL: colour swatches morphing
// ──────────────────────────────────────────────────────────
const PALETTES = [
  { name: "FOOTBALL", a: "#d4af37", b: "#0a0a0a" },
  { name: "RUGBY", a: "#1b5e20", b: "#ffffff" },
  { name: "CRICKET", a: "#0d47a1", b: "#ffd700" },
  { name: "NETBALL", a: "#c2185b", b: "#ffffff" },
  { name: "HOCKEY", a: "#ff6f00", b: "#0a0a0a" },
];

const SceneWhiteLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 18 } });
  // cycle palette every 40 frames
  const idx = Math.min(PALETTES.length - 1, Math.floor(frame / 42));
  const p = PALETTES[idx];
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${p.a}22 0%, transparent 70%)`,
          transition: "none",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontFamily: inter,
            fontWeight: 600,
            fontSize: 22,
            color: p.a,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            opacity: t,
            marginBottom: 32,
          }}
        >
          White-labelled for you
        </div>

        {/* dynamic badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: p.a,
              border: `6px solid ${p.b}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: oswald,
              fontWeight: 700,
              fontSize: 64,
              color: p.b,
              boxShadow: `0 0 60px ${p.a}55`,
              transform: `scale(${0.9 + t * 0.1})`,
            }}
          >
            FC
          </div>
          <div
            style={{
              fontFamily: oswald,
              fontWeight: 700,
              fontSize: 120,
              color: OFFWHITE,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            YOUR CLUB.
            <br />
            <span style={{ color: p.a }}>YOUR BRAND.</span>
          </div>
        </div>

        <div
          style={{
            fontFamily: inter,
            fontWeight: 400,
            fontSize: 32,
            color: OFFWHITE,
            opacity: 0.85,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {p.name}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────
// Scene 9 — CTA
// ──────────────────────────────────────────────────────────
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t1 = spring({ frame, fps, config: { damping: 16 } });
  const t2 = spring({ frame: frame - 30, fps, config: { damping: 14 } });
  const t3 = spring({ frame: frame - 90, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(212,175,55,0.22) 0%, transparent 60%)",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div
          style={{
            fontFamily: oswald,
            fontWeight: 700,
            fontSize: 130,
            lineHeight: 0.95,
            color: OFFWHITE,
            letterSpacing: "-0.02em",
            opacity: t1,
            transform: `translateY(${(1 - t1) * 30}px)`,
          }}
        >
          STOP VOLUNTEERING
          <br />
          AT <span style={{ color: CRIMSON }}>ADMIN.</span>
        </div>
        <div
          style={{
            fontFamily: oswald,
            fontWeight: 700,
            fontSize: 130,
            lineHeight: 0.95,
            color: GOLD,
            letterSpacing: "-0.02em",
            opacity: t2,
            transform: `translateY(${(1 - t2) * 30}px)`,
            marginTop: 28,
          }}
        >
          START RUNNING
          <br />
          YOUR CLUB.
        </div>
        <div
          style={{
            opacity: t3,
            marginTop: 64,
            padding: "24px 56px",
            border: `2px solid ${GOLD}`,
            fontFamily: oswald,
            fontWeight: 500,
            fontSize: 36,
            color: OFFWHITE,
            letterSpacing: "0.2em",
          }}
        >
          HELLO@PA-FC.UK
        </div>
        <div
          style={{
            opacity: t3,
            marginTop: 24,
            fontFamily: inter,
            fontWeight: 300,
            fontSize: 22,
            color: OFFWHITE,
            opacity: 0.6,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
          }}
        >
          Built by a club · For clubs
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────
export const MainVideoSales: React.FC = () => {
  const starts = audioStarts();
  return (
    <AbsoluteFill style={{ backgroundColor: BLACK, fontFamily: inter }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES[0].dur}>
          <SceneProblemHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENES[1].dur}>
          <SceneProblemStats />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENES[2].dur}>
          <SceneReveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENES[3].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/hub-chat.png")}
            title="THE CLUB HUB"
            subtitle="REPLACE WHATSAPP · END THE CHAOS"
            bullets={[
              "Private real-time chat per team",
              "Availability, attendance & carpool",
              "Instant push, email & in-app notifications",
            ]}
            layout="left"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENES[4].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/hub-payments.png")}
            title="PAYMENTS, SORTED."
            subtitle="AUTOMATED · NO MORE CHASING"
            bullets={[
              "Monthly subs by direct debit",
              "One-off requests for kit, trips, presentation",
              "Treasurer dashboard with live reconciliation",
            ]}
            layout="right"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENES[5].dur}>
          <SceneMontage />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENES[6].dur}>
          <SceneProof />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENES[7].dur}>
          <SceneWhiteLabel />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENES[8].dur}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {SCENES.map((s, i) => (
        <Sequence key={i} from={starts[i]}>
          <Audio src={staticFile(`audio/${s.audio}`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
