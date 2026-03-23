import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import clubLogo from "@/assets/club-logo.jpg";

interface Fixture {
  team: string;
  teamSlug: string;
  opponent: string;
  venue: "Home" | "Away";
  date: string;
  kickoff: string;
}

const upcomingFixtures: Fixture[] = [
  { team: "U7s", teamSlug: "u7s", opponent: "Thurlby Tigers U7 Yellow", venue: "Home", date: "Sat 28 March", kickoff: "09:30" },
  { team: "U8s Black", teamSlug: "u8s-black", opponent: "One Touch Football U8 Red", venue: "Home", date: "Sat 28 March", kickoff: "10:30" },
  { team: "U8s Gold", teamSlug: "u8s-gold", opponent: "Whittlesey Jnr U8 Blue", venue: "Home", date: "Sat 28 March", kickoff: "09:30" },
  { team: "U9s", teamSlug: "u9s", opponent: "Deeping Rangers U9 Claret", venue: "Home", date: "Sat 28 March", kickoff: "09:30" },
  { team: "U10s", teamSlug: "u10s", opponent: "Netherton Utd U10 Red", venue: "Home", date: "Sat 28 March", kickoff: "10:30" },
  { team: "U11s Black", teamSlug: "u11s-black", opponent: "Gladstone Knights U11", venue: "Away", date: "Sun 29 March", kickoff: "12:00" },
  { team: "U11s Gold", teamSlug: "u11s-gold", opponent: "Yaxley FC U11 Blues", venue: "Home", date: "Sun 29 March", kickoff: "10:00" },
  { team: "U13s Black", teamSlug: "u13s-black", opponent: "Nene Valley U13", venue: "Home", date: "Sun 29 March", kickoff: "12:00" },
  { team: "U13s Gold", teamSlug: "u13s-gold", opponent: "Moulton Chapel U13", venue: "Home", date: "Sun 03 May", kickoff: "10:00" },
  { team: "U14s", teamSlug: "u14s", opponent: "Park Farm Pumas U14 Black", venue: "Home", date: "Sun 12 April", kickoff: "14:00" },
];

export function FixturesSection() {
  return (
    <section id="fixtures" className="py-20 bg-surface-elevated">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-2">
            <span className="text-gold-gradient">Upcoming</span> Fixtures
          </h2>
          <p className="text-muted-foreground">Next match for each team</p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          {upcomingFixtures.map((fixture, i) => (
            <motion.div
              key={fixture.teamSlug}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to={`/teams/${fixture.teamSlug}`}
                className="block bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={clubLogo} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <span className="font-display text-sm font-bold text-primary">{fixture.team}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${fixture.venue === "Home" ? "bg-green-900/40 text-green-400" : "bg-blue-900/40 text-blue-400"}`}>
                    {fixture.venue}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">vs</p>
                    <p className="font-display text-sm text-foreground truncate">{fixture.opponent}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {fixture.kickoff}
                    </div>
                    <p className="text-xs text-muted-foreground">{fixture.date}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Link
            to="/teams"
            className="inline-flex items-center gap-1 text-sm font-display text-primary hover:text-gold-light transition-colors"
          >
            View all teams & fixtures
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
