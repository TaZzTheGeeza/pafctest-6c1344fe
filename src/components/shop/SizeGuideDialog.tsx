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

type GuideKind = "junior" | "adult" | "footwear" | "mixed" | null;

const JUNIOR_ROWS: Array<[string, string, string, string]> = [
  ["3/4 (SB)", "3–4 yrs", "98–104", "56–58"],
  ["5/6 (SB)", "5–6 yrs", "110–116", "60–62"],
  ["7/8 (MB)", "7–8 yrs", "122–128", "64–66"],
  ["9/10 (LB)", "9–10 yrs", "134–140", "68–71"],
  ["11/12 (XLB)", "11–12 yrs", "146–152", "73–76"],
  ["13/14 (XXLB)", "13–14 yrs", "158–164", "79–82"],
];

const ADULT_ROWS: Array<[string, string, string]> = [
  ["XS", "32–34", "81–86"],
  ["S", "35–37", "89–94"],
  ["M", "38–40", "97–102"],
  ["L", "41–43", "104–109"],
  ["XL", "44–46", "112–117"],
  ["2XL", "47–49", "119–124"],
  ["3XL", "50–52", "127–132"],
];

const FOOTWEAR_ROWS: Array<[string, string]> = [
  ["Junior 8–11", "26–29"],
  ["Junior 12–2", "30–34"],
  ["Junior 3–6", "35–39"],
  ["Adult 7–11", "40–46"],
  ["Adult 12–14", "47–49"],
];

const SIZE_OPTION_NAMES = ["size", "sizes", "shirt size", "kit size", "sock size", "age"];

function isSizeOption(name: string) {
  const n = name.trim().toLowerCase();
  return SIZE_OPTION_NAMES.includes(n) || n.includes("size");
}

/** Work out which chart(s) apply from the product's own size values. */
export function detectSizeGuide(
  options: Array<{ name: string; values: string[] }>,
  productTitle = ""
): GuideKind {
  const sizeOption = options.find((o) => isSizeOption(o.name));
  if (!sizeOption || sizeOption.values.length === 0) return null;

  const values = sizeOption.values.map((v) => v.toLowerCase());
  const title = productTitle.toLowerCase();

  if (title.includes("sock") || values.some((v) => /\b(shoe|uk)\b/.test(v))) return "footwear";

  const hasJunior = values.some((v) => /\d\s*[-/–]\s*\d|\byrs?\b|\byears?\b|\bjnr\b|\bjunior\b|\bkids?\b|\b(sb|mb|lb|xlb|xsb)\b/.test(v));
  const hasAdult = values.some((v) => /^(xs|s|m|l|xl|2xl|3xl|xxl|xxxl)$/.test(v.trim()));

  if (hasJunior && hasAdult) return "mixed";
  if (hasJunior) return "junior";
  if (hasAdult) return "adult";
  return null;
}

function JuniorTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-display text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-3">Size</th>
            <th className="py-2 pr-3">Age</th>
            <th className="py-2 pr-3">Height (cm)</th>
            <th className="py-2">Chest (cm)</th>
          </tr>
        </thead>
        <tbody>
          {JUNIOR_ROWS.map((r) => (
            <tr key={r[0]} className="border-b border-border/50">
              <td className="py-2 pr-3 font-medium">{r[0]}</td>
              <td className="py-2 pr-3 text-muted-foreground">{r[1]}</td>
              <td className="py-2 pr-3 text-muted-foreground">{r[2]}</td>
              <td className="py-2 text-muted-foreground">{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdultTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-display text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-3">Size</th>
            <th className="py-2 pr-3">Chest (in)</th>
            <th className="py-2">Chest (cm)</th>
          </tr>
        </thead>
        <tbody>
          {ADULT_ROWS.map((r) => (
            <tr key={r[0]} className="border-b border-border/50">
              <td className="py-2 pr-3 font-medium">{r[0]}</td>
              <td className="py-2 pr-3 text-muted-foreground">{r[1]}</td>
              <td className="py-2 text-muted-foreground">{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FootwearTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-display text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-3">UK shoe size</th>
            <th className="py-2">EU</th>
          </tr>
        </thead>
        <tbody>
          {FOOTWEAR_ROWS.map((r) => (
            <tr key={r[0]} className="border-b border-border/50">
              <td className="py-2 pr-3 font-medium">{r[0]}</td>
              <td className="py-2 text-muted-foreground">{r[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
          <DialogTitle className="font-display">Size Guide</DialogTitle>
          <DialogDescription>
            Measurements are a guide only and can vary slightly by garment. If between sizes, size up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {(kind === "junior" || kind === "mixed") && (
            <section>
              <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">Junior</h3>
              <JuniorTable />
            </section>
          )}
          {(kind === "adult" || kind === "mixed") && (
            <section>
              <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">Adult</h3>
              <AdultTable />
            </section>
          )}
          {kind === "footwear" && (
            <section>
              <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">Socks / Footwear</h3>
              <FootwearTable />
            </section>
          )}

          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">How to measure</p>
            <p>
              Chest: measure under the arms around the fullest part of the chest, keeping the tape level.
              Height: measure without shoes, standing straight against a wall.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
