import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Clock, MapPin, Calendar, ChevronRight, Shield, Trophy, TrendingUp, BarChart3, Loader2, Navigation, ClipboardEdit, ChevronDown, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TeamTradingCards } from "@/components/showcase/TeamTradingCards";
import { TeamStatsTable } from "@/components/TeamStatsTable";
import { LeagueTable } from "@/components/LeagueTable";
import { useTeamFixtures, FAFixture } from "@/hooks/useTeamFixtures";
import { useAuth } from "@/contexts/AuthContext";
import { CoachFixturePanel } from "@/components/CoachFixturePanel";
import { MatchDetailPanel } from "@/components/MatchDetailPanel";
import clubLogo from "@/assets/club-logo.jpg";

const leagueTableConfig: Record<string, { divisionSeason?: string; tableUrl?: string; faUrl: string; highlightTeams: string[] }> = {
  "u13s-black": {
    divisionSeason: "189349138",
    faUrl: "https://fulltime.thefa.com/table.html?divisionseason=189349138",
    highlightTeams: ["Peterborough Ath U13 Black"],
  },
  "u13s-gold": {
    divisionSeason: "189349138",
    faUrl: "https://fulltime.thefa.com/table.html?divisionseason=189349138",
    highlightTeams: ["Peterborough Ath U13 Gold"],
  },
  "u14s": {
    tableUrl: "https://fulltime.thefa.com/table.html?selectedSeason=233257866&selectedDivision=682264182&activeTab=1",
    faUrl: "https://fulltime.thefa.com/table.html?selectedSeason=233257866&selectedDivision=682264182&activeTab=1",
    highlightTeams: ["Peterborough Ath U14"],
  },
};

interface TeamData {
  slug: string;
  name: string;
  ageGroup: string;
  training: string;
  nextFixture: {
    opponent: string;
    venue: "Home" | "Away";
    date: string;
    kickoff: string;
  };
}

const allTeams: TeamData[] = [
  { slug: "u7s", name: "U7", ageGroup: "Under 7", training: "Tues & Thurs 5:30pm", nextFixture: { opponent: "Thurlby Tigers U7 Yellow", venue: "Home", date: "Sat 28 March", kickoff: "09:30" } },
  { slug: "u8s-black", name: "U8 Black", ageGroup: "Under 8", training: "Mon & Wed 5:30pm", nextFixture: { opponent: "One Touch Football U8 Red", venue: "Home", date: "Sat 28 March", kickoff: "10:30" } },
  { slug: "u8s-gold", name: "U8 Gold", ageGroup: "Under 8", training: "Tues & Thurs 5:30pm", nextFixture: { opponent: "Whittlesey Jnr U8 Blue", venue: "Home", date: "Sat 28 March", kickoff: "09:30" } },
  { slug: "u9s", name: "U9", ageGroup: "Under 9", training: "Mon & Wed 6:00pm", nextFixture: { opponent: "Deeping Rangers U9 Claret", venue: "Home", date: "Sat 28 March", kickoff: "09:30" } },
  { slug: "u10s", name: "U10", ageGroup: "Under 10", training: "Tues & Thurs 6:00pm", nextFixture: { opponent: "Netherton Utd U10 Red", venue: "Home", date: "Sat 28 March", kickoff: "10:30" } },
  { slug: "u11s-black", name: "U11 Black", ageGroup: "Under 11", training: "Mon & Wed 6:00pm", nextFixture: { opponent: "Gladstone Knights U11", venue: "Away", date: "Sun 29 March", kickoff: "12:00" } },
  { slug: "u11s-gold", name: "U11 Gold", ageGroup: "Under 11", training: "Tues & Thurs 6:00pm", nextFixture: { opponent: "Yaxley FC U11 Blues", venue: "Home", date: "Sun 29 March", kickoff: "10:00" } },
  { slug: "u13s-black", name: "U13 Black", ageGroup: "Under 13", training: "Mon & Wed 6:30pm", nextFixture: { opponent: "Nene Valley U13", venue: "Home", date: "Sun 29 March", kickoff: "12:00" } },
  { slug: "u13s-gold", name: "U13 Gold", ageGroup: "Under 13", training: "Tues & Thurs 6:30pm", nextFixture: { opponent: "Moulton Chapel U13", venue: "Home", date: "Sun 03 May", kickoff: "10:00" } },
  { slug: "u14s", name: "U14", ageGroup: "Under 14", training: "Mon & Wed 7:00pm", nextFixture: { opponent: "Park Farm Pumas U14 Black", venue: "Home", date: "Sun 12 April", kickoff: "14:00" } },
];

function formatFADate(dateStr: string): string {
// dateStr is "DD/MM/YY" or "DD/MM/YYYY" format
  const [d, m, y] = dateStr.split("/");
  const fullYear = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
  const date = new Date(fullYear, parseInt(m) - 1, parseInt(d));
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function parseFADate(dateStr: string): Date | null {
  try {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? 2000 + Number(parts[2]) : Number(parts[2]);
      return new Date(year, Number(parts[1]) - 1, Number(parts[0]));
    }
  } catch {}
  return null;
}

function isFutureFixture(f: { date: string }): boolean {
  const fixDate = parseFADate(f.date);
  if (!fixDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return fixDate >= today;
}

function TeamDetail({ team }: { team: TeamData }) {
  const f = team.nextFixture;
  const { data: liveData, isLoading: fixturesLoading } = useTeamFixtures(team.slug);
  const { isCoach, isAdmin, isPlayer } = useAuth();
  const canManage = isCoach || isAdmin;
  const [coachFixture, setCoachFixture] = useState<FAFixture | null>(null);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  // Determine next fixture from live data (future only) or fall back to hardcoded
  const futureFixtures = liveData?.fixtures?.filter(isFutureFixture) || [];
  const nextFixture = futureFixtures[0];
  const displayFixture = nextFixture
    ? {
        opponent: nextFixture.homeTeam.includes("Peterborough Ath") ? nextFixture.awayTeam : nextFixture.homeTeam,
        venue: nextFixture.homeTeam.includes("Peterborough Ath") ? "Home" as const : "Away" as const,
        date: formatFADate(nextFixture.date),
        kickoff: nextFixture.time,
      }
    : f;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/teams" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            ← All Teams
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-4 mb-8">
              <img src={clubLogo} alt="PAFC" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
              <div>
                <h1 className="text-4xl md:text-5xl font-bold font-display">
                  <span className="text-gold-gradient">{team.name}</span>
                </h1>
                <p className="text-sm text-muted-foreground font-display">Peterborough Athletic FC</p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Next Fixture */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="bg-primary/10 px-6 py-3 border-b border-border">
                  <h2 className="font-display text-sm font-bold text-primary tracking-wider">Next Fixture</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-display font-bold text-sm">{team.name}</p>
                        <p className="text-xs text-muted-foreground">Peterborough Athletic</p>
                      </div>
                    </div>
                    <span className="font-display text-lg text-muted-foreground">VS</span>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm">{displayFixture.opponent}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{displayFixture.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />KO {displayFixture.kickoff}</span>
                    <span className={`flex items-center gap-1 font-bold ${displayFixture.venue === "Home" ? "text-green-400" : "text-blue-400"}`}>
                      <MapPin className="w-3 h-3" />{displayFixture.venue}
                    </span>
                  </div>
                </div>
              </div>

              {/* All Fixtures from FA */}
              {fixturesLoading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading fixtures from FA Full-Time...</span>
                </div>
              )}

              {liveData && futureFixtures.length > 0 && (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-primary/10 px-6 py-3 border-b border-border">
                    <h2 className="font-display text-sm font-bold text-primary tracking-wider">Upcoming Fixtures</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {futureFixtures.map((fix, i) => {
                      const isHome = fix.homeTeam.includes("Peterborough Ath");
                      return (
                        <div key={i} className="px-6 py-3 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {isHome ? "vs" : "@"} {isHome ? fix.awayTeam : fix.homeTeam}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-muted-foreground">{fix.competition}</p>
                              {fix.venue && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />{fix.venue}
                                </span>
                              )}
                              {fix.venue && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fix.venue)}`, '_system');
                                  }}
                                  className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                                >
                                  <Navigation className="w-2.5 h-2.5" />Directions
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                            <span className={`font-bold ${isHome ? "text-green-400" : "text-blue-400"}`}>
                              {isHome ? "H" : "A"}
                            </span>
                            <span>{formatFADate(fix.date)}</span>
                            <span className="font-mono">{fix.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Results from FA - restricted to player/coach/admin */}
              {(isCoach || isAdmin || isPlayer) && liveData && liveData.results.length > 0 && (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-primary/10 px-6 py-3 border-b border-border">
                    <h2 className="font-display text-sm font-bold text-primary tracking-wider">Results</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {liveData.results.slice(0, 10).map((res, i) => {
                      const isHome = res.homeTeam.includes("Peterborough Ath");
                      const scored = isHome ? (res.homeScore ?? 0) : (res.awayScore ?? 0);
                      const conceded = isHome ? (res.awayScore ?? 0) : (res.homeScore ?? 0);
                      const result = scored > conceded ? "W" : scored < conceded ? "L" : "D";
                      const resultColor = result === "W" ? "bg-green-600" : result === "L" ? "bg-red-600" : "bg-yellow-600";
                      const isExpanded = expandedResult === i;
                      const opponent = isHome ? res.awayTeam : res.homeTeam;
                      return (
                        <div key={i}>
                          <div
                            className="px-6 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedResult(isExpanded ? null : i)}
                          >
                            <span className={`${resultColor} text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded`}>
                              {result}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {isHome ? "vs" : "@"} {opponent}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{formatFADate(res.date)}</p>
                            </div>
                            <span className="font-mono font-bold text-sm">{res.homeScore} - {res.awayScore}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <MatchDetailPanel
                                teamSlug={team.slug}
                                teamName={team.name}
                                opponent={opponent}
                                matchDate={res.date}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* League Table */}
              {leagueTableConfig[team.slug] && (
                <LeagueTable
                  divisionSeason={leagueTableConfig[team.slug].divisionSeason}
                  tableUrl={leagueTableConfig[team.slug].tableUrl}
                  highlightTeams={leagueTableConfig[team.slug].highlightTeams}
                  faUrl={leagueTableConfig[team.slug].faUrl}
                />
              )}

              {/* Trading Card Squad Showcase */}
              <TeamTradingCards ageGroup={team.name} />

              {/* Player Stats - restricted to player/coach/admin */}
              {(isCoach || isAdmin || isPlayer) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-sm font-bold text-primary tracking-wider">Player Stats</h2>
                  </div>
                  <TeamStatsTable ageGroup={team.name} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Coach Fixture Panel */}
      {coachFixture && (
        <CoachFixturePanel
          open={!!coachFixture}
          onClose={() => setCoachFixture(null)}
          fixture={coachFixture}
          teamSlug={team.slug}
          teamName={team.name}
        />
      )}

      <Footer />
    </div>
  );
}

const ageGroups = [
  { label: "All", filter: () => true },
  { label: "U7–U9", filter: (t: TeamData) => ["Under 7", "Under 8", "Under 9"].includes(t.ageGroup) },
  { label: "U10–U11", filter: (t: TeamData) => ["Under 10", "Under 11"].includes(t.ageGroup) },
  { label: "U13–U14", filter: (t: TeamData) => ["Under 13", "Under 14"].includes(t.ageGroup) },
];

function TeamCard({ team, index }: { team: TeamData; index: number }) {
  const f = team.nextFixture;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      layout
    >
      <Link
        to={`/teams/${team.slug}`}
        className="group relative block overflow-hidden rounded-lg border border-border bg-secondary hover:border-primary/60 transition-all duration-300"
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

        <div className="p-5">
          {/* Team header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                {team.name}
              </h3>
              <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">{team.ageGroup}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>

          {/* Fixture bar */}
          <div className="bg-background/60 rounded-md p-3 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-display tracking-[0.2em] text-primary uppercase font-semibold">Next Fixture</span>
              <span className={`text-[10px] font-display font-bold tracking-wider px-2 py-0.5 rounded ${f.venue === "Home" ? "bg-green-500/15 text-green-400" : "bg-blue-500/15 text-blue-400"}`}>
                {f.venue.toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground truncate mb-1.5">vs {f.opponent}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-primary/60" />{f.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary/60" />{f.kickoff}</span>
            </div>
          </div>

          {/* Training */}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-primary/50" />
            <span>Training: {team.training}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function TeamsPage() {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const [activeTab, setActiveTab] = useState(0);

  if (teamSlug) {
    const team = allTeams.find(t => t.slug === teamSlug);
    if (team) return <TeamDetail team={team} />;
  }

  const filteredTeams = allTeams.filter(ageGroups[activeTab].filter);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-xs font-display tracking-[0.2em] text-primary font-semibold">2025/26 SEASON</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold font-display tracking-tight mb-3">
              OUR <span className="text-gold-gradient">TEAMS</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              {allTeams.length} teams competing across all age groups. Select a team to view fixtures, league table & squad stats.
            </p>
          </motion.div>

          {/* Age group tabs */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-1 bg-secondary/50 border border-border rounded-lg p-1 w-fit mx-auto">
              {ageGroups.map((group, i) => (
                <button
                  key={group.label}
                  onClick={() => setActiveTab(i)}
                  className={`relative px-5 py-2 text-xs font-display font-semibold tracking-wider rounded-md transition-all duration-200 ${
                    activeTab === i
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          {/* Teams grid */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTeams.map((team, i) => (
                <TeamCard key={team.slug} team={team} index={i} />
              ))}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-lg mx-auto text-center mt-14"
          >
            <div className="bg-secondary border border-border rounded-lg p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg tracking-tight mb-1">Join the Lions</h3>
              <p className="text-sm text-muted-foreground mb-5">Register your interest for the upcoming season.</p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display text-sm font-semibold tracking-wider px-6 py-3 rounded-md hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                REGISTER NOW
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
