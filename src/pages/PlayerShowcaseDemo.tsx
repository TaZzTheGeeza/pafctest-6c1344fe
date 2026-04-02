import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShowcaseTradingCards } from "@/components/showcase/ShowcaseTradingCards";
import { ShowcaseSquadList } from "@/components/showcase/ShowcaseSquadList";
import { ShowcaseCarousel } from "@/components/showcase/ShowcaseCarousel";
import { ShowcaseMeetTheTeam } from "@/components/showcase/ShowcaseMeetTheTeam";

const OPTIONS = [
  { id: "trading-cards", label: "Option 1: Trading Card Grid", Component: ShowcaseTradingCards },
  { id: "squad-list", label: "Option 2: Squad List", Component: ShowcaseSquadList },
  { id: "carousel", label: "Option 3: Profile Carousel", Component: ShowcaseCarousel },
  { id: "meet-the-team", label: "Option 4: Meet the Team", Component: ShowcaseMeetTheTeam },
];

const SAMPLE_PLAYERS = [
  { name: "Oliver", number: 1, role: "Goalkeeper", photo: "/sample-player-hero.jpg", appearances: 18, goals: 0, assists: 2, potm: 3 },
  { name: "Lily", number: 2, role: "Defender", photo: "/sample-player-2-hero.jpg", appearances: 16, goals: 1, assists: 4, potm: 1 },
  { name: "Jack", number: 7, role: "Midfielder", photo: "/sample-player-hero.jpg", appearances: 20, goals: 8, assists: 6, potm: 5 },
  { name: "Charlie", number: 9, role: "Forward", photo: "/sample-player-2-hero.jpg", appearances: 19, goals: 14, assists: 3, potm: 4 },
  { name: "George", number: 4, role: "Defender", photo: "/sample-player-hero.jpg", appearances: 17, goals: 2, assists: 1, potm: 0 },
  { name: "Freddie", number: 10, role: "Midfielder", photo: "/sample-player-2-hero.jpg", appearances: 15, goals: 5, assists: 7, potm: 2 },
];

const SAMPLE_COACHES = [
  { name: "Coach Williams", role: "Head Coach", photo: "/sample-player.jpg" },
  { name: "Coach Davies", role: "Assistant Coach", photo: "/sample-player.jpg" },
];

const PlayerShowcaseDemo = () => {
  const [currentOption, setCurrentOption] = useState(0);
  const { label, Component } = OPTIONS[currentOption];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              size="sm"
              disabled={currentOption === 0}
              onClick={() => setCurrentOption((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {currentOption + 1} of {OPTIONS.length}
              </p>
              <h1 className="font-display text-lg md:text-2xl font-bold text-gold-gradient">
                {label}
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentOption === OPTIONS.length - 1}
              onClick={() => setCurrentOption((p) => p + 1)}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Option dots */}
          <div className="flex justify-center gap-2 mb-8">
            {OPTIONS.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => setCurrentOption(i)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === currentOption ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Showcase */}
          <Component
            teamName="U13 Black"
            players={SAMPLE_PLAYERS}
            coaches={SAMPLE_COACHES}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlayerShowcaseDemo;
