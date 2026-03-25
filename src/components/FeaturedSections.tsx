import { Link } from "react-router-dom";
import { Trophy, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function FeaturedSections() {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto grid md:grid-cols-2 gap-6 max-w-5xl">
        {/* Tournament Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/tournament"
            className="group block relative overflow-hidden rounded-xl border border-primary/20 bg-card p-8 h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
            <Trophy className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Summer Tournament 2026
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Register your team for the annual PAFC tournament. All age groups welcome — compete for the cup!
            </p>
            <span className="inline-flex items-center gap-2 text-primary font-display text-sm tracking-wider group-hover:gap-3 transition-all">
              View Tournament <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>

        {/* Shop Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link
            to="/shop"
            className="group block relative overflow-hidden rounded-xl border border-primary/20 bg-card p-8 h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
            <ShoppingBag className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Club Shop
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Kit up in official PAFC gear. Browse training wear, match-day kits, and supporter merchandise.
            </p>
            <span className="inline-flex items-center gap-2 text-primary font-display text-sm tracking-wider group-hover:gap-3 transition-all">
              Browse Shop <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
