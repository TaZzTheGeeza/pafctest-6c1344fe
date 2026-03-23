import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Users } from "lucide-react";

const allTeams = [
  { slug: "u7s", name: "U7s" },
  { slug: "u8s-black", name: "U8s Black" },
  { slug: "u8s-gold", name: "U8s Gold" },
  { slug: "u9s", name: "U9s" },
  { slug: "u10s", name: "U10s" },
  { slug: "u11s-black", name: "U11s Black" },
  { slug: "u11s-gold", name: "U11s Gold" },
  { slug: "u13s-black", name: "U13s Black" },
  { slug: "u13s-gold", name: "U13s Gold" },
  { slug: "u14s", name: "U14s" },
];

export default function TeamsPage() {
  const { teamSlug } = useParams<{ teamSlug: string }>();

  if (teamSlug) {
    const team = allTeams.find(t => t.slug === teamSlug);
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-4">
                <span className="text-gold-gradient">{team?.name || teamSlug}</span>
              </h1>
              <p className="text-muted-foreground text-center mb-12">Fixtures, results, and squad information coming soon.</p>
              <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Team page content will be added here — fixtures, results, squad list, and more.</p>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              Our <span className="text-gold-gradient">Teams</span>
            </h1>
            <p className="text-muted-foreground text-center mb-12">Select a team to view fixtures, results, and squad info</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {allTeams.map((team, i) => (
              <motion.div
                key={team.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link
                  to={`/teams/${team.slug}`}
                  className="block bg-card border border-border rounded-lg p-6 text-center hover:border-primary transition-colors group"
                >
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
                  <span className="font-display text-sm font-bold group-hover:text-primary transition-colors">{team.name}</span>
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
