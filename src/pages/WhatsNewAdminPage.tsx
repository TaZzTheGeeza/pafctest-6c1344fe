import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Save, Trash2, Eye, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Bullet {
  title: string;
  desc: string;
}

interface Campaign {
  id?: string;
  title: string;
  bullets: Bullet[];
  is_active: boolean;
}

const EMPTY: Campaign = {
  title: "What's New",
  bullets: [{ title: "", desc: "" }],
  is_active: false,
};

const WhatsNewAdminPage = () => {
  const [campaign, setCampaign] = useState<Campaign>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Load the most recently updated active campaign, or fall back to the latest one.
    const { data: active } = await supabase
      .from("whats_new_campaigns")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (active) {
      setCampaign({
        id: active.id as string,
        title: (active.title as string) || "What's New",
        bullets: Array.isArray(active.bullets) ? (active.bullets as unknown as Bullet[]) : [],
        is_active: true,
      });
    } else {
      const { data: latest } = await supabase
        .from("whats_new_campaigns")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest) {
        setCampaign({
          id: latest.id as string,
          title: (latest.title as string) || "What's New",
          bullets: Array.isArray(latest.bullets) ? (latest.bullets as unknown as Bullet[]) : [],
          is_active: false,
        });
      } else {
        setCampaign(EMPTY);
      }
    }
    setLoading(false);
  };

  const updateBullet = (idx: number, patch: Partial<Bullet>) => {
    setCampaign((c) => ({
      ...c,
      bullets: c.bullets.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }));
  };

  const addBullet = () => {
    setCampaign((c) => ({ ...c, bullets: [...c.bullets, { title: "", desc: "" }] }));
  };

  const removeBullet = (idx: number) => {
    setCampaign((c) => ({ ...c, bullets: c.bullets.filter((_, i) => i !== idx) }));
  };

  const startNewCampaign = () => {
    setCampaign({ ...EMPTY });
    toast.info("Started a new campaign — saving will create a fresh entry that re-shows for everyone");
  };

  const save = async () => {
    const cleanBullets = campaign.bullets
      .map((b) => ({ title: b.title.trim(), desc: b.desc.trim() }))
      .filter((b) => b.title || b.desc);

    if (cleanBullets.length === 0) {
      toast.error("Add at least one bullet");
      return;
    }

    setSaving(true);

    // If activating this campaign, deactivate any other active one first
    // (the partial unique index would otherwise block the insert/update).
    if (campaign.is_active) {
      const q = supabase.from("whats_new_campaigns").update({ is_active: false }).eq("is_active", true);
      const { error: deactErr } = campaign.id ? await q.neq("id", campaign.id) : await q;
      if (deactErr) {
        setSaving(false);
        toast.error(deactErr.message);
        return;
      }
    }

    if (campaign.id) {
      const { error } = await supabase
        .from("whats_new_campaigns")
        .update({
          title: campaign.title.trim() || "What's New",
          bullets: cleanBullets as unknown as never,
          is_active: campaign.is_active,
        })
        .eq("id", campaign.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Campaign saved");
    } else {
      const { data, error } = await supabase
        .from("whats_new_campaigns")
        .insert({
          title: campaign.title.trim() || "What's New",
          bullets: cleanBullets as unknown as never,
          is_active: campaign.is_active,
        })
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Campaign created");
      if (data) setCampaign((c) => ({ ...c, id: data.id as string }));
    }
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-3xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-display tracking-widest uppercase">What's New</span>
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight">Update Announcements</h1>
            <p className="text-sm text-muted-foreground mt-2">
              When active, a one-time popup is shown to every user with these highlights. They each see it once,
              then it's marked as seen on their device.
            </p>
          </div>
          <Link to="/?whatsnew=preview" target="_blank">
            <Button variant="outline" size="sm" className="shrink-0">
              <Eye className="h-4 w-4 mr-2" /> Preview
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div>
                <div className="font-display font-bold">Active</div>
                <div className="text-xs text-muted-foreground">
                  When on, this campaign shows to everyone who hasn't seen it yet.
                </div>
              </div>
              <Switch
                checked={campaign.is_active}
                onCheckedChange={(v) => setCampaign((c) => ({ ...c, is_active: v }))}
              />
            </div>

            <div>
              <Label>Headline</Label>
              <Input
                value={campaign.title}
                onChange={(e) => setCampaign((c) => ({ ...c, title: e.target.value }))}
                placeholder="What's New"
              />
              <p className="text-xs text-muted-foreground mt-1">Last word is highlighted in gold.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Highlights</Label>
                <Button variant="outline" size="sm" onClick={addBullet}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {campaign.bullets.map((b, i) => (
                <div key={i} className="rounded-lg border bg-card/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-display tracking-widest text-muted-foreground">
                      HIGHLIGHT #{i + 1}
                    </div>
                    {campaign.bullets.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeBullet(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={b.title}
                    onChange={(e) => updateBullet(i, { title: e.target.value })}
                    placeholder="Short title (e.g. World Cup 2026 Sweepstake)"
                  />
                  <Textarea
                    value={b.desc}
                    onChange={(e) => updateBullet(i, { desc: e.target.value })}
                    placeholder="One-line description"
                    rows={2}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={startNewCampaign}>
                Start New Campaign
              </Button>
              <Button onClick={save} disabled={saving} className="bg-gold-gradient text-primary-foreground font-display">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: editing an existing campaign won't re-show it to people who've already dismissed it.
              Click <strong>Start New Campaign</strong> to make a fresh one that everyone sees again.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default WhatsNewAdminPage;
