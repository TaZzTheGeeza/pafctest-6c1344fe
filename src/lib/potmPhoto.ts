import { supabase } from "@/integrations/supabase/client";

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "player";
}

export function resizeImageToBase64(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to process image"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for processing"));
    };

    img.src = url;
  });
}

export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(",");
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/png";
  const raw = atob(parts[1]);
  const arr = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    arr[i] = raw.charCodeAt(i);
  }

  return new Blob([arr], { type: mime });
}

export async function uploadPotmPhoto(
  file: File,
  options: {
    playerName: string;
    awardDate?: string;
    teamSlug?: string;
    onStatus?: (status: "processing" | "processed" | "fallback") => void;
  },
) {
  const base64 = await resizeImageToBase64(file, 1024);
  let finalBase64 = base64;

  options.onStatus?.("processing");

  try {
    const { data, error } = await supabase.functions.invoke("remove-background", {
      body: { imageBase64: base64 },
    });

    if (error) {
      console.error("[POTM] Background removal error:", error);
      options.onStatus?.("fallback");
    } else if (data?.imageBase64) {
      finalBase64 = data.imageBase64.startsWith("data:")
        ? data.imageBase64
        : `data:image/png;base64,${data.imageBase64}`;
      options.onStatus?.("processed");
    } else {
      console.warn("[POTM] No image returned from background removal", data);
      options.onStatus?.("fallback");
    }
  } catch (error) {
    console.error("[POTM] Background removal exception:", error);
    options.onStatus?.("fallback");
  }

  const datePrefix = options.awardDate || new Date().toISOString().split("T")[0];
  const teamPrefix = options.teamSlug ? `${sanitizePathSegment(options.teamSlug)}/` : "";
  const playerSegment = sanitizePathSegment(options.playerName);
  const path = `potm/${teamPrefix}${datePrefix}-${playerSegment}.png`;
  const blob = base64ToBlob(finalBase64);

  const { error: uploadError } = await supabase.storage
    .from("club-photos")
    .upload(path, blob, { upsert: true, contentType: "image/png" });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("club-photos").getPublicUrl(path);
  return urlData.publicUrl;
}