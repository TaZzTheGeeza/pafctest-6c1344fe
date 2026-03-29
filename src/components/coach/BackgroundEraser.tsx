import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Eraser, Undo2, Check, X, Paintbrush, Eye, EyeOff } from "lucide-react";

interface BackgroundEraserProps {
  imageUrl: string;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}

const CANVAS_MAX = 500;

export function BackgroundEraser({ imageUrl, onComplete, onCancel }: BackgroundEraserProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [isErasing, setIsErasing] = useState(true); // true = erase, false = restore
  const [drawing, setDrawing] = useState(false);
  const [showCheckerboard, setShowCheckerboard] = useState(true);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef(1);

  // Load image onto canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Scale to fit within CANVAS_MAX
      const scale = Math.min(CANVAS_MAX / img.naturalWidth, CANVAS_MAX / img.naturalHeight, 1);
      scaleRef.current = scale;
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);

      canvas.width = w;
      canvas.height = h;

      // Also size the overlay
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.width = w;
        overlay.height = h;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);

      // Save initial state
      setHistory([ctx.getImageData(0, 0, w, h)]);
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw brush cursor on overlay
  const drawCursor = useCallback((x: number, y: number) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = isErasing ? "rgba(255,80,80,0.7)" : "rgba(80,200,80,0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [brushSize, isErasing]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const paint = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isErasing) {
      // Erase (make transparent)
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else {
      // Restore from original
      if (!imgRef.current) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [isErasing, brushSize]);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    const pos = getCanvasPos(e);
    paint(pos.x, pos.y);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasPos(e);
    drawCursor(pos.x, pos.y);
    if (!drawing) return;
    e.preventDefault();
    paint(pos.x, pos.y);
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    // Save to history
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setHistory((prev) => [...prev.slice(-15), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const newHistory = history.slice(0, -1);
    const prev = newHistory[newHistory.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory(newHistory);
  };

  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onComplete(blob);
    }, "image/png");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Eraser className="h-3.5 w-3.5 text-primary" />
          Background Eraser
        </h4>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-6 text-xs gap-1">
          <X className="h-3 w-3" /> Cancel
        </Button>
      </div>

      {/* Tool bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant={isErasing ? "default" : "outline"}
          size="sm"
          className="h-7 text-[10px] gap-1"
          onClick={() => setIsErasing(true)}
        >
          <Eraser className="h-3 w-3" /> Erase
        </Button>
        <Button
          type="button"
          variant={!isErasing ? "default" : "outline"}
          size="sm"
          className="h-7 text-[10px] gap-1"
          onClick={() => setIsErasing(false)}
        >
          <Paintbrush className="h-3 w-3" /> Restore
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] gap-1"
          onClick={() => setShowCheckerboard(!showCheckerboard)}
        >
          {showCheckerboard ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {showCheckerboard ? "Hide" : "Show"} Grid
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] gap-1"
          onClick={undo}
          disabled={history.length <= 1}
        >
          <Undo2 className="h-3 w-3" /> Undo
        </Button>
      </div>

      {/* Brush size */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-display w-16">Brush: {brushSize}px</span>
        <Slider
          value={[brushSize]}
          onValueChange={([v]) => setBrushSize(v)}
          min={5}
          max={80}
          step={1}
          className="flex-1"
        />
      </div>

      {/* Canvas area */}
      <div
        className="relative inline-block rounded-lg overflow-hidden border border-border mx-auto"
        style={{
          background: showCheckerboard
            ? "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 0 0 / 16px 16px"
            : "hsl(var(--background))",
        }}
      >
        <canvas
          ref={canvasRef}
          className="block max-w-full cursor-crosshair touch-none"
          style={{ maxHeight: "400px" }}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={() => {
            endDraw();
            const overlay = overlayRef.current;
            if (overlay) overlay.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
          }}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none"
          style={{ maxHeight: "400px" }}
        />
      </div>

      <p className="text-[9px] text-muted-foreground text-center">
        Paint over the background to erase it · Use Restore to bring back any mistakes
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" className="flex-1 h-8 text-xs gap-1" onClick={handleComplete}>
          <Check className="h-3 w-3" /> Apply
        </Button>
      </div>
    </div>
  );
}
