import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHANNEL_ID = "UCn3DodNxJDTQeV_nbl1Ljjw";
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response = await fetch(RSS_URL);
    if (!response.ok) {
      throw new Error(`YouTube RSS fetch failed: ${response.status}`);
    }

    const xml = await response.text();

    // Parse entries from XML
    const entries: Array<{
      id: string;
      title: string;
      published: string;
      thumbnail: string;
      views: number;
    }> = [];

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || "";
      const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || "";
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] || "";
      const thumbnail = entry.match(/<media:thumbnail url="([^"]+)"/)?.[1] || "";
      const views = parseInt(entry.match(/<media:statistics views="(\d+)"/)?.[1] || "0", 10);

      if (videoId) {
        entries.push({ id: videoId, title, published, thumbnail, views });
      }
    }

    return new Response(JSON.stringify({ videos: entries }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("YouTube feed error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch YouTube feed" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
