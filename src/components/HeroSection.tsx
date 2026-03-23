import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trophy } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import clubLogo from "@/assets/club-logo.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

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
            className="w-32 h-32 md:w-44 md:h-44 rounded-full object-cover mb-6 border-2 border-primary shadow-[0_0_40px_rgba(200,160,40,0.3)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-display mb-2">
            <span className="text-gold-gradient">Peterborough</span>
            <br />
            <span className="text-foreground">Athletic FC</span>
          </h1>
          <p className="text-sm font-display text-primary tracking-widest mb-4">Est. 2020</p>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-body">
            Black & Gold. Passion. Pride. Follow the journey of Athletic FC.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-gold-gradient text-primary-foreground font-display tracking-wider hover:opacity-90 transition-opacity"
              onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Latest Results
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
    </section>
  );
}
