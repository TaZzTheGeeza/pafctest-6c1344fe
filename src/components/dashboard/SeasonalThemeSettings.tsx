import { Ghost, TreePine, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSeasonalTheme, type SeasonalTheme } from "@/hooks/useSeasonalTheme";
import { toast } from "sonner";

export function SeasonalThemeSettings() {
  const { theme, loading, error, saving, setTheme, refetch } = useSeasonalTheme();
  async function toggle(next: SeasonalTheme, checked: boolean) {
    try {
      await setTheme(checked ? next : "off");
      toast.success(checked ? `${next === "halloween" ? "Halloween" : "Christmas"} theme enabled site-wide` : "Seasonal theme turned off");
    } catch {
      toast.error("Couldn't save the seasonal theme. Please try again.");
    }
  }
  return (
    <section className="bg-card border border-border rounded-lg p-5 space-y-4" aria-labelledby="seasonal-theme-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="seasonal-theme-heading" className="text-sm font-display font-semibold">Seasonal Themes</h2>
        {(loading || saving) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Saving theme" />}
      </div>
      {error ? <div className="text-sm text-muted-foreground">Couldn't load themes. <Button variant="ghost" size="sm" onClick={() => refetch()}>Retry</Button></div> : (
        [{ key: "halloween" as const, label: "Halloween", icon: Ghost },
          { key: "christmas" as const, label: "Christmas", icon: TreePine }].map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <label htmlFor={`theme-${key}`} className="flex items-center gap-3 cursor-pointer text-sm">
              <Icon className="h-5 w-5 text-primary" />{label}
            </label>
            <Switch id={`theme-${key}`} checked={theme === key} disabled={loading || saving}
              onCheckedChange={(checked) => toggle(key, checked)} />
          </div>
        ))
      )}
      <p className="text-xs text-muted-foreground">{theme === "off" ? "Standard club theme" : `${theme === "halloween" ? "Halloween" : "Christmas"} active`}</p>
    </section>
  );
}