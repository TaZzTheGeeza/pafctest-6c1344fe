import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface TheatrePlayer {
  id: string;
  first_name: string | null;
  shirt_number?: number | null;
  age_group: string | null;
}

interface Props {
  players: TheatrePlayer[];
  /** Player names (case-insensitive) belonging to the current user — get a gold ring */
  highlightedNames?: string[];
  /** Approx chairs per row inside an age-group block (responsive cap) */
  chairsPerRow?: number;
}

/**
 * Theatre-style chair block for players, placed at the front of the hall
 * (just below the stage). Players are auto-grouped by age group, with
 * each group rendered as its own colour-banded row. Each chair shows the
 * player's first name + shirt number.
 *
 * No interactivity — seats are auto-allocated.
 */
export function TheatreBlock({
  players,
  highlightedNames = [],
  chairsPerRow = 12,
}: Props) {
  const highlightSet = useMemo(
    () =>
      new Set(
        highlightedNames
          .filter(Boolean)
          .map((n) => n.trim().toLowerCase()),
      ),
    [highlightedNames],
  );

  // Group players by age_group, preserving the natural age order
  const grouped = useMemo(() => {
    const map = new Map<string, TheatrePlayer[]>();
    for (const p of players) {
      const ag = p.age_group ?? "Other";
      const arr = map.get(ag) ?? [];
      arr.push(p);
      map.set(ag, arr);
    }
    // Sort each group by shirt number, then first name
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        const an = a.shirt_number ?? 999;
        const bn = b.shirt_number ?? 999;
        if (an !== bn) return an - bn;
        return (a.first_name ?? "").localeCompare(b.first_name ?? "");
      });
    }
    // Sort groups by their numeric age (U7, U8, U10, U11 Black, …)
    return Array.from(map.entries()).sort(([a], [b]) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ""), 10) || 99;
      const numB = parseInt(b.replace(/[^0-9]/g, ""), 10) || 99;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [players]);

  // Stable colour per age group (same hash as SeatingPlan for consistency)
  const ageGroupHue = (ag: string) => {
    let hash = 0;
    for (let i = 0; i < ag.length; i++) hash = (hash * 31 + ag.charCodeAt(i)) >>> 0;
    return hash % 360;
  };

  if (players.length === 0) return null;

  const totalSeats = players.length;

  return (
    <div className="mb-6 md:mb-8">
      <div className="text-center mb-3">
        <p className="text-[10px] font-display tracking-[0.4em] uppercase text-primary">
          ★ Theatre Block — Players ★
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {totalSeats} reserved player seats · auto-allocated by age group
        </p>
      </div>

      <div
        className="rounded-xl border border-primary/30 p-3 md:p-4 space-y-3 md:space-y-4"
        style={{
          background:
            "linear-gradient(180deg, hsl(45 25% 10% / 0.6) 0%, hsl(0 0% 4% / 0.6) 100%)",
          boxShadow: "inset 0 0 30px hsl(var(--primary) / 0.05)",
        }}
      >
        {grouped.map(([ageGroup, groupPlayers]) => {
          const hue = ageGroupHue(ageGroup);
          // Split into rows of ~chairsPerRow chairs
          const rows: TheatrePlayer[][] = [];
          for (let i = 0; i < groupPlayers.length; i += chairsPerRow) {
            rows.push(groupPlayers.slice(i, i + chairsPerRow));
          }

          return (
            <div
              key={ageGroup}
              className="rounded-lg p-2 md:p-3"
              style={{
                background: `linear-gradient(180deg, hsl(${hue} 50% 14% / 0.5) 0%, hsl(${hue} 30% 8% / 0.5) 100%)`,
                border: `1px solid hsl(${hue} 70% 55% / 0.4)`,
              }}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <p
                  className="text-[10px] font-display tracking-[0.25em] uppercase font-bold"
                  style={{ color: `hsl(${hue} 80% 70%)` }}
                >
                  {ageGroup}
                </p>
                <p className="text-[9px] font-display tracking-wider uppercase text-muted-foreground">
                  {groupPlayers.length} player{groupPlayers.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5 md:gap-2">
                {rows.map((row, rIdx) => (
                  <div key={rIdx} className="flex flex-wrap justify-center gap-1 md:gap-1.5">
                    {row.map((p) => {
                      const isMine =
                        !!p.first_name &&
                        highlightSet.has(p.first_name.trim().toLowerCase());
                      return (
                        <Chair
                          key={p.id}
                          name={p.first_name ?? "?"}
                          shirt={p.shirt_number ?? null}
                          hue={hue}
                          isMine={isMine}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chair({
  name,
  shirt,
  hue,
  isMine,
}: {
  name: string;
  shirt: number | null;
  hue: number;
  isMine: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-md border text-center transition-all",
        "w-[44px] md:w-[58px] h-[40px] md:h-[48px] px-1 leading-none",
        isMine && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105",
      )}
      style={{
        background: isMine
          ? `linear-gradient(180deg, hsl(45 60% 25%) 0%, hsl(45 50% 12%) 100%)`
          : `linear-gradient(180deg, hsl(${hue} 55% 22%) 0%, hsl(${hue} 45% 12%) 100%)`,
        borderColor: isMine
          ? "hsl(var(--primary))"
          : `hsl(${hue} 70% 55% / 0.7)`,
        color: isMine ? "hsl(var(--primary))" : `hsl(${hue} 90% 88%)`,
      }}
      title={shirt != null ? `#${shirt} ${name}` : name}
    >
      {shirt != null && (
        <span className="text-[7px] md:text-[8px] font-display font-bold opacity-80">
          #{shirt}
        </span>
      )}
      <span className="text-[8px] md:text-[9px] font-display font-bold truncate w-full">
        {name}
      </span>
    </div>
  );
}
