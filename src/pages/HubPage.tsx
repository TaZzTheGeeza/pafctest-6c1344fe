import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TeamChat } from "@/components/hub/TeamChat";
import { PaymentCenter } from "@/components/hub/PaymentCenter";
import { NotificationCenter } from "@/components/hub/NotificationCenter";
import { MessageSquare, CreditCard, Bell, CalendarCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const tabs = [
  { id: "chat", label: "Team Chat", icon: MessageSquare },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "availability", label: "Availability", icon: CalendarCheck },
];

export default function HubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "chat");
  const { user } = useAuth();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  function selectTab(id: string) {
    setActiveTab(id);
    setSearchParams({ tab: id });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              <span className="text-gold-gradient">PAFC</span> Hub
            </h1>
            <p className="text-muted-foreground text-center mb-8">Your central place for team communication, payments & notifications</p>
          </motion.div>

          {!user ? (
            <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg font-bold text-foreground mb-2">Sign in to access PAFC Hub</h2>
              <p className="text-sm text-muted-foreground mb-4">You need to be signed in to use team chat, payments and notifications.</p>
              <Link to="/auth" className="inline-block bg-primary text-primary-foreground rounded-lg px-6 py-2.5 font-display text-sm tracking-wider hover:bg-primary/90 transition-colors">
                Sign In
              </Link>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="max-w-4xl mx-auto flex flex-wrap gap-2 mb-6 justify-center">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => selectTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display tracking-wider transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}>
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="max-w-4xl mx-auto">
                {activeTab === "chat" && <TeamChat />}
                {activeTab === "payments" && <PaymentCenter />}
                {activeTab === "notifications" && <NotificationCenter />}
                {activeTab === "availability" && (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">Event Availability</h3>
                    <p className="text-sm text-muted-foreground mb-4">Manage your availability for matches and training on the calendar.</p>
                    <Link to="/calendar" className="inline-block bg-primary text-primary-foreground rounded-lg px-6 py-2.5 font-display text-sm tracking-wider hover:bg-primary/90 transition-colors">
                      Go to Calendar
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
