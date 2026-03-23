import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Info, Shield, Award } from "lucide-react";

export default function ClubInfoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              Club <span className="text-gold-gradient">Info</span>
            </h1>
            <p className="text-muted-foreground text-center mb-12">Everything you need to know about Peterborough Athletic FC</p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="font-display text-xl font-bold">About the Club</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Peterborough Athletic FC — proudly wearing black and gold since 2020. We are a community-driven
                football club committed to developing players of all ages and abilities in a supportive and inclusive environment.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <Award className="h-6 w-6 text-primary" />
                <h2 className="font-display text-xl font-bold">FA Accredited</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We are proudly FA Accredited. All coaches and staff are FA-qualified, first aid trained,
                and DBS-checked, ensuring the highest standards of safety and professionalism.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <Info className="h-6 w-6 text-primary" />
                <h2 className="font-display text-xl font-bold">Our Values</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Built on teamwork, respect, and community spirit. We pride ourselves on providing a safe, friendly,
                and supportive environment where young people can learn, develop, and thrive — on and off the pitch.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
