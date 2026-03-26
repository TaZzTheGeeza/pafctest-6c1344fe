import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TeamChat } from "@/components/hub/TeamChat";
import { PaymentCenter } from "@/components/hub/PaymentCenter";
import { NotificationCenter } from "@/components/hub/NotificationCenter";
import { TeamMemberManager } from "@/components/hub/TeamMemberManager";
import { MessageSquare, CreditCard, Bell, CalendarCheck, Users, Shield, ChevronDown } from "lucide-react";
import { FixtureAvailability } from "@/components/hub/FixtureAvailability";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const TEAMS = [
  { slug: "u7s", name: "U7" },
  { slug: "u8s-black", name: "U8 Black" },
  { slug: "u8s-gold", name: "U8 Gold" },
  { slug: "u9s", name: "U9" },
  { slug: "u10s", name: "U10" },
  { slug: "u11s-black", name: "U11 Black" },
  { slug: "u11s-gold", name: "U11 Gold" },
  { slug: "u13s-black", name: "U13 Black" },
  { slug: "u13s-gold", name: "U13 Gold" },
  { slug: "u14s", name: "U14" },
];

const tabs = [
  { id: "chat", label: "Team Chat", icon: MessageSquare },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "availability", label: "Availability", icon: CalendarCheck },
];

export default function HubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "chat");
  const [activeTeam, setActiveTeam] = useState<string | null>(searchParams.get("team") || null);
  const [myTeams, setMyTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const { user, isAdmin, isCoach } = useAuth();

  useEffect(() => {
    const tab = searchParams.get("tab");
    const team = searchParams.get("team");
    if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab);
    if (team) setActiveTeam(team);
  }, [searchParams]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadMyTeams();
  }, [user]);

  async function loadMyTeams() {
    setLoading(true);
    if (isAdmin || isCoach) {
      // Admins/coaches see all teams
      setMyTeams(TEAMS.map((t) => t.slug));
      if (!activeTeam) setActiveTeam(TEAMS[0].slug);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("team_members").select("team_slug").eq("user_id", user!.id);
    const slugs = data?.map((d) => d.team_slug) || [];
    setMyTeams(slugs);
    if (!activeTeam && slugs.length > 0) setActiveTeam(slugs[0]);
    setLoading(false);
  }

  function selectTab(id: string) {
    setActiveTab(id);
    setSearchParams({ tab: id, ...(activeTeam ? { team: activeTeam } : {}) });
  }

  function selectTeam(slug: string) {
    setActiveTeam(slug);
    setShowTeamPicker(false);
    setSearchParams({ tab: activeTab, team: slug });
  }

  const activeTeamName = TEAMS.find((t) => t.slug === activeTeam)?.name || activeTeam;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              <span className="text-gold-gradient">PAFC</span> Hub
            </h1>
            <p className="text-muted-foreground text-center mb-8">Your private team space for chat, payments & notifications</p>
          </motion.div>

          {!user ? (
            <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg font-bold text-foreground mb-2">Sign in to access PAFC Hub</h2>
              <p className="text-sm text-muted-foreground mb-4">You need to be signed in to use your team's private area.</p>
              <Link to="/auth" className="inline-block bg-primary text-primary-foreground rounded-lg px-6 py-2.5 font-display text-sm tracking-wider hover:bg-primary/90 transition-colors">
                Sign In
              </Link>
            </div>
          ) : loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading your teams...</div>
          ) : myTeams.length === 0 ? (
            <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-8 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg font-bold text-foreground mb-2">No Team Assigned</h2>
              <p className="text-sm text-muted-foreground mb-4">You haven't been added to a team yet. Ask your coach or club admin to add you.</p>
            </div>
          ) : (
            <>
              {/* Team Selector + Admin Manager */}
              <div className="max-w-4xl mx-auto mb-6">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="relative">
                    <button
                      onClick={() => setShowTeamPicker(!showTeamPicker)}
                      className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2.5 hover:border-primary/50 transition-colors"
                    >
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-display text-sm font-bold text-foreground">{activeTeamName}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showTeamPicker ? "rotate-180" : ""}`} />
                    </button>
                    {showTeamPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl shadow-black/20 p-2 min-w-[200px] z-50">
                        <p className="text-[10px] font-display tracking-wider text-muted-foreground uppercase px-2 py-1">Your Teams</p>
                        {myTeams.map((slug) => {
                          const team = TEAMS.find((t) => t.slug === slug);
                          return (
                            <button
                              key={slug}
                              onClick={() => selectTeam(slug)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-display tracking-wider transition-colors ${activeTeam === slug ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                            >
                              {team?.name || slug}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Admin: Manage Members tab */}
                  {(isAdmin || isCoach) && (
                    <button
                      onClick={() => selectTab("members")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display tracking-wider transition-colors ${activeTab === "members" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      <Users className="h-4 w-4" /> Manage Members
                    </button>
                  )}
                </div>
              </div>

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
                {activeTab === "chat" && activeTeam && <TeamChat teamSlug={activeTeam} />}
                {activeTab === "payments" && activeTeam && <PaymentCenter teamSlug={activeTeam} />}
                {activeTab === "notifications" && <NotificationCenter />}
                {activeTab === "availability" && activeTeam && (
                  <FixtureAvailability teamSlug={activeTeam} />
                )}
                {activeTab === "members" && activeTeam && (isAdmin || isCoach) && (
                  <TeamMemberManager teamSlug={activeTeam} teamName={activeTeamName || ""} />
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
