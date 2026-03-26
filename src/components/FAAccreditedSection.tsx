import { motion } from "framer-motion";
import faAccredited from "@/assets/fa-accredited.png";
import faRespect from "@/assets/fa-respect.png";
import faPositive from "@/assets/fa-positive.png";

const badges = [
  { src: faAccredited, alt: "England Football Accredited Club", wide: true },
  { src: faRespect, alt: "FA Respect" },
  { src: faPositive, alt: "We Only Do Positive" },
];

export function FAAccreditedSection() {
  return (
    <section className="py-12 bg-surface-elevated border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-1">
            Proudly <span className="text-gold-gradient">FA Accredited</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Committed to the highest standards in grassroots football
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 max-w-3xl mx-auto">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.alt}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
            >
              <img
                src={badge.src}
                alt={badge.alt}
                className={badge.wide ? "h-16 md:h-20 w-auto" : "h-20 md:h-24 w-auto"}
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
