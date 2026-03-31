import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: oswald } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
const { fontFamily: inter } = loadInter("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

interface Props {
  screenshotSrc: string;
  title: string;
  subtitle: string;
  bullets?: string[];
  layout?: "left" | "right";
  accentColor?: string;
}

export const SceneFeatureHighlight: React.FC<Props> = ({
  screenshotSrc,
  title,
  subtitle,
  bullets = [],
  layout = "left",
  accentColor = "#b8860b",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screenshot entrance
  const imgSpring = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 120 } });
  const imgX = interpolate(imgSpring, [0, 1], [layout === "left" ? -80 : 80, 0]);
  const slowZoom = interpolate(frame, [0, 600], [1, 1.04], { extrapolateRight: "clamp" });

  // Title
  const titleSpring = spring({ frame: frame - 15, fps, config: { damping: 15, stiffness: 150 } });
  const titleX = interpolate(titleSpring, [0, 1], [layout === "left" ? 60 : -60, 0]);

  // Subtitle
  const subSpring = spring({ frame: frame - 30, fps, config: { damping: 20 } });

  // Gold bar
  const barWidth = interpolate(
    spring({ frame: frame - 10, fps, config: { damping: 25 } }),
    [0, 1],
    [0, 80]
  );

  // Gentle sway
  const sway = Math.sin(frame * 0.008) * 2;

  const textContent = (
    <div
      style={{
        flex: "0 0 420px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 14,
        padding: "0 20px",
      }}
    >
      {/* Gold accent bar */}
      <div
        style={{
          width: barWidth,
          height: 4,
          background: `linear-gradient(90deg, ${accentColor}, #d4a843)`,
          borderRadius: 2,
          marginBottom: 6,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: oswald,
          fontSize: 48,
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
          fontSize: 18,
          fontWeight: 300,
          color: accentColor,
          letterSpacing: "0.2em",
          opacity: subSpring,
        }}
      >
        {subtitle}
      </div>

      {/* Bullet points */}
      {bullets.map((bullet, i) => {
        const bulletSpring = spring({
          frame: frame - 45 - i * 12,
          fps,
          config: { damping: 20 },
        });
        const bulletX = interpolate(bulletSpring, [0, 1], [30, 0]);
        return (
          <div
            key={i}
            style={{
              fontFamily: inter,
              fontSize: 16,
              fontWeight: 400,
              color: "#c8c0b0",
              opacity: bulletSpring,
              transform: `translateX(${bulletX}px)`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: i === 0 ? 10 : 0,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accentColor,
                flexShrink: 0,
              }}
            />
            {bullet}
          </div>
        );
      })}
    </div>
  );

  const imageContent = (
    <div
      style={{
        flex: 1,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: imgSpring,
        transform: `translateX(${imgX}px) translateY(${sway}px)`,
      }}
    >
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,134,11,0.15)`,
          transform: `scale(${slowZoom})`,
          maxHeight: "88%",
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
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }} />
      {/* Subtle radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${layout === "left" ? "70% 50%" : "30% 50%"}, hsla(38, 40%, 12%, 0.3) 0%, transparent 60%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 60,
          gap: 40,
          alignItems: "center",
          flexDirection: layout === "right" ? "row-reverse" : "row",
        }}
      >
        {textContent}
        {imageContent}
      </div>
    </AbsoluteFill>
  );
};
