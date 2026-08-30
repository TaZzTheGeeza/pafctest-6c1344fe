import { useState } from "react";
import { Ruler } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type GuideKind = "junior" | "adult" | "mixed" | null;

// Official Joma size guide figures (cm).
const MENS_TOP: Array<[string, string, string, string]> = [
  ["S", "87–94", "75–82", "86–93"],
  ["M", "95–101", "83–90", "94–100"],
  ["L", "102–108", "91–97", "101–108"],
  ["XL", "109–114", "98–103", "109–113"],
  ["XXL–3XL", "115–143", "104–134", "114–138"],
];

const WOMENS_TOP: Array<[string, string, string, string]> = [
  ["XS", "76–82", "61–68", "86–90"],
  ["S", "83–89", "69–73", "91–95"],
  ["M", "90–94", "74–78", "96–100"],
  ["L", "95–98", "79–82", "101–104"],
  ["XL", "99–102", "83–86", "105–108"],
  ["XXL–3XL", "103–106", "87–90", "109–112"],
];

const MENS_BOTTOM: Array<[string, string, string, string]> = [
  ["XS", "68–74", "80–85", "81"],
  ["S", "75–82", "86–93", "81.5"],
  ["M", "83–90", "94–100", "82"],
  ["L", "91–97", "101–108", "82.5"],
  ["XL", "98–103", "109–113", "83"],
  ["XXL–3XL", "104–134", "114–138", "83.5"],
];

const WOMENS_BOTTOM: Array<[string, string, string, string]> = [
  ["XS", "61–68", "86–91", "78"],
  ["S", "69–73", "92–95", "78.5"],
  ["M", "74–78", "96–100", "79"],
  ["L", "79–82", "101–104", "79.5"],
  ["XL", "83–86", "105–108", "80"],
  ["XXL–3XL", "87–90", "109–112", "80.5"],
];

// Kids top & bottom: size, age, height, chest, waist, hip (cm)
const KIDS_ROWS: Array<[string, string, string, string, string, string]> = [
  ["6XS", "4–5", "100–108", "56–57", "54–55", "60–62"],
  ["5XS", "5–6", "109–117", "58–61", "56–57", "63–65"],
  ["4XS", "7–8", "118–128", "62–66", "58–60", "66–68"],
  ["3XS", "9–10", "129–140", "67–72", "61–64", "69–74"],
  ["2XS", "11–12", "141–152", "73–79", "65–68", "75–80"],
  ["XS", "13–14", "153–164", "80–87", "69–72", "81–86"],
];

const KIDS_AGE_RANGES: Array<[string, number, number]> = [
  ["6XS", 3, 5],
  ["5XS", 5, 6],
  ["4XS", 7, 8],
  ["3XS", 9, 10],
  ["2XS", 11, 12],
  ["XS", 13, 14],
];

const KIDS_HEIGHT_RANGES: Array<[string, number, number]> = [
  ["6XS", 100, 108],
  ["5XS", 109, 117],
  ["4XS", 118, 128],
  ["3XS", 129, 140],
  ["2XS", 141, 152],
  ["XS", 153, 164],
];

const SIZE_OPTION_NAMES = ["size", "sizes", "shirt size", "kit size", "age"];

function isSizeOption(name: string) {
  const n = name.trim().toLowerCase();
  return SIZE_OPTION_NAMES.includes(n) || n.includes("size");
}

/** Pull the product's own size values out of its options. */
export function getSizeValues(options: Array<{ name: string; values: string[] }>): string[] {
  const sizeOption = options.find((o) => isSizeOption(o.name));
  return sizeOption?.values ?? [];
}

/**
 * Map a store size label ("5-6 Years", "YM", "128cm", "M") onto a Joma chart row key.
 * Returns { chart: "kids" | "adult", key } or null when it can't be matched.
 */
export function mapSizeLabel(raw: string): { chart: "kids" | "adult"; key: string } | null {
  const v = raw.trim().toLowerCase().replace(/\s+/g, " ");

  // Explicit Joma junior codes
  const jomaKid = v.match(/^([2-6])\s*xs$/);
  if (jomaKid) return { chart: "kids", key: `${jomaKid[1]}XS` };

  // Height labels, e.g. "128cm" / "128 cm" / "140"
  const height = v.match(/(\d{3})\s*cm/);
  if (height) {
    const h = parseInt(height[1], 10);
    const row = KIDS_HEIGHT_RANGES.find(([, lo, hi]) => h >= lo && h <= hi);
    if (row) return { chart: "kids", key: row[0] };
  }

  // Age labels, e.g. "5-6 years", "9/10 yrs", "age 11-12", "7-8"
  const ages = v.match(/(\d{1,2})\s*[-/–]\s*(\d{1,2})/);
  if (ages && parseInt(ages[2], 10) <= 16) {
    const lo = parseInt(ages[1], 10);
    const hi = parseInt(ages[2], 10);
    const mid = (lo + hi) / 2;
    const row =
      KIDS_AGE_RANGES.find(([, a, b]) => mid >= a && mid <= b) ||
      KIDS_AGE_RANGES.find(([, a, b]) => lo >= a && lo <= b);
    if (row) return { chart: "kids", key: row[0] };
  }
  const singleAge = v.match(/^(?:age\s*)?(\d{1,2})\s*(?:yrs?|years?)?$/);
  if (singleAge) {
    const a = parseInt(singleAge[1], 10);
    if (a >= 3 && a <= 16) {
      const row = KIDS_AGE_RANGES.find(([, lo, hi]) => a >= lo && a <= hi);
      if (row) return { chart: "kids", key: row[0] };
    }
  }

  // Youth letter sizes
  const youth = v.match(/^(?:y|junior |jnr |kids? )?(xs|s|m|l|xl)b?$/);
  if (youth && /^(y|junior|jnr|kid)/.test(v)) {
    const map: Record<string, string> = { xs: "6XS", s: "5XS", m: "4XS", l: "3XS", xl: "2XS" };
    return { chart: "kids", key: map[youth[1]] };
  }

  // Adult letter sizes
  const adult = v.match(/^(xs|s|m|l|xl|xxl|2xl|xxxl|3xl)$/);
  if (adult) {
    const key = adult[1];
    if (key === "xxl" || key === "2xl" || key === "xxxl" || key === "3xl") return { chart: "adult", key: "XXL–3XL" };
    return { chart: "adult", key: key.toUpperCase() };
  }

  return null;
}

/** Work out which chart(s) apply from the product's own size values. Clothing only. */
export function detectSizeGuide(
  options: Array<{ name: string; values: string[] }>,
  productTitle = ""
): GuideKind {
  const title = productTitle.toLowerCase();
  // Footwear / socks / accessories are not covered by the Joma clothing guide.
  if (title.includes("sock") || title.includes("boot") || title.includes("shoe")) return null;

  const values = getSizeValues(options);
  if (values.length === 0) return null;
  if (values.some((v) => /\b(shoe|uk)\b/i.test(v))) return null;

  const mapped = values.map(mapSizeLabel).filter(Boolean) as Array<{ chart: "kids" | "adult" }>;
  const hasJunior = mapped.some((m) => m.chart === "kids");
  const hasAdult = mapped.some((m) => m.chart === "adult");

  if (hasJunior && hasAdult) return "mixed";
  if (hasJunior) return "junior";
  if (hasAdult) return "adult";
  return null;
}

function Table({
  headers,
  rows,
  labels,
}: {
  headers: string[];
  rows: string[][];
  labels?: Record<string, string>;
}) {
  const showLabels = !!labels;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-display text-xs uppercase tracking-wider text-muted-foreground">
            {showLabels && <th className="py-2 pr-3">Shop size</th>}
            {headers.map((h) => (
              <th key={h} className="py-2 pr-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-border/50">
              {showLabels && (
                <td className="py-2 pr-3 font-medium text-primary">{labels?.[r[0]] ?? "—"}</td>
              )}
              <td className="py-2 pr-3 font-medium">{r[0]}</td>
              {r.slice(1).map((cell, i) => (
                <td key={i} className="py-2 pr-3 text-muted-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">{title}</h3>
      {children}
    </section>
  );
}

interface SizeGuideDialogProps {
  kind: GuideKind;
  /** The exact size values offered for this product, so the guide matches what's buyable. */
  sizeValues?: string[];
  className?: string;
}

export function SizeGuideDialog({ kind, sizeValues = [], className }: SizeGuideDialogProps) {
  const [open, setOpen] = useState(false);
  if (!kind) return null;

  // Map each purchasable size onto a chart row so the guide only shows what's for sale.
  const kidsLabels: Record<string, string> = {};
  const adultLabels: Record<string, string> = {};
  const unmatched: string[] = [];
  sizeValues.forEach((value) => {
    const m = mapSizeLabel(value);
    if (!m) {
      unmatched.push(value);
      return;
    }
    const target = m.chart === "kids" ? kidsLabels : adultLabels;
    target[m.key] = target[m.key] ? `${target[m.key]}, ${value}` : value;
  });

  const hasMapping = Object.keys(kidsLabels).length > 0 || Object.keys(adultLabels).length > 0;
  const kidsRows = hasMapping
    ? KIDS_ROWS.filter((r) => kidsLabels[r[0]])
    : KIDS_ROWS;
  const filterAdult = (rows: Array<[string, string, string, string]>) =>
    hasMapping ? rows.filter((r) => adultLabels[r[0]]) : rows;

  const showKids = (kind === "junior" || kind === "mixed") && kidsRows.length > 0;
  const showAdult =
    (kind === "adult" || kind === "mixed") &&
    (!hasMapping || Object.keys(adultLabels).length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          className={`h-auto p-0 font-display text-xs uppercase tracking-wider text-primary ${className ?? ""}`}
        >
          <Ruler className="mr-1.5 h-3.5 w-3.5" />
          Size guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Joma Size Guide</DialogTitle>
          <DialogDescription>
            Official Joma measurements (cm) for the sizes available on this product. If between sizes, size up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {showKids && (
            <Section title="Kids — Top &amp; Bottom">
              <Table
                headers={["Joma size", "Age", "Height", "Chest", "Waist", "Hip"]}
                rows={kidsRows}
                labels={hasMapping ? kidsLabels : undefined}
              />
            </Section>
          )}
          {showAdult && (
            <>
              {filterAdult(MENS_TOP).length > 0 && (
                <Section title="Men's Top">
                  <Table
                    headers={["Joma size", "Chest", "Waist", "Hip"]}
                    rows={filterAdult(MENS_TOP)}
                    labels={hasMapping ? adultLabels : undefined}
                  />
                </Section>
              )}
              {filterAdult(MENS_BOTTOM).length > 0 && (
                <Section title="Men's Bottom">
                  <Table
                    headers={["Joma size", "Waist", "Hip", "Inseam"]}
                    rows={filterAdult(MENS_BOTTOM)}
                    labels={hasMapping ? adultLabels : undefined}
                  />
                </Section>
              )}
              {filterAdult(WOMENS_TOP).length > 0 && (
                <Section title="Women's Top">
                  <Table
                    headers={["Joma size", "Chest", "Waist", "Hip"]}
                    rows={filterAdult(WOMENS_TOP)}
                    labels={hasMapping ? adultLabels : undefined}
                  />
                </Section>
              )}
              {filterAdult(WOMENS_BOTTOM).length > 0 && (
                <Section title="Women's Bottom">
                  <Table
                    headers={["Joma size", "Waist", "Hip", "Inseam"]}
                    rows={filterAdult(WOMENS_BOTTOM)}
                    labels={hasMapping ? adultLabels : undefined}
                  />
                </Section>
              )}
            </>
          )}

          {unmatched.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Not covered by the chart: {unmatched.join(", ")}
            </p>
          )}

          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">How to measure</p>
            <p>
              Chest: measure under the arms around the fullest part of the chest, keeping the tape level.
              Waist: measure around the natural waistline. Hip: measure around the fullest part of the hips.
              Height: measure without shoes, standing straight against a wall.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
