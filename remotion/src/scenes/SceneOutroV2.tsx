import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: oswald } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});
const { fontFamily: inter } = loadInter("normal", {
  weights: ["300", "400", "600"],
  subsets: ["latin"],
});

export const SceneOutroV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = Math.sin(frame * 0.03) * 5;

  // Main text
  const mainSpring = spring({ frame: frame - 15, fps, config: { damping: 15, stiffness: 100 } });
  const mainScale = interpolate(mainSpring, [0, 1], [0.8, 1]);

  // Subtitle
  const subSpring = spring({ frame: frame - 45, fps, config: { damping: 20 } });
  const subY = interpolate(subSpring, [0, 1], [30, 0]);

  // Gold bar
  const barSpring = spring({ frame: frame - 30, fps, config: { damping: 25 } });
  const barWidth = interpolate(barSpring, [0, 1], [0, 200]);

  // Features list
  const features = [
    "Club Hub", "Tournament System", "Payments",
    "Team Chat", "Video Meetings", "Club Shop",
    "Raffle System", "Coach Tools", "Admin Dashboard"
  ];

  // CTA section
  const ctaSpring = spring({ frame: frame - 160, fps, config: { damping: 18 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0.9, 1]);

  const nameSpring = spring({ frame: frame - 200, fps, config: { damping: 15, stiffness: 120 } });

  // Bar 2 under CTA
  const bar2Spring = spring({ frame: frame - 180, fps, config: { damping: 25 } });
  const bar2Width = interpolate(bar2Spring, [0, 1], [0, 300]);

  // Subtle glow pulse on "Ben Masters"
  const glowPulse = Math.sin(frame * 0.05) * 0.3 + 0.7;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% ${45 + pulse}%, #1a1207 0%, #0a0a0a 55%, #050505 100%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 18,
        }}
      >
        {/* Main title */}
        <div
          style={{
            fontFamily: oswald,
            fontSize: 68,
            fontWeight: 700,
            color: "#e8e0d0",
            letterSpacing: "0.06em",
            textAlign: "center",
            opacity: mainSpring,
            transform: `scale(${mainScale})`,
          }}
        >
          READY TO <span style={{ color: "#d4a843" }}>GO DIGITAL?</span>
        </div>

        {/* Gold bar */}
        <div
          style={{
            width: barWidth,
            height: 3,
            background: "linear-gradient(90deg, transparent, #b8860b, transparent)",
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontFamily: inter,
            fontSize: 20,
            fontWeight: 300,
            color: "#a09880",
            letterSpacing: "0.12em",
            textAlign: "center",
            opacity: subSpring,
            transform: `translateY(${subY}px)`,
            maxWidth: 700,
          }}
        >
          A COMPLETE DIGITAL PLATFORM FOR YOUR GRASSROOTS CLUB
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            maxWidth: 800,
            marginTop: 12,
          }}
        >
          {features.map((feat, i) => {
            const pillSpring = spring({
              frame: frame - 70 - i * 6,
              fps,
              config: { damping: 15 },
            });
            return (
              <div
                key={i}
                style={{
                  fontFamily: inter,
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#d4a843",
                  border: "1px solid rgba(184,134,11,0.3)",
                  borderRadius: 20,
                  padding: "6px 18px",
                  opacity: pillSpring,
                  transform: `scale(${interpolate(pillSpring, [0, 1], [0.8, 1])})`,
                  letterSpacing: "0.1em",
                }}
              >
                {feat}
              </div>
            );
          })}
        </div>

        {/* Gold bar 2 */}
        <div
          style={{
            width: bar2Width,
            height: 2,
            background: "linear-gradient(90deg, transparent, #b8860b, transparent)",
            marginTop: 20,
          }}
        />

        {/* CTA: Want this for your club? */}
        <div
          style={{
            fontFamily: inter,
            fontSize: 22,
            fontWeight: 300,
            color: "#c0b090",
            letterSpacing: "0.15em",
            textAlign: "center",
            marginTop: 10,
            opacity: ctaSpring,
            transform: `scale(${ctaScale})`,
          }}
        >
          WANT THIS FOR YOUR CLUB?
        </div>

        {/* Contact: Ben Masters */}
        <div
          style={{
            fontFamily: oswald,
            fontSize: 42,
            fontWeight: 700,
            color: "#d4a843",
            letterSpacing: "0.08em",
            textAlign: "center",
            opacity: nameSpring,
            transform: `scale(${interpolate(nameSpring, [0, 1], [0.85, 1])})`,
            textShadow: `0 0 ${30 * glowPulse}px rgba(212,168,67,${0.3 * glowPulse})`,
          }}
        >
          CONTACT BEN MASTERS
        </div>

        <div
          style={{
            fontFamily: inter,
            fontSize: 16,
            fontWeight: 400,
            color: "#706850",
            letterSpacing: "0.15em",
            opacity: interpolate(
              spring({ frame: frame - 220, fps, config: { damping: 20 } }),
              [0, 1],
              [0, 1]
            ),
          }}
        >
          CLUB CHAIRMAN · PAFC
        </div>
      </div>
    </AbsoluteFill>
  );
};
