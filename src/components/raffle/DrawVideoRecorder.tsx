import { useEffect, useRef, useCallback } from "react";

interface DrawVideoRecorderProps {
  raffleName: string;
  winnerName: string;
  ticketNumber: number;
  participantNames: string[];
  onVideoReady: (blob: Blob) => void;
}

/**
 * Renders the raffle draw animation entirely on a hidden <canvas>,
 * records it via MediaRecorder, and returns the WebM blob when done.
 * No DOM-to-canvas conversion — everything is drawn natively on canvas.
 */
const DrawVideoRecorder = ({
  raffleName,
  winnerName,
  ticketNumber,
  participantNames,
  onVideoReady,
}: DrawVideoRecorderProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number>(0);

  const WIDTH = 1280;
  const HEIGHT = 720;
  const FPS = 30;
  const TOTAL_FRAMES = FPS * 12; // 12 seconds

  const digits = String(ticketNumber).padStart(3, "0").split("");

  // Deterministic pseudo-random for confetti
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 49267;
    return x - Math.floor(x);
  };

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number) => {
      const t = frame / FPS; // time in seconds

      // === Background ===
      const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      grad.addColorStop(0, "#0f0f0f");
      grad.addColorStop(1, "#1a1206");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // === Subtle grid pattern ===
      ctx.strokeStyle = "rgba(212, 175, 55, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < WIDTH; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < HEIGHT; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
      }

      // === Phase calculations ===
      const PHASE_INTRO_END = 2; // 0-2s: Title
      const PHASE_SPIN_END = 5; // 2-5s: Spinning digits
      const PHASE_REVEAL_END = 7.5; // 5-7.5s: Revealing digits
      const PHASE_WINNER_START = 8; // 8s: Winner name
      const PHASE_END = 12;

      // === Raffle Title (always visible, fades in) ===
      const titleAlpha = Math.min(1, t / 0.5);
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(212, 175, 55, ${titleAlpha * 0.5})`;
      ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
      ctx.letterSpacing = "8px";
      ctx.fillText(raffleName.toUpperCase(), WIDTH / 2, 80);
      ctx.letterSpacing = "0px";

      // === Phase: Intro (0-2s) ===
      if (t < PHASE_INTRO_END) {
        const introT = t / PHASE_INTRO_END;
        const scale = 0.5 + introT * 0.5;
        const alpha = Math.min(1, introT * 2);

        ctx.save();
        ctx.translate(WIDTH / 2, HEIGHT / 2 - 30);
        ctx.scale(scale, scale);

        // Trophy icon (simple)
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
        ctx.font = '72px Arial';
        ctx.fillText("🏆", 0, -40);

        // "RAFFLE DRAW" text
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif';
        ctx.fillText("RAFFLE DRAW", 0, 50);

        // Participant count
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha * 0.8})`;
        ctx.font = '24px "Segoe UI", Arial, sans-serif';
        ctx.fillText(
          `${participantNames.length} participants`,
          0,
          95
        );

        ctx.restore();
        return;
      }

      // === Phase: Spinning / Revealing digits (2-7.5s) ===
      if (t < PHASE_WINNER_START) {
        const isRevealing = t >= PHASE_SPIN_END;

        // Header text
        const headerAlpha = Math.min(1, (t - PHASE_INTRO_END) * 3);
        ctx.fillStyle = `rgba(255, 255, 255, ${headerAlpha})`;
        ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(
          isRevealing ? "REVEALING..." : "SHUFFLING...",
          WIDTH / 2,
          180
        );

        // Hash symbol
        ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
        ctx.font = 'bold 80px "Segoe UI", Arial, sans-serif';
        const digitBlockWidth = digits.length * 120 + (digits.length - 1) * 20;
        const hashX = WIDTH / 2 - digitBlockWidth / 2 - 60;
        ctx.fillText("#", hashX, HEIGHT / 2 + 25);

        // Digit columns
        const startX = WIDTH / 2 - digitBlockWidth / 2 + 60;
        digits.forEach((targetDigit, i) => {
          const x = startX + i * 140;
          const y = HEIGHT / 2;

          // Is this digit revealed?
          const revealTime = PHASE_SPIN_END + i * 0.8 + 0.3;
          const isDigitRevealed = isRevealing && t >= revealTime;

          // Box
          if (isDigitRevealed) {
            ctx.fillStyle = "rgba(212, 175, 55, 0.9)";
            // Glow
            ctx.shadowColor = "rgba(212, 175, 55, 0.4)";
            ctx.shadowBlur = 20;
          } else {
            ctx.fillStyle = "rgba(40, 35, 25, 0.9)";
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
          }

          const boxW = 100;
          const boxH = 130;
          const radius = 16;

          // Rounded rect
          ctx.beginPath();
          ctx.moveTo(x - boxW / 2 + radius, y - boxH / 2);
          ctx.lineTo(x + boxW / 2 - radius, y - boxH / 2);
          ctx.quadraticCurveTo(x + boxW / 2, y - boxH / 2, x + boxW / 2, y - boxH / 2 + radius);
          ctx.lineTo(x + boxW / 2, y + boxH / 2 - radius);
          ctx.quadraticCurveTo(x + boxW / 2, y + boxH / 2, x + boxW / 2 - radius, y + boxH / 2);
          ctx.lineTo(x - boxW / 2 + radius, y + boxH / 2);
          ctx.quadraticCurveTo(x - boxW / 2, y + boxH / 2, x - boxW / 2, y + boxH / 2 - radius);
          ctx.lineTo(x - boxW / 2, y - boxH / 2 + radius);
          ctx.quadraticCurveTo(x - boxW / 2, y - boxH / 2, x - boxW / 2 + radius, y - boxH / 2);
          ctx.closePath();
          ctx.fill();

          // Border
          ctx.strokeStyle = isDigitRevealed
            ? "rgba(212, 175, 55, 1)"
            : "rgba(212, 175, 55, 0.2)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Digit text
          let displayDigit: string;
          if (isDigitRevealed) {
            displayDigit = targetDigit;
          } else {
            displayDigit = String(Math.floor(seededRandom(frame * 13 + i * 97) * 10));
          }

          ctx.fillStyle = isDigitRevealed ? "#1a1206" : "rgba(255, 255, 255, 0.9)";
          ctx.font = 'bold 64px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(displayDigit, x, y + 4);
        });

        ctx.textBaseline = "alphabetic";

        // Name scroller below digits
        ctx.fillStyle = "rgba(212, 175, 55, 0.4)";
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.letterSpacing = "4px";
        ctx.fillText("WINNER", WIDTH / 2, HEIGHT / 2 + 110);
        ctx.letterSpacing = "0px";

        let displayName: string;
        if (isRevealing && t >= PHASE_REVEAL_END - 0.5) {
          displayName = winnerName;
          ctx.fillStyle = "rgba(212, 175, 55, 1)";
        } else {
          const nameIdx = Math.floor(seededRandom(frame * 7) * participantNames.length);
          displayName = participantNames[nameIdx] || winnerName;
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        }

        ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
        ctx.fillText(displayName, WIDTH / 2, HEIGHT / 2 + 150);

        return;
      }

      // === Phase: Winner reveal (8-12s) ===
      const winnerT = (t - PHASE_WINNER_START) / (PHASE_END - PHASE_WINNER_START);

      // Confetti
      if (winnerT > 0.05) {
        for (let i = 0; i < 60; i++) {
          const confettiT = winnerT - 0.05;
          const seed = i;
          const cx = seededRandom(seed) * WIDTH;
          const startY = -20;
          const speed = 80 + seededRandom(seed + 100) * 200;
          const cy = startY + confettiT * speed * FPS * 0.05;
          const wobble = Math.sin(t * 3 + seed) * 30;
          const size = 4 + seededRandom(seed + 200) * 8;
          const rotation = t * (2 + seededRandom(seed + 300) * 4);

          if (cy > HEIGHT + 20) continue;

          const colors = [
            "rgba(212, 175, 55, 0.8)",
            "rgba(255, 100, 100, 0.8)",
            "rgba(100, 200, 100, 0.8)",
            "rgba(100, 150, 255, 0.8)",
            "rgba(200, 100, 255, 0.8)",
          ];
          const color = colors[Math.floor(seededRandom(seed + 400) * colors.length)];

          ctx.save();
          ctx.translate(cx + wobble, cy);
          ctx.rotate(rotation);
          ctx.fillStyle = color;
          ctx.fillRect(-size / 2, -size / 4, size, size / 2);
          ctx.restore();
        }
      }

      // Trophy
      const trophyScale = Math.min(1, winnerT * 4);
      const trophyPulse = 1 + Math.sin(t * 3) * 0.03;
      ctx.save();
      ctx.translate(WIDTH / 2, 220);
      ctx.scale(trophyScale * trophyPulse, trophyScale * trophyPulse);

      // Trophy circle background
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(212, 175, 55, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = '48px Arial';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(212, 175, 55, 1)";
      ctx.fillText("🏆", 0, 2);
      ctx.restore();
      ctx.textBaseline = "alphabetic";

      // "The Winner Is" label
      const labelAlpha = Math.min(1, Math.max(0, (winnerT - 0.15) * 5));
      ctx.fillStyle = `rgba(255, 255, 255, ${labelAlpha * 0.6})`;
      ctx.font = '18px "Segoe UI", Arial, sans-serif';
      ctx.letterSpacing = "6px";
      ctx.textAlign = "center";
      ctx.fillText("🎉  THE WINNER IS  🎉", WIDTH / 2, 330);
      ctx.letterSpacing = "0px";

      // Winner name
      const nameAlpha = Math.min(1, Math.max(0, (winnerT - 0.25) * 4));
      const nameScale = 0.5 + nameAlpha * 0.5;
      ctx.save();
      ctx.translate(WIDTH / 2, 410);
      ctx.scale(nameScale, nameScale);
      ctx.fillStyle = `rgba(212, 175, 55, ${nameAlpha})`;
      ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif';
      ctx.fillText(winnerName, 0, 0);
      ctx.restore();

      // Ticket number
      const ticketAlpha = Math.min(1, Math.max(0, (winnerT - 0.4) * 4));
      ctx.fillStyle = `rgba(180, 180, 180, ${ticketAlpha})`;
      ctx.font = '28px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(`Ticket #${ticketNumber}`, WIDTH / 2, 480);

      // "Congratulations!" text
      const congratsAlpha = Math.min(1, Math.max(0, (winnerT - 0.55) * 3));
      ctx.fillStyle = `rgba(212, 175, 55, ${congratsAlpha * 0.6})`;
      ctx.font = '22px "Segoe UI", Arial, sans-serif';
      ctx.fillText("Congratulations!", WIDTH / 2, 540);
    },
    [digits, winnerName, ticketNumber, participantNames, raffleName, FPS, HEIGHT, WIDTH]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up MediaRecorder
    const stream = canvas.captureStream(FPS);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      onVideoReady(blob);
    };

    // Start recording
    recorder.start(100); // collect data every 100ms

    // Animate
    let frame = 0;
    const interval = setInterval(() => {
      if (frame >= TOTAL_FRAMES) {
        clearInterval(interval);
        recorder.stop();
        return;
      }
      drawFrame(ctx, frame);
      frame++;
    }, 1000 / FPS);

    return () => {
      clearInterval(interval);
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    };
  }, [drawFrame, FPS, TOTAL_FRAMES, onVideoReady]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{ position: "fixed", top: -9999, left: -9999, opacity: 0, pointerEvents: "none" }}
    />
  );
};

export default DrawVideoRecorder;
