import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Phone, Mail, AlertTriangle, CheckCircle, Users, FileText, ExternalLink } from "lucide-react";
import { SafeguardingReportForm } from "@/components/SafeguardingReportForm";
import { Button } from "@/components/ui/button";
import clubLogo from "@/assets/club-logo.jpg";

const policies = [
  {
    icon: Shield,
    title: "Our Commitment",
    text: "The welfare of every child and young person is our top priority. We are committed to creating a safe, positive, and enjoyable environment for all players, coaches, volunteers, and families.",
  },
  {
    icon: CheckCircle,
    title: "DBS Checked Staff",
    text: "All coaches, managers, and volunteers who work with children and young people hold an in-date, FA-enhanced DBS check. No individual is permitted to supervise young players without this clearance.",
  },
  {
    icon: Users,
    title: "FA Qualified Coaches",
    text: "Every coach at the club has completed the FA Safeguarding Children Course and holds relevant first aid qualifications. We ensure all certifications remain current and are renewed as required.",
  },
  {
    icon: FileText,
    title: "Codes of Conduct",
    text: "We operate clear Codes of Conduct for players, parents, coaches, and spectators. These are designed to promote respect, fair play, and positive behaviour at all times.",
  },
  {
    icon: AlertTriangle,
    title: "Reporting Concerns",
    text: "If you have any concerns about the welfare of a child or young person at the club, please contact our Club Welfare Officer immediately. All concerns are treated confidentially and with the utmost seriousness.",
  },
];

const faResources = [
  { label: "FA Safeguarding Children Policy", url: "https://www.thefa.com/football-rules-governance/safeguarding" },
  { label: "NSPCC Helpline", url: "https://www.nspcc.org.uk/" },
  { label: "FA Respect Programme", url: "https://www.englandfootball.com/participate/respect" },
  { label: "Childline", url: "https://www.childline.org.uk/" },
];

export default function SafeguardingPage() {
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
              <span className="text-gold-gradient">Safeguarding</span>
            </h1>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Peterborough Athletic FC is committed to safeguarding and promoting the welfare of all children and young people involved in football.
            </p>
          </motion.div>

          {/* Club Welfare Officer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-card border-2 border-primary rounded-lg p-8 text-center">
              <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-1">Club Welfare Officer</h2>
              <p className="text-2xl font-display text-gold-gradient mb-4">Jayne Garratt-Pearson</p>
              <div className="text-sm text-muted-foreground mb-6 text-left space-y-4">
                <p>
                  My name is Jayne, and I am pleased to introduce myself as the Club Welfare Officer. I wanted to take this opportunity to let you know that I am here as the first point of contact for any concerns you may have regarding the wellbeing and safety of your children within the club.
                </p>
                <p>
                  A Welfare Officer is responsible for helping to ensure that the club provides a safe, positive, and inclusive environment for all members. This includes promoting good practice, listening to any concerns, and supporting both children and adults where needed.
                </p>
                <p>In my role, I can offer support in several ways, including:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Being a confidential and approachable point of contact for any worries or concerns</li>
                  <li>Providing guidance on safeguarding and wellbeing matters</li>
                  <li>Supporting children who may be feeling anxious, upset, or unsure</li>
                  <li>Helping parents and carers navigate any issues within the club</li>
                  <li>Signposting to additional support services if needed</li>
                </ul>
                <p>
                  My aim is to make sure every child feels safe, valued, and able to enjoy their time at the club. Whether you have a concern, a question, or simply need someone to talk to, please don't hesitate to get in touch. I am always happy to help and to be a friendly, approachable face if you would like a chat.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="mailto:welfare@peterboroughathleticfc.co.uk">
                  <Button variant="outline" className="font-display tracking-wider">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Welfare Officer
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Policies */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="font-display text-2xl font-bold text-center mb-8">
              Our <span className="text-gold-gradient">Policies</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <item.icon className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-display text-sm font-bold mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Emergency Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="h-6 w-6 text-destructive" />
                <h2 className="font-display text-xl font-bold">Emergency Contacts</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">NSPCC Helpline</span>
                  <span className="font-display font-bold">0808 800 5000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Childline</span>
                  <span className="font-display font-bold">0800 1111</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">FA Safeguarding Team</span>
                  <span className="font-display font-bold">0800 169 1863</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Police (non-emergency)</span>
                  <span className="font-display font-bold">101</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Report a Concern */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <h2 className="font-display text-2xl font-bold text-center mb-8">
              Report a <span className="text-gold-gradient">Concern</span>
            </h2>
            <SafeguardingReportForm />
          </motion.div>

          {/* FA Resources */}
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-6">
              Useful <span className="text-gold-gradient">Resources</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {faResources.map((res) => (
                <a key={res.label} href={res.url} target="_blank" rel="noopener noreferrer" className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 hover:border-primary transition-colors group">
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  <span className="text-sm font-display tracking-wider text-muted-foreground group-hover:text-primary">{res.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
