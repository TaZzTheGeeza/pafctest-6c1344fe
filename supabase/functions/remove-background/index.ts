import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let originalImageBase64: string | null = null;

  try {
    const { imageBase64 } = await req.json();
    originalImageBase64 = imageBase64 ?? null;

    if (!originalImageBase64) {
      return jsonResponse({ error: "imageBase64 required" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return jsonResponse({ error: "API key not configured" }, 500);
    }

    let dataUri = originalImageBase64;
    if (!dataUri.startsWith("data:")) {
      dataUri = `data:image/png;base64,${dataUri}`;
    }

    console.log("Starting background removal, data URI length:", dataUri.length);
    console.log("Data URI prefix:", dataUri.substring(0, 50));

    let response: Response | null = null;
    let errText = "";

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            {
58:               role: "user",
59:               content: [
60:                 {
61:                   type: "text",
62:                   text: "Remove the background from this photo completely, making it fully transparent. Output the result as a PNG image with an alpha-transparent background. Keep the person fully intact — do not crop or clip any part of their head, hair, body, arms, hands, clothing, or accessories. Return only the image, no text.",
63:                 },
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

      console.log(`AI gateway response status (attempt ${attempt}):`, response.status);

      if (response.ok) {
        break;
      }

      errText = await response.text();
      console.error(`AI gateway error (attempt ${attempt}):`, response.status, errText);

      if (response.status === 429) {
        return jsonResponse({ error: "Lovable AI rate limit reached. Please try again shortly." }, 429);
      }

      if (response.status === 402) {
        return jsonResponse({ error: "Lovable AI credits are unavailable right now." }, 402);
      }

      if (response.status < 500 || attempt === 2) {
        break;
      }
    }

    if (!response?.ok) {
      return jsonResponse({
        imageBase64: originalImageBase64,
        fallback: true,
        warning: errText || "AI gateway unavailable",
      });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    console.log("Response message keys:", JSON.stringify(message ? Object.keys(message) : null));

    let resultImage: string | null = null;

    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      const imgUrl = message.images[0]?.image_url?.url;
      if (imgUrl) {
        resultImage = imgUrl;
        console.log("Found image in message.images[0].image_url.url, length:", resultImage.length);
      }
    }

    if (!resultImage && message?.content && typeof message.content === "string" && message.content.startsWith("data:image")) {
      resultImage = message.content;
      console.log("Found image in content string, length:", resultImage.length);
    }

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
      return jsonResponse({
        imageBase64: originalImageBase64,
        fallback: true,
        warning: "No image returned from AI",
        debug: debugInfo,
      });
    }

    if (!resultImage.startsWith("data:")) {
      resultImage = `data:image/png;base64,${resultImage}`;
    }

    console.log("Background removal successful, result length:", resultImage.length);
    return jsonResponse({ imageBase64: resultImage });
  } catch (err) {
    console.error("Error:", err);

    if (originalImageBase64) {
      return jsonResponse({
        imageBase64: originalImageBase64,
        fallback: true,
        warning: err instanceof Error ? err.message : "Unknown processing error",
      });
    }

    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
