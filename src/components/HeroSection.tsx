import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trophy, Users, ChevronRight, Smartphone } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import clubLogo from "@/assets/club-logo.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-end justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/95" />

      <div className="relative z-10 container mx-auto px-4 text-center pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-7xl md:text-[10rem] lg:text-[12rem] font-bold font-display mb-2 mt-8 tracking-tighter leading-[0.85]">
            <span className="text-gold-gradient">Peterborough</span>
            <br />
            <span className="text-foreground">Athletic FC</span>
          </h1>
          <p className="text-xs md:text-sm font-display text-primary tracking-[0.3em] mb-6">The Lions · Est. 2020</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-gold-gradient text-primary-foreground font-display tracking-wider hover:opacity-90 transition-opacity"
              asChild
            >
              <Link to="/tournament">
                <Trophy className="w-5 h-5 mr-2" />
                Tournament
              </Link>
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
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary font-display tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors animate-pulse hover:animate-none"
              asChild
            >
              <Link to="/install">
                <Smartphone className="w-5 h-5 mr-2" />
                Get the PAFC App
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
