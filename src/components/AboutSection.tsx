import { motion } from "framer-motion";
import clubLogo from "@/assets/club-logo.jpg";
import { Shield, Heart, Award, Users } from "lucide-react";

const values = [
  { icon: Shield, title: "FA Accredited", description: "All coaches FA-qualified, first aid trained, and DBS-checked to the highest standards." },
  { icon: Heart, title: "Community First", description: "A safe, friendly environment where young people learn, develop, and thrive — on and off the pitch." },
  { icon: Award, title: "Player Development", description: "Offering players of all ages and abilities the opportunity to play, develop, and reach their potential." },
  { icon: Users, title: "Volunteer Powered", description: "Our success is built on the incredible commitment and dedication of our volunteer coaches and staff." },
];

export function AboutSection() {
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              About <span className="text-gold-gradient">The Club</span>
            </h2>
            <div className="flex justify-center mb-6">
              <img src={clubLogo} alt="PAFC Crest" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto mb-4">
              At <strong className="text-foreground">Peterborough Athletic</strong>, we are more than just a football club — we are a family.
              Built on the values of teamwork, respect, and community spirit, our club is proud to offer players of all ages
              and abilities the opportunity to play, develop, and thrive in a supportive and inclusive environment.
            </p>
            <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Whether you're a player, a parent, or a passionate supporter, we invite you to be part of our growing club.
            </p>
            <p className="font-display text-primary text-lg mt-6 tracking-wider">
              Join Us. Train with Us. Develop with Us.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-card border border-border rounded-lg p-6 text-center"
              >
                <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-display text-sm font-bold mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
