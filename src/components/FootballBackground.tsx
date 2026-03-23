import { useEffect, useRef, useCallback } from "react";

interface Confetti {
  x: number;
  y: number;
  width: number;
  height: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  color: string;
}

const COLORS = [
  "hsla(38, 45%, 47%, ALPHA)",   // gold
  "hsla(38, 40%, 58%, ALPHA)",   // light gold
  "hsla(38, 50%, 34%, ALPHA)",   // dark gold
  "hsla(0, 0%, 20%, ALPHA)",     // dark grey
  "hsla(0, 0%, 30%, ALPHA)",     // mid grey
  "hsla(38, 60%, 65%, ALPHA)",   // bright gold
];

export const FootballBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const confettiRef = useRef<Confetti[]>([]);
  const animationRef = useRef<number>(0);

  const createConfetti = useCallback((width: number, height: number) => {
    const pieces: Confetti[] = [];
    const count = Math.floor((width * height) / 12000);

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * width,
        y: Math.random() * height,
        width: Math.random() * 6 + 3,
        height: Math.random() * 4 + 2,
        speedY: Math.random() * 0.4 + 0.15,
        speedX: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        flip: Math.random() * Math.PI * 2,
        flipSpeed: Math.random() * 0.02 + 0.01,
        opacity: Math.random() * 0.12 + 0.04,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    return pieces;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      confettiRef.current = createConfetti(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;
      const swirl = 80;

      confettiRef.current.forEach((c) => {
        // Mouse swirl effect
        const dx = c.x - mouse.x;
        const dy = c.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < swirl && dist > 0) {
          const force = (swirl - dist) / swirl;
          // Push away + add spin
          c.x += (dx / dist) * force * 3;
          c.y += (dy / dist) * force * 2;
          c.rotationSpeed += force * 0.01;
          c.opacity = Math.min(c.opacity + 0.01, 0.3);
        } else {
          c.opacity += (Math.random() * 0.12 + 0.04 - c.opacity) * 0.005;
        }

        // Fall & drift
        c.y += c.speedY;
        c.x += c.speedX + Math.sin(c.rotation) * 0.15;
        c.rotation += c.rotationSpeed;
        c.flip += c.flipSpeed;

        // Wrap
        if (c.y > canvas.height + 10) {
          c.y = -10;
          c.x = Math.random() * canvas.width;
        }
        if (c.x < -10) c.x = canvas.width + 10;
        if (c.x > canvas.width + 10) c.x = -10;

        // Draw confetti piece
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);

        const scaleX = Math.cos(c.flip);
        ctx.scale(scaleX, 1);

        ctx.globalAlpha = c.opacity;
        ctx.fillStyle = c.color.replace("ALPHA", String(c.opacity));
        
        // Rounded rectangle confetti
        const w = c.width;
        const h = c.height;
        const r = 1;
        ctx.beginPath();
        ctx.moveTo(-w / 2 + r, -h / 2);
        ctx.lineTo(w / 2 - r, -h / 2);
        ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
        ctx.lineTo(w / 2, h / 2 - r);
        ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
        ctx.lineTo(-w / 2 + r, h / 2);
        ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
        ctx.lineTo(-w / 2, -h / 2 + r);
        ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
        ctx.fill();

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [createConfetti]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
};
