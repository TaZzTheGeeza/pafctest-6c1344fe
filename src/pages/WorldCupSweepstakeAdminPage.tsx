import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Save, Shuffle, Eye, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_WORLD_CUP_2026_TEAMS, SWEEPSTAKE_STATUSES, type SweepstakeStatus } from "@/lib/worldCupTeams";

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  prize_description: string;
  ticket_price_cents: number;
  currency: string;
  max_tickets: number | null;
  number_range: number | null;
  status: string;
  sweepstake_mode: boolean;
  teams_revealed: boolean;
  prize_winner_pence: number | null;
  prize_runner_up_pence: number | null;
  prize_third_pence: number | null;
  prize_golden_boot_pence: number | null;
}

interface AssignmentRow {
  id?: string;
  ticket_number: number;
  country_name: string;
  flag_emoji: string;
  group_letter: string;
  status: SweepstakeStatus;
}

interface BuyerRow {
  ticket_number: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  payment_status: string;
  created_at: string;
}

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const WorldCupSweepstakeAdminPage = () => {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [buyers, setBuyers] = useState<BuyerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: r } = await supabase
      .from("raffles")
      .select("*")
      .eq("sweepstake_mode", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRaffle((r as Raffle) || null);

    if (r) {
      const [{ data: a }, { data: t }] = await Promise.all([
        supabase.from("sweepstake_team_assignments").select("*").eq("raffle_id", r.id).order("ticket_number"),
        supabase
          .from("raffle_tickets")
          .select("ticket_number, buyer_name, buyer_email, buyer_phone, payment_status, created_at")
          .eq("raffle_id", r.id)
          .in("payment_status", ["paid", "pending"])
          .order("ticket_number"),
      ]);

      const existing = new Map((a || []).map((x: any) => [x.ticket_number, x]));
      const range = r.number_range || 48;
      const built: AssignmentRow[] = Array.from({ length: range }, (_, i) => {
        const n = i + 1;
        const e = existing.get(n);
        if (e) return {
          id: e.id, ticket_number: n,
          country_name: e.country_name || "",
          flag_emoji: e.flag_emoji || "",
          group_letter: e.group_letter || "",
          status: (e.status || "active") as SweepstakeStatus,
        };
        return { ticket_number: n, country_name: "", flag_emoji: "", group_letter: "", status: "active" };
      });
      setRows(built);
      setBuyers((t || []) as BuyerRow[]);
    }
    setLoading(false);
  };

  const createRaffle = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("raffles")
      .insert({
        title: "World Cup 2026 Sweepstake",
        description: "48 teams, 48 tickets. Pick a number, get a country, win a slice of the pot.",
        prize_description: "Cash prizes for Champion, Runner-up, 3rd Place and Golden Boot winners.",
        ticket_price_cents: 2000,
        currency: "gbp",
        max_tickets: 48,
        number_range: 48,
        status: "active",
        sweepstake_mode: true,
        teams_revealed: false,
        prize_winner_pence: 12000,
        prize_runner_up_pence: 6000,
        prize_third_pence: 3000,
        prize_golden_boot_pence: 3000,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Sweepstake created");
    setRaffle(data as Raffle);
    fetchData();
  };

  const updateRaffleField = async (patch: Partial<Raffle>) => {
    if (!raffle) return;
    setRaffle({ ...raffle, ...patch });
    const { error } = await supabase.from("raffles").update(patch).eq("id", raffle.id);
    if (error) toast.error(error.message);
  };

  const seedDefaults = () => {
    setRows((prev) =>
      prev.map((r, i) => {
        const def = DEFAULT_WORLD_CUP_2026_TEAMS[i];
        if (!def) return r;
        return r.country_name ? r : { ...r, country_name: def.country_name, flag_emoji: def.flag_emoji, group_letter: def.group_letter };
      })
    );
    toast.success("Defaults populated — review and save");
  };

  const shuffle = () => {
    const teams = [...DEFAULT_WORLD_CUP_2026_TEAMS].sort(() => Math.random() - 0.5);
    setRows((prev) => prev.map((r, i) => {
      const t = teams[i];
      if (!t) return r;
      return { ...r, country_name: t.country_name, flag_emoji: t.flag_emoji, group_letter: t.group_letter };
    }));
    toast.success("Teams shuffled randomly");
  };

  const updateRow = (idx: number, patch: Partial<AssignmentRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const saveAll = async () => {
    if (!raffle) return;
    setSaving(true);
    const payload = rows.map((r) => ({
      raffle_id: raffle.id,
      ticket_number: r.ticket_number,
      country_name: r.country_name,
      flag_emoji: r.flag_emoji,
      group_letter: r.group_letter || null,
      status: r.status,
    }));
    const { error } = await supabase
      .from("sweepstake_team_assignments")
      .upsert(payload, { onConflict: "raffle_id,ticket_number" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Team assignments saved");
    fetchData();
  };

  const filledCount = useMemo(() => rows.filter((r) => r.country_name.trim()).length, [rows]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-28 pb-20 max-w-3xl">
          <h1 className="font-display text-4xl font-black mb-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" /> World Cup Sweepstake Admin
          </h1>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">No sweepstake raffle exists yet. Create one to get started.</p>
              <Button onClick={createRaffle} disabled={saving} className="bg-gold-gradient text-primary-foreground">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Sweepstake (48 tickets @ £20)
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-6xl space-y-6">
        <div>
          <h1 className="font-display text-4xl font-black flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" /> Sweepstake Admin
          </h1>
          <p className="text-muted-foreground mt-1">{raffle.title} • Status: <Badge variant="outline">{raffle.status}</Badge></p>
        </div>

        {/* Prize settings */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display text-xl font-bold">Prizes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: "prize_winner_pence", label: "Champion" },
                { key: "prize_runner_up_pence", label: "Runner-up" },
                { key: "prize_third_pence", label: "3rd Place" },
                { key: "prize_golden_boot_pence", label: "Golden Boot" },
              ].map((p) => (
                <div key={p.key}>
                  <Label className="text-xs">{p.label} (£)</Label>
                  <Input
                    type="number"
                    value={((raffle as any)[p.key] || 0) / 100}
                    onChange={(e) => updateRaffleField({ [p.key]: Math.round(Number(e.target.value) * 100) } as any)}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <Switch
                checked={raffle.teams_revealed}
                onCheckedChange={(v) => updateRaffleField({ teams_revealed: v })}
              />
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Reveal teams to buyers
                </div>
                <div className="text-xs text-muted-foreground">
                  When ON, ticket holders see their country and the public tournament board.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team assignments */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-display text-xl font-bold">Team Assignments</h2>
                <p className="text-xs text-muted-foreground">{filledCount} / {rows.length} teams set</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={seedDefaults}>
                  <Plus className="h-4 w-4 mr-1" /> Seed defaults
                </Button>
                <Button variant="outline" size="sm" onClick={shuffle}>
                  <Shuffle className="h-4 w-4 mr-1" /> Shuffle randomly
                </Button>
                <Button size="sm" onClick={saveAll} disabled={saving} className="bg-gold-gradient text-primary-foreground">
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save all
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="text-left p-2 w-12">#</th>
                    <th className="text-left p-2">Flag</th>
                    <th className="text-left p-2">Country</th>
                    <th className="text-left p-2 w-20">Group</th>
                    <th className="text-left p-2 w-44">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.ticket_number} className="border-t border-border/40">
                      <td className="p-2 font-display font-bold text-primary">{r.ticket_number}</td>
                      <td className="p-2">
                        <Input
                          value={r.flag_emoji}
                          onChange={(e) => updateRow(i, { flag_emoji: e.target.value })}
                          className="w-16 text-lg"
                          placeholder="🏳"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={r.country_name}
                          onChange={(e) => updateRow(i, { country_name: e.target.value })}
                          placeholder="Country name"
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={r.group_letter || "__none__"}
                          onValueChange={(v) => updateRow(i, { group_letter: v === "__none__" ? "" : v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {GROUP_LETTERS.map((g) => (
                              <SelectItem key={g} value={g}>Group {g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Select
                          value={r.status}
                          onValueChange={(v) => updateRow(i, { status: v as SweepstakeStatus })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SWEEPSTAKE_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default WorldCupSweepstakeAdminPage;
