import { useEffect, useRef, useCallback } from "react";

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  pulsePhase: number;
  pulseSpeed: number;
}

export const FootballBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  const createNodes = useCallback((width: number, height: number) => {
    const nodes: Node[] = [];
    const spacing = 90;
    const cols = Math.ceil(width / spacing) + 2;
    const rows = Math.ceil(height / spacing) + 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offsetX = r % 2 === 0 ? 0 : spacing / 2;
        const x = c * spacing + offsetX - spacing;
        const y = r * spacing - spacing;
        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          size: Math.random() * 1.5 + 1,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.01 + 0.005,
        });
      }
    }
    return nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      nodesRef.current = createNodes(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      timeRef.current += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;
      const nodes = nodesRef.current;
      const maxConnDist = 130;
      const mouseRadius = 200;

      // Update nodes
      nodes.forEach((n) => {
        // Gentle floating
        n.x = n.baseX + Math.sin(timeRef.current * 0.005 + n.pulsePhase) * 8;
        n.y = n.baseY + Math.cos(timeRef.current * 0.007 + n.pulsePhase) * 6;

        // Mouse attraction/interaction
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius && dist > 0) {
          const force = (mouseRadius - dist) / mouseRadius;
          // Push nodes slightly away but also pull them into formation
          n.x -= (dx / dist) * force * 15;
          n.y -= (dy / dist) * force * 15;
        }
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnDist) {
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            const mouseDx = mouse.x - midX;
            const mouseDy = mouse.y - midY;
            const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

            const baseAlpha = 0.06 * (1 - dist / maxConnDist);
            const mouseBoost = mouseDist < mouseRadius ? (1 - mouseDist / mouseRadius) * 0.25 : 0;
            const alpha = baseAlpha + mouseBoost;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(38, 45%, 47%, ${alpha})`;
            ctx.lineWidth = mouseDist < mouseRadius ? 1.2 : 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nearMouse = dist < mouseRadius;
        const proximity = nearMouse ? 1 - dist / mouseRadius : 0;

        const pulse = Math.sin(timeRef.current * n.pulseSpeed + n.pulsePhase) * 0.5 + 0.5;
        const baseAlpha = 0.08 + pulse * 0.06;
        const alpha = baseAlpha + proximity * 0.5;
        const size = n.size + proximity * 3;

        // Glow for near-mouse nodes
        if (nearMouse && proximity > 0.3) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, size + 6, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, size + 6);
          glow.addColorStop(0, `hsla(38, 50%, 55%, ${proximity * 0.15})`);
          glow.addColorStop(1, `hsla(38, 50%, 55%, 0)`);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(38, 45%, ${47 + proximity * 20}%, ${alpha})`;
        ctx.fill();
      });

      // Draw formation triangle near mouse
      if (mouse.x > 0 && mouse.y > 0) {
        const nearby = nodes
          .map((n) => ({ n, d: Math.sqrt((mouse.x - n.x) ** 2 + (mouse.y - n.y) ** 2) }))
          .filter((x) => x.d < mouseRadius * 0.8)
          .sort((a, b) => a.d - b.d)
          .slice(0, 4);

        if (nearby.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(nearby[0].n.x, nearby[0].n.y);
          for (let i = 1; i < nearby.length; i++) {
            ctx.lineTo(nearby[i].n.x, nearby[i].n.y);
          }
          ctx.closePath();
          ctx.fillStyle = `hsla(38, 45%, 47%, 0.03)`;
          ctx.fill();
          ctx.strokeStyle = `hsla(38, 45%, 47%, 0.12)`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [createNodes]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
};
