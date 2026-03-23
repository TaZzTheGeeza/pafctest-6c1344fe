import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Heart, Award, Users, Star, CheckCircle } from "lucide-react";
import clubLogo from "@/assets/club-logo.jpg";

const values = [
  { icon: Shield, title: "FA Accredited", text: "All coaches and staff are FA-qualified, first aid trained, and DBS-checked, ensuring the highest standards of safety and professionalism." },
  { icon: Heart, title: "Community Spirit", text: "We are more than just a football club — we are a family. Built on the values of teamwork, respect, and community spirit." },
  { icon: Users, title: "Inclusive for All", text: "Our club is proud to offer players of all ages and abilities the opportunity to play, develop, and thrive in a supportive environment." },
  { icon: Award, title: "Volunteer Powered", text: "Our success is built on the commitment and dedication of our incredible volunteers who give their time to grassroots football." },
  { icon: Star, title: "Player Development", text: "We provide structured coaching and development pathways to help every player reach their potential." },
  { icon: CheckCircle, title: "Safeguarding", text: "We pride ourselves on providing a safe, friendly, and supportive environment — the welfare of our players is our top priority." },
];

export default function ClubInfoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex justify-center mb-6">
              <img src={clubLogo} alt="PAFC" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              Club <span className="text-gold-gradient">Info</span>
            </h1>
            <p className="text-muted-foreground text-center mb-4">Peterborough Athletic Football Club · The Lions</p>
            <p className="text-xs text-center font-display text-primary tracking-widest mb-12">
              Proudly FA Accredited · Grassroots Football for All · Powered by Community
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card border border-border rounded-lg p-8"
            >
              <h2 className="font-display text-xl font-bold mb-4">About <span className="text-gold-gradient">Us</span></h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>
                  At <strong className="text-foreground">Peterborough Athletic</strong>, we are more than just a football club — we are a family. Built on the values of teamwork, respect, and community spirit, our club is proud to offer players of all ages and abilities the opportunity to play, develop, and thrive in a supportive and inclusive environment.
                </p>
                <p>
                  Our success is built on the commitment and dedication of our incredible volunteers. All coaches and staff are FA-qualified, first aid trained, and DBS-checked, ensuring the highest standards of safety and professionalism.
                </p>
                <p>
                  We pride ourselves on providing a safe, friendly, and supportive environment where young people can learn, develop, and thrive, on and off the pitch.
                </p>
                <p>
                  Whether you're a player, a parent, or a passionate supporter, we invite you to be part of our growing club.
                </p>
                <p className="font-display text-primary text-base tracking-wider pt-2">
                  Join Us. Train with Us. Develop with Us.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-8">
              Our <span className="text-gold-gradient">Values</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {values.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <item.icon className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-display text-sm font-bold mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
