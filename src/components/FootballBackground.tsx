import { useEffect, useRef, useCallback } from "react";

interface Dust {
  x: number;
  y: number;
  size: number;
  opacity: number;
  drift: number;
  phase: number;
  speed: number;
}

export const FootballBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dustRef = useRef<Dust[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  const createDust = useCallback((w: number, h: number) => {
    const count = Math.floor((w * h) / 30000);
    return Array.from({ length: count }, (): Dust => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.08 + 0.02,
      drift: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.002 + 0.001,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dustRef.current = createDust(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    // Throttle to ~20fps and pause when tab is hidden
    const FRAME_INTERVAL = 50; // ms (~20fps instead of 60)
    let lastFrame = 0;
    let paused = false;

    const handleVisibility = () => {
      paused = document.hidden;
      if (!paused) {
        lastFrame = 0;
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const animate = (timestamp: number) => {
      if (paused) return;

      if (timestamp - lastFrame < FRAME_INTERVAL) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrame = timestamp;

      timeRef.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dustRef.current.forEach((d) => {
        const float = Math.sin(timeRef.current * d.speed + d.phase);
        d.x += d.drift;
        d.y += float * 0.15;

        if (d.x < -5) d.x = canvas.width + 5;
        if (d.x > canvas.width + 5) d.x = -5;
        if (d.y < -5) d.y = canvas.height + 5;
        if (d.y > canvas.height + 5) d.y = -5;

        const pulse = (Math.sin(timeRef.current * d.speed * 2 + d.phase) + 1) * 0.5;
        const alpha = d.opacity + pulse * 0.03;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(38, 45%, 55%, ${alpha})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(animationRef.current);
    };
  }, [createDust]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
};
