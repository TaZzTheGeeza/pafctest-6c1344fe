import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
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

interface Props {
  screenshotSrc: string;
  title: string;
  subtitle: string;
}

export const SceneScreenshot: React.FC<Props> = ({
  screenshotSrc,
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screenshot entrance - slides up and scales
  const screenshotSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 20, stiffness: 120 },
  });
  const screenshotY = interpolate(screenshotSpring, [0, 1], [80, 0]);
  const screenshotScale = interpolate(screenshotSpring, [0, 1], [0.9, 1]);

  // Slow zoom on screenshot over time
  const slowZoom = interpolate(frame, [0, 400], [1, 1.05], {
    extrapolateRight: "clamp",
  });

  // Title entrance
  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const titleX = interpolate(titleSpring, [0, 1], [-60, 0]);

  // Subtitle entrance
  const subSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 20 },
  });

  // Gold accent bar
  const barWidth = interpolate(
    spring({ frame: frame - 10, fps, config: { damping: 25 } }),
    [0, 1],
    [0, 80]
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }} />

      {/* Layout: title on left, screenshot on right */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 60,
          gap: 40,
          alignItems: "center",
        }}
      >
        {/* Left side - Title area */}
        <div
          style={{
            flex: "0 0 380px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {/* Gold accent bar */}
          <div
            style={{
              width: barWidth,
              height: 4,
              background: "linear-gradient(90deg, #b8860b, #d4a843)",
              borderRadius: 2,
              marginBottom: 8,
            }}
          />

          {/* Title */}
          <div
            style={{
              fontFamily: oswald,
              fontSize: 56,
              fontWeight: 700,
              color: "#e8e0d0",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
              opacity: titleSpring,
              transform: `translateX(${titleX}px)`,
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontFamily: inter,
              fontSize: 20,
              fontWeight: 300,
              color: "#b8860b",
              letterSpacing: "0.2em",
              opacity: subSpring,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Right side - Screenshot */}
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: screenshotSpring,
            transform: `translateY(${screenshotY}px) scale(${screenshotScale})`,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,134,11,0.15)",
              transform: `scale(${slowZoom})`,
              maxHeight: "90%",
            }}
          >
            <Img
              src={screenshotSrc}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
