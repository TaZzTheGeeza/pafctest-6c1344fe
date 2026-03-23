import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Users, Clock, MapPin, Calendar, ChevronRight } from "lucide-react";
import clubLogo from "@/assets/club-logo.jpg";

interface TeamData {
  slug: string;
  name: string;
  nextFixture: {
    opponent: string;
    venue: "Home" | "Away";
    date: string;
    kickoff: string;
  };
}

const allTeams: TeamData[] = [
  { slug: "u7s", name: "U7s", nextFixture: { opponent: "Thurlby Tigers U7 Yellow", venue: "Home", date: "Sat 28 March", kickoff: "09:30" } },
  { slug: "u8s-black", name: "U8s Black", nextFixture: { opponent: "One Touch Football U8 Red", venue: "Home", date: "Sat 28 March", kickoff: "10:30" } },
  { slug: "u8s-gold", name: "U8s Gold", nextFixture: { opponent: "Whittlesey Jnr U8 Blue", venue: "Home", date: "Sat 28 March", kickoff: "09:30" } },
  { slug: "u9s", name: "U9s", nextFixture: { opponent: "Deeping Rangers U9 Claret", venue: "Home", date: "Sat 28 March", kickoff: "09:30" } },
  { slug: "u10s", name: "U10s", nextFixture: { opponent: "Netherton Utd U10 Red", venue: "Home", date: "Sat 28 March", kickoff: "10:30" } },
  { slug: "u11s-black", name: "U11s Black", nextFixture: { opponent: "Gladstone Knights U11", venue: "Away", date: "Sun 29 March", kickoff: "12:00" } },
  { slug: "u11s-gold", name: "U11s Gold", nextFixture: { opponent: "Yaxley FC U11 Blues", venue: "Home", date: "Sun 29 March", kickoff: "10:00" } },
  { slug: "u13s-black", name: "U13s Black", nextFixture: { opponent: "Nene Valley U13", venue: "Home", date: "Sun 29 March", kickoff: "12:00" } },
  { slug: "u13s-gold", name: "U13s Gold", nextFixture: { opponent: "Moulton Chapel U13", venue: "Home", date: "Sun 03 May", kickoff: "10:00" } },
  { slug: "u14s", name: "U14s", nextFixture: { opponent: "Park Farm Pumas U14 Black", venue: "Home", date: "Sun 12 April", kickoff: "14:00" } },
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

              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display text-sm font-bold mb-2">Squad & Full Fixtures</h3>
                <p className="text-xs text-muted-foreground">Full squad list, season fixtures, and past results will be added here.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex justify-center mb-6">
              <img src={clubLogo} alt="PAFC" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              Our <span className="text-gold-gradient">Teams</span>
            </h1>
            <p className="text-muted-foreground text-center mb-12">Select a team to view their fixtures and squad</p>
          </motion.div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allTeams.map((team, i) => (
              <motion.div
                key={team.slug}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link
                  to={`/teams/${team.slug}`}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <img src={clubLogo} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <span className="font-display text-sm font-bold group-hover:text-primary transition-colors">{team.name}</span>
                      <p className="text-xs text-muted-foreground">
                        vs {team.nextFixture.opponent} · {team.nextFixture.date}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
