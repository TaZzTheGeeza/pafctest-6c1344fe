import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Starting background removal, image data length:", imageBase64.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Remove the background from this photo completely. Keep only the person/player and make the background fully transparent. Output just the person cutout with a transparent background as a PNG.",
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    console.log("AI gateway response status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Background removal failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("Response structure keys:", JSON.stringify(Object.keys(data)));
    
    // Try multiple possible response structures
    const choice = data.choices?.[0]?.message;
    let resultImage: string | null = null;
    
    if (choice?.images?.[0]?.image_url?.url) {
      resultImage = choice.images[0].image_url.url;
      console.log("Found image in images[0].image_url.url");
    } else if (choice?.content && typeof choice.content === "string" && choice.content.startsWith("data:image")) {
      resultImage = choice.content;
      console.log("Found image in content string");
    } else {
      console.error("Unexpected response structure:", JSON.stringify(data).substring(0, 500));
    }

    if (!resultImage) {
      return new Response(JSON.stringify({ error: "No image returned from AI", debug: JSON.stringify(data).substring(0, 300) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Background removal successful, result length:", resultImage.length);

    return new Response(JSON.stringify({ imageBase64: resultImage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
