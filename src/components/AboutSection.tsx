import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            About <span className="text-gold-gradient">The Club</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            Peterborough Athletic FC — proudly wearing black and gold. We are a community-driven
            football club committed to developing players, competing at the highest level, and
            bringing people together through the beautiful game.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Whether you're a player, supporter, or sponsor, there's a place for you at Athletic FC.
            Join us on matchdays and be part of something special.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
