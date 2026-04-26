import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, AlertCircle, Search, Download, Loader2,
  User as UserIcon, Mail, Phone, MapPin, Calendar, Heart, ShieldAlert, X,
} from "lucide-react";
import { format } from "date-fns";

// Resolves a signed URL for a photo stored in the private `registration-photos` bucket.
// Accepts either a raw storage path (e.g. "userId/123.jpg") or a full https URL (legacy).
function RegPhoto({ path, alt, className, fallback }: { path: string | null; alt: string; className: string; fallback: React.ReactNode }) {
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

export default function PlayerRegistrationAdminPage() {
  const [tab, setTab] = useState<"paid" | "outstanding">("paid");
  const [search, setSearch] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Registration | null>(null);

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

  // Index PAID registered names per age group — only paid registrations count as complete.
  const registeredKeys = useMemo(() => {
    const set = new Set<string>();
    paidRegistrations.forEach((r) => {
      const first = r.child_name.split(" ")[0] || r.child_name;
      set.add(`${normaliseName(first)}::${r.preferred_age_group}`);
      set.add(`${normaliseName(r.child_name)}::${r.preferred_age_group}`);
    });
    return set;
  }, [paidRegistrations]);

  const outstanding = useMemo(() => {
    return roster.filter((p) => {
      const key = `${normaliseName(p.first_name)}::${p.age_group}`;
      return !registeredKeys.has(key);
    });
  }, [roster, registeredKeys]);

  const applySearch = (r: Registration) => {
    if (ageGroupFilter !== "all" && r.preferred_age_group !== ageGroupFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.child_name.toLowerCase().includes(q) ||
      r.parent_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q)
    );
  };

  const filteredPaid = useMemo(() => paidRegistrations.filter(applySearch), [paidRegistrations, search, ageGroupFilter]);
  const filteredUnpaid = useMemo(() => unpaidRegistrations.filter(applySearch), [unpaidRegistrations, search, ageGroupFilter]);

  const filteredOutstanding = useMemo(() => {
    return outstanding.filter((p) => {
      if (ageGroupFilter !== "all" && p.age_group !== ageGroupFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.first_name.toLowerCase().includes(q) || p.team_name.toLowerCase().includes(q);
    });
  }, [outstanding, search, ageGroupFilter]);

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
          <StatCard label="Paid & Complete" value={paidRegistrations.length} icon={CheckCircle2} color="text-green-500" />
          <StatCard label="Awaiting Payment" value={unpaidRegistrations.length} icon={AlertCircle} color="text-red-500" />
          <StatCard label="Outstanding" value={outstanding.length} icon={AlertCircle} color="text-amber-500" />
          <StatCard label="Total Roster" value={roster.length} icon={UserIcon} color="text-primary" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-border overflow-x-auto">
          {([
            { key: "paid", label: `Paid & Complete (${paidRegistrations.length})` },
            { key: "unpaid", label: `Awaiting Payment (${unpaidRegistrations.length})` },
            { key: "outstanding", label: `Outstanding (${outstanding.length})` },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : tab === "outstanding" ? (
          <OutstandingList items={filteredOutstanding} />
        ) : (
          <RegisteredList items={visibleRegistrations} onSelect={setSelected} showUnpaid={tab === "unpaid"} />
        )}
      </main>

      {selected && <RegistrationDetail registration={selected} onClose={() => setSelected(null)} />}

      <Footer />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
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

function RegisteredList({ items, onSelect, showUnpaid = false }: { items: Registration[]; onSelect: (r: Registration) => void; showUnpaid?: boolean }) {
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
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className="w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors flex items-center gap-3"
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
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-sm truncate">{r.child_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {r.preferred_age_group} • {r.parent_name} • {r.email}
              </p>
            </div>
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
          </button>
        ))}
      </div>
    </div>
  );
}

function OutstandingList({ items }: { items: RosterPlayer[] }) {
  if (!items.length) {
    return (
      <div className="text-center py-16 text-green-500 bg-card border border-border rounded-xl">
        🎉 Everyone on the roster has registered!
      </div>
    );
  }
  return (
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
            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 font-display tracking-wider">
              NOT REGISTERED
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegistrationDetail({ registration: r, onClose }: { registration: Registration; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="container mx-auto px-4 py-10 max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card border border-border rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="font-display text-xl font-black text-foreground">{r.child_name}</h2>
              <p className="text-xs text-muted-foreground">
                {r.preferred_age_group} • Submitted {format(new Date(r.created_at), "dd MMM yyyy 'at' HH:mm")}
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {r.photo_url && (
              <RegPhoto
                path={r.photo_url}
                alt={r.child_name}
                className="h-32 w-32 rounded-xl object-cover border-2 border-border"
                fallback={
                  <div className="h-32 w-32 rounded-xl bg-secondary/40 border-2 border-border flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                }
              />
            )}

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
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-xs font-bold text-primary uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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
