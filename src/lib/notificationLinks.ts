/**
 * Every notification should take the user somewhere useful when clicked.
 * If a notification was stored without an explicit link, we derive a sensible
 * destination from its type / team / wording.
 */

export interface NotificationLinkSource {
  type?: string | null;
  link?: string | null;
  team_slug?: string | null;
  title?: string | null;
  message?: string | null;
}

const TYPE_LINKS: Record<string, string> = {
  event: "/events",
  meeting: "/meetings",
  payment: "/hub?tab=payments",
  reminder: "/hub?tab=availability",
  match_report: "/results",
  match_report_reminder: "/dashboard?section=match-report",
  shop_order: "/dashboard?section=orders",
  admin_broadcast: "/hub?tab=notifications",
  chat: "/hub?tab=chat",
};

function withTeam(path: string, teamSlug?: string | null) {
  if (!teamSlug) return path;
  return `${path}${path.includes("?") ? "&" : "?"}team=${teamSlug}`;
}

export function resolveNotificationLink(n: NotificationLinkSource): string {
  const explicit = (n.link || "").trim();
  if (explicit) return explicit;

  const text = `${n.title ?? ""} ${n.message ?? ""}`.toLowerCase();

  if (text.includes("match report") || text.includes("player of the match")) return "/results";
  if (text.includes("registration")) return "/register";
  if (text.includes("meeting")) return "/meetings";
  if (text.includes("availability") || text.includes("fixture")) {
    return withTeam("/hub?tab=availability", n.team_slug);
  }
  if (text.includes("payment") || text.includes("direct debit")) {
    return withTeam("/hub?tab=payments", n.team_slug);
  }
  if (text.includes("pitch booking")) return "/pitch-bookings";
  if (text.includes("presentation")) return "/presentation";

  const byType = n.type ? TYPE_LINKS[n.type] : undefined;
  if (byType) return withTeam(byType, byType.startsWith("/hub") ? n.team_slug : null);

  return withTeam("/hub?tab=notifications", n.team_slug);
}
