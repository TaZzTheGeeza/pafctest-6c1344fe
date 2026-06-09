import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LionsDenGate } from "./LionsDenGate";

/**
 * WhatsNewLoader
 * ---------------
 * Fetches the active "What's New" campaign from the database and shows the
 * gate exactly once per campaign (tracked in localStorage by campaign id).
 *
 * Admins can author campaigns at /whats-new-admin. Only one campaign is
 * active at a time (enforced by a unique partial index).
 *
 * Also supports `?whatsnew=preview` to force-show the latest active campaign
 * without consuming the seen flag.
 */

const STORAGE_KEY = "pafc:whatsnew:seen";

interface Bullet {
  title: string;
  desc: string;
}

interface Campaign {
  id: string;
  title: string;
  bullets: Bullet[];
}

export function WhatsNewLoader() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [show, setShow] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const previewMode =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("whatsnew") === "preview";
    setPreview(previewMode);

    (async () => {
      const { data, error } = await supabase
        .from("whats_new_campaigns")
        .select("id, title, bullets")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return;

      const bullets = Array.isArray(data.bullets) ? (data.bullets as unknown as Bullet[]) : [];
      const c: Campaign = { id: data.id as string, title: (data.title as string) || "What's New", bullets };
      setCampaign(c);

      if (previewMode) {
        setShow(true);
        return;
      }

      try {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (seen !== c.id) setShow(true);
      } catch {
        setShow(true);
      }
    })();
  }, []);

  if (!show || !campaign) return null;

  return (
    <WhatsNewGate
      title={campaign.title}
      bullets={campaign.bullets}
      onEnter={() => {
        if (preview) {
          const u = new URL(window.location.href);
          u.searchParams.delete("whatsnew");
          window.location.replace(u.toString());
          return;
        }
        try {
          localStorage.setItem(STORAGE_KEY, campaign.id);
        } catch {
          // ignore — user will just see it again next time
        }
        setShow(false);
      }}
    />
  );
}
