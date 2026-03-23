import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trophy, Users, ChevronRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import clubLogo from "@/assets/club-logo.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/65 to-background" />

      <div className="relative z-10 container mx-auto px-4 text-center pt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <motion.img
            src={clubLogo}
            alt="Peterborough Athletic FC Crest"
            className="w-28 h-28 md:w-40 md:h-40 rounded-full object-cover mb-6 border-2 border-primary shadow-[0_0_40px_rgba(160,130,50,0.3)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display mb-1">
            <span className="text-gold-gradient">Peterborough</span>
            <br />
            <span className="text-foreground">Athletic FC</span>
          </h1>
          <p className="text-xs md:text-sm font-display text-primary tracking-[0.3em] mb-2">The Lions · Est. 2020</p>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-3 font-body">
            Proudly FA Accredited · Grassroots Football for All · Powered by Community
          </p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8 font-body leading-relaxed">
            More than just a football club — we are a family. Built on teamwork, respect, and community spirit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-gold-gradient text-primary-foreground font-display tracking-wider hover:opacity-90 transition-opacity"
              asChild
            >
              <Link to="/teams">
                <Users className="w-5 h-5 mr-2" />
                Our Teams
              </Link>
            </Button>
            <Button
              size="lg"
              className="bg-gold-gradient text-primary-foreground font-display tracking-wider hover:opacity-90 transition-opacity"
              onClick={() => document.getElementById("fixtures")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Fixtures
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary text-primary font-display tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
              asChild
            >
              <Link to="/shop">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Club Shop
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ChevronRight className="w-6 h-6 text-muted-foreground rotate-90" />
      </motion.div>
    </section>
  );
}
