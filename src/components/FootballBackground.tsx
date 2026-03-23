import { useEffect, useRef, useCallback } from "react";

interface Ember {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  life: number;
  maxLife: number;
  opacity: number;
  hue: number;
  lightness: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
}

export const FootballBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const embersRef = useRef<Ember[]>([]);
  const animationRef = useRef<number>(0);

  const spawnEmber = useCallback((width: number, height: number, fromBottom = true): Ember => {
    return {
      x: Math.random() * width,
      y: fromBottom ? height + Math.random() * 40 : Math.random() * height,
      size: Math.random() * 3 + 1,
      speedY: -(Math.random() * 0.8 + 0.3),
      speedX: (Math.random() - 0.5) * 0.2,
      life: 0,
      maxLife: Math.random() * 400 + 200,
      opacity: 0,
      hue: 38 + (Math.random() - 0.5) * 10,
      lightness: 45 + Math.random() * 20,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      wobbleAmp: Math.random() * 1.5 + 0.5,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.floor((canvas.width * canvas.height) / 8000);
      embersRef.current = Array.from({ length: count }, () =>
        spawnEmber(canvas.width, canvas.height, false)
      );
      // Randomize initial life so they don't all appear at once
      embersRef.current.forEach((e) => {
        e.life = Math.random() * e.maxLife;
      });
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
      const mouseRadius = 150;

      embersRef.current.forEach((e, i) => {
        e.life++;

        // Fade in, sustain, fade out
        const fadeIn = Math.min(e.life / 60, 1);
        const fadeOut = Math.max(1 - (e.life - e.maxLife + 80) / 80, 0);
        e.opacity = fadeIn * fadeOut * 0.35;

        // Float upward with wobble
        e.y += e.speedY;
        e.x += e.speedX + Math.sin(e.wobblePhase + e.life * e.wobbleSpeed) * e.wobbleAmp * 0.3;

        // Mouse interaction — scatter embers
        const dx = e.x - mouse.x;
        const dy = e.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius && dist > 0) {
          const force = (mouseRadius - dist) / mouseRadius;
          e.x += (dx / dist) * force * 4;
          e.y += (dy / dist) * force * 3;
          e.opacity = Math.min(e.opacity + force * 0.3, 0.7);
          e.size = Math.min(e.size + force * 0.5, 5);
        }

        // Respawn if dead or off screen
        if (e.life >= e.maxLife || e.y < -20) {
          embersRef.current[i] = spawnEmber(canvas.width, canvas.height, true);
          return;
        }

        // Draw glow
        if (e.opacity > 0.05) {
          const glowSize = e.size * 4;
          const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glowSize);
          glow.addColorStop(0, `hsla(${e.hue}, 50%, ${e.lightness}%, ${e.opacity * 0.4})`);
          glow.addColorStop(1, `hsla(${e.hue}, 50%, ${e.lightness}%, 0)`);
          ctx.beginPath();
          ctx.arc(e.x, e.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          // Draw core
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${e.hue}, 55%, ${e.lightness + 15}%, ${e.opacity})`;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [spawnEmber]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.9 }}
    />
  );
};
