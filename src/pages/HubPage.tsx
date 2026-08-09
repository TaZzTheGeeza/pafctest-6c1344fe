import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TeamChat } from "@/components/hub/TeamChat";
import { PaymentCenter } from "@/components/hub/PaymentCenter";
import { NotificationCenter } from "@/components/hub/NotificationCenter";
import { TeamMemberManager } from "@/components/hub/TeamMemberManager";
import { MessageSquare, CreditCard, Bell, CalendarCheck, Users, Shield, ChevronDown, Car, TrendingUp, UserPlus, User, FileText, ChevronRight, ChevronLeft, Video, Sparkles, Award, ClipboardList, MapPin } from "lucide-react";
import { PlayerRosterManager } from "@/components/hub/PlayerRosterManager";
import { AwardsVoting } from "@/components/hub/AwardsVoting";
import { FixtureAvailability } from "@/components/hub/FixtureAvailability";
import { CarpoolBoard } from "@/components/hub/CarpoolBoard";
import { AttendanceStats } from "@/components/hub/AttendanceStats";
import { GuardianManager } from "@/components/hub/GuardianManager";
import { HubMeetingsEmbed } from "@/components/hub/HubMeetingsEmbed";
import { TeamAccessRequest } from "@/components/hub/TeamAccessRequest";
import PitchBookingsPanel from "@/components/hub/PitchBookingsPanel";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePresentationEnabled } from "@/hooks/usePresentationEnabled";
import { registerPushSubscription, isPushSupported, isPushEnabled } from "@/lib/pushNotifications";
import { ALL_CLUB_TEAM_SLUGS, CLUB_TEAMS, normalizeClubTeamSlugs } from "@/lib/teamConfig";

const TEAMS = CLUB_TEAMS;

const tabs = [
  { id: "chat", label: "Team Chat", icon: MessageSquare },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "availability", label: "Fixtures & Events", icon: CalendarCheck },
  { id: "carpool", label: "Carpool", icon: Car },
  { id: "attendance", label: "Attendance", icon: TrendingUp },
  { id: "guardian", label: "Guardian", icon: UserPlus },
  { id: "meetings", label: "Meetings", icon: Video },

  { id: "awards", label: "Awards", icon: Award },
  { id: "player", label: "Player Zone", icon: User },
];

// ⚠️ DO NOT REMOVE the "Presentation Evening" entry below.
// It is a permanent featured item in the Player Zone for the 2025/26 season.
// If editing this list, keep the featured: true item at index 0.
const playerHubItems = [
  {
    title: "Presentation Evening",
    description: "Claim your family tickets at the Player Zone — admins will allocate your seats for 05/06/26.",
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
  const [mobileView, setMobileView] = useState<"menu" | "content">(searchParams.get("tab") ? "content" : "menu");
  const { user, isAdmin, isCoach, rolesLoading } = useAuth();
  const isMobile = useIsMobile();
  const { enabled: presentationEnabled } = usePresentationEnabled();

  useEffect(() => {
    const tab = searchParams.get("tab");
    const team = searchParams.get("team");
    if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab);
    if (team) setActiveTeam(team);
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      setMyTeams([]);
      setLoading(false);
      return;
    }

    if (rolesLoading) return;

    let cancelled = false;

    async function loadMyTeams() {
      setLoading(true);

      if (isAdmin) {
        if (cancelled) return;
        setMyTeams([...ALL_CLUB_TEAM_SLUGS]);
        setActiveTeam((current) => current && ALL_CLUB_TEAM_SLUGS.includes(current) ? current : ALL_CLUB_TEAM_SLUGS[0]);
        setLoading(false);
        return;
      }

      const [membershipsResult, adminCheckResult, rolesResult] = await Promise.all([
        supabase
          .from("team_members")
          .select("team_slug")
          .eq("user_id", user.id),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id),
      ]);

      if (cancelled) return;

      // Keep the management view independent of transient client role state.
      // The backend role check is authoritative and prevents the full catalogue
      // being replaced by a partial membership list after auth refreshes.
      const hasAdminRole = rolesResult.data?.some(({ role }) => role === "admin") ?? false;

      if (adminCheckResult.data === true || hasAdminRole) {
        setMyTeams([...ALL_CLUB_TEAM_SLUGS]);
        setActiveTeam((current) => current && ALL_CLUB_TEAM_SLUGS.includes(current) ? current : ALL_CLUB_TEAM_SLUGS[0]);
        setLoading(false);
        return;
      }

      // Never replace an already-resolved admin catalogue with a partial
      // membership response when a transient role check fails during refresh.
      if (adminCheckResult.error || rolesResult.error) {
        console.error("Unable to verify Hub admin access", adminCheckResult.error ?? rolesResult.error);
        setMyTeams((current) => current.length === ALL_CLUB_TEAM_SLUGS.length
          ? current
          : normalizeClubTeamSlugs((membershipsResult.data ?? []).map((membership) => membership.team_slug)));
        setLoading(false);
        return;
      }

      if (membershipsResult.error) {
        console.error("Unable to load Hub teams", membershipsResult.error);
        setLoading(false);
        return;
      }

      const slugs = normalizeClubTeamSlugs((membershipsResult.data ?? []).map((membership) => membership.team_slug));
      setMyTeams(slugs);
      setActiveTeam((current) => current && slugs.includes(current) ? current : slugs[0] ?? null);
      setLoading(false);
    }

    void loadMyTeams();

    return () => {
      cancelled = true;
    };
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

  function selectTab(id: string) {
    setActiveTab(id);
    setMobileView("content");
    setSearchParams({ tab: id, ...(activeTeam ? { team: activeTeam } : {}) });
  }

  function selectTeam(slug: string) {
    setActiveTeam(slug);
    setShowTeamPicker(false);
    setSearchParams({ tab: activeTab, team: slug });
  }

  const activeTeamName = TEAMS.find((t) => t.slug === activeTeam)?.name || activeTeam;
  // Admins always see the full club catalogue in club order; others see their teams
  // ordered the same way, so the picker never renders a partial/odd-ordered list.
  const visibleTeams = isAdmin
    ? [...ALL_CLUB_TEAM_SLUGS]
    : ALL_CLUB_TEAM_SLUGS.filter((slug) => myTeams.includes(slug));

    const allTabs = [
    ...tabs,
    ...((isAdmin || isCoach) ? [{ id: "pitch-bookings", label: "Pitch Bookings", icon: MapPin }] : []),
    ...((isAdmin || isCoach) ? [{ id: "members", label: "Members", icon: Users }] : []),
    ...(isAdmin ? [{ id: "roster", label: "Roster", icon: ClipboardList }] : []),
  ].filter((t) => !(t.id === "awards" && (activeTeam === "u6s" || !presentationEnabled)));

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
      {activeTab === "roster" && activeTeam && isAdmin && <PlayerRosterManager teamSlug={activeTeam} teamName={activeTeamName || ""} />}
      {activeTab === "meetings" && <HubMeetingsEmbed />}
      {activeTab === "pitch-bookings" && (isAdmin || isCoach) && <PitchBookingsPanel />}

      {activeTab === "awards" && activeTeam && activeTeam !== "u6s" && <AwardsVoting teamSlug={activeTeam} teamName={activeTeamName || ""} />}
      {activeTab === "player" && (
        <div className="space-y-4">
          {/* Featured: Presentation Evening — toggled via site_settings (admin dashboard) */}
          {presentationEnabled && playerHubItems
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
          ) : myTeams.length === 0 && activeTab !== "player" ? (
            <TeamAccessRequest />
          ) : myTeams.length === 0 ? (
            <div className="max-w-4xl mx-auto">
              {renderContent()}
            </div>
          ) : (
            <div className="flex gap-0 md:gap-6">
              {/* Sidebar - full width on mobile menu view, hidden on mobile content view */}
              <TooltipProvider delayDuration={100}>
                <aside className={`${mobileView === "content" ? "hidden md:block" : "w-full md:w-56"} shrink-0 md:w-56 bg-card border border-border rounded-xl overflow-visible`}>
                  {/* Team Picker */}
                  <div className="relative border-b border-border">
                    <button
                      onClick={() => setShowTeamPicker(!showTeamPicker)}
                      className="w-full flex items-center gap-2 px-3 md:px-4 py-3 hover:bg-secondary/50 transition-colors"
                    >
                      <Users className="h-5 w-5 text-primary shrink-0" />
                      <span className="block font-display text-xs md:text-sm font-bold text-foreground truncate flex-1 text-left">
                        {activeTeamName}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showTeamPicker ? "rotate-180" : ""}`} />
                    </button>
                    {showTeamPicker && (
                      <>
                        {/* Mobile backdrop */}
                        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowTeamPicker(false)} />
                        <div className="fixed md:absolute left-4 right-4 md:left-0 md:right-auto top-auto md:top-full mt-1 max-h-[70vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl shadow-black/20 p-2 md:min-w-[200px] z-50">
                          <p className="text-[10px] font-display tracking-wider text-muted-foreground uppercase px-2 py-1">Your Teams</p>
                          {visibleTeams.map((slug) => {
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
                      const isAwards = tab.id === "awards";
                      const btn = (
                        <button
                          key={tab.id}
                          onClick={() => selectTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display tracking-wider transition-all relative ${
                            isAwards
                              ? isActive
                                ? "bg-gradient-to-r from-primary/30 to-primary/10 text-primary border border-primary shadow-md shadow-primary/20"
                                : "bg-gradient-to-r from-primary/15 to-transparent text-primary border border-primary/40 hover:from-primary/25 hover:border-primary/70"
                              : isActive
                                ? "bg-primary/15 text-primary border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${isActive || isAwards ? "text-primary" : ""}`} />
                          <span className="block truncate text-xs md:text-sm">{tab.label}</span>
                          {isAwards && (
                            <span className="ml-auto text-[9px] font-display font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                              VOTE
                            </span>
                          )}
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

              {/* Main Content - hidden on mobile menu view */}
              <div className={`${mobileView === "menu" ? "hidden md:block" : "block"} flex-1 min-w-0`}>
                {isMobile && (
                  <button
                    onClick={() => setMobileView("menu")}
                    className="mb-3 inline-flex items-center gap-1 text-xs font-display tracking-wider text-muted-foreground hover:text-primary uppercase"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back to menu
                  </button>
                )}
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
