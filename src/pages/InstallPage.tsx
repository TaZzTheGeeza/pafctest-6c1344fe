import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Check, AlertTriangle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
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
      <main className="container mx-auto px-4 pt-32 pb-16 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-6">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-oswald uppercase mb-3">
            Get the PAFC App
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Install Peterborough Athletic FC directly to your phone's home screen — no app store needed.
          </p>
        </div>

        {/* Auto-install prompt (Chrome/Edge on Android or desktop) */}
        {isInstalled ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center mb-10">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold font-oswald mb-2">Already Installed!</h2>
            <p className="text-muted-foreground">You've got the PAFC app on your device. Open it from your home screen.</p>
          </div>
        ) : deferredPrompt ? (
          <div className="bg-card border border-primary/30 rounded-xl p-8 text-center mb-10">
            <Button onClick={handleInstall} size="lg" className="gap-2 text-lg px-8">
              <Download className="w-5 h-5" />
              Install PAFC App Now
            </Button>
            <p className="text-muted-foreground text-sm mt-4">Free • No app store needed • Works offline</p>
          </div>
        ) : null}

        {/* Guides — always show both */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* iPhone / iPad Guide */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-secondary/50 px-5 py-3 border-b border-border">
              <h2 className="font-oswald text-lg font-bold flex items-center gap-2">
                🍎 iPhone / iPad
              </h2>
            </div>
            <div className="p-5 space-y-5">
              {/* Important note */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">
                  <strong>You must use Safari</strong> — this won't work in Chrome, Instagram, or Facebook browsers. Open this page in Safari first.
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="font-semibold text-foreground">Open this website in Safari</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    If you're reading this in another app, copy the URL and paste it into Safari's address bar.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="font-semibold text-foreground">Tap the Share button</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    It's the square icon with an arrow pointing upward — found at the <strong>bottom centre</strong> of Safari (or top-right on iPad).
                  </p>
                  <div className="mt-2 bg-secondary rounded-lg px-3 py-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3v11.25" /></svg>
                    Looks like this
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="font-semibold text-foreground">Scroll down and tap "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    You may need to scroll down in the share menu to find it. It has a <strong>+</strong> icon next to it.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <p className="font-semibold text-foreground">Tap "Add" in the top-right corner</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    You'll see a preview — just tap <strong>Add</strong> and the PAFC app icon will appear on your home screen.
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
                ✅ Done! You can now open PAFC from your home screen like any other app.
              </div>
            </div>
          </div>

          {/* Android Guide */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-secondary/50 px-5 py-3 border-b border-border">
              <h2 className="font-oswald text-lg font-bold flex items-center gap-2">
                🤖 Android
              </h2>
            </div>
            <div className="p-5 space-y-5">
              {/* Important note */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">
                  <strong>Use Chrome or Samsung Internet</strong> — this won't work from links opened inside Facebook, Instagram, or other apps. Open the website in your normal browser.
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="font-semibold text-foreground">Open this website in Chrome</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    If you see a banner at the bottom saying <strong>"Install app"</strong> or <strong>"Add PAFC to Home Screen"</strong> — just tap it and skip to step 4!
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="font-semibold text-foreground">Tap the three dots menu ⋮</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    The <strong>⋮</strong> menu is in the <strong>top-right corner</strong> of Chrome. Tap it to open the dropdown.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="font-semibold text-foreground">Tap "Install app" or "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    The wording depends on your phone. Look for either option in the menu — it may also say <strong>"Install Peterborough Athletic FC"</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <p className="font-semibold text-foreground">Tap "Install" to confirm</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    A popup will appear asking you to confirm — tap <strong>Install</strong> and the app will be added to your home screen and app drawer.
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
                ✅ Done! You can now open PAFC from your home screen or app drawer.
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-card border border-border rounded-xl p-6 mb-10">
          <h3 className="font-oswald text-lg font-bold mb-4">Having trouble?</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-primary font-bold shrink-0">Q:</span>
              <div>
                <p className="font-semibold text-foreground">I don't see "Add to Home Screen"</p>
                <p className="text-muted-foreground">Make sure you're using <strong>Safari on iPhone</strong> or <strong>Chrome on Android</strong>. This option doesn't appear in other browsers or in-app browsers (like opening links from Facebook or Instagram).</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-primary font-bold shrink-0">Q:</span>
              <div>
                <p className="font-semibold text-foreground">The install option is greyed out or missing</p>
                <p className="text-muted-foreground">Try refreshing the page, or close and re-open your browser. On some Android phones, you may need to wait a few seconds for the option to appear.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-primary font-bold shrink-0">Q:</span>
              <div>
                <p className="font-semibold text-foreground">I accidentally dismissed the install popup</p>
                <p className="text-muted-foreground">No worries — on Android, go to the ⋮ menu and look for "Install app" again. On iPhone, tap the Share button again and find "Add to Home Screen".</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
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
