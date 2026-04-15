import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Send, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export default function ContactPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("handle-contact-form", {
        body: { name, email, message },
      });
      if (error) throw error;
      toast.success("Message sent!", { description: "We'll get back to you as soon as possible. Check your Dashboard → Messages for replies." });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message", { description: "Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              <span className="text-gold-gradient">Contact</span> Us
            </h1>
            <p className="text-muted-foreground text-center mb-12">Get in touch with Peterborough Athletic FC</p>
          </motion.div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="font-display text-xl font-bold mb-6">Send a Message</h2>

              {!user ? (
                <div className="text-center py-8">
                  <LogIn className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Please sign in to send us a message. This lets us reply to you directly through your dashboard.
                  </p>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-2.5 font-display text-sm tracking-wider hover:bg-primary/90 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In / Create Account
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Message</label>
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Your message..." rows={5} />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-gold-gradient text-primary-foreground font-display tracking-wider">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {submitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
