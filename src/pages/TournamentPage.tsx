import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, MapPin, ClipboardList, Megaphone, Shield, Clock, PoundSterling, CheckCircle, Loader2, AlertTriangle, Phone, Mail, Award, Utensils, Dog, Info, Camera } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TournamentEntryForm } from "@/components/tournament/TournamentEntryForm";
import { TournamentPhotoGallery } from "@/components/tournament/TournamentPhotoGallery";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PitchLayoutSVG from "@/components/tournament/PitchLayoutSVG";
import { TournamentBracket } from "@/components/TournamentBracket";
import { toast } from "sonner";

const TournamentPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const { data: tournaments } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tournaments").select("*").in("status", ["active", "completed"]).order("tournament_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const activeTournament = tournaments?.find(t => t.status === "active") || tournaments?.[0];

  const { data: ageGroups } = useQuery({
    queryKey: ["tournament-age-groups", activeTournament?.id],
    queryFn: async () => {
      if (!activeTournament) return [];
      const { data, error } = await supabase.from("tournament_age_groups").select("*").eq("tournament_id", activeTournament.id);
      if (error) throw error;
      return (data || []).sort((a, b) => {
        const numA = parseInt(a.age_group.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.age_group.replace(/\D/g, "")) || 0;
        return numA - numB;
      });
    },
    enabled: !!activeTournament,
  });

  const { data: teams, refetch: refetchTeams } = useQuery({
    queryKey: ["tournament-teams", activeTournament?.id],
    queryFn: async () => {
      if (!ageGroups?.length) return [];
      const ids = ageGroups.map(ag => ag.id);
      const { data, error } = await supabase.from("tournament_teams").select("*").in("age_group_id", ids).eq("status", "confirmed");
      if (error) throw error;
      return data;
    },
    enabled: !!ageGroups?.length,
  });

  const { data: groups } = useQuery({
    queryKey: ["tournament-groups", activeTournament?.id],
    queryFn: async () => {
      if (!ageGroups?.length) return [];
      const ids = ageGroups.map(ag => ag.id);
      const { data, error } = await supabase.from("tournament_groups").select("*").in("age_group_id", ids);
      if (error) throw error;
      return data;
    },
    enabled: !!ageGroups?.length,
  });

  const { data: matches } = useQuery({
    queryKey: ["tournament-matches", activeTournament?.id],
    queryFn: async () => {
      if (!ageGroups?.length) return [];
      const ids = ageGroups.map(ag => ag.id);
      const { data, error } = await supabase.from("tournament_matches").select("*").in("age_group_id", ids).order("match_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!ageGroups?.length,
  });

  const { data: announcements } = useQuery({
    queryKey: ["tournament-announcements", activeTournament?.id],
    queryFn: async () => {
      if (!activeTournament) return [];
      const { data, error } = await supabase.from("tournament_announcements").select("*").eq("tournament_id", activeTournament.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeTournament,
  });

  // Handle payment return
  useEffect(() => {
    const payment = searchParams.get("payment");
    const brId = searchParams.get("br_id");
    const teamId = searchParams.get("team_id");
    const photoPurchased = searchParams.get("photo_purchased");

    if (payment === "success" && brId && teamId && !verifying) {
      setVerifying(true);
      verifyPayment(brId, teamId);
    } else if (payment === "cancelled") {
      toast.error("Payment was cancelled. Your registration is still pending.");
      setSearchParams({});
    }

    // Handle photo purchase return
    if (photoPurchased) {
      setActiveSection("photos");
      toast.success("Photo purchased! You can now download it from the gallery.");
      // Verify and record the purchase
      supabase.functions.invoke("verify-photo-purchase", {
        body: { photo_id: photoPurchased },
      }).then(() => {
        setSearchParams({});
      }).catch(() => {
        setSearchParams({});
      });
    }
  }, [searchParams]);

  const verifyPayment = async (brId: string, teamId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-tournament-payment", {
        body: { br_id: brId, team_id: teamId },
      });

      if (error) throw error;

      if (data.success) {
        setPaymentSuccess(true);
        refetchTeams();
        toast.success("Payment confirmed! Your team has been registered and assigned to a group.");
      } else {
        toast.error(data.error || "Payment verification failed");
      }
    } catch (err) {
      toast.error("Failed to verify payment. Please contact us.");
    } finally {
      setVerifying(false);
      setSearchParams({});
    }
  };




  const getStandings = (groupId: string) => {
    const groupTeams = teams?.filter(t => t.group_id === groupId) || [];
    const groupMatches = matches?.filter(m => m.group_id === groupId && m.status === "completed") || [];

    return groupTeams.map(team => {
      const played = groupMatches.filter(m => m.home_team_id === team.id || m.away_team_id === team.id);
      let w = 0, d = 0, l = 0, gf = 0, ga = 0;
      played.forEach(m => {
        const isHome = m.home_team_id === team.id;
        const scored = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
        const conceded = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
        gf += scored; ga += conceded;
        if (scored > conceded) w++; else if (scored === conceded) d++; else l++;
      });
      return { team, p: played.length, w, d, l, gf, ga, gd: gf - ga, pts: w * 3 + d };
    }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  const getTeamName = (id: string) => teams?.find(t => t.id === id)?.team_name || "TBC";

  const TeamLink = ({ id }: { id: string }) => {
    const name = getTeamName(id);
    if (name === "TBC") return <span>{name}</span>;
    return (
      <Link to={`/tournament/team/${id}`} className="hover:text-primary hover:underline transition-colors">
        {name}
      </Link>
    );
  };

  const knockoutMatches = matches?.filter(m => m.stage !== "group") || [];
  const groupMatches = matches?.filter(m => m.stage === "group") || [];

  const ageGroupDetails: Record<string, { date: string; format: string }> = {
    "U7": { date: "Saturday 13th June", format: "5v5" },
    "U8": { date: "Saturday 13th June", format: "5v5" },
    "U9": { date: "Sunday 14th June", format: "7v7" },
    "U10": { date: "Sunday 14th June", format: "7v7" },
    "U11": { date: "Saturday 20th June", format: "7v7" },
    "U12": { date: "Saturday 20th June", format: "7v7" },
    "U13": { date: "Sunday 21st June", format: "7v7" },
    "U14": { date: "Sunday 21st June", format: "7v7" },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="mb-10 text-center">
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Peterborough Athletic <span className="text-primary">Tournament 2026</span>
            </h1>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                13th – 21st June 2026
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                Itter Park
              </span>
              <span className="flex items-center gap-1.5">
                <PoundSterling className="h-4 w-4 text-primary" />
                £40 per team
              </span>
            </div>
            {activeTournament?.description && (
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm">{activeTournament.description}</p>
            )}
          </div>

          {/* Payment verification overlay */}
          {verifying && (
            <Card className="max-w-md mx-auto mb-6 border-primary">
              <CardContent className="pt-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="font-medium">Verifying your payment...</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait while we confirm your registration.</p>
              </CardContent>
            </Card>
          )}

          {/* Payment success message */}
          {paymentSuccess && (
            <Card className="max-w-md mx-auto mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <p className="font-bold text-lg text-green-700 dark:text-green-400">Registration Complete!</p>
                <p className="text-sm text-muted-foreground mt-1">Your team has been confirmed and assigned to a group. Check the Groups tab!</p>
              </CardContent>
            </Card>
          )}

          {!activeTournament ? (
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="pt-8 pb-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tournaments scheduled at the moment. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto">
                <div className="flex-1 w-full">
                  <Label htmlFor="tournament-section" className="sr-only">Tournament section</Label>
                  <Select value={activeSection} onValueChange={setActiveSection}>
                    <SelectTrigger id="tournament-section" className="font-display tracking-[0.15em] uppercase">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="groups">Groups</SelectItem>
                        <SelectItem value="fixtures">Fixtures</SelectItem>
                        <SelectItem value="knockout">Knockout</SelectItem>
                        <SelectItem value="photos">Photos</SelectItem>
                        <SelectItem value="register">ENTER HERE!</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setActiveSection("register")}
                  size="lg"
                  className="w-full sm:w-auto font-display tracking-wider text-sm animate-pulse hover:animate-none"
                >
                  ENTER HERE!
                </Button>
              </div>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-6">
                {announcements && announcements.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Megaphone className="h-5 w-5 text-primary" />Announcements</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {announcements.map(a => (
                        <div key={a.id} className="border-l-2 border-primary pl-3">
                          <p className="text-sm">{a.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString("en-GB")}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Schedule & Age Groups */}
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />Schedule & Age Groups
                      </CardTitle>
                      <CardDescription className="mt-1.5">Two weekends of football across all age groups</CardDescription>
                    </div>
                    {activeTournament && ageGroups && (
                      <Button
                        size="sm"
                        onClick={() => setActiveSection("photos")}
                        className="bg-gold-gradient text-primary-foreground font-display tracking-wider shrink-0"
                      >
                        <Camera className="h-4 w-4 mr-1.5" />
                        Action Photos
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {ageGroups?.map(ag => {
                        const details = ageGroupDetails[ag.age_group];
                        return (
                          <div key={ag.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                              <p className="font-semibold text-sm">{ag.age_group}</p>
                              {details && (
                                <p className="text-xs text-muted-foreground">{details.date} · {details.format}</p>
                              )}
                            </div>
                            {ag.max_teams && (
                              <Badge variant="secondary" className="text-xs">Max {ag.max_teams}</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {(!ageGroups || ageGroups.length === 0) && <p className="text-sm text-muted-foreground">Age groups coming soon</p>}
                  </CardContent>
                </Card>

                {/* Registration & Match Format */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Registration</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p><strong>Registration:</strong> From 8:30 AM at the Registration Gazebo</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p><strong>First Match:</strong> 9:30 AM</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <PoundSterling className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p><strong>Entry Fee:</strong> £40 per team</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Match Format</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p><strong>Duration:</strong> Two 7-minute halves · 1-minute half time</p>
                      <p><strong>5v5:</strong> U7 & U8 (max 10 players per team)</p>
                      <p><strong>7v7:</strong> U9, U10, U11, U12, U13 & U14 (max 10 players per team)</p>
                      <p><strong>Progression:</strong> Top 2 from each group → Semi-Finals → Final</p>
                      <p><strong>Tiebreaker:</strong> Goal difference, then 3 penalties each</p>
                      <p className="text-muted-foreground">No 3rd/4th place play-off</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Awards & First Aid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-primary" />Awards</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>🏆 <strong>Winners:</strong> Trophy + 10 Winner Medals</p>
                      <p>🥈 <strong>Runners-up:</strong> 10 Runner-Up Medals</p>
                      <p className="text-muted-foreground">No other placement awards given</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />First Aid & Help</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>🏥 First Aid available at the Registration Gazebo</p>
                      <p>👨‍⚕️ Several first aiders on site</p>
                      <p>👦 Lost children — bring to Registration Gazebo</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Rules Accordion */}
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Full Tournament Rules</CardTitle></CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="match-rules">
                        <AccordionTrigger className="text-sm font-semibold">⚽ Match Day Rules</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                          <p>• Kit clashes: Away team must wear bibs</p>
                          <p>• Home team supplies match ball (Size 3 for U7–U10, Size 4 for U11–U14)</p>
                          <p>• Shin pads are mandatory</p>
                          <p>• Roll-on, roll-off substitutions (unlimited)</p>
                          <p>• No offside rule for any age group</p>
                          <p>• All free kicks are direct</p>
                          <p>• Goalkeepers CAN kick from hands</p>
                          <p>• Back pass rule in place for all age groups</p>
                          <p>• Kick-off decided by Rock-Paper-Scissors</p>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="younger-rules">
                        <AccordionTrigger className="text-sm font-semibold">👦 U7–U10 Specific Rules</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                          <p>• Must take kick ins or dribble ins</p>
                          <p>• No shooting direct from a kick in</p>
                          <p>• No deliberate heading</p>
                          <p>• Must retreat to halfway line on opposition goal kicks</p>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="eligibility">
                        <AccordionTrigger className="text-sm font-semibold">📋 Player Eligibility</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                          <p>• Players must play in the age group they played in for 2025/26 season</p>
                          <p>• Only registered players from 2025/26 can play</p>
                          <p>• Maximum 2 guest players allowed per team (proof of age required)</p>
                          <p>• No player may play for more than one team on the day</p>
                          <p>• Max squad size: 10 players per team</p>
                          <p>• A child who has not reached age 6 shall not play</p>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="discipline">
                        <AccordionTrigger className="text-sm font-semibold">🟨 Discipline & Conduct</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                          <p>• Yellow and red card system in place</p>
                          <p>• Red card (straight or 2 yellows) = suspended for rest of tournament</p>
                          <p>• Zero-tolerance approach to abusive, aggressive, or threatening behaviour</p>
                          <p>• Referee decisions are final and must be respected</p>
                          <p>• FA Respect and Safeguarding Codes of Conduct apply</p>
                          <p>• Serious incidents reported to authorities including police if necessary</p>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="results">
                        <AccordionTrigger className="text-sm font-semibold">📊 Results & Updates</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                          <p>• Referees bring result slips to Registration Gazebo after each match</p>
                          <p>• Results entered and league tables updated live</p>
                          <p>• Each age group will have a WhatsApp group for results & table updates</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                {/* Venue & Directions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Venue & Directions</CardTitle>
                    <CardDescription>Itter Park, Itter Crescent, Peterborough, PE4 6SW</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold mb-2">Pitch Layout</p>
                        <PitchLayoutSVG />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-2">Directions & Parking</p>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> Tournament Venue</p>
                            <div className="rounded-lg border border-border overflow-hidden aspect-video">
                              <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2412.5!2d-0.2365!3d52.6095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s!2sItter+Cres%2C+Park%2C+Peterborough+PE4!5e0!3m2!1sen!2suk!4v1700000000000"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Tournament venue - Itter Park"
                              />
                            </div>
                            <a href="https://www.google.com/maps/dir//Itter+Cres,+Park,+Peterborough+PE4" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline">
                              <MapPin className="h-3 w-3" /> Get directions to venue
                            </a>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3 text-yellow-500" /> Parking Location</p>
                            <div className="rounded-lg border border-border overflow-hidden aspect-video">
                              <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2412.5!2d-0.2365!3d52.6095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s!2s1-25+Hallfields+Ln%2C+Peterborough+PE4+7UW!5e0!3m2!1sen!2suk!4v1700000000001"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Parking location - Hallfields Lane"
                              />
                            </div>
                            <a href="https://www.google.com/maps/dir//1-25+Hallfields+Ln,+Peterborough+PE4+7UW" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline">
                              <MapPin className="h-3 w-3" /> Get directions to parking
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <p className="text-sm text-destructive"><strong>Important:</strong> Do NOT park in front of or block the Main Gate on Itter Crescent — this must be kept clear for emergency vehicle access.</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Some parking available near the event address. A parking steward will be on location. Extra parking details included in tournament documents.</p>
                  </CardContent>
                </Card>

                {/* Reminders */}
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Reminders</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <p>💧 Bring water & weather gear (sunscreen)</p>
                      <p>🚧 Keep touchlines clear for players & referees</p>
                      <p>🗑️ Use bins or black sacks provided for litter</p>
                      <p>🐕 Dogs must be on leads & cleaned up after</p>
                      <p>🤝 Respect all players, officials, and staff</p>
                      <p>🍔 Food, drink & ice cream vendor on sale</p>
                      <p>🎪 Bouncy castles & attractions over the weekends</p>
                      <p>🚫 No changing facilities available</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact & Quick Stats */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Phone className="h-5 w-5 text-primary" />Contact</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                      <div>
                        <p className="font-semibold mb-2 text-foreground">Quick Enquiry</p>
                        <form onSubmit={(e) => { e.preventDefault(); const form = e.target as HTMLFormElement; const name = (form.elements.namedItem('eq_name') as HTMLInputElement).value; const email = (form.elements.namedItem('eq_email') as HTMLInputElement).value; const msg = (form.elements.namedItem('eq_msg') as HTMLTextAreaElement).value; window.location.href = `mailto:peterboroughath@gmail.com?subject=Tournament Enquiry from ${encodeURIComponent(name)}&body=${encodeURIComponent(msg)}%0A%0AFrom: ${encodeURIComponent(name)} (${encodeURIComponent(email)})`; toast.success("Opening your email client..."); }} className="space-y-2">
                          <Input name="eq_name" placeholder="Your name" required className="h-8 text-xs" />
                          <Input name="eq_email" type="email" placeholder="Your email" required className="h-8 text-xs" />
                          <Textarea name="eq_msg" placeholder="Your question..." required rows={3} className="text-xs min-h-[60px]" />
                          <Button type="submit" size="sm" className="w-full bg-gold-gradient text-primary-foreground font-display text-xs">
                            <Mail className="h-3 w-3 mr-1" /> Send Enquiry
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Quick Stats</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center rounded-lg bg-muted p-3">
                          <p className="text-2xl font-bold text-primary">{ageGroups?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">Age Groups</p>
                        </div>
                        <div className="text-center rounded-lg bg-muted p-3">
                          <p className="text-2xl font-bold text-primary">{teams?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">Teams</p>
                        </div>
                        <div className="text-center rounded-lg bg-muted p-3">
                          <p className="text-2xl font-bold text-primary">{matches?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">Matches</p>
                        </div>
                        <div className="text-center rounded-lg bg-muted p-3">
                          <p className="text-2xl font-bold text-primary">4</p>
                          <p className="text-xs text-muted-foreground">Days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </TabsContent>

              {/* GROUPS */}
              <TabsContent value="groups" className="space-y-6">
                {ageGroups?.map(ag => {
                  const agGroups = groups?.filter(g => g.age_group_id === ag.id) || [];
                  if (agGroups.length === 0) return (
                    <Card key={ag.id}><CardHeader><CardTitle className="text-lg">{ag.age_group}</CardTitle><CardDescription>Groups not drawn yet</CardDescription></CardHeader></Card>
                  );
                  return (
                    <div key={ag.id} className="space-y-4">
                      <h3 className="font-display text-xl font-bold text-primary">{ag.age_group}</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {agGroups.map(group => {
                          const standings = getStandings(group.id);
                          return (
                            <Card key={group.id}>
                              <CardHeader className="pb-2"><CardTitle className="text-base">Group {group.group_name}</CardTitle></CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[140px]">Team</TableHead>
                                      <TableHead className="text-center w-8">P</TableHead>
                                      <TableHead className="text-center w-8">W</TableHead>
                                      <TableHead className="text-center w-8">D</TableHead>
                                      <TableHead className="text-center w-8">L</TableHead>
                                      <TableHead className="text-center w-10">GD</TableHead>
                                      <TableHead className="text-center w-10 font-bold">Pts</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {standings.map((s, i) => (
                                      <TableRow key={s.team.id} className={i === 0 ? "bg-primary/5" : ""}>
                                        <TableCell className="font-medium text-xs"><TeamLink id={s.team.id} /></TableCell>
                                        <TableCell className="text-center text-xs">{s.p}</TableCell>
                                        <TableCell className="text-center text-xs">{s.w}</TableCell>
                                        <TableCell className="text-center text-xs">{s.d}</TableCell>
                                        <TableCell className="text-center text-xs">{s.l}</TableCell>
                                        <TableCell className="text-center text-xs">{s.gd}</TableCell>
                                        <TableCell className="text-center text-xs font-bold">{s.pts}</TableCell>
                                      </TableRow>
                                    ))}
                                    {standings.length === 0 && (
                                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground text-xs">No teams assigned</TableCell></TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {(!ageGroups || ageGroups.length === 0) && (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground">No groups available yet</CardContent></Card>
                )}
              </TabsContent>

              {/* FIXTURES */}
              <TabsContent value="fixtures" className="space-y-4">
                {ageGroups?.map(ag => {
                  const agMatches = groupMatches.filter(m => m.age_group_id === ag.id);
                  if (agMatches.length === 0) return null;
                  return (
                    <div key={ag.id} className="space-y-3">
                      <h3 className="font-display text-xl font-bold text-primary">{ag.age_group}</h3>
                      <div className="space-y-2">
                        {agMatches.map(m => (
                          <Card key={m.id} className="p-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium flex-1 text-right"><TeamLink id={m.home_team_id} /></span>
                              <div className="mx-4 text-center min-w-[60px]">
                                {m.status === "completed" ? (
                                  <span className="font-bold text-lg">{m.home_score} - {m.away_score}</span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">{m.match_time ? new Date(m.match_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "TBC"}</span>
                                )}
                              </div>
                              <span className="font-medium flex-1"><TeamLink id={m.away_team_id} /></span>
                            </div>
                            {m.pitch && <p className="text-xs text-muted-foreground text-center mt-1">Pitch: {m.pitch}</p>}
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {groupMatches.length === 0 && (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground">Fixtures not yet published</CardContent></Card>
                )}
              </TabsContent>

              {/* KNOCKOUT */}
              <TabsContent value="knockout" className="space-y-6">
                {knockoutMatches.length === 0 ? (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground">Knockout stages not started yet</CardContent></Card>
                ) : (
                  <div className="space-y-8">
                    {ageGroups?.map(ag => {
                      const agKnockout = knockoutMatches.filter(m => m.age_group_id === ag.id);
                      if (agKnockout.length === 0) return null;
                      return (
                        <Card key={ag.id} className="p-4 md:p-6">
                          <TournamentBracket
                            matches={agKnockout}
                            getTeamName={getTeamName}
                            ageGroupLabel={ag.age_group}
                          />
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* REGISTER */}
              <TabsContent value="register">
                {ageGroups && ageGroups.length > 0 ? (
                  <TournamentEntryForm
                    ageGroups={ageGroups}
                    onSuccess={() => {
                      refetchTeams();
                    }}
                  />
                ) : (
                  <Card className="max-w-lg mx-auto text-center">
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">Registration not yet open — check back soon!</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* PHOTOS */}
              <TabsContent value="photos" className="space-y-6">
                {activeTournament && ageGroups && (
                  <>
                    <TournamentPhotoGallery
                      tournamentId={activeTournament.id}
                      ageGroups={ageGroups}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TournamentPage;
