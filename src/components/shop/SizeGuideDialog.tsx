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

const SIZE_OPTION_NAMES = ["size", "sizes", "shirt size", "kit size", "age"];

function isSizeOption(name: string) {
  const n = name.trim().toLowerCase();
  return SIZE_OPTION_NAMES.includes(n) || n.includes("size");
}

/** Work out which chart(s) apply from the product's own size values. Clothing only. */
export function detectSizeGuide(
  options: Array<{ name: string; values: string[] }>,
  productTitle = ""
): GuideKind {
  const title = productTitle.toLowerCase();
  // Footwear / socks / accessories are not covered by the Joma clothing guide.
  if (title.includes("sock") || title.includes("boot") || title.includes("shoe")) return null;

  const sizeOption = options.find((o) => isSizeOption(o.name));
  if (!sizeOption || sizeOption.values.length === 0) return null;

  const values = sizeOption.values.map((v) => v.toLowerCase());
  if (values.some((v) => /\b(shoe|uk)\b/.test(v))) return null;

  const hasJunior = values.some((v) => /\d\s*[-/–]\s*\d|\byrs?\b|\byears?\b|\bjnr\b|\bjunior\b|\bkids?\b|\b(sb|mb|lb|xlb|xsb)\b|^[2-6]xs$/.test(v));
  const hasAdult = values.some((v) => /^(xs|s|m|l|xl|2xl|3xl|xxl|xxxl)$/.test(v.trim()));

  if (hasJunior && hasAdult) return "mixed";
  if (hasJunior) return "junior";
  if (hasAdult) return "adult";
  return null;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-display text-xs uppercase tracking-wider text-muted-foreground">
            {headers.map((h, i) => (
              <th key={h} className={i < headers.length - 1 ? "py-2 pr-3" : "py-2"}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-border/50">
              <td className="py-2 pr-3 font-medium">{r[0]}</td>
              {r.slice(1).map((cell, i) => (
                <td key={i} className={i < r.length - 2 ? "py-2 pr-3 text-muted-foreground" : "py-2 text-muted-foreground"}>{cell}</td>
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
  className?: string;
}

export function SizeGuideDialog({ kind, className }: SizeGuideDialogProps) {
  const [open, setOpen] = useState(false);
  if (!kind) return null;

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
            Official Joma measurements (cm). If between sizes, size up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {(kind === "junior" || kind === "mixed") && (
            <Section title="Kids — Top &amp; Bottom">
              <Table
                headers={["Size", "Age", "Height", "Chest", "Waist", "Hip"]}
                rows={KIDS_ROWS}
              />
            </Section>
          )}
          {(kind === "adult" || kind === "mixed") && (
            <>
              <Section title="Men's Top">
                <Table headers={["Size", "Chest", "Waist", "Hip"]} rows={MENS_TOP} />
              </Section>
              <Section title="Men's Bottom">
                <Table headers={["Size", "Waist", "Hip", "Inseam"]} rows={MENS_BOTTOM} />
              </Section>
              <Section title="Women's Top">
                <Table headers={["Size", "Chest", "Waist", "Hip"]} rows={WOMENS_TOP} />
              </Section>
              <Section title="Women's Bottom">
                <Table headers={["Size", "Waist", "Hip", "Inseam"]} rows={WOMENS_BOTTOM} />
              </Section>
            </>
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
