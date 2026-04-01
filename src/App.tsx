import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCartSync } from "@/hooks/useCartSync";
import { usePresence } from "@/hooks/usePresence";
import { useEffect } from "react";
import { FootballBackground } from "@/components/FootballBackground";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { AuthProvider } from "@/contexts/AuthContext";
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

function AppContent() {
  useCartSync();
  usePresence();
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnnouncementBanner />
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
        <Route path="/events" element={<EventsPage />} />
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
        <Route path="/pafc-tv" element={<PafcTvPage />} />
        <Route path="/tournament" element={<TournamentPage />} />
        <Route path="/tournament-admin" element={<TournamentAdminPage />} />
        <Route path="/tournament/team/:teamId" element={<TeamProfilePage />} />
        
        <Route path="/player-of-the-match" element={<RoleGate requiredRole="player"><POTMPage /></RoleGate>} />
        <Route path="/calendar" element={<CalendarPage />} />
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
