import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";

export default function ClubDocumentsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              Club <span className="text-gold-gradient">Documents</span>
            </h1>
            <p className="text-muted-foreground text-center mb-12">Policies, forms, and official club documentation</p>
          </motion.div>
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Club documents will be available here soon.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
