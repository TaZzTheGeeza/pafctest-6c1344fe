// Kit request system config: reasons and the Macron size guide.

export const KIT_REASONS = [
  { value: "outgrown", label: "Outgrown - current kit is too small" },
  { value: "damaged", label: "Damaged or worn out" },
  { value: "lost", label: "Lost" },
  { value: "goalkeeper", label: "Playing in goal - need GK kit" },
  { value: "never_received", label: "Never received this item" },
  { value: "other", label: "Other reason" },
] as const;

export const KIT_REASON_LABELS: Record<string, string> = Object.fromEntries(
  KIT_REASONS.map((r) => [r.value, r.label])
);

export const KIT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  ready: "Ready to collect",
  handed_out: "Handed out",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const KIT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved: "bg-primary/15 text-primary border-primary/30",
  ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  handed_out: "bg-muted text-muted-foreground border-border",
  declined: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export interface SizeGuideRow {
  size: string;
  age?: string;
  heightCm: [number, number];
  chestCm: [number, number];
}

// Macron official size guide (junior then adult/unisex, smallest upwards).
export const MACRON_SIZE_GUIDE: SizeGuideRow[] = [
  { size: "5XS", age: "3-4", heightCm: [100, 109], chestCm: [56, 60] },
  { size: "4XS", age: "5-6", heightCm: [110, 119], chestCm: [60, 64] },
  { size: "3XS", age: "7-8", heightCm: [120, 132], chestCm: [64, 72] },
  { size: "XXS", age: "9-10", heightCm: [133, 146], chestCm: [72, 80] },
  { size: "XS", age: "11-12", heightCm: [147, 160], chestCm: [80, 88] },
  { size: "S", heightCm: [160, 172], chestCm: [88, 96] },
  { size: "M", heightCm: [171, 179], chestCm: [96, 100] },
  { size: "L", heightCm: [178, 185], chestCm: [100, 104] },
  { size: "XL", heightCm: [183, 190], chestCm: [104, 108] },
  { size: "XXL", heightCm: [188, 195], chestCm: [108, 112] },
  { size: "3XL", heightCm: [193, 200], chestCm: [112, 120] },
  { size: "4XL", heightCm: [198, 205], chestCm: [120, 128] },
  { size: "5XL", heightCm: [203, 210], chestCm: [128, 136] },
  { size: "6XL", heightCm: [210, 217], chestCm: [136, 144] },
];

export const DEFAULT_KIT_SIZES = MACRON_SIZE_GUIDE.map((r) => r.size);
export const SOCK_SIZES = ["XS", "S", "M", "L", "XL"];

/** Suggest a Macron size from the child's height in cm. */
export function suggestSize(heightCm: number): SizeGuideRow | null {
  if (!heightCm || heightCm < 80 || heightCm > 230) return null;
  const exact = MACRON_SIZE_GUIDE.find(
    (r) => heightCm >= r.heightCm[0] && heightCm <= r.heightCm[1]
  );
  if (exact) return exact;
  // Between bands: size up (Macron runs small).
  const next = MACRON_SIZE_GUIDE.find((r) => heightCm < r.heightCm[0]);
  return next || MACRON_SIZE_GUIDE[MACRON_SIZE_GUIDE.length - 1];
}
