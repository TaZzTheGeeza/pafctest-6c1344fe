import {
  AbsoluteFill, Audio, Sequence, staticFile,
  useCurrentFrame, useVideoConfig, interpolate, spring, Img,
} from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: oswald } = loadOswald("normal", { weights: ["500", "700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["300", "400", "600"], subsets: ["latin"] });

const GOLD = "#c9a24a";
const GOLD_BRIGHT = "#e8c878";
const CREAM = "#ece4d3";
const BG = "#0a0a0a";

type Shot = { src: string; frame: "phone" | "laptop"; caption?: string };
type Scene =
  | { kind: "type"; audio: string; dur: number; eyebrow: string; title: string; sub: string; isOutro?: boolean }
  | { kind: "module"; audio: string; dur: number; eyebrow: string; title: string; sub: string; shot: Shot }
  | { kind: "long"; audio: string; dur: number; eyebrow: string; title: string; sub: string; shots: Shot[] };

const S = (p: string) => `screenshots/${p}`;

export const SCENES: Scene[] = [
  { kind: "type", audio: "yc-01.mp3", dur: 114, eyebrow: "", title: "Running a club\nshouldn't eat\nyour week.", sub: "" },
  { kind: "type", audio: "yc-02.mp3", dur: 198, eyebrow: "THE REALITY", title: "SPREADSHEETS.\nWHATSAPP.\nCHASING PAYMENTS.", sub: "" },
  { kind: "type", audio: "yc-03.mp3", dur: 207, eyebrow: "INTRODUCING", title: "YOUR CLUB", sub: "Everything you run. One platform." },

  // HUB - long
  { kind: "long", audio: "yc-04.mp3", dur: 1041,
    eyebrow: "MODULE 01  ·  THE HUB",
    title: "YOUR TEAM'S\nCOMMAND\nCENTRE.",
    sub: "Chat · Availability · Registrations · Directions · Payments",
    shots: [
      { src: S("hub-chat.png"), frame: "phone", caption: "Real-time team chat" },
      { src: S("hub-availability.png"), frame: "phone", caption: "One-tap availability + directions" },
      { src: S("player-registration.png"), frame: "laptop", caption: "Online registrations & profiles" },
      { src: S("hub-payments.png"), frame: "phone", caption: "Direct-debit subs & fees" },
      { src: S("hub-overview.png"), frame: "phone", caption: "Everything in one place" },
    ],
  },

  // TOURNAMENT - long
  { kind: "long", audio: "yc-05.mp3", dur: 966,
    eyebrow: "MODULE 02  ·  TOURNAMENTS",
    title: "RUN AN\nEVENT WITHOUT\nLOSING SLEEP.",
    sub: "Entries · Groups · Brackets · Live admin",
    shots: [
      { src: S("04-tournament.png"), frame: "laptop", caption: "Online team entry" },
      { src: S("tournament-groups.png"), frame: "laptop", caption: "Auto-generated group tables" },
      { src: S("tournament-knockout.png"), frame: "laptop", caption: "Knockout brackets, automatic" },
      { src: S("tournament-admin.png"), frame: "laptop", caption: "Admin panel: drag, drop, done" },
    ],
  },

  { kind: "module", audio: "yc-06.mp3", dur: 198, eyebrow: "MODULE 03", title: "CLUB SHOP",
    sub: "Branded kit. Zero setup.", shot: { src: S("05-shop.png"), frame: "laptop" } },
  { kind: "module", audio: "yc-07.mp3", dur: 192, eyebrow: "MODULE 04", title: "MEETINGS",
    sub: "Video calls + RSVP, built in.", shot: { src: S("hub-meetings.png"), frame: "phone" } },
  { kind: "module", audio: "yc-08.mp3", dur: 171, eyebrow: "MODULE 05", title: "NEWS",
    sub: "Matchday programmes. AI-assisted.", shot: { src: S("news.png"), frame: "laptop" } },
  { kind: "module", audio: "yc-09.mp3", dur: 174, eyebrow: "MODULE 06", title: "PLAYER SHOWCASE",
    sub: "Trading cards. Stats. Walkouts.", shot: { src: S("showcase.png"), frame: "laptop" } },
  { kind: "module", audio: "yc-10.mp3", dur: 195, eyebrow: "MODULE 07", title: "FUNDRAISING",
    sub: "Raffles & subs on autopilot.", shot: { src: S("08-raffle.png"), frame: "laptop" } },
  { kind: "module", audio: "yc-11.mp3", dur: 156, eyebrow: "MODULE 08", title: "SAFEGUARDING",
    sub: "FA-standard. Anonymous. Audited.", shot: { src: S("safeguarding.png"), frame: "laptop" } },
  { kind: "module", audio: "yc-12.mp3", dur: 156, eyebrow: "MODULE 09", title: "MANAGEMENT",
    sub: "Granular roles. Total oversight.", shot: { src: S("dashboard-mgmt.png"), frame: "laptop" } },

  { kind: "type", audio: "yc-13.mp3", dur: 240, eyebrow: "YOUR CLUB", title: "BUILT FOR\nYOUR CLUB.",
    sub: "White-labelled. Your colours. Your sport.", isOutro: true },
];

export const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0);

/* -------------------- Background -------------------- */
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at ${50 + Math.sin(t * 0.4) * 20}% ${50 + Math.cos(t * 0.3) * 15}%, rgba(201,162,74,0.18), transparent 55%)`,
      }} />
      <div style={{
        position: "absolute", inset: 0, opacity: 0.05,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
        backgroundSize: "3px 3px",
      }} />
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 280,
        background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
      }} />
    </AbsoluteFill>
  );
};

/* -------------------- Wordmark -------------------- */
const Wordmark: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: oswald, color: CREAM, letterSpacing: "0.32em", fontSize: size, fontWeight: 500 }}>
    <div style={{ width: 28, height: 2, background: GOLD }} />
    <span>YOUR <span style={{ color: GOLD }}>CLUB</span></span>
  </div>
);

/* -------------------- Device frames -------------------- */
const Laptop: React.FC<{ src: string; pan: number; zoom: number }> = ({ src, pan, zoom }) => (
  <div style={{ width: 1080, position: "relative" }}>
    <div style={{
      width: "100%", aspectRatio: "16/10",
      background: "#000", borderRadius: 14, padding: 14,
      boxShadow: "0 40px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,162,74,0.18)",
      border: "1px solid #1f1f1f",
    }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 4, overflow: "hidden", background: "#0a0a0a", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 26, background: "#1a1a1a", display: "flex", alignItems: "center", gap: 6, padding: "0 10px", zIndex: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
          <div style={{ marginLeft: 14, fontFamily: inter, fontSize: 10, color: "#888" }}>your-club.app</div>
        </div>
        <div style={{ position: "absolute", top: 26, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          <Img src={staticFile(src)} style={{
            width: "100%", display: "block",
            transform: `scale(${zoom}) translateY(${pan}px)`,
            transformOrigin: "top center",
          }} />
        </div>
      </div>
    </div>
    <div style={{ width: "108%", marginLeft: "-4%", height: 20, background: "linear-gradient(to bottom, #2a2a2a, #0e0e0e)", borderRadius: "0 0 20px 20px", boxShadow: "0 20px 30px rgba(0,0,0,0.5)" }} />
    <div style={{ width: 120, height: 6, margin: "0 auto", background: "#161616", borderRadius: "0 0 8px 8px" }} />
  </div>
);

const Phone: React.FC<{ src: string; pan: number; zoom: number }> = ({ src, pan, zoom }) => (
  <div style={{
    width: 360, height: 740, background: "#0a0a0a", borderRadius: 48, padding: 12,
    border: "2px solid #2a2a2a",
    boxShadow: "0 40px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,162,74,0.2), inset 0 0 0 2px #000",
    position: "relative",
  }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 38, overflow: "hidden", background: "#000", position: "relative" }}>
      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 110, height: 28, background: "#000", borderRadius: 14, zIndex: 3 }} />
      <Img src={staticFile(src)} style={{
        width: "100%", display: "block",
        transform: `scale(${zoom}) translateY(${pan}px)`,
        transformOrigin: "top center",
      }} />
    </div>
  </div>
);

const DeviceShot: React.FC<{ shot: Shot; pan: number; zoom: number }> = ({ shot, pan, zoom }) =>
  shot.frame === "phone" ? <Phone src={shot.src} pan={pan} zoom={zoom} /> : <Laptop src={shot.src} pan={pan} zoom={zoom} />;

/* -------------------- Module scene -------------------- */
const ModuleScene: React.FC<{ scene: Extract<Scene, {kind: "module"}> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 110 } });
  const textX = interpolate(enter, [0, 1], [-50, 0]);
  const shotEnter = spring({ frame: frame - 6, fps, config: { damping: 24, stiffness: 120 } });
  const shotY = interpolate(shotEnter, [0, 1], [60, 0]);
  const shotScale = interpolate(shotEnter, [0, 1], [0.92, 1]);
  const zoom = interpolate(frame, [0, scene.dur], [1, 1.08]);
  const pan = interpolate(frame, [0, scene.dur], [0, -60]);
  const exit = interpolate(frame, [scene.dur - 15, scene.dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = interpolate(spring({ frame: frame - 4, fps, config: { damping: 28 } }), [0, 1], [0, 70]);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={{ position: "absolute", top: 50, left: 60 }}><Wordmark size={14} /></div>
      <div style={{ display: "flex", width: "100%", height: "100%", padding: "120px 80px 80px", gap: 60, alignItems: "center" }}>
        <div style={{ flex: "0 0 460px", opacity: enter, transform: `translateX(${textX}px)` }}>
          <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 600, color: GOLD, letterSpacing: "0.32em", marginBottom: 18 }}>{scene.eyebrow}</div>
          <div style={{ width: bar, height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, marginBottom: 22, borderRadius: 2 }} />
          <div style={{ fontFamily: oswald, fontSize: 78, fontWeight: 700, color: CREAM, letterSpacing: "0.02em", lineHeight: 0.95, whiteSpace: "pre-line" }}>{scene.title}</div>
          <div style={{ fontFamily: inter, fontSize: 22, fontWeight: 300, color: "rgba(236,228,211,0.65)", marginTop: 24, letterSpacing: "0.04em" }}>{scene.sub}</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: shotEnter, transform: `translateY(${shotY}px) scale(${shotScale})` }}>
          <DeviceShot shot={scene.shot} pan={pan} zoom={zoom} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* -------------------- Long scene with cycling shots -------------------- */
const LongScene: React.FC<{ scene: Extract<Scene, {kind: "long"}> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 110 } });
  const textX = interpolate(enter, [0, 1], [-50, 0]);
  const exit = interpolate(frame, [scene.dur - 18, scene.dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = interpolate(spring({ frame: frame - 4, fps, config: { damping: 28 } }), [0, 1], [0, 90]);

  // Cycle shots evenly across the scene
  const shotDur = Math.floor(scene.dur / scene.shots.length);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={{ position: "absolute", top: 50, left: 60 }}><Wordmark size={14} /></div>

      <div style={{ display: "flex", width: "100%", height: "100%", padding: "100px 80px 80px", gap: 60, alignItems: "center" }}>
        {/* Left: persistent title + caption */}
        <div style={{ flex: "0 0 480px", opacity: enter, transform: `translateX(${textX}px)` }}>
          <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 600, color: GOLD, letterSpacing: "0.32em", marginBottom: 18 }}>{scene.eyebrow}</div>
          <div style={{ width: bar, height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, marginBottom: 22, borderRadius: 2 }} />
          <div style={{ fontFamily: oswald, fontSize: 84, fontWeight: 700, color: CREAM, letterSpacing: "0.02em", lineHeight: 0.92, whiteSpace: "pre-line" }}>{scene.title}</div>
          <div style={{ fontFamily: inter, fontSize: 18, fontWeight: 300, color: "rgba(236,228,211,0.55)", marginTop: 28, letterSpacing: "0.08em", lineHeight: 1.6 }}>{scene.sub}</div>

          {/* Cycling caption */}
          <div style={{ marginTop: 40, height: 60, position: "relative" }}>
            {scene.shots.map((shot, i) => {
              const start = i * shotDur;
              const end = start + shotDur;
              const local = frame - start;
              const fadeIn = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const fadeOut = interpolate(frame, [end - 12, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const op = frame >= start && frame < end ? Math.min(fadeIn, fadeOut) : 0;
              return (
                <div key={i} style={{
                  position: "absolute", inset: 0, opacity: op,
                  fontFamily: inter, fontSize: 24, color: GOLD_BRIGHT, fontWeight: 400, letterSpacing: "0.02em",
                }}>
                  <span style={{ color: GOLD, marginRight: 12 }}>{String(i+1).padStart(2,"0")}</span>{shot.caption}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: cycling shots */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "100%" }}>
          {scene.shots.map((shot, i) => {
            const start = i * shotDur;
            const end = start + shotDur;
            const local = frame - start;
            const enterShot = spring({ frame: local, fps, config: { damping: 24, stiffness: 120 } });
            const exitShot = interpolate(frame, [end - 15, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const op = frame >= start && frame < end ? Math.min(enterShot, exitShot) : 0;
            const ty = interpolate(enterShot, [0, 1], [50, 0]);
            const sc = interpolate(enterShot, [0, 1], [0.95, 1]);
            const zoom = interpolate(local, [0, shotDur], [1, 1.06]);
            const pan = interpolate(local, [0, shotDur], [0, -50]);
            if (op <= 0) return null;
            return (
              <div key={i} style={{
                position: "absolute", display: "flex", alignItems: "center", justifyContent: "center",
                opacity: op, transform: `translateY(${ty}px) scale(${sc})`,
              }}>
                <DeviceShot shot={shot} pan={pan} zoom={zoom} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress dots for sub-shots */}
      <div style={{ position: "absolute", bottom: 50, right: 80, display: "flex", gap: 6 }}>
        {scene.shots.map((_, i) => {
          const active = Math.floor(frame / shotDur) === i;
          return <div key={i} style={{ width: active ? 32 : 12, height: 3, background: active ? GOLD : "rgba(255,255,255,0.2)", borderRadius: 2 }} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

/* -------------------- Typography hero -------------------- */
const TypeScene: React.FC<{ scene: Extract<Scene, {kind: "type"}> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 100 } });
  const y = interpolate(enter, [0, 1], [40, 0]);
  const exit = interpolate(frame, [scene.dur - 15, scene.dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subEnter = spring({ frame: frame - 25, fps, config: { damping: 24 } });
  const drift = Math.sin(frame / 80) * 6;

  return (
    <AbsoluteFill style={{ opacity: exit, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 50, left: 60 }}><Wordmark size={14} /></div>
      <div style={{ textAlign: "center", opacity: enter, transform: `translateY(${y + drift}px)`, maxWidth: 1500, padding: "0 80px" }}>
        {scene.eyebrow && (
          <div style={{ fontFamily: inter, fontSize: 16, fontWeight: 600, color: GOLD, letterSpacing: "0.42em", marginBottom: 32 }}>{scene.eyebrow}</div>
        )}
        <div style={{
          fontFamily: oswald, fontSize: scene.isOutro ? 170 : 130, fontWeight: 700, color: CREAM,
          letterSpacing: "0.01em", lineHeight: 0.92, whiteSpace: "pre-line",
          textShadow: "0 0 60px rgba(201,162,74,0.18)",
        }}>{scene.title}</div>
        {scene.sub && (
          <div style={{
            fontFamily: inter, fontSize: 26, fontWeight: 300, color: "rgba(236,228,211,0.7)",
            marginTop: 36, opacity: subEnter, letterSpacing: "0.06em",
          }}>{scene.sub}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* -------------------- Main -------------------- */
export const MainVideoYourClub: React.FC = () => {
  let pos = 0;
  return (
    <AbsoluteFill>
      <Background />
      {SCENES.map((scene, i) => {
        const from = pos;
        pos += scene.dur;
        return (
          <Sequence key={i} from={from} durationInFrames={scene.dur}>
            {scene.kind === "type" ? <TypeScene scene={scene} /> :
             scene.kind === "long" ? <LongScene scene={scene} /> :
             <ModuleScene scene={scene} />}
            <Audio src={staticFile(`audio/${scene.audio}`)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
