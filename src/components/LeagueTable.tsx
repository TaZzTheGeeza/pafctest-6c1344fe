import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Table2, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LeagueRow {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
}

interface LeagueTableProps {
  divisionSeason?: string;
  tableUrl?: string;
  highlightTeams?: string[];
  faUrl: string;
}

export function LeagueTable({ divisionSeason, tableUrl, highlightTeams = [], faUrl }: LeagueTableProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["league-table", divisionSeason || tableUrl],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("scrape-league-table", {
        body: { divisionSeason, tableUrl },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data as { divisionName: string; standings: LeagueRow[] };
    },
    staleTime: 1000 * 60 * 30, // cache 30 mins
  });

  const isHighlighted = (teamName: string) =>
    highlightTeams.some((ht) => teamName.toLowerCase().includes(ht.toLowerCase()));

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/10 px-6 py-3 border-b border-border flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-primary tracking-wider flex items-center gap-2">
          <Table2 className="w-4 h-4" />
          {data?.divisionName || "League Table"}
        </h2>
        <a
          href={faUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          FA Full-Time <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading standings...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">Unable to load league table</p>
            <a
              href={faUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View on FA Full-Time <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {data?.standings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">Pos</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center w-10">P</TableHead>
                  <TableHead className="text-center w-10">W</TableHead>
                  <TableHead className="text-center w-10">D</TableHead>
                  <TableHead className="text-center w-10">L</TableHead>
                  <TableHead className="text-center w-10 font-bold">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.standings.map((row) => {
                  const highlighted = isHighlighted(row.team);
                  return (
                    <TableRow
                      key={row.position}
                      className={highlighted ? "bg-primary/10 font-bold" : ""}
                    >
                      <TableCell className="text-center text-xs font-bold">{row.position}</TableCell>
                      <TableCell className={`text-xs ${highlighted ? "text-primary font-bold" : ""}`}>
                        {row.team}
                      </TableCell>
                      <TableCell className="text-center text-xs">{row.played}</TableCell>
                      <TableCell className="text-center text-xs">{row.won}</TableCell>
                      <TableCell className="text-center text-xs">{row.drawn}</TableCell>
                      <TableCell className="text-center text-xs">{row.lost}</TableCell>
                      <TableCell className="text-center text-xs font-bold">{row.points}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </div>
    </div>
  );
}
