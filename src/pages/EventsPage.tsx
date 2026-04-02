import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PartyPopper } from "lucide-react";
import { CouncilFixtureExport } from "@/components/CouncilFixtureExport";
import { useAuth } from "@/contexts/AuthContext";

export default function EventsPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              <span className="text-gold-gradient">Events</span>
            </h1>
            <p className="text-muted-foreground text-center mb-12">Upcoming club events and social activities</p>
          </motion.div>

          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <CouncilFixtureExport />
            </motion.div>
          )}

          <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-12 text-center">
            <PartyPopper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming events. Stay tuned for announcements!</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
