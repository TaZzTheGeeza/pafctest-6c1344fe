import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedSections } from "@/components/FeaturedSections";
import { AboutSection } from "@/components/AboutSection";
import { SponsorsSection } from "@/components/SponsorsSection";

import { FAAccreditedSection } from "@/components/FAAccreditedSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Peterborough Athletic FC | Junior & Youth Football in Peterborough"
        description="PAFC — The Lions. Grassroots junior and youth football club in Peterborough. Boys' and girls' teams U6–U16, FA accredited coaches, training, fixtures and how to join."
        keywords="Peterborough Athletic FC, PAFC, Peterborough football, Peterborough kids football, Peterborough junior football, Peterborough youth football, junior football club Peterborough, kids football Peterborough, grassroots football Peterborough, girls football Peterborough, football clubs near me Peterborough, The Lions Peterborough, Cambridgeshire junior football"
        path="/"
      />
      <Navbar />

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
