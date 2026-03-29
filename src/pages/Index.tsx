import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedSections } from "@/components/FeaturedSections";
import { AboutSection } from "@/components/AboutSection";
import { SponsorsSection } from "@/components/SponsorsSection";

import { FAAccreditedSection } from "@/components/FAAccreditedSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      <FeaturedSections />
      
      <AboutSection />
      <FAAccreditedSection />
      <SponsorsSection />
      <Footer />
    </div>
  );
};

export default Index;
