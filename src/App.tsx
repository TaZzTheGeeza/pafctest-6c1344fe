import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { UpdateGate } from "@/components/UpdateGate";
import { LionsDenGate } from "@/components/LionsDenGate";
import { KickOffGate } from "@/components/KickOffGate";
import { WhatsNewLoader } from "@/components/WhatsNewLoader";
import WhatsNewAdminPage from "./pages/WhatsNewAdminPage.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCartSync } from "@/hooks/useCartSync";
import { usePresence } from "@/hooks/usePresence";
import { useEffect } from "react";
import { FootballBackground } from "@/components/FootballBackground";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleGate } from "@/components/RoleGate";
import Index from "./pages/Index.tsx";
import ShopPage from "./pages/Shop.tsx";
import ProductPage from "./pages/ProductPage.tsx";
import TeamsPage from "./pages/TeamsPage.tsx";
import WhatsOnPage from "./pages/WhatsOnPage.tsx";
import NewsPage from "./pages/NewsPage.tsx";
import NewsArticlePage from "./pages/NewsArticlePage.tsx";
import NewsEditorPage from "./pages/NewsEditorPage.tsx";
import EventsPage from "./pages/EventsPage.tsx";
import GalleryPage from "./pages/GalleryPage.tsx";
import ClubDocumentsPage from "./pages/ClubDocumentsPage.tsx";
import SponsorsPage from "./pages/SponsorsPage.tsx";
import ClubInfoPage from "./pages/ClubInfoPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import SafeguardingPage from "./pages/SafeguardingPage.tsx";
import PlayerRegistrationPage from "./pages/PlayerRegistrationPage.tsx";
import RafflePage from "./pages/RafflePage.tsx";
import RaffleAdminPage from "./pages/RaffleAdminPage.tsx";
import WorldCupSweepstakePage from "./pages/WorldCupSweepstakePage.tsx";
import WorldCupSweepstakeAdminPage from "./pages/WorldCupSweepstakeAdminPage.tsx";
import TournamentPage from "./pages/TournamentPage.tsx";
import TournamentAdminPage from "./pages/TournamentAdminPage.tsx";
import TeamProfilePage from "./pages/TeamProfilePage.tsx";

import POTMPage from "./pages/POTMPage.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import PlayerHubPage from "./pages/PlayerHubPage.tsx";
import CoachPanelPage from "./pages/CoachPanelPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import ResultsPage from "./pages/ResultsPage.tsx";
import POTMDemoPage from "./pages/POTMDemoPage.tsx";
import HubPage from "./pages/HubPage.tsx";
import InstallPage from "./pages/InstallPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import AdminPlayerProfilePage from "./pages/AdminPlayerProfilePage.tsx";
import MyProfilePage from "./pages/MyProfilePage.tsx";
import BulkDocumentUploadPage from "./pages/BulkDocumentUploadPage.tsx";
import SafeguardingReportsPage from "./pages/SafeguardingReportsPage.tsx";
import PafcTvPage from "./pages/PafcTvPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import UnsubscribePage from "./pages/UnsubscribePage.tsx";
import MeetingsPage from "./pages/MeetingsPage.tsx";
import PlayerShowcaseDemo from "./pages/PlayerShowcaseDemo.tsx";
import WildcatsPage from "./pages/WildcatsPage.tsx";
import PresentationPage from "./pages/PresentationPage.tsx";
import PresentationAdminPage from "./pages/PresentationAdminPage.tsx";
import PlayerRegistrationAdminPage from "./pages/PlayerRegistrationAdminPage.tsx";
import PresentationAwardsAdminPage from "./pages/PresentationAwardsAdminPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PlayerHubRedirect() {
  return <Navigate to="/hub?tab=player" replace />;
}

function ForcePasswordChangeGate() {
  const { mustChangePassword, user } = useAuth();
  const location = useLocation();
  if (user && mustChangePassword && location.pathname !== "/reset-password") {
    return <Navigate to="/reset-password?forced=1" replace />;
  }
  return null;
}

function AppContent() {
  useCartSync();
  usePresence();
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ForcePasswordChangeGate />
      
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:handle" element={<ProductPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/:teamSlug" element={<TeamsPage />} />
        <Route path="/whats-on" element={<WhatsOnPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/editor" element={<RoleGate requiredRole="news_editor"><NewsEditorPage /></RoleGate>} />
        <Route path="/news/editor/:id" element={<RoleGate requiredRole="news_editor"><NewsEditorPage /></RoleGate>} />
        <Route path="/news/:slug" element={<NewsArticlePage />} />
        <Route path="/events" element={<CalendarPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/club-documents" element={<RoleGate requiredRole="player"><ClubDocumentsPage /></RoleGate>} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/club-info" element={<ClubInfoPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/safeguarding" element={<SafeguardingPage />} />
        <Route path="/register" element={<PlayerRegistrationPage />} />
        <Route path="/player-hub" element={<PlayerHubRedirect />} />
        <Route path="/raffle" element={<RafflePage />} />
        <Route path="/raffle-admin" element={<RoleGate requiredRole="admin"><RaffleAdminPage /></RoleGate>} />
        <Route path="/world-cup-sweepstake" element={<WorldCupSweepstakePage />} />
        <Route path="/world-cup-sweepstake-admin" element={<RoleGate requiredRole="admin"><WorldCupSweepstakeAdminPage /></RoleGate>} />

        <Route path="/pafc-tv" element={<PafcTvPage />} />
        <Route path="/tournament" element={<TournamentPage />} />
        <Route path="/tournament-admin" element={<TournamentAdminPage />} />
        <Route path="/tournament/team/:teamId" element={<TeamProfilePage />} />
        
        <Route path="/player-of-the-match" element={<POTMPage />} />
        <Route path="/calendar" element={<Navigate to="/events" replace />} />
        <Route path="/coach-panel" element={<Navigate to="/dashboard" replace />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/potm-demo" element={<POTMDemoPage />} />
        <Route path="/hub" element={<HubPage />} />
        <Route path="/install" element={<InstallPage />} />
        <Route path="/dashboard" element={<RoleGate requiredRole="coach"><DashboardPage /></RoleGate>} />
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/player/:userId" element={<RoleGate requiredRole="admin"><AdminPlayerProfilePage /></RoleGate>} />
        <Route path="/admin/bulk-documents" element={<RoleGate requiredRole="admin"><BulkDocumentUploadPage /></RoleGate>} />
        <Route path="/admin/safeguarding-reports" element={<SafeguardingReportsPage />} />
        <Route path="/my-profile" element={<RoleGate requiredRole="authenticated"><MyProfilePage /></RoleGate>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
        <Route path="/meetings" element={<RoleGate requiredRole="player"><MeetingsPage /></RoleGate>} />
        <Route path="/player-showcase-demo" element={<PlayerShowcaseDemo />} />
        <Route path="/wildcats" element={<WildcatsPage />} />
        <Route path="/presentation" element={<PresentationPage />} />
        <Route path="/presentation-admin" element={<PresentationAdminPage />} />
        <Route path="/admin/player-registrations" element={<RoleGate requiredRole="admin"><PlayerRegistrationAdminPage /></RoleGate>} />
        <Route path="/presentation-awards-admin" element={<RoleGate requiredRole="admin"><PresentationAwardsAdminPage /></RoleGate>} />
        <Route path="/whats-new-admin" element={<RoleGate requiredRole="admin"><WhatsNewAdminPage /></RoleGate>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FootballBackground />
        <Toaster />
        <Sonner />
        <AppContent />
        <UpdateGate />
        {typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("lionsden") === "preview" && (
            <LionsDenGate
              onEnter={() => {
                const u = new URL(window.location.href);
                u.searchParams.delete("lionsden");
                window.location.replace(u.toString());
              }}
            />
          )}
        {typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("kickoff") === "preview" && (
            <KickOffGate
              onEnter={() => {
                const u = new URL(window.location.href);
                u.searchParams.delete("kickoff");
                window.location.replace(u.toString());
              }}
            />
          )}
        <WhatsNewLoader />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
