import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { YouTubeSection } from "@/components/YouTubeSection";

const PafcTvPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24">
        <YouTubeSection />
      </main>
      <Footer />
    </div>
  );
};

export default PafcTvPage;
