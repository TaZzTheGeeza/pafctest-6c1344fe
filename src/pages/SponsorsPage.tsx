import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Handshake, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Sponsor {
  name: string;
  logo: string;
  url: string;
}

const mainSponsors: Sponsor[] = [
  { name: "New Theatre Peterborough", logo: "https://mcp-cdn-fja5bvhth4eqercf.z01.azurefd.net/images/Sponsors/1611/109952/sponsor.jpg", url: "https://newtheatre-peterborough.com/" },
  { name: "Dyno-Rod", logo: "https://mcp-cdn-fja5bvhth4eqercf.z01.azurefd.net/images/Sponsors/1611/109950/sponsor.jpg", url: "https://www.dyno.com/" },
  { name: "Preim", logo: "https://mcp-cdn-fja5bvhth4eqercf.z01.azurefd.net/images/Sponsors/1611/109951/sponsor.jpg", url: "https://www.preim.co.uk/" },
];


export default function SponsorsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              Our <span className="text-gold-gradient">Sponsors</span>
            </h1>
            <p className="text-muted-foreground text-center mb-16">
              Thank you to our incredible partners who support grassroots football
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-xl font-bold text-center mb-6">
              <span className="text-gold-gradient">Club</span> Sponsors
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-6 mb-16">
              {mainSponsors.map((sponsor, i) => (
                <motion.a
                  key={sponsor.name}
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
                >
                  <img src={sponsor.logo} alt={sponsor.name} className="h-20 w-auto object-contain" loading="lazy" />
                </motion.a>
              ))}
            </div>

            <h2 className="font-display text-xl font-bold text-center mb-6">
              <span className="text-gold-gradient">Team</span> Sponsors
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-16">
              {teamSponsors.map((sponsor, i) => (
                <motion.a
                  key={`team-${i}`}
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-center hover:border-primary transition-colors"
                >
                  <img src={sponsor.logo} alt={sponsor.name} className="h-14 w-auto object-contain" loading="lazy" />
                </motion.a>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-card border border-border rounded-lg p-8 text-center"
            >
              <Handshake className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Become a Sponsor</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                Support grassroots football in Peterborough. We offer a range of sponsorship packages for teams and the club.
              </p>
              <Button className="bg-gold-gradient text-primary-foreground font-display tracking-wider" asChild>
                <Link to="/contact">
                  <Mail className="w-4 h-4 mr-2" />
                  Get in Touch
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
