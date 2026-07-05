import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RoleGate } from "@/components/RoleGate";
import PitchBookingsPanel from "@/components/hub/PitchBookingsPanel";

export default function PitchBookingsPage() {
  return (
    <RoleGate requiredRole="authenticated">
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <PitchBookingsPanel />
          </div>
        </main>
        <Footer />
      </div>
    </RoleGate>
  );
}
