import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import clubLogo from "@/assets/club-logo.jpg";

const ageGroups = [
  "U7", "U8 Black", "U8 Gold", "U9", "U10",
  "U11 Black", "U11 Gold", "U13 Black", "U13 Gold", "U14",
];

export default function PlayerRegistrationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    childName: "",
    childDob: "",
    address: "",
    preferredAgeGroup: "",
    faFanNumber: "",
    parentName: "",
    relationshipToChild: "",
    email: "",
    phone: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
    medicalConditions: "",
    knownToSocialServices: "no",
    socialServicesDetails: "",
    fosterCareDetails: "",
    previousClub: "",
    additionalInfo: "",
    consentMedical: false,
    consentPhotography: false,
    declarationConfirmed: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.declarationConfirmed) {
      toast.error("Please confirm the declaration before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const insertData: Record<string, unknown> = {
        child_name: form.childName,
        child_dob: form.childDob,
        address: form.address || null,
        preferred_age_group: form.preferredAgeGroup,
        fa_fan_number: form.faFanNumber || null,
        parent_name: form.parentName,
        relationship_to_child: form.relationshipToChild || null,
        email: form.email,
        phone: form.phone,
        emergency_contact_name: form.emergencyName || null,
        emergency_contact_relationship: form.emergencyRelationship || null,
        emergency_contact_phone: form.emergencyPhone || null,
        medical_conditions: form.medicalConditions || null,
        known_to_social_services: form.knownToSocialServices === "yes",
        social_services_details: form.socialServicesDetails || null,
        foster_care_details: form.fosterCareDetails || null,
        previous_club: form.previousClub || null,
        additional_info: form.additionalInfo || null,
        consent_medical: form.consentMedical,
        consent_photography: form.consentPhotography,
        declaration_confirmed: form.declarationConfirmed,
      };

      const { error } = await supabase
        .from("player_registrations" as any)
        .insert(insertData);

      if (error) throw error;

      toast.success("Registration submitted!", {
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

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-16">
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
                  Your registration has been submitted successfully.
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
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <UserPlus className="h-6 w-6 text-primary" />
                    <h2 className="font-display text-xl font-bold">Player Registration Form</h2>
                  </div>

                  {/* Child's Details */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Child's Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
                          <Input name="childName" value={form.childName} onChange={handleChange} required placeholder="Child's full name" maxLength={100} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Date of Birth *</label>
                          <Input name="childDob" type="date" value={form.childDob} onChange={handleChange} required />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Address *</label>
                        <Textarea name="address" value={form.address} onChange={handleChange} required placeholder="Full address" rows={2} maxLength={500} />
                      </div>
                    </div>
                  </div>

                  {/* Preferred Age Group */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Preferred Age Group *</label>
                    <select name="preferredAgeGroup" value={form.preferredAgeGroup} onChange={handleChange} required className={selectClass}>
                      <option value="">Select age group...</option>
                      {ageGroups.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* FA FAN Number */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">FA FAN Number</label>
                    <Input name="faFanNumber" value={form.faFanNumber} onChange={handleChange} placeholder="If you don't have one, leave blank" maxLength={50} />
                    <p className="text-[10px] text-muted-foreground mt-1">If you don't have one, the club will help arrange this.</p>
                  </div>

                  {/* Parent / Carer Details */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Parent / Carer Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
                          <Input name="parentName" value={form.parentName} onChange={handleChange} required placeholder="Parent/carer name" maxLength={100} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Relationship to Child *</label>
                          <Input name="relationshipToChild" value={form.relationshipToChild} onChange={handleChange} required placeholder="e.g. Mother, Father, Guardian" maxLength={50} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Contact Number *</label>
                          <Input name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="07xxx xxxxxx" maxLength={20} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Email Address *</label>
                          <Input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" maxLength={255} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                        <Input name="emergencyName" value={form.emergencyName} onChange={handleChange} required placeholder="Emergency contact name" maxLength={100} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Relationship *</label>
                        <Input name="emergencyRelationship" value={form.emergencyRelationship} onChange={handleChange} required placeholder="e.g. Grandparent" maxLength={50} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Contact Number *</label>
                        <Input name="emergencyPhone" type="tel" value={form.emergencyPhone} onChange={handleChange} required placeholder="07xxx xxxxxx" maxLength={20} />
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Medical Information</h3>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Please provide details of any medical conditions, allergies, or additional needs we should be aware of.
                    </label>
                    <Textarea name="medicalConditions" value={form.medicalConditions} onChange={handleChange} placeholder="Medical conditions, allergies, dietary requirements..." rows={3} maxLength={2000} />
                  </div>

                  {/* Safeguarding Information */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Safeguarding Information</h3>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                      We strongly welcome children from all backgrounds and circumstances. To support our safeguarding responsibilities, we kindly ask parents and carers to complete the following information.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Is the child currently known to any Social Services? *</label>
                        <select name="knownToSocialServices" value={form.knownToSocialServices} onChange={handleChange} required className={selectClass}>
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>

                      {form.knownToSocialServices === "yes" && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            If yes, please provide any relevant details that will help us support the child's safety and wellbeing.
                          </label>
                          <Textarea name="socialServicesDetails" value={form.socialServicesDetails} onChange={handleChange} placeholder="Relevant details..." rows={3} maxLength={2000} />
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          If you are a foster parent or carer, please advise any specific arrangements or key contacts we need to be aware of (e.g. social worker details, permissions, or restrictions).
                        </label>
                        <Textarea name="fosterCareDetails" value={form.fosterCareDetails} onChange={handleChange} placeholder="Leave blank if not applicable" rows={3} maxLength={2000} />
                      </div>
                    </div>
                  </div>

                  {/* Previous Club */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Previous Club</h3>
                    <Input name="previousClub" value={form.previousClub} onChange={handleChange} placeholder="Previous club name (if any)" maxLength={100} />
                  </div>

                  {/* Additional Info */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Anything else we should know?</label>
                    <Textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} placeholder="Any other information you'd like us to know" rows={3} maxLength={2000} />
                  </div>

                  {/* Privacy Statement */}
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All information provided will be treated with the utmost confidentiality and used only for safeguarding purposes. Your data will be handled in accordance with our privacy policy and UK GDPR regulations.
                    </p>
                  </div>

                  {/* Consent & Permissions */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Consent & Permissions</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="consentMedical"
                          checked={form.consentMedical}
                          onCheckedChange={(checked) => setForm({ ...form, consentMedical: checked === true })}
                        />
                        <label htmlFor="consentMedical" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                          <strong className="text-foreground">Emergency Medical Treatment:</strong> I give my consent for my child to receive emergency medical treatment if required.
                        </label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="consentPhotography"
                          checked={form.consentPhotography}
                          onCheckedChange={(checked) => setForm({ ...form, consentPhotography: checked === true })}
                        />
                        <label htmlFor="consentPhotography" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                          <strong className="text-foreground">Photography / Video Consent:</strong> I give my consent for my child's image to be used for club photos, newsletters, and social media.
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Declaration */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-primary mb-3">Declaration</h3>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="declaration"
                        checked={form.declarationConfirmed}
                        onCheckedChange={(checked) => setForm({ ...form, declarationConfirmed: checked === true })}
                        required
                      />
                      <label htmlFor="declaration" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                        I confirm that the information provided is accurate to the best of my knowledge. *
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.declarationConfirmed}
                    className="w-full bg-gold-gradient text-primary-foreground font-display tracking-wider"
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Registration
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
