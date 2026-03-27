import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TeamChat } from "@/components/hub/TeamChat";
import { PaymentCenter } from "@/components/hub/PaymentCenter";
import { NotificationCenter } from "@/components/hub/NotificationCenter";
import { TeamMemberManager } from "@/components/hub/TeamMemberManager";
import { MessageSquare, CreditCard, Bell, CalendarCheck, Users, Shield, ChevronDown, Car, TrendingUp, UserPlus, User, FileText, ChevronRight } from "lucide-react";
import { FixtureAvailability } from "@/components/hub/FixtureAvailability";
import { CarpoolBoard } from "@/components/hub/CarpoolBoard";
import { AttendanceStats } from "@/components/hub/AttendanceStats";
import { GuardianManager } from "@/components/hub/GuardianManager";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

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
  { id: "carpool", label: "Carpool", icon: Car },
  { id: "attendance", label: "Attendance", icon: TrendingUp },
  { id: "guardian", label: "Guardian", icon: UserPlus },
  { id: "player", label: "Player Zone", icon: User },
];

const playerHubItems = [
  {
    title: "My Profile",
    description: "View your stats, documents, availability history, and POTM awards.",
    icon: User,
    path: "/my-profile",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    title: "Player Registration",
    description: "Register your child's interest for the upcoming season.",
    icon: UserPlus,
    path: "/register",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/20",
  },
  {
    title: "Club Documents",
    description: "Access player forms, codes of conduct, and essential paperwork.",
    icon: FileText,
    path: "/club-documents",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
  },
  {
    title: "Safeguarding",
    description: "Player safety policies, contacts, and reporting procedures.",
    icon: Shield,
    path: "/safeguarding",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/20",
  },
];

export default function HubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "chat");
  const [activeTeam, setActiveTeam] = useState<string | null>(searchParams.get("team") || null);
  const [myTeams, setMyTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const { user, isAdmin, isCoach } = useAuth();
  const isMobile = useIsMobile();

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

  const allTabs = [
    ...tabs,
    ...((isAdmin || isCoach) ? [{ id: "members", label: "Members", icon: Users }] : []),
  ];

  const renderContent = () => (
    <>
      {activeTab === "chat" && activeTeam && <TeamChat teamSlug={activeTeam} />}
      {activeTab === "payments" && activeTeam && <PaymentCenter teamSlug={activeTeam} />}
      {activeTab === "notifications" && <NotificationCenter />}
      {activeTab === "availability" && activeTeam && <FixtureAvailability teamSlug={activeTeam} />}
      {activeTab === "carpool" && activeTeam && <CarpoolBoard teamSlug={activeTeam} />}
      {activeTab === "attendance" && activeTeam && (isCoach || isAdmin) && <AttendanceStats teamSlug={activeTeam} />}
      {activeTab === "guardian" && activeTeam && <GuardianManager teamSlug={activeTeam} teamName={activeTeamName || ""} />}
      {activeTab === "members" && activeTeam && (isAdmin || isCoach) && <TeamMemberManager teamSlug={activeTeam} teamName={activeTeamName || ""} />}
      {activeTab === "player" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {playerHubItems.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className={`group relative flex flex-col bg-card border ${item.borderColor} rounded-xl p-6 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5`}
            >
              <div className={`${item.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <h3 className="font-display font-bold text-sm mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{item.description}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors mt-4 font-display tracking-wider">
                View <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
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
            <div className="max-w-5xl mx-auto pb-20">
              {/* Header with team picker */}
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <button
                    onClick={() => setShowTeamPicker(!showTeamPicker)}
                    className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 hover:border-primary/50 transition-colors"
                  >
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-display text-sm font-bold text-foreground">{activeTeamName}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showTeamPicker ? "rotate-180" : ""}`} />
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
                <h2 className="font-display text-sm tracking-wider text-muted-foreground">
                  {allTabs.find(t => t.id === activeTab)?.label}
                </h2>
              </div>

              {/* Content */}
              {renderContent()}

              {/* Bottom Tab Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
                <div className="max-w-5xl mx-auto flex items-center justify-around px-2 py-1.5">
                  {allTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => selectTab(tab.id)}
                        className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-0 ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                        <span className={`text-[9px] font-display tracking-wider truncate max-w-[60px] ${isActive ? "font-bold" : ""}`}>
                          {tab.label}
                        </span>
                        {isActive && (
                          <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
