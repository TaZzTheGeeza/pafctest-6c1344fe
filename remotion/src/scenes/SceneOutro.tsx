import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Oswald";

const { fontFamily: oswald } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.6, 1]);

  const textSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 20 },
  });

  const urlSpring = spring({
    frame: frame - 50,
    fps,
    config: { damping: 20 },
  });

  const tagSpring = spring({
    frame: frame - 65,
    fps,
    config: { damping: 20 },
  });

  // Pulsing gold ring
  const pulseScale = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [1, 1.08]
  );

  // Fade to black at end
  const fadeOut = interpolate(frame, [280, 350], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#080808" }} />

      {/* Radial gold glow */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(184,134,11,0.12) 0%, transparent 50%)",
        }}
      />

      {/* Pulsing ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: "1px solid rgba(184,134,11,0.15)",
          transform: `translate(-50%, -55%) scale(${pulseScale})`,
          opacity: logoSpring * 0.5,
        }}
      />

      {/* Content */}
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
            gap: 12,
          }}
        >
          {/* Lion emoji as logo placeholder */}
          <div
            style={{
              fontSize: 80,
              opacity: logoSpring,
              transform: `scale(${logoScale})`,
              marginBottom: 16,
            }}
          >
            🦁
          </div>

          {/* Club name */}
          <div
            style={{
              fontFamily: oswald,
              fontSize: 72,
              fontWeight: 700,
              background: "linear-gradient(135deg, #b8860b, #d4a843)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              opacity: textSpring,
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            PETERBOROUGH ATHLETIC FC
          </div>

          {/* Tagline */}
          <div
            style={{
              fontFamily: inter,
              fontSize: 22,
              fontWeight: 300,
              color: "rgba(232,224,208,0.7)",
              letterSpacing: "0.25em",
              opacity: textSpring,
              marginTop: 4,
            }}
          >
            GRASSROOTS FOOTBALL FOR ALL
          </div>

          {/* URL */}
          <div
            style={{
              fontFamily: oswald,
              fontSize: 42,
              fontWeight: 600,
              color: "#e8e0d0",
              letterSpacing: "0.1em",
              opacity: urlSpring,
              marginTop: 40,
              padding: "16px 50px",
              border: "2px solid rgba(184,134,11,0.5)",
              borderRadius: 10,
              background: "rgba(184,134,11,0.08)",
            }}
          >
            WWW.PA-FC.UK
          </div>

          {/* FA accredited */}
          <div
            style={{
              fontFamily: inter,
              fontSize: 16,
              fontWeight: 400,
              color: "rgba(184,134,11,0.6)",
              letterSpacing: "0.3em",
              opacity: tagSpring,
              marginTop: 24,
            }}
          >
            FA ACCREDITED · EST. 2020
          </div>
        </div>
      </AbsoluteFill>

      {/* Fade to black */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: fadeOut,
        }}
      />
    </AbsoluteFill>
  );
};
