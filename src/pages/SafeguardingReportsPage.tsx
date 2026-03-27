import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ArrowLeft, Eye, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link, Navigate } from "react-router-dom";
import { RoleGate } from "@/components/RoleGate";

interface Report {
  id: string;
  reference_number: string;
  is_anonymous: boolean;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  category: string;
  description: string;
  people_involved: string | null;
  incident_date: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "New", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
  reviewing: { label: "Reviewing", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  resolved: { label: "Resolved", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
  bullying: "Bullying",
  discrimination: "Discrimination",
  welfare: "Welfare Concern",
  inappropriate_behaviour: "Inappropriate Behaviour",
  safety: "Safety Concern",
  other: "Other",
};

export default function SafeguardingReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("safeguarding_reports" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } else {
      setReports((data as any[]) || []);
    }
    setLoading(false);
  };

  const updateReport = async (id: string, status: string, notes: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase
      .from("safeguarding_reports" as any)
      .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update report");
    } else {
      toast.success("Report updated");
      fetchReports();
      if (selectedReport?.id === id) {
        setSelectedReport({ ...selectedReport, status, admin_notes: notes });
      }
    }
    setUpdatingStatus(false);
  };

  return (
    <RoleGate requiredRole="admin">
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Link to="/admin">
                <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Admin</Button>
              </Link>
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-display font-bold">Safeguarding Reports</h1>
              <Badge variant="outline" className="ml-auto">{reports.length} reports</Badge>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground">Loading reports...</p>
            ) : reports.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No safeguarding reports have been submitted yet.</p>
              </div>
            ) : selectedReport ? (
              /* Detail view */
              <div className="max-w-2xl mx-auto">
                <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelectedReport(null)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
                </Button>
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-primary">{selectedReport.reference_number}</span>
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedReport.status] || STATUS_CONFIG.new;
                      return <Badge className={cfg.color}>{cfg.label}</Badge>;
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category</span>
                      <p className="font-medium">{CATEGORY_LABELS[selectedReport.category] || selectedReport.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted</span>
                      <p className="font-medium">{new Date(selectedReport.created_at).toLocaleDateString("en-GB")}</p>
                    </div>
                    {selectedReport.incident_date && (
                      <div>
                        <span className="text-muted-foreground">Incident Date</span>
                        <p className="font-medium">{new Date(selectedReport.incident_date).toLocaleDateString("en-GB")}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Reporter</span>
                      <p className="font-medium">{selectedReport.is_anonymous ? "Anonymous" : selectedReport.reporter_name || "—"}</p>
                    </div>
                    {!selectedReport.is_anonymous && selectedReport.reporter_email && (
                      <div>
                        <span className="text-muted-foreground">Email</span>
                        <p className="font-medium">{selectedReport.reporter_email}</p>
                      </div>
                    )}
                    {!selectedReport.is_anonymous && selectedReport.reporter_phone && (
                      <div>
                        <span className="text-muted-foreground">Phone</span>
                        <p className="font-medium">{selectedReport.reporter_phone}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Description</span>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReport.description}</p>
                  </div>
                  {selectedReport.people_involved && (
                    <div>
                      <span className="text-sm text-muted-foreground">People Involved</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReport.people_involved}</p>
                    </div>
                  )}

                  <hr className="border-border" />

                  <div className="space-y-3">
                    <span className="text-sm font-medium">Update Status</span>
                    <Select
                      value={selectedReport.status}
                      onValueChange={(val) => updateReport(selectedReport.id, val, adminNotes || selectedReport.admin_notes || "")}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>

                    <span className="text-sm font-medium">Admin Notes</span>
                    <Textarea
                      value={adminNotes || selectedReport.admin_notes || ""}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Private notes about this report..."
                      rows={3}
                    />
                    <Button
                      size="sm"
                      disabled={updatingStatus}
                      onClick={() => updateReport(selectedReport.id, selectedReport.status, adminNotes)}
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* List view */
              <div className="space-y-3">
                {reports.map((report) => {
                  const cfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.new;
                  return (
                    <div
                      key={report.id}
                      className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => { setSelectedReport(report); setAdminNotes(report.admin_notes || ""); }}
                    >
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm">{report.reference_number}</span>
                          <span className="text-xs text-muted-foreground">
                            {CATEGORY_LABELS[report.category] || report.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{report.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString("en-GB")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.is_anonymous ? "Anonymous" : report.reporter_name || "—"}
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </RoleGate>
  );
}
