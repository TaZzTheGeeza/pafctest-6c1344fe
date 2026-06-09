import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { History, Undo2, Loader2, ChevronDown, ChevronRight } from "lucide-react";

type LogRow = {
  id: string;
  table_name: string;
  record_id: string | null;
  operation: "INSERT" | "UPDATE" | "DELETE";
  actor_id: string | null;
  old_row: any;
  new_row: any;
  created_at: string;
};

const TABLE_LABELS: Record<string, string> = {
  tournament_teams: "Team",
  tournament_matches: "Match",
  tournament_groups: "Group",
};

const OP_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  INSERT: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

function summarize(row: LogRow): string {
  const data = row.operation === "DELETE" ? row.old_row : row.new_row;
  if (!data) return row.record_id ?? "—";
  if (row.table_name === "tournament_teams") return data.team_name || data.club_name || row.record_id || "—";
  if (row.table_name === "tournament_groups") return `Group ${data.group_name || ""}`.trim();
  if (row.table_name === "tournament_matches") {
    const when = data.match_time ? new Date(data.match_time).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
    return `${data.pitch || "Match"} • ${when}`.trim();
  }
  return row.record_id ?? "—";
}

export function ChangeLogTab() {
  const qc = useQueryClient();
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [opFilter, setOpFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["tournament-audit-log", tableFilter, opFilter],
    queryFn: async () => {
      let q = supabase
        .from("tournament_audit_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (tableFilter !== "all") q = q.eq("table_name", tableFilter);
      if (opFilter !== "all") q = q.eq("operation", opFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as LogRow[];
    },
  });

  const handleRestore = async (logId: string, operation: string) => {
    const prompts: Record<string, string> = {
      DELETE: "Restore this deleted record? Related matches deleted at the same time will also be restored where possible.",
      UPDATE: "Revert this record back to its previous values? The current values will be replaced.",
      INSERT: "Undo this creation? The record will be removed.",
    };
    if (!confirm(prompts[operation] ?? "Apply this change?")) return;
    setRestoring(logId);
    try {
      const { error } = await supabase.rpc("restore_tournament_record" as any, { _log_id: logId } as any);
      if (error) throw error;
      toast.success(operation === "UPDATE" ? "Reverted to previous values" : operation === "INSERT" ? "Creation undone" : "Record restored");
      await qc.invalidateQueries({ queryKey: ["tournament-audit-log"] });
      await qc.invalidateQueries({ queryKey: ["tournament-admin"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    } finally {
      setRestoring(null);
    }
  };

  const actionLabel = (op: string) => (op === "UPDATE" ? "Revert" : op === "INSERT" ? "Undo" : "Restore");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm font-display uppercase tracking-wider">
          <History className="h-4 w-4" /> Change Log
        </div>
        <span className="text-xs text-muted-foreground">Last 200 changes • Admins only • 90-day retention</span>
        <div className="ml-auto flex gap-2">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              <SelectItem value="tournament_teams">Teams</SelectItem>
              <SelectItem value="tournament_matches">Matches</SelectItem>
              <SelectItem value="tournament_groups">Groups</SelectItem>
            </SelectContent>
          </Select>
          <Select value={opFilter} onValueChange={setOpFilter}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Edited</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : !logs || logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {logs.map((row) => {
            const isOpen = expanded === row.id;
            return (
              <div key={row.id} className="text-sm">
                <div className="flex items-center gap-3 px-3 py-2">
                  <button
                    onClick={() => setExpanded(isOpen ? null : row.id)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Toggle details"
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <Badge variant={OP_VARIANT[row.operation]} className="text-[10px] uppercase">{row.operation}</Badge>
                  <span className="text-muted-foreground text-xs w-16 shrink-0">{TABLE_LABELS[row.table_name] ?? row.table_name}</span>
                  <span className="font-medium truncate flex-1">{summarize(row)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {new Date(row.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {row.operation === "DELETE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(row.id)}
                      disabled={restoring === row.id}
                      className="h-7 gap-1"
                    >
                      {restoring === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />}
                      Restore
                    </Button>
                  )}
                </div>
                {isOpen && (
                  <div className="px-3 pb-3 pl-10 grid md:grid-cols-2 gap-2">
                    {row.old_row && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Before</div>
                        <pre className="text-[11px] bg-muted/40 rounded p-2 overflow-auto max-h-60">{JSON.stringify(row.old_row, null, 2)}</pre>
                      </div>
                    )}
                    {row.new_row && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">After</div>
                        <pre className="text-[11px] bg-muted/40 rounded p-2 overflow-auto max-h-60">{JSON.stringify(row.new_row, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
