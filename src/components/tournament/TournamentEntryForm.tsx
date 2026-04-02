import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, ChevronRight, ChevronLeft, Users, ClipboardList, UserPlus } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { toast } from "sonner";
import { z } from "zod";

interface AgeGroup {
  id: string;
  age_group: string;
}

interface TournamentEntryFormProps {
  ageGroups: AgeGroup[];
  onSuccess: () => void;
}

interface PlayerEntry {
  player_name: string;
  date_of_birth: string;
}

const EMPTY_PLAYER = (): PlayerEntry => ({ player_name: "", date_of_birth: "" });

const stepLabels = ["Club Details", "Team Sheet", "Squad List", "Review & Pay"];

export function TournamentEntryForm({ ageGroups, onSuccess }: TournamentEntryFormProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Club Details
  const [clubName, setClubName] = useState("");
  const [county, setCounty] = useState("");
  const [clubOrgId, setClubOrgId] = useState("");
  const [secretaryName, setSecretaryName] = useState("");
  const [secretaryEmail, setSecretaryEmail] = useState("");
  const [secretaryPhone, setSecretaryPhone] = useState("");
  const [leagueDivision, setLeagueDivision] = useState("");

  // Step 2: Team Sheet
  const [ageGroupId, setAgeGroupId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCategory, setTeamCategory] = useState("mixed");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [whatsappName1, setWhatsappName1] = useState("");
  const [whatsappNumber1, setWhatsappNumber1] = useState("");
  const [whatsappName2, setWhatsappName2] = useState("");
  const [whatsappNumber2, setWhatsappNumber2] = useState("");

  // Step 3: Squad
  const [players, setPlayers] = useState<PlayerEntry[]>(
    Array.from({ length: 10 }, () => EMPTY_PLAYER())
  );

  // Step 4: Consent
  const [consentRules, setConsentRules] = useState(false);
  const [consentPhotography, setConsentPhotography] = useState(false);

  const updatePlayer = (index: number, field: keyof PlayerEntry, value: string) => {
    setPlayers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const filledPlayers = players.filter(p => p.player_name.trim() && p.date_of_birth);
  const selectedAgeGroup = ageGroups.find(ag => ag.id === ageGroupId);

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!clubName.trim()) return "Club name is required";
      if (!county.trim()) return "County is required";
    }
    if (s === 1) {
      if (!ageGroupId) return "Please select an age group";
      if (!teamName.trim()) return "Team name is required";
      if (!managerName.trim()) return "Manager name is required";
      if (!managerEmail.trim()) return "Manager email is required";
      const emailResult = z.string().email().safeParse(managerEmail);
      if (!emailResult.success) return "Invalid manager email";
    }
    if (s === 2) {
      if (filledPlayers.length < 5) return "You need at least 5 players in your squad";
      if (filledPlayers.length > 10) return "Maximum 10 players per team";
    }
    if (s === 3) {
      if (!consentRules) return "You must agree to the tournament rules";
      if (!consentPhotography) return "You must acknowledge the photography notice";
    }
    return null;
  };

  const nextStep = () => {
    const error = validateStep(step);
    if (error) { toast.error(error); return; }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    const error = validateStep(3);
    if (error) { toast.error(error); return; }

    setSubmitting(true);

    try {
      // Insert team with all details
      const { data: newTeam, error: teamError } = await supabase
        .from("tournament_teams")
        .insert({
          age_group_id: ageGroupId,
          team_name: teamName.trim(),
          manager_name: managerName.trim(),
          manager_email: managerEmail.trim(),
          manager_phone: managerPhone.trim() || null,
          player_count: filledPlayers.length,
          status: "pending",
          club_name: clubName.trim(),
          county: county.trim(),
          club_org_id: clubOrgId.trim() || null,
          secretary_name: secretaryName.trim() || null,
          secretary_email: secretaryEmail.trim() || null,
          secretary_phone: secretaryPhone.trim() || null,
          league_division: leagueDivision.trim() || null,
          team_category: teamCategory,
          whatsapp_contacts: [
            ...(whatsappName1 ? [{ name: whatsappName1.trim(), number: whatsappNumber1.trim() }] : []),
            ...(whatsappName2 ? [{ name: whatsappName2.trim(), number: whatsappNumber2.trim() }] : []),
          ],
          consent_rules: consentRules,
          consent_photography: consentPhotography,
        } as any)
        .select()
        .single();

      if (teamError || !newTeam) throw new Error(teamError?.message || "Failed to register team");

      // Insert players
      const playerInserts = filledPlayers.map(p => ({
        team_id: newTeam.id,
        player_name: p.player_name.trim(),
        date_of_birth: p.date_of_birth,
      }));

      if (playerInserts.length > 0) {
        const { error: playersError } = await supabase
          .from("tournament_team_players" as any)
          .insert(playerInserts);
        if (playersError) console.error("Failed to insert players:", playersError);
      }

      // Create Stripe checkout
      const { data, error: fnError } = await supabase.functions.invoke("create-tournament-checkout", {
        body: { team_id: newTeam.id },
      });

      if (fnError) throw fnError;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Enter Your Team
        </CardTitle>
        <CardDescription>
          Complete all sections below. Your team sheet and squad list are submitted digitally — no need to email anything.
        </CardDescription>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mt-4">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <span className="hidden sm:block text-xs text-muted-foreground truncate">{label}</span>
              {i < stepLabels.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* STEP 1: Club Details */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-display font-bold text-sm">Club Details</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Club Name *</Label>
                <Input value={clubName} onChange={e => setClubName(e.target.value)} maxLength={100} placeholder="e.g. Peterborough Athletic FC" required />
              </div>
              <div>
                <Label>County *</Label>
                <Input value={county} onChange={e => setCounty(e.target.value)} maxLength={100} placeholder="e.g. Cambridgeshire" required />
              </div>
            </div>
            <div>
              <Label>Club Organisation ID (2025/26)</Label>
              <Input value={clubOrgId} onChange={e => setClubOrgId(e.target.value)} maxLength={50} placeholder="FA Organisation ID" />
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-3">Club Secretary Details</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Secretary Name</Label>
                  <Input value={secretaryName} onChange={e => setSecretaryName(e.target.value)} maxLength={100} />
                </div>
                <div>
                  <Label>Secretary Email</Label>
                  <Input type="email" value={secretaryEmail} onChange={e => setSecretaryEmail(e.target.value)} maxLength={255} />
                </div>
                <div>
                  <Label>Secretary Phone</Label>
                  <Input value={secretaryPhone} onChange={e => setSecretaryPhone(e.target.value)} maxLength={20} />
                </div>
                <div>
                  <Label>League & Division (2025/26)</Label>
                  <Input value={leagueDivision} onChange={e => setLeagueDivision(e.target.value)} maxLength={100} placeholder="e.g. PDFL Division 1" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Team Sheet */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h3 className="font-display font-bold text-sm">Team Sheet</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Age Group *</Label>
                <Select value={ageGroupId} onValueChange={setAgeGroupId}>
                  <SelectTrigger><SelectValue placeholder="Select age group" /></SelectTrigger>
                  <SelectContent>
                    {ageGroups.map(ag => <SelectItem key={ag.id} value={ag.id}>{ag.age_group}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Team Category</Label>
                <Select value={teamCategory} onValueChange={setTeamCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Team Name *</Label>
              <Input value={teamName} onChange={e => setTeamName(e.target.value)} maxLength={100} placeholder="e.g. PAFC U10 Gold" required />
            </div>

            <div className="border-t border-border pt-4 mt-2">
              <p className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-3">Manager / Coach</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Manager Name *</Label>
                  <Input value={managerName} onChange={e => setManagerName(e.target.value)} maxLength={100} required />
                </div>
                <div>
                  <Label>Manager Email *</Label>
                  <Input type="email" value={managerEmail} onChange={e => setManagerEmail(e.target.value)} maxLength={255} required />
                </div>
                <div className="sm:col-span-2">
                  <Label>Manager Phone</Label>
                  <Input value={managerPhone} onChange={e => setManagerPhone(e.target.value)} maxLength={20} />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-2">
              <p className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1">WhatsApp Contacts</p>
              <p className="text-xs text-muted-foreground mb-3">For live results & league table updates on the day</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Contact 1 Name</Label>
                  <Input value={whatsappName1} onChange={e => setWhatsappName1(e.target.value)} maxLength={100} />
                </div>
                <div>
                  <Label>Contact 1 Number</Label>
                  <Input value={whatsappNumber1} onChange={e => setWhatsappNumber1(e.target.value)} maxLength={20} placeholder="07..." />
                </div>
                <div>
                  <Label>Contact 2 Name</Label>
                  <Input value={whatsappName2} onChange={e => setWhatsappName2(e.target.value)} maxLength={100} />
                </div>
                <div>
                  <Label>Contact 2 Number</Label>
                  <Input value={whatsappNumber2} onChange={e => setWhatsappNumber2(e.target.value)} maxLength={20} placeholder="07..." />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Squad List */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-sm">Squad List</h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {filledPlayers.length}/10 players
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Enter at least 5 players (max 10). All players must have a name and date of birth.</p>

            <div className="space-y-3">
              {players.map((player, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">{i + 1}.</span>
                  <Input
                    value={player.player_name}
                    onChange={e => updatePlayer(i, "player_name", e.target.value)}
                    placeholder="Player name"
                    maxLength={100}
                    className="flex-1"
                  />
                  <DateInput
                    value={player.date_of_birth}
                    onChange={val => updatePlayer(i, "date_of_birth", val)}
                    placeholder="DOB"
                    className="w-[160px]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Pay */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-sm">Review Your Entry</h3>

            <div className="rounded-lg border border-border p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">Club</p>
                  <p className="font-medium">{clubName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">County</p>
                  <p className="font-medium">{county}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Team</p>
                  <p className="font-medium">{teamName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Age Group</p>
                  <p className="font-medium">{selectedAgeGroup?.age_group} · {teamCategory}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Manager</p>
                  <p className="font-medium">{managerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Squad Size</p>
                  <p className="font-medium">{filledPlayers.length} players</p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-muted-foreground text-xs mb-1">Squad</p>
                <div className="flex flex-wrap gap-1.5">
                  {filledPlayers.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{p.player_name}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent-rules"
                  checked={consentRules}
                  onCheckedChange={v => setConsentRules(v === true)}
                />
                <Label htmlFor="consent-rules" className="text-xs leading-relaxed cursor-pointer">
                  I understand and confirm that myself, my players, and their parents/guardians will respect and conduct ourselves within the PAFC Tourney Rules. *
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent-photography"
                  checked={consentPhotography}
                  onCheckedChange={v => setConsentPhotography(v === true)}
                />
                <Label htmlFor="consent-photography" className="text-xs leading-relaxed cursor-pointer">
                  I confirm that I have obtained consent from the parents/guardians of all players listed in this entry for photography and video to be taken during the PAFC Tourney. I understand that images may be used by PAFC for promotional purposes including social media, the club website, and printed materials. *
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          {step > 0 ? (
            <Button variant="outline" onClick={prevStep} type="button">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : <div />}

          {step < 3 ? (
            <Button onClick={nextStep} type="button">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="min-w-[180px]">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
              ) : (
                <>Submit & Pay £40</>
              )}
            </Button>
          )}
        </div>

        {step === 3 && (
          <p className="text-xs text-muted-foreground text-center mt-3">You'll be redirected to Stripe to complete payment securely.</p>
        )}
      </CardContent>
    </Card>
  );
}
