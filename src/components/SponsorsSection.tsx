import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface Sponsor {
  name: string;
  logo: string;
  url: string;
}

const sponsors: Sponsor[] = [
  { name: "New Theatre Peterborough", logo: "https://mcp-cdn-fja5bvhth4eqercf.z01.azurefd.net/images/Sponsors/1611/109952/sponsor.jpg", url: "https://newtheatre-peterborough.com/" },
  { name: "Dyno-Rod", logo: "https://mcp-cdn-fja5bvhth4eqercf.z01.azurefd.net/images/Sponsors/1611/109950/sponsor.jpg", url: "https://www.dyno.com/" },
  { name: "Preim", logo: "https://mcp-cdn-fja5bvhth4eqercf.z01.azurefd.net/images/Sponsors/1611/109951/sponsor.jpg", url: "https://www.preim.co.uk/" },
];

export function SponsorsSection() {
  return (
    <section className="py-16 bg-surface-elevated">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
            Our <span className="text-gold-gradient">Sponsors</span>
          </h2>
          <p className="text-muted-foreground text-sm">Thank you to our partners who make it all possible</p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 max-w-3xl mx-auto mb-8">
          {sponsors.map((sponsor, i) => (
            <motion.a
              key={sponsor.name}
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-lg overflow-hidden hover:scale-105 transition-transform"
            >
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-16 w-auto object-contain"
                loading="lazy"
              />
            </motion.a>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/sponsors"
            className="text-sm font-display text-primary hover:text-gold-light transition-colors"
          >
            Interested in sponsoring? Get in touch →
          </Link>
        </div>
      </div>
    </section>
  );
}
