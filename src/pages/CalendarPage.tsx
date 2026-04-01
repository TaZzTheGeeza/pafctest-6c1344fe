import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin, Clock, Download, Filter } from "lucide-react";
import { EventRSVP } from "@/components/EventRSVP";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parse } from "date-fns";
import { faTeamConfigs } from "@/lib/faFixtureConfig";
import type { FAFixture } from "@/hooks/useTeamFixtures";

/** Format a UTC date string to UK time display */
function formatUK(dateStr: string, fmt: string): string {
  const d = new Date(dateStr);
  const ukString = d.toLocaleString("en-GB", { timeZone: "Europe/London" });
  const [datePart, timePart] = ukString.split(", ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  const ukDate = new Date(year, month - 1, day, hours, minutes, seconds);
  return format(ukDate, fmt);
}

function toUKDate(dateStr: string): Date {
  const d = new Date(dateStr);
  const ukString = d.toLocaleString("en-GB", { timeZone: "Europe/London" });
  const [datePart, timePart] = ukString.split(", ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

interface ClubEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  team: string | null;
  is_all_day: boolean;
}

const typeColors: Record<string, string> = {
  match: "bg-green-500",
  fixture: "bg-green-500",
  training: "bg-blue-500",
  social: "bg-purple-500",
  meeting: "bg-yellow-500",
  general: "bg-primary",
};

function generateICS(event: ClubEvent): string {
  const ukStart = toUKDate(event.start_time);
  const dtStart = event.is_all_day
    ? format(ukStart, "yyyyMMdd")
    : format(ukStart, "yyyyMMdd'T'HHmmss");
  const dtEnd = event.end_time
    ? event.is_all_day ? format(toUKDate(event.end_time), "yyyyMMdd") : format(toUKDate(event.end_time), "yyyyMMdd'T'HHmmss")
    : dtStart;

  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
LOCATION:${event.location || ""}
END:VEVENT
END:VCALENDAR`;
}

function downloadICS(event: ClubEvent) {
  const blob = new Blob([generateICS(event)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Convert an FA fixture into a ClubEvent shape */
function fixtureToEvent(f: FAFixture, teamName: string): ClubEvent {
  // Parse date like "Saturday 12 Apr 2025"
  let startDate: Date;
  try {
    startDate = parse(f.date, "EEEE d MMM yyyy", new Date());
  } catch {
    startDate = new Date(f.date);
  }
  // Apply time if present
  if (f.time && f.time !== "TBC") {
    const [h, m] = f.time.split(":").map(Number);
    if (!isNaN(h)) startDate.setHours(h, m || 0);
  }

  const isHome = f.homeTeam.toLowerCase().includes("pinner");
  const opponent = isHome ? f.awayTeam : f.homeTeam;
  const prefix = isHome ? "vs" : "@";
  const hasScore = f.type === "result" && f.homeScore != null;
  const scoreStr = hasScore ? ` (${f.homeScore}-${f.awayScore})` : "";

  return {
    id: `fa-${teamName}-${f.date}-${opponent}`,
    title: `${teamName}: ${prefix} ${opponent}${scoreStr}`,
    description: f.competition || null,
    event_type: "fixture",
    start_time: startDate.toISOString(),
    end_time: null,
    location: f.venue || null,
    team: teamName,
    is_all_day: !f.time || f.time === "TBC",
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [fixtureEvents, setFixtureEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  // Fetch club_events from DB
  useEffect(() => {
    supabase
      .from("club_events")
      .select("*")
      .order("start_time", { ascending: true })
      .then(({ data }) => {
        if (data) setEvents(data);
        setLoading(false);
      });
  }, []);

  // Fetch FA fixtures for all teams
  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const results: ClubEvent[] = [];
      // Fetch all teams in parallel
      const promises = faTeamConfigs.map(async (config) => {
        try {
          const { data, error } = await supabase.functions.invoke("scrape-fixtures", {
            body: { team: config.team, fixtureUrl: config.fixtureUrl, resultUrl: config.resultUrl },
          });
          if (error || !data?.success) return [];
          const fixtures: FAFixture[] = [...(data.fixtures || []), ...(data.results || [])];
          return fixtures.map((f) => fixtureToEvent(f, config.team));
        } catch {
          return [];
        }
      });
      const allTeams = await Promise.all(promises);
      allTeams.forEach((teamEvents) => results.push(...teamEvents));
      if (!cancelled) setFixtureEvents(results);
    }
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const allEvents = useMemo(() => {
    return [...events, ...fixtureEvents].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, [events, fixtureEvents]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDayOfWeek = startOfMonth(currentMonth).getDay();
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const filteredEvents = allEvents.filter((e) => filterType === "all" || e.event_type === filterType);
  const dayEvents = selectedDate ? filteredEvents.filter((e) => isSameDay(toUKDate(e.start_time), selectedDate)) : [];

  const upcomingEvents = filteredEvents
    .filter((e) => toUKDate(e.start_time) >= new Date())
    .slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              <span className="text-gold-gradient">Events</span> & Calendar
            </h1>
            <p className="text-muted-foreground text-center mb-8">Upcoming events, training, matches & more</p>
          </motion.div>

          {/* Filters */}
          <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-2 mb-6">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {["all", "match", "training", "social", "meeting", "general"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`text-xs font-display tracking-wider px-3 py-1.5 rounded-full border transition-colors ${filterType === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_350px] gap-8">
            {/* Calendar Grid */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-muted-foreground hover:text-foreground text-sm font-display">← Prev</button>
                <h2 className="font-display text-lg font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-muted-foreground hover:text-foreground text-sm font-display">Next →</button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="text-center text-xs font-display text-muted-foreground py-2">{d}</div>
                ))}
                {Array.from({ length: paddingDays }).map((_, i) => <div key={`pad-${i}`} />)}
                {days.map((day) => {
                  const hasEvents = filteredEvents.some((e) => isSameDay(toUKDate(e.start_time), day));
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`relative aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                        isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {format(day, "d")}
                      {hasEvents && <span className="absolute bottom-1 w-1.5 h-1.5 bg-primary rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {selectedDate ? (
                <div>
                  <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">{format(selectedDate, "EEEE, dd MMMM yyyy")}</h3>
                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events on this day</p>
                  ) : (
                    <div className="space-y-3">
                      {dayEvents.map((e) => (
                        <div key={e.id} className="bg-card border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${typeColors[e.event_type] || typeColors.general}`} />
                            <span className="text-xs font-display tracking-wider text-muted-foreground capitalize">{e.event_type}</span>
                          </div>
                          <h4 className="font-display font-bold text-foreground">{e.title}</h4>
                          {e.description && <p className="text-sm text-muted-foreground mt-1">{e.description}</p>}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            {!e.is_all_day && (
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatUK(e.start_time, "HH:mm")}</span>
                            )}
                            {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>}
                          </div>
                          {e.team && <p className="text-xs text-primary mt-2">{e.team}</p>}
                          <button
                            onClick={() => downloadICS(e)}
                            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:text-gold-light transition-colors"
                          >
                            <Download className="h-3 w-3" /> Add to Calendar
                          </button>
                          <EventRSVP eventId={e.id} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">UPCOMING EVENTS</h3>
                  {upcomingEvents.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                      <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No upcoming events. Check back soon!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingEvents.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelectedDate(toUKDate(e.start_time))}
                          className="w-full text-left bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${typeColors[e.event_type] || typeColors.general}`} />
                            <span className="text-sm font-display text-foreground truncate">{e.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 pl-4">{formatUK(e.start_time, "EEE dd MMM, HH:mm")}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
