import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedSections } from "@/components/FeaturedSections";
import { FixturesSection } from "@/components/FixturesSection";
import { AboutSection } from "@/components/AboutSection";
import { SponsorsSection } from "@/components/SponsorsSection";
import { YouTubeSection } from "@/components/YouTubeSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      <FeaturedSections />
      <YouTubeSection />
      <FixturesSection />
      <AboutSection />
      <SponsorsSection />
      <Footer />
    </div>
  );
};

export default Index;
