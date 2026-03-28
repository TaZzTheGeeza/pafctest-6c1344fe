import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trophy, ChevronRight, Smartphone, Plus, Minus } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  const [scale, setScale] = useState(1);

  return (
    <section className="relative min-h-[90vh] flex items-end justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/95" />

      {/* Resize controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-background/80 backdrop-blur rounded-full px-3 py-1.5 border border-border shadow-lg">
        <button onClick={() => setScale(s => Math.max(0.4, s - 0.05))} className="p-1 hover:bg-muted rounded-full transition-colors">
          <Minus className="w-4 h-4 text-foreground" />
        </button>
        <span className="text-xs font-mono text-muted-foreground min-w-[3ch] text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(2, s + 0.05))} className="p-1 hover:bg-muted rounded-full transition-colors">
          <Plus className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <motion.div
        className="relative z-10 container mx-auto px-4 text-center pb-16 flex flex-col items-center"
        drag
        dragMomentum={false}
        dragElastic={0}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        whileDrag={{ scale: scale * 1.02, cursor: "grabbing" }}
        style={{ cursor: "grab", scale }}
      >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold font-display mb-2 mt-8 tracking-tight pointer-events-none select-none">
            <span className="text-gold-gradient text-center">PETERBOROUGH</span>
            <br />
            <span className="text-foreground">Athletic FC</span>
          </h1>
          <p className="text-xs md:text-sm font-display text-primary tracking-[0.3em] mb-6 pointer-events-none select-none">The Lions · Est. 2020</p>
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
