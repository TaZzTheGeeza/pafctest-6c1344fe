import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  UserPlus,
  FileText,
  Users,
  Shield,
  ChevronRight,
  Lock,
} from "lucide-react";

const hubItems = [
  {
    title: "My Profile",
    description: "View your stats, documents, availability history, and POTM awards — all in one place.",
    icon: UserPlus,
    path: "/my-profile",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    restricted: true,
  },
  {
    title: "Player Registration",
    description: "Register your child's interest for the upcoming season. Submit details and preferred age group.",
    icon: UserPlus,
    path: "/register",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/20",
    restricted: false,
  },
  {
    title: "Club Documents",
    description: "Access player forms, codes of conduct, medical forms, and other essential paperwork.",
    icon: FileText,
    path: "/club-documents",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    restricted: true,
  },
  {
    title: "Safeguarding",
    description: "Our commitment to player safety — policies, contacts, and reporting procedures.",
    icon: Shield,
    path: "/safeguarding",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/20",
    restricted: false,
  },
];

export default function PlayerHubPage() {
  const { isPlayer } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-display tracking-wider text-primary">PLAYER ZONE</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-3">
              Player <span className="text-gold-gradient">Hub</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything players and parents need in one place — registration, documents, match info, and more.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hubItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  to={item.path}
                  className={`group relative flex flex-col h-full bg-card border ${item.borderColor} rounded-xl p-6 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5`}
                >
                  {item.restricted && !isPlayer && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-muted/80 rounded-full px-2 py-0.5">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-display tracking-wider text-muted-foreground">MEMBERS</span>
                    </div>
                  )}
                  <div className={`${item.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <h3 className="font-display font-bold text-sm mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors mt-4 font-display tracking-wider">
                    {item.restricted && !isPlayer ? "Sign in" : "View"}
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
