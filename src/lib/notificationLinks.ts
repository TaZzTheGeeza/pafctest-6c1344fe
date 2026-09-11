/**
 * Every notification should take the user somewhere useful when clicked.
 * If a notification was stored without an explicit link (or with an older,
 * now-renamed link), we normalise it into a working destination.
 */

export interface NotificationLinkSource {
  type?: string | null;
  link?: string | null;
  team_slug?: string | null;
  title?: string | null;
  message?: string | null;
}

const TYPE_LINKS: Record<string, string> = {
  event: "/hub?tab=availability",
  meeting: "/meetings",
  payment: "/hub?tab=payments",
  reminder: "/hub?tab=availability",
  match_report: "/results",
  match_report_reminder: "/dashboard?section=report",
  shop_order: "/dashboard?section=orders",
  pitch_booking: "/pitch-bookings",
  tournament: "/tournament-admin",
  admin_broadcast: "/hub?tab=notifications",
  chat: "/hub?tab=chat",
};

function withTeam(path: string, teamSlug?: string | null) {
  if (!teamSlug) return path;
  if (path.includes("team=")) return path;
  return `${path}${path.includes("?") ? "&" : "?"}team=${teamSlug}`;
}

/**
 * Older notifications were stored with routes/params that have since changed.
 * Rewrite them so historical alerts still land on the right screen.
 */
function normaliseStoredLink(raw: string, teamSlug?: string | null): string {
  let link = raw;

  // Legacy admin route now redirects to the dashboard.
  if (link === "/admin" || link.startsWith("/admin?")) {
    link = link.replace(/^\/admin/, "/dashboard");
  }
  // Legacy calendar route now lives at /events.
  if (link === "/calendar" || link.startsWith("/calendar?")) {
    link = link.replace(/^\/calendar/, "/events");
  }
  // Legacy coach panel route now redirects to the dashboard.
  if (link === "/coach-panel" || link.startsWith("/coach-panel?")) {
    link = link.replace(/^\/coach-panel/, "/dashboard");
  }
  // Legacy registration route.
  if (link === "/player-registration" || link.startsWith("/player-registration?")) {
    link = link.replace(/^\/player-registration/, "/register");
  }

  // The dashboard reads ?section=, not ?tab= / ?contact.
  if (link.startsWith("/dashboard")) {
    link = link.replace(/([?&])tab=/, "$1section=");
    link = link.replace(/([?&])section=contact\b/, "$1section=enquiries");
  }

  // Hub links are useless without a team — attach the notification's team.
  if (link.startsWith("/hub?") || link === "/hub") {
    link = withTeam(link, teamSlug);
  }

  return link;
}

export function resolveNotificationLink(n: NotificationLinkSource): string {
  const explicit = (n.link || "").trim();
  if (explicit) return normaliseStoredLink(explicit, n.team_slug);

  const text = `${n.title ?? ""} ${n.message ?? ""}`.toLowerCase();

  if (text.includes("match report") || text.includes("player of the match")) return "/results";
  if (text.includes("squad") || text.includes("lineup") || text.includes("line-up") || text.includes("team selection")) {
    return withTeam("/hub?tab=availability", n.team_slug);
  }
  if (text.includes("shop order") || text.includes("order")) return "/dashboard?section=orders";
  if (text.includes("registration")) return "/register";
  if (text.includes("meeting")) return "/meetings";
  if (text.includes("chat") || text.includes("message in")) {
    return withTeam("/hub?tab=chat", n.team_slug);
  }
  if (text.includes("availability") || text.includes("fixture") || text.includes("training")) {
    return withTeam("/hub?tab=availability", n.team_slug);
  }
  if (text.includes("payment") || text.includes("direct debit")) {
    return withTeam("/hub?tab=payments", n.team_slug);
  }
  if (text.includes("pitch booking")) return "/pitch-bookings";
  if (text.includes("presentation")) return "/presentation";

  const byType = n.type ? TYPE_LINKS[n.type] : undefined;
  if (byType) return byType.startsWith("/hub") ? withTeam(byType, n.team_slug) : byType;

  return withTeam("/hub?tab=notifications", n.team_slug);
}
