import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, Mail, Building2, MapPin, MessageCircle, FileText } from "lucide-react";

interface AdminTeamDetailProps {
  teamId: string;
  team: {
    id: string;
    team_name: string;
    club_name: string | null;
    county: string | null;
    club_org_id: string | null;
    secretary_name: string | null;
    secretary_email: string | null;
    secretary_phone: string | null;
    league_division: string | null;
    manager_name: string;
    manager_email: string;
    manager_phone: string | null;
    team_category: string | null;
    player_count: number | null;
    whatsapp_contacts: any;
    consent_rules: boolean | null;
    consent_photography: boolean | null;
    status: string;
    created_at: string;
  };
}

export function AdminTeamDetail({ teamId, team }: AdminTeamDetailProps) {
  const { data: players, isLoading } = useQuery({
    queryKey: ["admin-team-players", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_team_players")
        .select("*")
        .eq("team_id", teamId)
        .order("player_name");
      if (error) throw error;
      return data;
    },
  });

  const whatsappContacts = Array.isArray(team.whatsapp_contacts) ? team.whatsapp_contacts : [];

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-display font-bold text-sm">{team.team_name}</h4>
        <span className="text-xs text-muted-foreground">
          Registered: {new Date(team.created_at).toLocaleDateString("en-GB")}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Club Info */}
        <Card>
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
              <Building2 className="h-3.5 w-3.5" /> Club Details
            </div>
            <Detail label="Club" value={team.club_name} />
            <Detail label="County" value={team.county} />
            <Detail label="Org ID" value={team.club_org_id} />
            <Detail label="League" value={team.league_division} />
            <Detail label="Category" value={team.team_category} />
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
              <Mail className="h-3.5 w-3.5" /> Manager & Secretary
            </div>
            <Detail label="Manager" value={team.manager_name} />
            <Detail label="Email" value={team.manager_email} icon={<Mail className="h-3 w-3" />} />
            <Detail label="Phone" value={team.manager_phone} icon={<Phone className="h-3 w-3" />} />
            {team.secretary_name && (
              <>
                <div className="border-t border-border pt-2 mt-2" />
                <Detail label="Secretary" value={team.secretary_name} />
                <Detail label="Email" value={team.secretary_email} icon={<Mail className="h-3 w-3" />} />
                <Detail label="Phone" value={team.secretary_phone} icon={<Phone className="h-3 w-3" />} />
              </>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp & Consent */}
        <Card>
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp & Consent
            </div>
            {whatsappContacts.length > 0 ? (
              whatsappContacts.map((c: any, i: number) => (
                <div key={i}>
                  <Detail label={`Contact ${i + 1}`} value={`${c.name || "—"} · ${c.number || "—"}`} />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs">No WhatsApp contacts</p>
            )}
            <div className="border-t border-border pt-2 mt-2" />
            <div className="flex items-center gap-2">
              <Badge variant={team.consent_rules ? "default" : "destructive"} className="text-[10px]">
                Rules {team.consent_rules ? "✓" : "✗"}
              </Badge>
              <Badge variant={team.consent_photography ? "default" : "destructive"} className="text-[10px]">
                Photo {team.consent_photography ? "✓" : "✗"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Squad List */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-3">
            <Users className="h-3.5 w-3.5" /> Squad List ({players?.length || team.player_count || 0} players)
          </div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading squad...</p>
          ) : players && players.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-sm bg-background rounded px-3 py-1.5 border border-border">
                  <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                  <span className="font-medium flex-1">{p.player_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.date_of_birth).toLocaleDateString("en-GB")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No players submitted</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-1.5">
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-medium break-all">{value}</span>
    </div>
  );
}
