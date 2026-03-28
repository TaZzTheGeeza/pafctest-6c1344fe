import { motion } from "framer-motion";

interface Result {
  date: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  ageGroup: string;
}

const recentResults: Result[] = [
  { date: "22 Mar 2026", home: "Thurlby Tigers FC U13 White", away: "Peterborough Athletic U13 Black", homeScore: 4, awayScore: 1, competition: "League", ageGroup: "U13" },
  { date: "22 Mar 2026", home: "Thorney FC U14 Oranges", away: "Peterborough Athletic U14", homeScore: 0, awayScore: 8, competition: "League", ageGroup: "U14" },
  { date: "15 Mar 2026", home: "Parkside Athletic U13", away: "Peterborough Athletic U13 Gold", homeScore: 1, awayScore: 4, competition: "League", ageGroup: "U13" },
  { date: "15 Mar 2026", home: "Peterborough Athletic U14", away: "Hampton Rangers U14 Black", homeScore: 7, awayScore: 2, competition: "League", ageGroup: "U14" },
  { date: "8 Mar 2026", home: "Hampton United U13 Blues", away: "Peterborough Athletic U13 Gold", homeScore: 3, awayScore: 9, competition: "League", ageGroup: "U13" },
];

export function ResultsSection() {
  return (
    <section id="results" className="py-20 bg-surface-elevated">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
            <span className="text-gold-gradient">Latest</span> Results
          </h2>
          <p className="text-muted-foreground text-center mb-12">Season 2025/26</p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {recentResults.map((result, i) => {
            const isHome = result.home.includes("Peterborough Athletic");
            const won = isHome
              ? result.homeScore > result.awayScore
              : result.awayScore > result.homeScore;
            const drew = result.homeScore === result.awayScore;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 text-right">
                  <span className={`font-display text-sm md:text-base ${isHome ? "text-primary" : "text-foreground"}`}>
                    {result.home}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-display text-2xl font-bold text-foreground">{result.homeScore}</span>
                  <span className="text-muted-foreground">-</span>
                  <span className="font-display text-2xl font-bold text-foreground">{result.awayScore}</span>
                </div>
                <div className="flex-1">
                  <span className={`font-display text-sm md:text-base ${!isHome ? "text-primary" : "text-foreground"}`}>
                    {result.away}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col items-end shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${won ? "bg-green-900/50 text-green-400" : drew ? "bg-yellow-900/50 text-yellow-400" : "bg-red-900/50 text-red-400"}`}>
                    {won ? "W" : drew ? "D" : "L"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">{result.date}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
