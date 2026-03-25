import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Users, Clock, MapPin, Calendar, ChevronRight, Shield, Trophy, TrendingUp, BarChart3, ExternalLink, Table2 } from "lucide-react";
import { TeamStatsTable } from "@/components/TeamStatsTable";
import clubLogo from "@/assets/club-logo.jpg";

const leagueTableUrls: Record<string, string> = {
  "u13s-black": "https://fulltime.thefa.com/table.html?divisionseason=189349138",
  "u13s-gold": "https://fulltime.thefa.com/table.html?divisionseason=189349138",
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
  { slug: "u7s", name: "U7s", ageGroup: "Under 7", training: "Tues & Thurs 5:30pm", nextFixture: { opponent: "Thurlby Tigers U7 Yellow", venue: "Home", date: "Sat 28 March", kickoff: "09:30" } },
  { slug: "u8s-black", name: "U8s Black", ageGroup: "Under 8", training: "Mon & Wed 5:30pm", nextFixture: { opponent: "One Touch Football U8 Red", venue: "Home", date: "Sat 28 March", kickoff: "10:30" } },
  { slug: "u8s-gold", name: "U8s Gold", ageGroup: "Under 8", training: "Tues & Thurs 5:30pm", nextFixture: { opponent: "Whittlesey Jnr U8 Blue", venue: "Home", date: "Sat 28 March", kickoff: "09:30" } },
  { slug: "u9s", name: "U9s", ageGroup: "Under 9", training: "Mon & Wed 6:00pm", nextFixture: { opponent: "Deeping Rangers U9 Claret", venue: "Home", date: "Sat 28 March", kickoff: "09:30" } },
  { slug: "u10s", name: "U10s", ageGroup: "Under 10", training: "Tues & Thurs 6:00pm", nextFixture: { opponent: "Netherton Utd U10 Red", venue: "Home", date: "Sat 28 March", kickoff: "10:30" } },
  { slug: "u11s-black", name: "U11s Black", ageGroup: "Under 11", training: "Mon & Wed 6:00pm", nextFixture: { opponent: "Gladstone Knights U11", venue: "Away", date: "Sun 29 March", kickoff: "12:00" } },
  { slug: "u11s-gold", name: "U11s Gold", ageGroup: "Under 11", training: "Tues & Thurs 6:00pm", nextFixture: { opponent: "Yaxley FC U11 Blues", venue: "Home", date: "Sun 29 March", kickoff: "10:00" } },
  { slug: "u13s-black", name: "U13s Black", ageGroup: "Under 13", training: "Mon & Wed 6:30pm", nextFixture: { opponent: "Nene Valley U13", venue: "Home", date: "Sun 29 March", kickoff: "12:00" } },
  { slug: "u13s-gold", name: "U13s Gold", ageGroup: "Under 13", training: "Tues & Thurs 6:30pm", nextFixture: { opponent: "Moulton Chapel U13", venue: "Home", date: "Sun 03 May", kickoff: "10:00" } },
  { slug: "u14s", name: "U14s", ageGroup: "Under 14", training: "Mon & Wed 7:00pm", nextFixture: { opponent: "Park Farm Pumas U14 Black", venue: "Home", date: "Sun 12 April", kickoff: "14:00" } },
];

function TeamDetail({ team }: { team: TeamData }) {
  const f = team.nextFixture;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
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
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="bg-primary/10 px-6 py-3 border-b border-border">
                  <h2 className="font-display text-sm font-bold text-primary tracking-wider">Next Fixture</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={clubLogo} alt="" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-display font-bold text-sm">{team.name}</p>
                        <p className="text-xs text-muted-foreground">Peterborough Athletic</p>
                      </div>
                    </div>
                    <span className="font-display text-lg text-muted-foreground">VS</span>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm">{f.opponent}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{f.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />KO {f.kickoff}</span>
                    <span className={`flex items-center gap-1 font-bold ${f.venue === "Home" ? "text-green-400" : "text-blue-400"}`}>
                      <MapPin className="w-3 h-3" />{f.venue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Player Stats */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-sm font-bold text-primary tracking-wider">Player Stats</h2>
                </div>
                <TeamStatsTable ageGroup={team.name} />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TeamCard({ team, index }: { team: TeamData; index: number }) {
  const f = team.nextFixture;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to={`/teams/${team.slug}`}
        className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
      >
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-primary/20 to-transparent px-5 py-4 flex items-center gap-3">
          <div className="relative">
            <img src={clubLogo} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/30" />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <Shield className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-base group-hover:text-primary transition-colors truncate">
              {team.name}
            </h3>
            <p className="text-xs text-muted-foreground font-display tracking-wide">{team.ageGroup}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-3 flex-1">
          {/* Next match */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-display tracking-widest text-muted-foreground uppercase">Next Match</p>
            <p className="text-sm font-medium truncate">vs {f.opponent}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {f.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {f.kickoff}
              </span>
              <span className={`inline-flex items-center gap-1 font-bold ${f.venue === "Home" ? "text-green-400" : "text-blue-400"}`}>
                <MapPin className="w-3 h-3" />
                {f.venue}
              </span>
            </div>
          </div>

          {/* Training */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] font-display tracking-widest text-muted-foreground uppercase mb-1">Training</p>
            <p className="text-xs text-foreground/80">{team.training}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function TeamsPage() {
  const { teamSlug } = useParams<{ teamSlug: string }>();

  if (teamSlug) {
    const team = allTeams.find(t => t.slug === teamSlug);
    if (team) return <TeamDetail team={team} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-xs font-display tracking-wider text-primary">2025/26 SEASON</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-3">
              Our <span className="text-gold-gradient">Teams</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {allTeams.length} teams across all age groups. Select a team to view fixtures, results, and squad info.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTeams.map((team, i) => (
              <TeamCard key={team.slug} team={team} index={i} />
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="max-w-md mx-auto text-center mt-14"
          >
            <div className="bg-card border border-border rounded-xl p-6">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-sm mb-1">Want to join the Lions?</h3>
              <p className="text-xs text-muted-foreground mb-4">Register your interest for the upcoming season.</p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display text-xs tracking-wider px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                Register Now
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
