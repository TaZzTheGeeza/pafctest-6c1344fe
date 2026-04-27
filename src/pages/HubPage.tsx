import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TeamChat } from "@/components/hub/TeamChat";
import { PaymentCenter } from "@/components/hub/PaymentCenter";
import { NotificationCenter } from "@/components/hub/NotificationCenter";
import { TeamMemberManager } from "@/components/hub/TeamMemberManager";
import { MessageSquare, CreditCard, Bell, CalendarCheck, Users, Shield, ChevronDown, Car, TrendingUp, UserPlus, User, FileText, ChevronRight, Video, Sparkles } from "lucide-react";
import { FixtureAvailability } from "@/components/hub/FixtureAvailability";
import { CarpoolBoard } from "@/components/hub/CarpoolBoard";
import { AttendanceStats } from "@/components/hub/AttendanceStats";
import { GuardianManager } from "@/components/hub/GuardianManager";
import { HubMeetingsEmbed } from "@/components/hub/HubMeetingsEmbed";
import { TeamAccessRequest } from "@/components/hub/TeamAccessRequest";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { registerPushSubscription, isPushSupported, isPushEnabled } from "@/lib/pushNotifications";

const TEAMS = [
  { slug: "u6s", name: "U6" },
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
  { id: "meetings", label: "Meetings", icon: Video },
  { id: "player", label: "Player Zone", icon: User },
];

const playerHubItems = [
  {
    title: "Presentation Evening",
    description: "Claim your family tickets and pick your seats for 05/06/26.",
    icon: Sparkles,
    path: "/presentation",
    color: "text-primary",
    bgColor: "bg-gradient-to-br from-primary/20 to-primary/5",
    borderColor: "border-primary/40",
    featured: true,
  },
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
  const { user, isAdmin, isCoach, rolesLoading } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const tab = searchParams.get("tab");
    const team = searchParams.get("team");
    if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab);
    if (team) setActiveTeam(team);
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (rolesLoading) return;

    loadMyTeams();
  }, [user, isAdmin, rolesLoading]);

  useEffect(() => {
    if (!user) return;

    if (isPushSupported()) {
      isPushEnabled().then((enabled) => {
        if (!enabled) {
          registerPushSubscription(user.id).catch(() => {});
        }
      });
    }
  }, [user]);

  async function loadMyTeams() {
    setLoading(true);
    if (isAdmin) {
      setMyTeams(TEAMS.map((t) => t.slug));
      if (!activeTeam) setActiveTeam(TEAMS[0].slug);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("team_members").select("team_slug").eq("user_id", user!.id);
    const rawSlugs = data?.map((d) => d.team_slug) || [];
    // Normalize non-canonical slugs to canonical ones
    const canonicalMap: Record<string, string> = {
      "u6": "u6s", "u7": "u7s", "u8-black": "u8s-black", "u8-gold": "u8s-gold",
      "u9": "u9s", "u10": "u10s", "u11-black": "u11s-black",
      "u11-gold": "u11s-gold", "u13-black": "u13s-black", "u13-gold": "u13s-gold",
      "u14": "u14s",
    };
    const normalized = [...new Set(rawSlugs.map((s) => canonicalMap[s] || s))];
    const teamOrder = TEAMS.map((t) => t.slug);
    const slugs = normalized.filter((s) => teamOrder.includes(s)).sort((a, b) => teamOrder.indexOf(a) - teamOrder.indexOf(b));
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
      {activeTab === "meetings" && <HubMeetingsEmbed />}
      {activeTab === "player" && (
        <div className="space-y-4">
          {/* Featured: Presentation Evening — always rendered prominently at top */}
          {playerHubItems
            .filter((i) => i.featured)
            .map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className={`group relative flex items-center gap-5 bg-gradient-to-br from-primary/15 via-card to-card border-2 ${item.borderColor} rounded-xl p-6 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 ring-1 ring-primary/30`}
              >
                <span className="absolute top-3 right-3 text-[10px] tracking-[0.15em] uppercase font-display font-semibold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full">
                  Featured
                </span>
                <div className={`${item.bgColor} w-14 h-14 rounded-lg flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-7 w-7 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-base mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors font-display tracking-wider shrink-0">
                  Claim Tickets <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}

          {/* Standard items grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {playerHubItems
              .filter((i) => !i.featured)
              .map((item) => (
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
            <TeamAccessRequest />
          ) : (
            <div className="flex gap-0 md:gap-6">
              {/* Sidebar */}
              <TooltipProvider delayDuration={100}>
                <aside className="shrink-0 w-14 md:w-56 bg-card border border-border rounded-xl overflow-visible md:overflow-hidden">
                  {/* Team Picker */}
                  <div className="relative border-b border-border">
                    <button
                      onClick={() => setShowTeamPicker(!showTeamPicker)}
                      className="w-full flex items-center gap-2 px-3 md:px-4 py-3 hover:bg-secondary/50 transition-colors"
                    >
                      <Users className="h-5 w-5 text-primary shrink-0" />
                      <span className="hidden md:block font-display text-sm font-bold text-foreground truncate flex-1 text-left">
                        {activeTeamName}
                      </span>
                      <ChevronDown className={`hidden md:block h-4 w-4 text-muted-foreground transition-transform ${showTeamPicker ? "rotate-180" : ""}`} />
                    </button>
                    {showTeamPicker && (
                      <>
                        {/* Mobile backdrop */}
                        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowTeamPicker(false)} />
                        <div className="fixed md:absolute left-4 right-4 md:left-0 md:right-auto top-auto md:top-full mt-1 bg-card border border-border rounded-xl shadow-xl shadow-black/20 p-2 md:min-w-[200px] z-50">
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
                      </>
                    )}
                  </div>

                  {/* Tab Items */}
                  <nav className="p-1.5 md:p-2 space-y-0.5">
                    {allTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      const btn = (
                        <button
                          key={tab.id}
                          onClick={() => selectTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display tracking-wider transition-all ${
                            isActive
                              ? "bg-primary/15 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                          <span className="hidden md:block truncate">{tab.label}</span>
                        </button>
                      );

                      if (isMobile) {
                        return (
                          <Tooltip key={tab.id}>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent side="right" className="font-display text-xs">
                              {tab.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return btn;
                    })}
                  </nav>
                </aside>
              </TooltipProvider>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {renderContent()}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
