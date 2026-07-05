import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, AlertCircle, Search, Download, Loader2,
  User as UserIcon, Mail, Phone, MapPin, Calendar, Heart, ShieldAlert, X,
  Bell, Send, Users, CheckSquare, Trash2, Pencil, Save,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";


// Resolves a signed URL for a photo stored in the private `registration-photos` bucket.
// Accepts either a raw storage path (e.g. "userId/123.jpg") or a full https URL (legacy).
function RegPhoto({ path, alt, className, fallback }: { path: string | null; alt: string; className: string; fallback: ReactNode }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!path) return;
    if (/^https?:\/\//i.test(path)) {
      setUrl(path);
      return;
    }
    (async () => {
      const { data, error } = await supabase.storage
        .from("registration-photos")
        .createSignedUrl(path, 60 * 60); // 1 hour
      if (!cancelled && !error && data?.signedUrl) setUrl(data.signedUrl);
    })();
    return () => { cancelled = true; };
  }, [path]);

  if (!path || !url) return <>{fallback}</>;
  return <img src={url} alt={alt} className={className} />;
}


interface Registration {
  id: string;
  child_name: string;
  child_dob: string;
  parent_name: string;
  email: string;
  phone: string;
  preferred_age_group: string;
  previous_club: string | null;
  medical_conditions: string | null;
  additional_info: string | null;
  address: string | null;
  fa_fan_number: string | null;
  relationship_to_child: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  known_to_social_services: boolean | null;
  social_services_details: string | null;
  foster_care_details: string | null;
  consent_photography: boolean | null;
  consent_medical: boolean | null;
  declaration_confirmed: boolean | null;
  photo_url: string | null;
  created_at: string;
  payment_status: string | null;
  paid_at: string | null;
}

interface RosterPlayer {
  id: string;
  first_name: string;
  age_group: string;
  team_name: string;
  shirt_number: number | null;
}

const normaliseName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const splitName = (name: string) => {
  const parts = normaliseName(name).split(" ").filter(Boolean);
  return {
    first: parts[0] || "",
    surname: parts.slice(1).join(" "),
    full: parts.join(" "),
  };
};

const nameMatchScore = (shortOrRosterName: string, fullCandidateName: string): number => {
  const roster = splitName(shortOrRosterName);
  const candidate = splitName(fullCandidateName);
  if (!roster.first || !candidate.first) return 0;
  if (roster.full === candidate.full) return 100;

  const firstMatch =
    candidate.first === roster.first ||
    (roster.first.length >= 3 && candidate.first.startsWith(roster.first)) ||
    (candidate.first.length >= 3 && roster.first.startsWith(candidate.first));
  if (!firstMatch) return 0;

  if (roster.surname) {
    if (!candidate.surname) return 0;
    if (candidate.surname === roster.surname) return 95;
    if (candidate.surname.startsWith(roster.surname)) return 85;
    if (candidate.surname[0] && roster.surname === candidate.surname[0]) return 80;
    if (candidate.surname[0] && roster.surname.startsWith(candidate.surname[0]) && roster.surname.length === 1) return 75;
    return 0;
  }

  return candidate.first === roster.first ? 45 : 35;
};

// Map team_slug (e.g. "u9s-gold") to the human age group used in registrations (e.g. "U9 Gold")
function teamSlugToAgeGroup(slug: string): string {
  const s = (slug || "").toLowerCase().trim();
  const m = s.match(/^u(\d+)s?(?:-(black|gold))?$/);
  if (!m) return slug;
  const num = m[1];
  const suffix = m[2] ? ` ${m[2][0].toUpperCase()}${m[2].slice(1)}` : "";
  return `U${num}${suffix}`;
}

interface HubPlayer {
  guardian_id: string;
  parent_user_id: string;
  parent_name: string;
  parent_email: string | null;
  player_name: string;
  team_slug: string;
  age_group: string; // derived
  registered: boolean;
}

export default function PlayerRegistrationAdminPage() {
  const [tab, setTab] = useState<"paid" | "outstanding" | "hub">("hub");
  const [search, setSearch] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [excludedRosterIds, setExcludedRosterIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("registration-excluded-roster-ids");
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set(); }
  });
  const toggleExcluded = useCallback((id: string) => {
    setExcludedRosterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("registration-excluded-roster-ids", JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  }, []);
  const queryClient = useQueryClient();

  const markComplete = async (opts: {
    childName: string;
    ageGroup: string;
    parentName?: string | null;
    email?: string | null;
    phone?: string | null;
    rowKey: string;
  }) => {
    if (!confirm(`Mark ${opts.childName} (${opts.ageGroup}) as registered & paid? Use this only when payment has been received outside the system (cash, bank transfer, etc.).`)) return;
    setMarkingId(opts.rowKey);
    try {
      // Check all same-age registrations for the best name match. This avoids
      // "Charlie M" accidentally updating another Charlie in the same age group.
      const firstName = splitName(opts.childName).first;
      const { data: existingRows, error: lookupError } = await supabase
        .from("player_registrations")
        .select("id, child_name, payment_status")
        .eq("preferred_age_group", opts.ageGroup)
        .ilike("child_name", `${firstName}%`);

      if (lookupError) throw lookupError;

      const existing = (existingRows || [])
        .map((row) => ({ ...row, score: nameMatchScore(opts.childName, row.child_name) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score || (a.payment_status === "paid" ? 1 : 0) - (b.payment_status === "paid" ? 1 : 0))[0];

      if (existing) {
        const { error } = await supabase
          .from("player_registrations")
          .update({ payment_status: "paid", paid_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
        toast.success(`${opts.childName} marked as paid`);
      } else {
        const { error } = await supabase.from("player_registrations").insert({
          child_name: opts.childName,
          child_dob: "1900-01-01",
          parent_name: opts.parentName || "Manual entry",
          email: opts.email || "manual@pa-fc.uk",
          phone: opts.phone || "N/A",
          preferred_age_group: opts.ageGroup,
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          additional_info: "Manually marked complete by admin (payment received outside system).",
          declaration_confirmed: true,
        });
        if (error) throw error;
        toast.success(`${opts.childName} registered manually`);
      }
      await queryClient.invalidateQueries({ queryKey: ["player-registrations"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to mark complete");
    } finally {
      setMarkingId(null);
    }
  };

  const deleteRegistration = async (r: Registration) => {
    if (!confirm(`Permanently delete the registration for ${r.child_name} (${r.preferred_age_group})?\n\nThis cannot be undone.`)) return;
    const { error } = await supabase.from("player_registrations").delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Deleted ${r.child_name}'s registration`);
    setSelected(null);
    await queryClient.invalidateQueries({ queryKey: ["player-registrations"] });
  };

  const deleteHubPlayer = async (h: HubPlayer) => {
    if (!confirm(`Remove ${h.player_name} (${h.age_group}) from the hub?\n\nThis unlinks the parent/guardian record. It does NOT delete the parent's account or any completed registration.`)) return;
    const { error } = await supabase.from("guardians").delete().eq("id", h.guardian_id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Removed ${h.player_name} from the hub`);
    await queryClient.invalidateQueries({ queryKey: ["hub-guardians"] });
  };



  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["player-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Registration[];
    },
  });

  const { data: roster = [] } = useQuery({
    queryKey: ["player-stats-roster"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select("id, first_name, age_group, team_name, shirt_number");
      if (error) throw error;
      return data as RosterPlayer[];
    },
  });

  // Hub data: guardians (parent ↔ player ↔ team) with parent profile
  const { data: guardians = [] } = useQuery({
    queryKey: ["hub-guardians"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardians")
        .select("id, parent_user_id, player_name, team_slug, status")
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: parentProfiles = [] } = useQuery({
    queryKey: ["hub-parent-profiles", guardians.map((g) => g.parent_user_id).sort().join(",")],
    enabled: guardians.length > 0,
    queryFn: async () => {
      const ids = Array.from(new Set(guardians.map((g) => g.parent_user_id)));
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      if (error) throw error;
      return data || [];
    },
  });


  // A registration only counts as "complete" once payment_status === 'paid'.
  const paidRegistrations = useMemo(
    () => registrations.filter((r) => r.payment_status === "paid"),
    [registrations],
  );
  const unpaidRegistrations = useMemo(
    () => registrations.filter((r) => r.payment_status !== "paid"),
    [registrations],
  );

  const ageGroups = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach((r) => r.preferred_age_group && set.add(r.preferred_age_group));
    roster.forEach((p) => p.age_group && set.add(p.age_group));
    return Array.from(set).sort();
  }, [registrations, roster]);

  // Index PAID registrations per age group — pre-parsed for flexible matching.
  type PaidIndex = { first: string; surname: string; full: string; ag: string };
  const paidIndex = useMemo<PaidIndex[]>(() => {
    return paidRegistrations.map((r) => {
      const parts = splitName(r.child_name);
      return {
        first: parts.first,
        surname: parts.surname,
        full: parts.full,
        ag: r.preferred_age_group,
      };
    });
  }, [paidRegistrations]);

  // Flexible matcher: handles full names, first-only, "first lastInitial",
  // nicknames where roster is a prefix of registration (e.g. "Muz" → "Muzima"),
  // and roster "first lastInitial" matching registration "first surname".
  const matchesPaid = useCallback((rosterName: string, ageGroup: string): boolean => {
    const rParts = normaliseName(rosterName).split(" ").filter(Boolean);
    if (rParts.length === 0) return false;
    const rFirst = rParts[0];
    const rRest = rParts.slice(1).join(" ");
    return paidIndex.some((p) => {
      if (p.ag !== ageGroup) return false;
      if (nameMatchScore(rosterName, p.full) >= 35) return true;
      if (p.full === normaliseName(rosterName)) return true;
      // First-name match: exact, or one is a prefix of the other (≥3 chars to avoid false positives)
      const firstMatch =
        p.first === rFirst ||
        (rFirst.length >= 3 && p.first.startsWith(rFirst)) ||
        (p.first.length >= 3 && rFirst.startsWith(p.first));
      if (!firstMatch) return false;
      // If roster supplied a surname/initial, it must match the registration surname
      if (rRest) {
        if (!p.surname) return false;
        return p.surname.startsWith(rRest) || rRest.startsWith(p.surname[0] || "");
      }
      return true;
    });
  }, [paidIndex]);

  const outstanding = useMemo(() => {
    return roster.filter((p) => !excludedRosterIds.has(p.id) && !matchesPaid(p.first_name, p.age_group));
  }, [roster, matchesPaid, excludedRosterIds]);

  const excludedRosterPlayers = useMemo(
    () => roster.filter((p) => excludedRosterIds.has(p.id)),
    [roster, excludedRosterIds],
  );

  const applySearch = useCallback((r: Registration) => {
    if (ageGroupFilter !== "all" && r.preferred_age_group !== ageGroupFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.child_name.toLowerCase().includes(q) ||
      r.parent_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q)
    );
  }, [ageGroupFilter, search]);

  const filteredPaid = useMemo(() => paidRegistrations.filter(applySearch), [paidRegistrations, applySearch]);
  const filteredUnpaid = useMemo(() => unpaidRegistrations.filter(applySearch), [unpaidRegistrations, applySearch]);

  const filteredOutstanding = useMemo(() => {
    return outstanding.filter((p) => {
      if (ageGroupFilter !== "all" && p.age_group !== ageGroupFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.first_name.toLowerCase().includes(q) || p.team_name.toLowerCase().includes(q);
    });
  }, [outstanding, search, ageGroupFilter]);

  // Build hub player list with registration cross-reference (by parent email OR child name + age group)
  const paidEmails = useMemo(
    () => new Set(paidRegistrations.map((r) => r.email.toLowerCase().trim())),
    [paidRegistrations],
  );

  const hubPlayers: HubPlayer[] = useMemo(() => {
    return guardians
      .filter((g) => g.player_name && g.player_name.trim().length > 0)
      .map((g) => {
        const profile = parentProfiles.find((p) => p.id === g.parent_user_id);
        const ageGroup = teamSlugToAgeGroup(g.team_slug);
        const nameMatch = matchesPaid(g.player_name, ageGroup);
        const emailMatch = profile?.email ? paidEmails.has(profile.email.toLowerCase().trim()) : false;
        return {
          guardian_id: g.id,
          parent_user_id: g.parent_user_id,
          parent_name: profile?.full_name || "Unknown parent",
          parent_email: profile?.email || null,
          player_name: g.player_name,
          team_slug: g.team_slug,
          age_group: ageGroup,
          registered: nameMatch || emailMatch,
        };
      })
      .sort((a, b) => a.age_group.localeCompare(b.age_group) || a.player_name.localeCompare(b.player_name));
  }, [guardians, parentProfiles, matchesPaid, paidEmails]);

  const hubRegisteredCount = hubPlayers.filter((h) => h.registered).length;
  const hubOutstandingCount = hubPlayers.length - hubRegisteredCount;

  const filteredHub = useMemo(() => {
    return hubPlayers.filter((h) => {
      if (ageGroupFilter !== "all" && h.age_group !== ageGroupFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        h.player_name.toLowerCase().includes(q) ||
        h.parent_name.toLowerCase().includes(q) ||
        (h.parent_email || "").toLowerCase().includes(q) ||
        h.team_slug.toLowerCase().includes(q)
      );
    });
  }, [hubPlayers, search, ageGroupFilter]);

  const resolveManualCompletionDetails = (player: RosterPlayer) => {
    const hubMatch = hubPlayers
      .filter((h) => h.age_group === player.age_group)
      .map((h) => ({ player: h, score: nameMatchScore(player.first_name, h.player_name) }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.player;

    return {
      childName: hubMatch?.player_name || player.first_name,
      ageGroup: player.age_group,
      parentName: hubMatch?.parent_name,
      email: hubMatch?.parent_email,
      rowKey: player.id,
    };
  };

  const toggleParent = (userId: string) => {
    setSelectedParents((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectAllOutstanding = () => {
    const ids = filteredHub.filter((h) => !h.registered).map((h) => h.parent_user_id);
    setSelectedParents(new Set(ids));
  };

  const clearSelection = () => setSelectedParents(new Set());

  const sendRegistrationReminders = async () => {
    const targets = hubPlayers.filter((h) => selectedParents.has(h.parent_user_id) && !h.registered);
    // De-duplicate parents (one parent may have multiple children)
    const byParent = new Map<string, HubPlayer[]>();
    targets.forEach((t) => {
      const arr = byParent.get(t.parent_user_id) || [];
      arr.push(t);
      byParent.set(t.parent_user_id, arr);
    });

    if (byParent.size === 0) {
      toast.info("Select at least one outstanding parent to remind");
      return;
    }

    setSending(true);
    try {
      const title = "Action Required: Player Registration 2026/27";
      const link = "/register";

      // 1. In-app notifications
      const notifications = Array.from(byParent.entries()).map(([uid, players]) => ({
        user_id: uid,
        title,
        message: `Please complete the 2026/27 registration & payment for ${players.map((p) => p.player_name).join(", ")}.`,
        type: "info",
        link,
      }));
      await supabase.from("hub_notifications").insert(notifications);

      // 2. Email (admin-broadcast template) — one per parent with email
      const ts = Date.now();
      for (const [uid, players] of byParent.entries()) {
        const player = players[0];
        if (!player.parent_email) continue;
        const childList = players.map((p) => `• ${p.player_name} (${p.age_group})`).join("\n");
        supabase.functions
          .invoke("send-transactional-email", {
            body: {
              templateName: "admin-broadcast",
              recipientEmail: player.parent_email,
              idempotencyKey: `reg-reminder-${uid}-${ts}`,
              templateData: {
                title: "Player Registration Reminder — 2026/27 Season",
                message:
                  `Hi ${player.parent_name},\n\n` +
                  `Our records show that the 2026/27 registration & payment is still outstanding for:\n\n${childList}\n\n` +
                  `Please complete it as soon as possible so your child is fully registered to play this season.\n\n` +
                  `Register here: https://www.pa-fc.uk/register\n\n` +
                  `If you've already completed this and believe you're seeing this in error, please reply to this email and we'll get it sorted.`,
              },
            },
          })
          .catch((err) => console.error("Reminder email failed:", err));
      }

      // 3. Push
      const userIds = Array.from(byParent.keys());
      supabase.functions
        .invoke("send-push-notification", {
          body: {
            userIds,
            title,
            message: "Complete your 2026/27 player registration & payment.",
            link,
            tag: "registration-reminder",
          },
        })
        .catch((err) => console.error("Reminder push failed:", err));

      toast.success(`Reminders sent to ${byParent.size} parent${byParent.size !== 1 ? "s" : ""}`);
      clearSelection();
    } catch (err) {
      console.error("Send reminders failed:", err);
      toast.error("Failed to send reminders");
    } finally {
      setSending(false);
    }
  };

  const visibleRegistrations = tab === "paid" ? filteredPaid : [];


  const exportCsv = () => {
    const rows = [
      [
        "Child Name", "DOB", "Age Group", "Parent", "Relationship", "Email", "Phone",
        "Address", "FA Fan #", "Previous Club", "Medical", "Emergency Contact",
        "Emergency Phone", "Photo Consent", "Medical Consent", "Declaration", "Submitted",
      ],
      ...filteredPaid.map((r) => [
        r.child_name, r.child_dob, r.preferred_age_group, r.parent_name,
        r.relationship_to_child || "", r.email, r.phone, (r.address || "").replace(/\n/g, " "),
        r.fa_fan_number || "", r.previous_club || "", (r.medical_conditions || "").replace(/\n/g, " "),
        r.emergency_contact_name || "", r.emergency_contact_phone || "",
        r.consent_photography ? "Yes" : "No", r.consent_medical ? "Yes" : "No",
        r.declaration_confirmed ? "Yes" : "No", r.created_at,
      ]),
    ];
    const csv = rows.map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `player-registrations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-7xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Player Registrations
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Track who has registered for the 2026/27 season and who still needs to.
            </p>
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-bold tracking-wider hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Registered & Paid" value={paidRegistrations.length} icon={CheckCircle2} color="text-green-500" />
          <StatCard label="Hub Outstanding" value={hubOutstandingCount} icon={AlertCircle} color="text-amber-500" />
          <StatCard label="Roster Outstanding" value={outstanding.length} icon={AlertCircle} color="text-orange-500" />
          <StatCard label="Hub Players" value={hubPlayers.length} icon={Users} color="text-primary" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-border overflow-x-auto">
          {([
            { key: "hub", label: `Hub Players (${hubPlayers.length})` },
            { key: "paid", label: `Registered (${paidRegistrations.length})` },
            { key: "outstanding", label: `Roster Outstanding (${outstanding.length})` },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); clearSelection(); }}
              className={`px-4 py-2 text-sm font-display font-bold tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone…"
              className="w-full pl-10 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={ageGroupFilter}
            onChange={(e) => setAgeGroupFilter(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All age groups</option>
            {ageGroups.map((ag) => (
              <option key={ag} value={ag}>{ag}</option>
            ))}
          </select>
        </div>

        {/* Hub bulk action bar */}
        {tab === "hub" && (
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-card border border-border rounded-lg">
            <span className="text-xs text-muted-foreground font-display tracking-wider">
              {selectedParents.size} parent{selectedParents.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex-1" />
            <button
              onClick={selectAllOutstanding}
              className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary font-display tracking-wider"
            >
              Select all outstanding
            </button>
            {selectedParents.size > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary font-display tracking-wider"
              >
                Clear
              </button>
            )}
            <button
              onClick={sendRegistrationReminders}
              disabled={sending || selectedParents.size === 0}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-display font-bold tracking-wider disabled:opacity-50 hover:bg-primary/90"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? "Sending…" : `Send reminder (in-app + email + push)`}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : tab === "hub" ? (
          <HubPlayerList
            items={filteredHub}
            selected={selectedParents}
            onToggle={toggleParent}
            onMarkComplete={(h) => markComplete({
              childName: h.player_name,
              ageGroup: h.age_group,
              parentName: h.parent_name,
              email: h.parent_email,
              rowKey: h.guardian_id,
            })}
            onDelete={deleteHubPlayer}
            markingId={markingId}
          />
        ) : tab === "outstanding" ? (
          <OutstandingList
            items={filteredOutstanding}
            onMarkComplete={(p) => markComplete(resolveManualCompletionDetails(p))}
            markingId={markingId}
            excludedItems={excludedRosterPlayers}
            onToggleExclude={toggleExcluded}
          />
        ) : (
          <RegisteredList items={visibleRegistrations} onSelect={setSelected} onDelete={deleteRegistration} showUnpaid={false} />
        )}
      </main>


      {selected && (
        <RegistrationDetail
          registration={selected}
          onClose={() => setSelected(null)}
          onDelete={() => deleteRegistration(selected)}
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: ["player-registrations"] });
          }}
        />
      )}

      <Footer />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">{label}</p>
          <p className="text-3xl font-display font-black text-foreground mt-1">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </div>
  );
}

function RegisteredList({ items, onSelect, onDelete, showUnpaid = false }: { items: Registration[]; onSelect: (r: Registration) => void; onDelete: (r: Registration) => void; showUnpaid?: boolean }) {
  if (!items.length) {
    return (
      <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
        {showUnpaid
          ? "Everyone who has submitted a form has paid. 🎉"
          : "No paid registrations match your filters."}
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {showUnpaid && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 font-display tracking-wider">
          These parents submitted the form but did not complete payment. Their registration is NOT complete.
        </div>
      )}
      <div className="divide-y divide-border">
        {items.map((r) => (
          <div
            key={r.id}
            className="px-4 py-3 hover:bg-secondary/40 transition-colors flex items-center gap-3"
          >
            <RegPhoto
              path={r.photo_url}
              alt={r.child_name}
              className="h-10 w-10 rounded-full object-cover shrink-0"
              fallback={
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display font-bold shrink-0">
                  {r.child_name[0]?.toUpperCase()}
                </div>
              }
            />
            <button onClick={() => onSelect(r)} className="flex-1 min-w-0 text-left">
              <p className="font-display font-bold text-foreground text-sm truncate">{r.child_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {r.preferred_age_group} • {r.parent_name} • {r.email}
              </p>
            </button>
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Submitted</span>
              <span className="text-xs text-foreground font-display">
                {format(new Date(r.created_at), "dd MMM yyyy")}
              </span>
            </div>
            {showUnpaid ? (
              <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-display tracking-wider shrink-0">
                UNPAID
              </span>
            ) : (
              <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-500 font-display tracking-wider shrink-0">
                PAID
              </span>
            )}
            {(!r.consent_photography || !r.consent_medical || !r.declaration_confirmed) && (
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(r); }}
              className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
              title="Edit registration"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(r); }}
              className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete registration"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutstandingList({ items, onMarkComplete, markingId, excludedItems, onToggleExclude }: {
  items: RosterPlayer[];
  onMarkComplete: (p: RosterPlayer) => void;
  markingId: string | null;
  excludedItems: RosterPlayer[];
  onToggleExclude: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-16 text-green-500 bg-card border border-border rounded-xl">
          🎉 Everyone on the roster has registered!
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-500 font-display tracking-wider">
            These players appear on a team roster but have not submitted a 2026/27 registration form yet.
          </div>
          <div className="divide-y divide-border">
            {items.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-display font-bold">
                  {p.first_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground text-sm truncate">{p.first_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.team_name} • {p.age_group}
                    {p.shirt_number ? ` • #${p.shirt_number}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => onMarkComplete(p)}
                  disabled={markingId === p.id}
                  className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md bg-green-500/20 text-green-500 hover:bg-green-500/30 font-display tracking-wider disabled:opacity-50"
                  title="Mark as registered & paid manually (no payment required)"
                >
                  {markingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckSquare className="h-3 w-3" />}
                  MARK COMPLETE
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Mark ${p.first_name} (${p.team_name}) as a coach/staff member? They will be hidden from the outstanding list and won't require a player registration.`)) {
                      onToggleExclude(p.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-display tracking-wider"
                  title="Hide from outstanding list — this person is a coach/staff member, not a player"
                >
                  NOT A PLAYER
                </button>
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 font-display tracking-wider">
                  NOT REGISTERED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {excludedItems.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-blue-500/10 border-b border-blue-500/20 text-xs text-blue-400 font-display tracking-wider">
            Coaches / Staff — hidden from outstanding ({excludedItems.length})
          </div>
          <div className="divide-y divide-border">
            {excludedItems.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-display font-bold text-xs">
                  {p.first_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground text-sm truncate">{p.first_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.team_name} • {p.age_group} • Coach/Staff
                  </p>
                </div>
                <button
                  onClick={() => onToggleExclude(p.id)}
                  className="text-[10px] px-2.5 py-1 rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 font-display tracking-wider"
                  title="Restore to outstanding list"
                >
                  UNDO
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function RegistrationDetail({ registration: r, onClose, onDelete, onSaved }: {
  registration: Registration;
  onClose: () => void;
  onDelete: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState<Registration>(r);

  useEffect(() => { setForm(r); setEditing(false); }, [r]);

  const set = <K extends keyof Registration>(k: K, v: Registration[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Image must be under 20MB"); return; }
    setUploadingPhoto(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `admin/${r.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("registration-photos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      // Remove previous photo if it was a storage path (not a legacy https URL)
      if (form.photo_url && !/^https?:\/\//i.test(form.photo_url)) {
        await supabase.storage.from("registration-photos").remove([form.photo_url]);
      }
      set("photo_url", path);
      toast.success("Photo updated — click Save to persist");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (!form.photo_url) return;
    if (!confirm("Remove this photo?")) return;
    if (!/^https?:\/\//i.test(form.photo_url)) {
      await supabase.storage.from("registration-photos").remove([form.photo_url]);
    }
    set("photo_url", null);
    toast.success("Photo removed — click Save to persist");
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("player_registrations").update({
      child_name: form.child_name,
      child_dob: form.child_dob,
      preferred_age_group: form.preferred_age_group,
      previous_club: form.previous_club,
      fa_fan_number: form.fa_fan_number,
      address: form.address,
      parent_name: form.parent_name,
      relationship_to_child: form.relationship_to_child,
      email: form.email,
      phone: form.phone,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_relationship: form.emergency_contact_relationship,
      emergency_contact_phone: form.emergency_contact_phone,
      medical_conditions: form.medical_conditions,
      additional_info: form.additional_info,
      consent_photography: form.consent_photography,
      consent_medical: form.consent_medical,
      declaration_confirmed: form.declaration_confirmed,
      payment_status: form.payment_status,
      photo_url: form.photo_url,
    }).eq("id", r.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Registration updated");
    setEditing(false);
    await onSaved();
  };

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground mt-1";

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="container mx-auto px-4 py-10 max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card border border-border rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border gap-2">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-black text-foreground truncate">{form.child_name}</h2>
              <p className="text-xs text-muted-foreground">
                {form.preferred_age_group} • Submitted {format(new Date(r.created_at), "dd MMM yyyy 'at' HH:mm")}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-display tracking-wider hover:bg-primary/90">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              ) : (
                <>
                  <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-display tracking-wider hover:bg-primary/90 disabled:opacity-50">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                  </button>
                  <button onClick={() => { setForm(r); setEditing(false); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-foreground text-xs font-display tracking-wider hover:bg-secondary/80">
                    Cancel
                  </button>
                </>
              )}
              <button onClick={onDelete} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 text-xs font-display tracking-wider hover:bg-red-500/30">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {r.photo_url && (
              <RegPhoto
                path={r.photo_url}
                alt={form.child_name}
                className="h-32 w-32 rounded-xl object-cover border-2 border-border"
                fallback={
                  <div className="h-32 w-32 rounded-xl bg-secondary/40 border-2 border-border flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                }
              />
            )}

            {editing ? (
              <>
                <Section title="Child">
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Full Name</span><input className={inputCls} value={form.child_name} onChange={(e) => set("child_name", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Date of Birth</span><input type="date" className={inputCls} value={form.child_dob || ""} onChange={(e) => set("child_dob", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Preferred Age Group</span><input className={inputCls} value={form.preferred_age_group} onChange={(e) => set("preferred_age_group", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Previous Club</span><input className={inputCls} value={form.previous_club || ""} onChange={(e) => set("previous_club", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">FA Fan Number</span><input className={inputCls} value={form.fa_fan_number || ""} onChange={(e) => set("fa_fan_number", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Address</span><textarea rows={2} className={inputCls} value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></label>
                </Section>

                <Section title="Parent / Guardian">
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Name</span><input className={inputCls} value={form.parent_name} onChange={(e) => set("parent_name", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Relationship</span><input className={inputCls} value={form.relationship_to_child || ""} onChange={(e) => set("relationship_to_child", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Email</span><input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Phone</span><input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label>
                </Section>

                <Section title="Emergency Contact">
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Name</span><input className={inputCls} value={form.emergency_contact_name || ""} onChange={(e) => set("emergency_contact_name", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Relationship</span><input className={inputCls} value={form.emergency_contact_relationship || ""} onChange={(e) => set("emergency_contact_relationship", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Phone</span><input className={inputCls} value={form.emergency_contact_phone || ""} onChange={(e) => set("emergency_contact_phone", e.target.value)} /></label>
                </Section>

                <Section title="Medical & Additional">
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Medical Conditions</span><textarea rows={2} className={inputCls} value={form.medical_conditions || ""} onChange={(e) => set("medical_conditions", e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Additional Info</span><textarea rows={2} className={inputCls} value={form.additional_info || ""} onChange={(e) => set("additional_info", e.target.value)} /></label>
                </Section>

                <Section title="Consents & Payment">
                  <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={!!form.consent_photography} onChange={(e) => set("consent_photography", e.target.checked)} /> Photography & Video</label>
                  <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={!!form.consent_medical} onChange={(e) => set("consent_medical", e.target.checked)} /> Medical Treatment</label>
                  <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={!!form.declaration_confirmed} onChange={(e) => set("declaration_confirmed", e.target.checked)} /> Declaration Confirmed</label>
                  <label className="block mt-2"><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Payment Status</span>
                    <select className={inputCls} value={form.payment_status || ""} onChange={(e) => set("payment_status", e.target.value)}>
                      <option value="">—</option>
                      <option value="paid">paid</option>
                      <option value="pending">pending</option>
                      <option value="unpaid">unpaid</option>
                    </select>
                  </label>
                </Section>
              </>
            ) : (
              <>
                <Section title="Child">
                  <Field icon={UserIcon} label="Full Name" value={r.child_name} />
                  <Field icon={Calendar} label="Date of Birth" value={r.child_dob ? format(new Date(r.child_dob), "dd/MM/yyyy") : "—"} />
                  <Field icon={UserIcon} label="Preferred Age Group" value={r.preferred_age_group} />
                  <Field icon={UserIcon} label="Previous Club" value={r.previous_club || "—"} />
                  <Field icon={UserIcon} label="FA Fan Number" value={r.fa_fan_number || "—"} />
                  <Field icon={MapPin} label="Address" value={r.address || "—"} />
                </Section>

                <Section title="Parent / Guardian">
                  <Field icon={UserIcon} label="Name" value={r.parent_name} />
                  <Field icon={UserIcon} label="Relationship" value={r.relationship_to_child || "—"} />
                  <Field icon={Mail} label="Email" value={r.email} />
                  <Field icon={Phone} label="Phone" value={r.phone} />
                </Section>

                <Section title="Emergency Contact">
                  <Field icon={UserIcon} label="Name" value={r.emergency_contact_name || "—"} />
                  <Field icon={UserIcon} label="Relationship" value={r.emergency_contact_relationship || "—"} />
                  <Field icon={Phone} label="Phone" value={r.emergency_contact_phone || "—"} />
                </Section>

                <Section title="Medical & Safeguarding">
                  <Field icon={Heart} label="Medical Conditions" value={r.medical_conditions || "None reported"} />
                  <Field icon={ShieldAlert} label="Known to Social Services" value={r.known_to_social_services ? "Yes" : "No"} />
                  {r.social_services_details && <Field icon={ShieldAlert} label="Social Services Details" value={r.social_services_details} />}
                  {r.foster_care_details && <Field icon={ShieldAlert} label="Foster Care Details" value={r.foster_care_details} />}
                  <Field icon={UserIcon} label="Additional Info" value={r.additional_info || "—"} />
                </Section>

                <Section title="Consents">
                  <ConsentRow label="Photography & Video" granted={!!r.consent_photography} />
                  <ConsentRow label="Medical Treatment" granted={!!r.consent_medical} />
                  <ConsentRow label="Declaration Confirmed" granted={!!r.declaration_confirmed} />
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-xs font-bold text-primary uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">{label}</p>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{value}</p>
      </div>
    </div>
  );
}

function ConsentRow({ label, granted }: { label: string; granted: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      {granted ? (
        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500 font-display tracking-wider flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> GRANTED
        </span>
      ) : (
        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-500 font-display tracking-wider flex items-center gap-1">
          <X className="h-3 w-3" /> NOT GRANTED
        </span>
      )}
    </div>
  );
}

function HubPlayerList({
  items,
  selected,
  onToggle,
  onMarkComplete,
  onDelete,
  markingId,
}: {
  items: HubPlayer[];
  selected: Set<string>;
  onToggle: (userId: string) => void;
  onMarkComplete: (h: HubPlayer) => void;
  onDelete: (h: HubPlayer) => void;
  markingId: string | null;
}) {
  if (!items.length) {
    return (
      <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
        No hub players match your filters.
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-primary/5 border-b border-border text-xs text-muted-foreground font-display tracking-wider">
        Hub players are linked to a parent account via the PAFC Hub. Tick outstanding parents to send a reminder, or click <span className="text-green-500">Mark Complete</span> to manually register a player whose payment was received outside the system.
      </div>
      <div className="divide-y divide-border">
        {items.map((h) => {
          const isSel = selected.has(h.parent_user_id);
          const disabled = h.registered;
          return (
            <div
              key={h.guardian_id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                disabled ? "opacity-70" : ""
              } ${isSel ? "bg-primary/5" : ""}`}
            >
              <input
                type="checkbox"
                checked={isSel}
                disabled={disabled}
                onChange={() => onToggle(h.parent_user_id)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 disabled:opacity-30"
              />
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-display font-bold shrink-0 ${
                  h.registered
                    ? "bg-green-500/20 text-green-500"
                    : "bg-amber-500/20 text-amber-500"
                }`}
              >
                {h.player_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-foreground text-sm truncate">
                  {h.player_name}{" "}
                  <span className="text-muted-foreground font-normal">· {h.age_group}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Parent: {h.parent_name}
                  {h.parent_email ? ` · ${h.parent_email}` : " · (no email)"}
                </p>
              </div>
              {!h.registered && (
                <button
                  onClick={() => onMarkComplete(h)}
                  disabled={markingId === h.guardian_id}
                  className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md bg-green-500/20 text-green-500 hover:bg-green-500/30 font-display tracking-wider disabled:opacity-50"
                  title="Mark as registered & paid manually (no payment required)"
                >
                  {markingId === h.guardian_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckSquare className="h-3 w-3" />}
                  MARK COMPLETE
                </button>
              )}
              {h.registered ? (
                <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-500 font-display tracking-wider shrink-0">
                  REGISTERED
                </span>
              ) : (
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 font-display tracking-wider shrink-0 flex items-center gap-1">
                  <Bell className="h-3 w-3" /> OUTSTANDING
                </span>
              )}
              <button
                onClick={() => onDelete(h)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                title="Remove from hub (unlink parent/guardian)"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
