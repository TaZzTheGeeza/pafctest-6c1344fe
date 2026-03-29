import { Trophy, ZoomIn, ZoomOut, Move, RotateCcw } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import potmCardBg from "@/assets/potm-card-bg.jpg";

interface POTMCardPreviewProps {
  photoPreview: string | null;
  playerName: string;
  shirtNumber?: number | null;
  ageGroup?: string;
  onCroppedImage?: (blob: Blob) => void;
}

const CARD_W = 280;
const CARD_H = 320; // photo area height on real card
const PREVIEW_SCALE = 180 / 280; // preview is 180px wide
const PREVIEW_W = 180;
const PREVIEW_H = Math.round(CARD_H * PREVIEW_SCALE);

export function POTMCardPreview({
  photoPreview,
  playerName,
  shirtNumber,
  ageGroup,
  onCroppedImage,
}: POTMCardPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset when photo changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [photoPreview]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  // Mouse / touch drag handlers
  const startDrag = useCallback((clientX: number, clientY: number) => {
    setDragging(true);
    dragStart.current = { x: clientX, y: clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, [dragging]);

  const endDrag = useCallback(() => setDragging(false), []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); startDrag(e.clientX, e.clientY); };
  const onMouseMove = (e: React.MouseEvent) => moveDrag(e.clientX, e.clientY);
  const onMouseUp = () => endDrag();
  const onMouseLeave = () => endDrag();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const onTouchEnd = () => endDrag();

  const resetPosition = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Generate cropped image whenever zoom/pan changes
  useEffect(() => {
    if (!photoPreview || !onCroppedImage || !naturalSize.w) return;

    const timer = setTimeout(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // The preview container maps to the card's photo area (CARD_W x CARD_H)
        // We need to figure out what portion of the source image is visible

        // First, calculate the "cover" fit at zoom=1
        const containerAspect = PREVIEW_W / PREVIEW_H;
        const imgAspect = img.naturalWidth / img.naturalHeight;

        let baseScale: number;
        if (imgAspect > containerAspect) {
          // image wider than container: height-fit
          baseScale = PREVIEW_H / img.naturalHeight;
        } else {
          // image taller: width-fit
          baseScale = PREVIEW_W / img.naturalWidth;
        }

        const scale = baseScale * zoom;
        const renderedW = img.naturalWidth * scale;
        const renderedH = img.naturalHeight * scale;

        // Image is centered + panned
        const imgLeft = (PREVIEW_W - renderedW) / 2 + pan.x;
        const imgTop = (PREVIEW_H - renderedH) / 2 + pan.y;

        // Visible crop in rendered coords
        const cropLeft = Math.max(0, -imgLeft);
        const cropTop = Math.max(0, -imgTop);
        const cropRight = Math.min(renderedW, PREVIEW_W - imgLeft);
        const cropBottom = Math.min(renderedH, PREVIEW_H - imgTop);

        // Convert to source coords
        const sx = cropLeft / scale;
        const sy = cropTop / scale;
        const sw = (cropRight - cropLeft) / scale;
        const sh = (cropBottom - cropTop) / scale;

        // Output at card resolution
        const canvas = document.createElement("canvas");
        canvas.width = CARD_W;
        canvas.height = CARD_H;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw as cover-fit into the full card area
        const outAspect = CARD_W / CARD_H;
        const srcAspect = sw / sh;
        let dx = 0, dy = 0, dw = CARD_W, dh = CARD_H;

        if (srcAspect > outAspect) {
          dw = CARD_H * srcAspect;
          dx = (CARD_W - dw) / 2;
        } else {
          dh = CARD_W / srcAspect;
          dy = (CARD_H - dh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CARD_W, CARD_H);
        canvas.toBlob((blob) => {
          if (blob) onCroppedImage(blob);
        }, "image/jpeg", 0.92);
      };
      img.src = photoPreview;
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [photoPreview, zoom, pan, naturalSize, onCroppedImage]);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Move className="h-3 w-3" />
        Position &amp; Zoom Preview
      </p>

      {/* Card preview */}
      <div className="relative w-[180px] rounded-xl overflow-hidden shadow-md border border-border bg-card">
        {/* Photo area – interactive */}
        <div
          ref={containerRef}
          className={`relative overflow-hidden select-none ${
            photoPreview ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          style={{ height: `${PREVIEW_H}px` }}
          onMouseDown={photoPreview ? onMouseDown : undefined}
          onMouseMove={photoPreview ? onMouseMove : undefined}
          onMouseUp={photoPreview ? onMouseUp : undefined}
          onMouseLeave={photoPreview ? onMouseLeave : undefined}
          onTouchStart={photoPreview ? onTouchStart : undefined}
          onTouchMove={photoPreview ? onTouchMove : undefined}
          onTouchEnd={photoPreview ? onTouchEnd : undefined}
        >
          {/* Background */}
          <img
            src={potmCardBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_60%,_hsla(38,45%,47%,0.2)_0%,_transparent_70%)]" />

          {/* Player image */}
          {photoPreview ? (
            <img
              ref={imgRef}
              src={photoPreview}
              alt="Preview"
              onLoad={handleImageLoad}
              className="absolute z-10 pointer-events-none"
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transformOrigin: "center center",
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-16 h-16 rounded-full bg-secondary/80 border-2 border-primary/30 border-dashed flex items-center justify-center">
                <span className="font-display text-2xl font-bold text-primary/40">
                  {shirtNumber || playerName?.charAt(0) || "?"}
                </span>
              </div>
            </div>
          )}

          {/* Guide overlay */}
          {photoPreview && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-8 h-8">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
              </div>
              {/* Rule of thirds */}
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/15" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/15" />
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/15" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/15" />
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card via-card/80 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Info area */}
        <div className="relative px-3 pb-2 -mt-5 z-10 text-center">
          {ageGroup && (
            <div className="flex items-center justify-center mb-1">
              <span className="font-display text-[7px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                {ageGroup}
              </span>
            </div>
          )}
          <h3 className="font-display text-xs font-bold uppercase tracking-wide text-foreground leading-tight truncate">
            {playerName || "Player Name"}
          </h3>
          <div className="mt-1 flex items-center justify-center gap-1 py-1 rounded bg-primary/10 border border-primary/20">
            <Trophy className="h-2 w-2 text-primary" />
            <span className="font-display text-[7px] font-bold uppercase tracking-[0.1em] text-primary">
              Player of the Match
            </span>
          </div>
        </div>
      </div>

      {/* Zoom & reset controls */}
      {photoPreview && (
        <div className="w-[180px] space-y-1.5">
          <div className="flex items-center gap-2">
            <ZoomOut className="h-3 w-3 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={0.5}
              max={3}
              step={0.05}
              className="flex-1"
            />
            <ZoomIn className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full h-6 text-[10px] gap-1 text-muted-foreground"
            onClick={resetPosition}
          >
            <RotateCcw className="h-2.5 w-2.5" /> Reset Position
          </Button>
          <p className="text-[9px] text-muted-foreground text-center">
            Drag to reposition · Zoom to resize
          </p>
        </div>
      )}
    </div>
  );
}
