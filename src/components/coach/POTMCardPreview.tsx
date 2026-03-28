import { Trophy } from "lucide-react";
import potmCardBg from "@/assets/potm-card-bg.jpg";

interface POTMCardPreviewProps {
  photoPreview: string | null;
  playerName: string;
  shirtNumber?: number | null;
  ageGroup?: string;
}

export function POTMCardPreview({
  photoPreview,
  playerName,
  shirtNumber,
  ageGroup,
}: POTMCardPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
        Card Preview
      </p>
      <div className="relative w-[180px] h-[270px] rounded-xl overflow-hidden shadow-md border border-border bg-card">
        {/* Photo area */}
        <div className="relative h-[205px] overflow-hidden">
          {/* Background */}
          <img
            src={potmCardBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_60%,_hsla(38,45%,47%,0.2)_0%,_transparent_70%)]" />

          {/* Player image or placeholder */}
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Preview"
              className="absolute inset-0 w-full h-full z-10 object-cover"
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

          {/* Guide overlay lines when photo is present */}
          {photoPreview && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              {/* Center crosshair */}
              <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-8 h-8">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
              </div>
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card via-card/80 to-transparent z-10" />
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
    </div>
  );
}
