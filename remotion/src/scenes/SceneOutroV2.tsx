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
  weights: ["300", "400"],
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
          gap: 24,
        }}
      >
        {/* Main title */}
        <div
          style={{
            fontFamily: oswald,
            fontSize: 72,
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
            fontSize: 22,
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
            gap: 12,
            justifyContent: "center",
            maxWidth: 800,
            marginTop: 20,
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
                  fontSize: 14,
                  fontWeight: 400,
                  color: "#d4a843",
                  border: "1px solid rgba(184,134,11,0.3)",
                  borderRadius: 20,
                  padding: "8px 20px",
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

        {/* Contact */}
        <div
          style={{
            fontFamily: inter,
            fontSize: 16,
            fontWeight: 300,
            color: "#706850",
            letterSpacing: "0.15em",
            marginTop: 30,
            opacity: interpolate(
              spring({ frame: frame - 140, fps, config: { damping: 20 } }),
              [0, 1],
              [0, 1]
            ),
          }}
        >
          LET'S BUILD SOMETHING AMAZING
        </div>
      </div>
    </AbsoluteFill>
  );
};
