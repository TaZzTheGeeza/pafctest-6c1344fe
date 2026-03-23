import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ResultsSection } from "@/components/ResultsSection";
import { AboutSection } from "@/components/AboutSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      <ResultsSection />
      <AboutSection />
      <Footer />
    </div>
  );
};

export default Index;
