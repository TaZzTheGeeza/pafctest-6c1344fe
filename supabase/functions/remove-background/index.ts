import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Ensure imageBase64 is a proper data URI
    let dataUri = imageBase64;
    if (!dataUri.startsWith("data:")) {
      dataUri = `data:image/png;base64,${dataUri}`;
    }

    console.log("Starting background removal, data URI length:", dataUri.length);
    console.log("Data URI prefix:", dataUri.substring(0, 50));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Remove the background from this image completely. Keep only the main person/subject and make everything else fully transparent. Output the result as a PNG image with transparent background.",
              },
              {
                type: "image_url",
                image_url: { url: dataUri },
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
    const message = data.choices?.[0]?.message;
    console.log("Response message keys:", JSON.stringify(message ? Object.keys(message) : null));

    let resultImage: string | null = null;

    // Check for image in the images array (standard format)
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      const imgUrl = message.images[0]?.image_url?.url;
      if (imgUrl) {
        resultImage = imgUrl;
        console.log("Found image in message.images[0].image_url.url, length:", resultImage.length);
      }
    }

    // Fallback: check if content is a data URI
    if (!resultImage && message?.content && typeof message.content === "string" && message.content.startsWith("data:image")) {
      resultImage = message.content;
      console.log("Found image in content string, length:", resultImage.length);
    }

    // Fallback: check content array format
    if (!resultImage && message?.content && Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          resultImage = part.image_url.url;
          console.log("Found image in content array, length:", resultImage.length);
          break;
        }
      }
    }

    if (!resultImage) {
      const debugInfo = JSON.stringify(data).substring(0, 500);
      console.error("No image in response. Debug:", debugInfo);
      return new Response(JSON.stringify({
        error: "No image returned from AI",
        textResponse: message?.content || null,
        debug: debugInfo,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure the result is a proper data URI
    if (!resultImage.startsWith("data:")) {
      resultImage = `data:image/png;base64,${resultImage}`;
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
