import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Newspaper } from "lucide-react";

export default function NewsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              <span className="text-gold-gradient">Latest</span> News
            </h1>
            <p className="text-muted-foreground text-center mb-12">Club news, announcements, and updates</p>
          </motion.div>
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-12 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No news articles yet. Check back for the latest updates!</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
