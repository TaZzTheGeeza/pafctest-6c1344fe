import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Send, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = [
  { value: "bullying", label: "Bullying" },
  { value: "discrimination", label: "Discrimination" },
  { value: "welfare", label: "Welfare Concern" },
  { value: "inappropriate_behaviour", label: "Inappropriate Behaviour" },
  { value: "safety", label: "Safety Concern" },
  { value: "other", label: "Other" },
];

export function SafeguardingReportForm() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [peopleInvolved, setPeopleInvolved] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !description.trim()) {
      toast.error("Please select a category and describe your concern.");
      return;
    }

    if (!isAnonymous && !reporterName.trim()) {
      toast.error("Please provide your name, or choose to report anonymously.");
      return;
    }

    setSubmitting(true);
    try {
      const insertData: Record<string, unknown> = {
        is_anonymous: isAnonymous,
        reporter_name: isAnonymous ? null : reporterName.trim() || null,
        reporter_email: isAnonymous ? null : reporterEmail.trim() || null,
        reporter_phone: isAnonymous ? null : reporterPhone.trim() || null,
        category,
        description: description.trim(),
        people_involved: peopleInvolved.trim() || null,
        incident_date: incidentDate || null,
      };

      const { data, error } = await supabase
        .from("safeguarding_reports" as any)
        .insert(insertData)
        .select("reference_number")
        .single();

      if (error) throw error;

      setReferenceNumber(data.reference_number);
      toast.success("Your report has been submitted securely.");
    } catch (err) {
      console.error("Report submission error:", err);
      toast.error("Failed to submit report. Please try again or contact the welfare officer directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (referenceNumber) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border-2 border-primary rounded-lg p-8 text-center"
      >
        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold mb-2">Report Submitted</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Your safeguarding concern has been securely submitted. Please keep your reference number for future correspondence.
        </p>
        <div className="bg-muted rounded-lg p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Your Reference Number</p>
          <p className="text-2xl font-display font-bold text-primary">{referenceNumber}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Our Club Welfare Officer will review this report and may reach out if further information is needed
          {isAnonymous ? "." : " using the contact details you provided."}
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            setReferenceNumber(null);
            setCategory("");
            setDescription("");
            setPeopleInvolved("");
            setIncidentDate("");
            setReporterName("");
            setReporterEmail("");
            setReporterPhone("");
            setIsAnonymous(false);
          }}
        >
          Submit Another Report
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="h-6 w-6 text-primary" />
        <h3 className="font-display text-lg font-bold">Report a Concern</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        All reports are treated with the strictest confidence. You may choose to remain anonymous.
      </p>

      {/* Anonymous toggle */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-2">
          {isAnonymous ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          <Label htmlFor="anonymous-toggle" className="text-sm font-medium cursor-pointer">
            Report anonymously
          </Label>
        </div>
        <Switch
          id="anonymous-toggle"
          checked={isAnonymous}
          onCheckedChange={setIsAnonymous}
        />
      </div>

      {/* Contact details (hidden if anonymous) */}
      {!isAnonymous && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="reporter-name" className="text-sm">Your Name *</Label>
            <Input
              id="reporter-name"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Full name"
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reporter-email" className="text-sm">Email</Label>
              <Input
                id="reporter-email"
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="your@email.com"
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="reporter-phone" className="text-sm">Phone</Label>
              <Input
                id="reporter-phone"
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="Phone number"
                maxLength={20}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Category */}
      <div>
        <Label className="text-sm">Category *</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-sm">Describe your concern *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide as much detail as possible about your concern..."
          rows={5}
          maxLength={5000}
        />
      </div>

      {/* People involved */}
      <div>
        <Label htmlFor="people-involved" className="text-sm">People involved</Label>
        <Textarea
          id="people-involved"
          value={peopleInvolved}
          onChange={(e) => setPeopleInvolved(e.target.value)}
          placeholder="Names of any individuals involved (optional)"
          rows={2}
          maxLength={1000}
        />
      </div>

      {/* Incident date */}
      <div>
        <Label htmlFor="incident-date" className="text-sm">Date of incident</Label>
        <Input
          id="incident-date"
          type="date"
          value={incidentDate}
          onChange={(e) => setIncidentDate(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full font-display tracking-wider">
        <Send className="w-4 h-4 mr-2" />
        {submitting ? "Submitting..." : "Submit Report"}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center">
        If you believe a child is in immediate danger, please call 999 immediately.
      </p>
    </form>
  );
}
