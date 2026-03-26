import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, ChevronRight, Calendar } from "lucide-react";
import clubLogo from "@/assets/club-logo.jpg";

// Opponent logos
import thurlbyTigersLogo from "@/assets/opponents/thurlby-tigers.png";
import oneTouchLogo from "@/assets/opponents/one-touch-football.png";
import whittleseyLogo from "@/assets/opponents/whittlesey-junior.png";
import deepingRangersLogo from "@/assets/opponents/deeping-rangers.png";
import nethertonLogo from "@/assets/opponents/netherton-united.png";
import gladstoneKnightsLogo from "@/assets/opponents/gladstone-knights.png";
import yaxleyLogo from "@/assets/opponents/yaxley-fc.png";
import neneValleyLogo from "@/assets/opponents/nene-valley.png";
import moultonChapelLogo from "@/assets/opponents/moulton-chapel.png";
import parkFarmPumasLogo from "@/assets/opponents/park-farm-pumas.png";

interface Fixture {
  team: string;
  teamSlug: string;
  opponent: string;
  opponentLogo: string;
  venue: "Home" | "Away";
  date: string;
  kickoff: string;
}

const upcomingFixtures: Fixture[] = [
  { team: "U7s", teamSlug: "u7s", opponent: "Thurlby Tigers U7 Yellow", opponentLogo: thurlbyTigersLogo, venue: "Home", date: "Sat 28 March", kickoff: "09:30" },
  { team: "U8s Black", teamSlug: "u8s-black", opponent: "One Touch Football U8 Red", opponentLogo: oneTouchLogo, venue: "Home", date: "Sat 28 March", kickoff: "10:30" },
  { team: "U8s Gold", teamSlug: "u8s-gold", opponent: "Whittlesey Jnr U8 Blue", opponentLogo: whittleseyLogo, venue: "Home", date: "Sat 28 March", kickoff: "09:30" },
  { team: "U9s", teamSlug: "u9s", opponent: "Deeping Rangers U9 Claret", opponentLogo: deepingRangersLogo, venue: "Home", date: "Sat 28 March", kickoff: "09:30" },
  { team: "U10s", teamSlug: "u10s", opponent: "Netherton Utd U10 Red", opponentLogo: nethertonLogo, venue: "Home", date: "Sat 28 March", kickoff: "10:30" },
  { team: "U11s Black", teamSlug: "u11s-black", opponent: "Gladstone Knights U11", opponentLogo: gladstoneKnightsLogo, venue: "Away", date: "Sun 29 March", kickoff: "12:00" },
  { team: "U11s Gold", teamSlug: "u11s-gold", opponent: "Yaxley FC U11 Blues", opponentLogo: yaxleyLogo, venue: "Home", date: "Sun 29 March", kickoff: "10:00" },
  { team: "U13s Black", teamSlug: "u13s-black", opponent: "Nene Valley U13", opponentLogo: neneValleyLogo, venue: "Home", date: "Sun 29 March", kickoff: "12:00" },
  { team: "U13s Gold", teamSlug: "u13s-gold", opponent: "Moulton Chapel U13", opponentLogo: moultonChapelLogo, venue: "Home", date: "Sun 03 May", kickoff: "10:00" },
  { team: "U14s", teamSlug: "u14s", opponent: "Park Farm Pumas U14 Black", opponentLogo: parkFarmPumasLogo, venue: "Home", date: "Sun 12 April", kickoff: "14:00" },
];

export function FixturesSection() {
  return (
    <section id="fixtures" className="py-20 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-surface-elevated" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="font-display text-[11px] tracking-[0.2em] uppercase text-primary">Match Week</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-2">
            <span className="text-primary">Upcoming</span> Fixtures
          </h2>
          <p className="text-muted-foreground text-sm">Next match for every PAFC team</p>
        </motion.div>

        {/* Fixtures grid */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingFixtures.map((fixture, i) => {
              const isHome = fixture.venue === "Home";

              return (
                <motion.div
                  key={fixture.teamSlug}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <Link
                    to={`/teams/${fixture.teamSlug}`}
                    className="group block bg-card/80 backdrop-blur-sm border border-border hover:border-primary/50 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 p-5"
                  >
                    {/* Team badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-display text-xs font-bold tracking-wider text-primary uppercase">{fixture.team}</span>
                      <span className={`text-[10px] font-display tracking-wider uppercase px-2.5 py-1 rounded-full ${
                        isHome ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {fixture.venue}
                      </span>
                    </div>

                    {/* Matchup */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <img src={clubLogo} alt="PAFC" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30 shrink-0" />
                        <span className="font-display text-base font-semibold text-foreground truncate">PAFC {fixture.team}</span>
                      </div>
                      <span className="font-display text-[11px] tracking-[0.15em] uppercase text-muted-foreground bg-secondary px-3 py-1.5 rounded-md shrink-0">vs</span>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                        <span className="font-display text-sm text-muted-foreground truncate text-right">{fixture.opponent}</span>
                        <img
                          src={fixture.opponentLogo}
                          alt={fixture.opponent}
                          className="w-9 h-9 rounded-full object-contain bg-white shrink-0 ring-2 ring-border"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Date & Kickoff */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-display">{fixture.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-display">{fixture.kickoff}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 font-display text-sm tracking-wider text-primary hover:text-primary/80 transition-colors group"
          >
            View all teams & fixtures
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
