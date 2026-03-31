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

const { fontFamily: oswald } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["300"],
  subsets: ["latin"],
});

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screenshot zooms in from background
  const bgScale = interpolate(frame, [0, 383], [1.15, 1.3], {
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(frame, [0, 30, 300, 383], [0, 0.3, 0.3, 0.15], {
    extrapolateRight: "clamp",
  });

  // Gold line sweep
  const lineX = interpolate(frame, [10, 50], [-100, 110], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title animations
  const titleSpring = spring({ frame: frame - 20, fps, config: { damping: 15, stiffness: 100 } });
  const subtitleSpring = spring({ frame: frame - 35, fps, config: { damping: 20 } });
  const taglineSpring = spring({ frame: frame - 50, fps, config: { damping: 20 } });

  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const subtitleY = interpolate(subtitleSpring, [0, 1], [40, 0]);

  // Floating particles
  const particle1Y = interpolate(frame, [0, 383], [600, -100]);
  const particle2Y = interpolate(frame, [0, 383], [800, -200]);

  return (
    <AbsoluteFill>
      {/* Dark base */}
      <AbsoluteFill style={{ backgroundColor: "#080808" }} />

      {/* Background screenshot - blurred and zoomed */}
      <AbsoluteFill
        style={{
          opacity: bgOpacity,
          transform: `scale(${bgScale})`,
          filter: "blur(4px)",
        }}
      >
        <Img src={staticFile("screenshots/01-homepage.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>

      {/* Gradient overlay */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Gold sweep line */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${lineX}%`,
          width: 3,
          height: 300,
          background: "linear-gradient(180deg, transparent, #b8860b, transparent)",
          transform: "translateY(-50%)",
        }}
      />

      {/* Floating gold particles */}
      <div
        style={{
          position: "absolute",
          left: "20%",
          top: particle1Y,
          width: 4,
          height: 4,
          borderRadius: "50%",
          backgroundColor: "rgba(184, 134, 11, 0.4)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "30%",
          top: particle2Y,
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "rgba(184, 134, 11, 0.25)",
        }}
      />

      {/* Main content */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Club name */}
          <div
            style={{
              fontFamily: oswald,
              fontSize: 110,
              fontWeight: 700,
              letterSpacing: "0.04em",
              background: "linear-gradient(135deg, #b8860b, #d4a843)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              opacity: titleSpring,
              transform: `translateY(${titleY}px)`,
              lineHeight: 1,
            }}
          >
            PETERBOROUGH
          </div>
          <div
            style={{
              fontFamily: oswald,
              fontSize: 110,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#e8e0d0",
              opacity: titleSpring,
              transform: `translateY(${titleY}px)`,
              lineHeight: 1,
            }}
          >
            ATHLETIC FC
          </div>

          {/* Tagline */}
          <div
            style={{
              fontFamily: inter,
              fontSize: 24,
              fontWeight: 300,
              letterSpacing: "0.35em",
              color: "#b8860b",
              opacity: subtitleSpring,
              transform: `translateY(${subtitleY}px)`,
              marginTop: 16,
            }}
          >
            THE LIONS · EST. 2020
          </div>

          {/* URL */}
          <div
            style={{
              fontFamily: inter,
              fontSize: 32,
              fontWeight: 300,
              letterSpacing: "0.15em",
              color: "rgba(232, 224, 208, 0.8)",
              opacity: taglineSpring,
              marginTop: 40,
              padding: "12px 40px",
              border: "1px solid rgba(184, 134, 11, 0.4)",
              borderRadius: 8,
            }}
          >
            www.pa-fc.uk
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
