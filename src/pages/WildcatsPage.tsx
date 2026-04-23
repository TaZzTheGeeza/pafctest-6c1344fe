import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Sparkles, ExternalLink, Heart, Trophy } from "lucide-react";
import wildcatsLogo from "@/assets/wildcats-logo.png";

const FA_BOOKING_URL = "https://www.englandfootball.com/play/youth-football/wildcats";

export default function WildcatsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-purple-900/20 via-pink-900/10 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.15),_transparent_60%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <img
              src={wildcatsLogo}
              alt="FA Wildcats Girls' Football"
              className="mx-auto h-32 md:h-44 w-auto mb-6 drop-shadow-[0_8px_24px_rgba(168,85,247,0.4)]"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-display tracking-[0.2em] uppercase mb-4">
              <Sparkles className="h-3 w-3" /> Now at PAFC
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
              Wildcats Girls' Football
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              An FA initiative giving girls aged <strong className="text-foreground">5–11</strong> the chance to play, learn and have fun in a safe, friendly environment.
            </p>
            <a href={FA_BOOKING_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-base font-display tracking-wider gap-2">
                Book via The FA <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-3">All bookings are managed through the official FA Wildcats portal.</p>
          </div>
        </div>
      </section>

      {/* Session details */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">Session Details</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">When</p>
                <p className="font-display text-lg font-bold">Every Thursday</p>
              </Card>
              <Card className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Time</p>
                <p className="font-display text-lg font-bold">6:30pm – 7:30pm</p>
              </Card>
              <Card className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Ages</p>
                <p className="font-display text-lg font-bold">Girls 5 – 11</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">What To Expect</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Heart, title: "Fun First", desc: "A welcoming, pressure-free environment focused on enjoyment and friendships." },
                { icon: Trophy, title: "Learn To Play", desc: "Develop football skills through age-appropriate games and activities." },
                { icon: Users, title: "Make Friends", desc: "Meet other girls who love football and build lasting connections." },
                { icon: Sparkles, title: "FA Approved", desc: "Delivered by FA-qualified coaches following the official Wildcats programme." },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="p-6 flex gap-4 items-start">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/15 shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Bookings for our Wildcats sessions are handled directly by The FA. Click below to find PAFC on the official Wildcats finder and reserve your child's place.
          </p>
          <a href={FA_BOOKING_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="text-base font-display tracking-wider gap-2">
              Book on The FA Wildcats Site <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" /> Search for "Peterborough Athletic FC" on the FA portal
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
