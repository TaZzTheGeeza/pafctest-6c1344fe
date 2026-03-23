import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import clubLogo from "@/assets/club-logo.jpg";

const ageGroups = [
  "U7s", "U8s Black", "U8s Gold", "U9s", "U10s",
  "U11s Black", "U11s Gold", "U13s Black", "U13s Gold", "U14s",
];

export default function PlayerRegistrationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    childName: "",
    childDob: "",
    parentName: "",
    email: "",
    phone: "",
    preferredAgeGroup: "",
    previousClub: "",
    medicalConditions: "",
    additionalInfo: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('player_registrations').insert({
        child_name: form.childName,
        child_dob: form.childDob,
        parent_name: form.parentName,
        email: form.email,
        phone: form.phone,
        preferred_age_group: form.preferredAgeGroup,
        previous_club: form.previousClub || null,
        medical_conditions: form.medicalConditions || null,
        additional_info: form.additionalInfo || null,
      });

      if (error) throw error;

      toast.success("Registration of interest submitted!", {
        description: "We'll be in touch when registration opens for the 2026/27 season.",
      });
      setSubmitted(true);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex justify-center mb-6">
              <img src={clubLogo} alt="PAFC" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              Player <span className="text-gold-gradient">Registration</span>
            </h1>
            <p className="text-muted-foreground text-center mb-4">Register your interest for the 2026/27 season</p>
          </motion.div>

          {/* Season Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 flex items-start gap-4">
              <Clock className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-bold text-sm mb-1">Registration Currently Closed</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All team registrations are currently closed for the 2025/26 season. You can register your interest below and we will contact you when registration opens for the <strong className="text-foreground">2026/27 season</strong>.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-lg p-12 text-center"
              >
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-2">
                  Your registration of interest has been submitted successfully.
                </p>
                <p className="text-sm text-muted-foreground">
                  We'll be in touch when registration opens for the 2026/27 season.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <UserPlus className="h-6 w-6 text-primary" />
                    <h2 className="font-display text-xl font-bold">Register Your Interest</h2>
                  </div>

                  {/* Player Details */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Player Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Player Full Name *</label>
                        <Input name="childName" value={form.childName} onChange={handleChange} required placeholder="Child's full name" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Date of Birth *</label>
                        <Input name="childDob" type="date" value={form.childDob} onChange={handleChange} required />
                      </div>
                    </div>
                  </div>

                  {/* Preferred Age Group */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Preferred Age Group *</label>
                    <select
                      name="preferredAgeGroup"
                      value={form.preferredAgeGroup}
                      onChange={handleChange}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select age group...</option>
                      {ageGroups.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Parent/Guardian Details */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Parent / Guardian Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
                        <Input name="parentName" value={form.parentName} onChange={handleChange} required placeholder="Parent/guardian name" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Email Address *</label>
                        <Input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Phone Number *</label>
                        <Input name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="07xxx xxxxxx" />
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Additional Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Previous Club (if any)</label>
                        <Input name="previousClub" value={form.previousClub} onChange={handleChange} placeholder="Previous club name" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Medical Conditions / Allergies</label>
                        <Textarea name="medicalConditions" value={form.medicalConditions} onChange={handleChange} placeholder="Any medical conditions, allergies, or dietary requirements we should know about" rows={3} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Anything else?</label>
                        <Textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} placeholder="Any other information you'd like us to know" rows={3} />
                      </div>
                    </div>
                  </div>

                  {/* Consent */}
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        By submitting this form, you consent to Peterborough Athletic FC storing and processing the information provided for the purpose of player registration. Your data will be handled in accordance with our privacy policy and GDPR regulations. We may contact you regarding registration for the 2026/27 season.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gold-gradient text-primary-foreground font-display tracking-wider"
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Registration of Interest
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
