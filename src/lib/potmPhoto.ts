import { supabase } from "@/integrations/supabase/client";

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "player";
}

export function resizeImageToBase64(
  file: File,
  maxDim = 1024,
  outputType: "image/png" | "image/jpeg" = "image/png",
  quality = 0.92,
): Promise<string> {
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
      resolve(canvas.toDataURL(outputType, quality));
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

function colorDistance(a: [number, number, number], b: [number, number, number]) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function isNearBackgroundColor(
  r: number,
  g: number,
  b: number,
  backgroundSamples: [number, number, number][],
) {
  return backgroundSamples.some((sample) => colorDistance([r, g, b], sample) <= 30);
}

function getPixelIndex(x: number, y: number, width: number) {
  return (y * width + x) * 4;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load processed image"));
    image.src = source;
  });
}

async function normalizePotmImage(base64: string, size = 1024) {
  const image = await loadImage(base64);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });

  if (!sourceContext) {
    throw new Error("Failed to normalize processed image");
  }

  sourceContext.drawImage(image, 0, 0);
  const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);

  const backgroundSampleMap = new Map<string, { color: [number, number, number]; count: number }>();
  const sampleBand = Math.max(12, Math.floor(Math.min(width, height) * 0.08));
  const sampleStep = Math.max(2, Math.floor(Math.min(width, height) / 96));

  const addBackgroundSample = (x: number, y: number) => {
    const index = getPixelIndex(x, y, width);
    const alpha = data[index + 3];
    if (alpha < 16) return;

    const color: [number, number, number] = [data[index], data[index + 1], data[index + 2]];
    const key = color.map((value) => Math.round(value / 24) * 24).join(",");
    const existing = backgroundSampleMap.get(key);

    if (existing) {
      existing.count += 1;
      return;
    }

    backgroundSampleMap.set(key, { color, count: 1 });
  };

  for (let x = 0; x < width; x += sampleStep) {
    for (let offset = 0; offset < sampleBand; offset += sampleStep) {
      addBackgroundSample(x, offset);
      addBackgroundSample(x, height - 1 - offset);
    }
  }

  for (let y = 0; y < height; y += sampleStep) {
    for (let offset = 0; offset < sampleBand; offset += sampleStep) {
      addBackgroundSample(offset, y);
      addBackgroundSample(width - 1 - offset, y);
    }
  }

  const backgroundSamples = [...backgroundSampleMap.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ color }) => color)
    .reduce<[number, number, number][]>((samples, color) => {
      if (!samples.some((existing) => colorDistance(existing, color) <= 18)) {
        samples.push(color);
      }
      return samples;
    }, [])
    .slice(0, 12);

  const queue: Array<[number, number]> = [];

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const key = y * width + x;
    if (visited[key]) return;
    visited[key] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const index = getPixelIndex(x, y, width);
    const alpha = data[index + 3];

    if (alpha === 0) continue;

    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];

    if (!isNearBackgroundColor(r, g, b, backgroundSamples)) continue;

    data[index + 3] = 0;

    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  // ── Remove green fringe from edges ──
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getPixelIndex(x, y, width);
      const a = data[idx + 3];
      if (a === 0) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Fully transparent bright-green leftovers
      if (g > 180 && g > r + 60 && g > b + 60) {
        data[idx + 3] = 0;
        continue;
      }

      // De-fringe: if pixel is semi-transparent and greenish, fade it out
      if (a < 220 && g > r && g > b) {
        data[idx + 3] = 0;
        continue;
      }

      // Check if this is an edge pixel (has a transparent neighbour)
      let isEdge = false;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
          if (data[getPixelIndex(nx, ny, width) + 3] === 0) { isEdge = true; break; }
        }
      }

      if (isEdge && g > Math.max(r, b) + 20) {
        // Desaturate green cast on edge pixels
        const avg = Math.round((r + g + b) / 3);
        data[idx] = Math.round(r * 0.4 + avg * 0.6);
        data[idx + 1] = Math.round(g * 0.3 + avg * 0.7);
        data[idx + 2] = Math.round(b * 0.4 + avg * 0.6);
        data[idx + 3] = Math.min(a, 180);
      }
    }
  }

  sourceContext.putImageData(imageData, 0, 0);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = getPixelIndex(x, y, width);
      if (data[index + 3] > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX === -1 || maxY === -1) {
    return base64;
  }

  const subjectWidth = maxX - minX + 1;
  const subjectHeight = maxY - minY + 1;
  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = size;
  targetCanvas.height = size;
  const targetContext = targetCanvas.getContext("2d");

  if (!targetContext) {
    throw new Error("Failed to create square image");
  }

  const hPad = size * 0.02;
  const tPad = size * 0.02;
  const bPad = 0;
  const scale = Math.min(
    (size - hPad * 2) / subjectWidth,
    (size - tPad - bPad) / subjectHeight,
  );

  const drawWidth = subjectWidth * scale;
  const drawHeight = subjectHeight * scale;
  const dx = (size - drawWidth) / 2;
  const dy = (size - drawHeight) / 2;

  targetContext.clearRect(0, 0, size, size);
  targetContext.drawImage(
    sourceCanvas,
    minX,
    minY,
    subjectWidth,
    subjectHeight,
    dx,
    dy,
    drawWidth,
    drawHeight,
  );

  return targetCanvas.toDataURL("image/png");
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
  const fallbackBase64 = await resizeImageToBase64(file, 1024);
  const aiBase64 = await resizeImageToBase64(file, 384, "image/jpeg", 0.82);
  let finalBase64 = fallbackBase64;

  options.onStatus?.("processing");

  try {
    const { data, error } = await supabase.functions.invoke("remove-background", {
      body: { imageBase64: aiBase64 },
    });

    if (error) {
      console.error("[POTM] Background removal error:", error);
      options.onStatus?.("fallback");
    } else if (data?.fallback) {
      console.warn("[POTM] Background removal fallback:", data?.warning || "Unknown AI fallback");
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

  finalBase64 = await normalizePotmImage(finalBase64);

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
