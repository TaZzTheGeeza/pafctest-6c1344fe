import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Share, MoreVertical, Plus, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-6">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-oswald uppercase mb-4">
            Get the PAFC App
          </h1>
          <p className="text-muted-foreground text-lg">
            Install Peterborough Athletic FC on your phone for quick access to fixtures, results, the team hub and more.
          </p>
        </div>

        {isInstalled ? (
          <div className="bg-card border border-border rounded-xl p-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold font-oswald mb-2">Already Installed!</h2>
            <p className="text-muted-foreground">You've got the PAFC app on your device. Open it from your home screen.</p>
          </div>
        ) : deferredPrompt ? (
          <div className="bg-card border border-border rounded-xl p-8">
            <Button onClick={handleInstall} size="lg" className="gap-2 text-lg px-8">
              <Download className="w-5 h-5" />
              Install PAFC App
            </Button>
            <p className="text-muted-foreground text-sm mt-4">Free • No app store needed • Works offline</p>
          </div>
        ) : (
          <div className="space-y-6">
            {isIOS ? (
              <div className="bg-card border border-border rounded-xl p-8 text-left space-y-4">
                <h2 className="text-xl font-bold font-oswald text-center">Install on iPhone / iPad</h2>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                  <div>
                    <p className="font-semibold">Tap the Share button</p>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">Look for the <Share className="w-4 h-4 inline" /> icon at the bottom of Safari</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                  <div>
                    <p className="font-semibold">Tap "Add to Home Screen"</p>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">Scroll down and tap <Plus className="w-4 h-4 inline" /> Add to Home Screen</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                  <div>
                    <p className="font-semibold">Tap "Add"</p>
                    <p className="text-muted-foreground text-sm">The PAFC app will appear on your home screen</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-8 text-left space-y-4">
                <h2 className="text-xl font-bold font-oswald text-center">Install on Android</h2>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                  <div>
                    <p className="font-semibold">Tap the menu button</p>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">Look for <MoreVertical className="w-4 h-4 inline" /> in the top-right of Chrome</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                  <div>
                    <p className="font-semibold">Tap "Install app" or "Add to Home Screen"</p>
                    <p className="text-muted-foreground text-sm">You'll see it in the menu options</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                  <div>
                    <p className="font-semibold">Tap "Install"</p>
                    <p className="text-muted-foreground text-sm">The PAFC app will appear on your home screen</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-primary">⚡</p>
            <p className="font-semibold mt-1">Lightning Fast</p>
            <p className="text-sm text-muted-foreground">Loads instantly, even offline</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-primary">📱</p>
            <p className="font-semibold mt-1">Home Screen</p>
            <p className="text-sm text-muted-foreground">Launch like a real app</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-primary">🔔</p>
            <p className="font-semibold mt-1">Stay Updated</p>
            <p className="text-sm text-muted-foreground">Never miss a fixture</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InstallPage;
