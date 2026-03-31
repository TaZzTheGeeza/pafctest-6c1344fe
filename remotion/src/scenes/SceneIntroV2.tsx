import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
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

export const SceneIntroV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle background pulse
  const bgPulse = Math.sin(frame * 0.02) * 3;

  // Logo entrance
  const logoSpring = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 100 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.3, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  // Title reveal
  const titleSpring = spring({ frame: frame - 40, fps, config: { damping: 20, stiffness: 120 } });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);

  // Subtitle
  const subSpring = spring({ frame: frame - 70, fps, config: { damping: 25 } });

  // Tagline
  const tagSpring = spring({ frame: frame - 100, fps, config: { damping: 20 } });

  // Floating particles
  const particles = Array.from({ length: 8 }, (_, i) => ({
    x: 100 + i * 220,
    y: 200 + Math.sin(frame * 0.015 + i * 1.5) * 80,
    size: 3 + Math.sin(i * 2) * 2,
    opacity: 0.15 + Math.sin(frame * 0.02 + i) * 0.1,
  }));

  return (
    <AbsoluteFill>
      {/* Dark gradient background */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% ${40 + bgPulse}%, #1a1207 0%, #0a0a0a 60%, #050505 100%)`,
        }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#b8860b",
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 20,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          <Img
            src={staticFile("screenshots/01-homepage.png")}
            style={{
              width: 900,
              borderRadius: 16,
              boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(184,134,11,0.2)",
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: oswald,
            fontSize: 64,
            fontWeight: 700,
            color: "#e8e0d0",
            letterSpacing: "0.06em",
            textAlign: "center",
            opacity: titleSpring,
            transform: `translateY(${titleY}px)`,
            marginTop: 30,
          }}
        >
          YOUR CLUB. <span style={{ color: "#d4a843" }}>FULLY DIGITAL.</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: inter,
            fontSize: 24,
            fontWeight: 300,
            color: "#a09880",
            letterSpacing: "0.15em",
            textAlign: "center",
            opacity: subSpring,
          }}
        >
          BUILT FOR GRASSROOTS FOOTBALL
        </div>

        {/* Gold bar */}
        <div
          style={{
            width: interpolate(tagSpring, [0, 1], [0, 120]),
            height: 3,
            background: "linear-gradient(90deg, transparent, #b8860b, transparent)",
            marginTop: 10,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
