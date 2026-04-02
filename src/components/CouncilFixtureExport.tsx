import { useState } from "react";
import { format, parse, isValid, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateInput } from "@/components/ui/date-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Table, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FixtureRow {
  team: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  competition: string;
  type: string;
  score?: string;
}

function parseFADate(dateStr: string): Date | null {
  // Handle "DD/MM/YY" and "DD/MM/YYYY" and text months like "Sat 01 Mar 25"
  const numericMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (numericMatch) {
    let year = parseInt(numericMatch[3]);
    if (year < 100) year += 2000;
    return new Date(year, parseInt(numericMatch[2]) - 1, parseInt(numericMatch[1]));
  }

  const textMatch = dateStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{2,4})/);
  if (textMatch) {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    let year = parseInt(textMatch[3]);
    if (year < 100) year += 2000;
    const mon = months[textMatch[2]];
    if (mon !== undefined) return new Date(year, mon, parseInt(textMatch[1]));
  }

  return null;
}

function filterByDateRange(fixtures: FixtureRow[], from: string, to: string): FixtureRow[] {
  const fromDate = parse(from, "yyyy-MM-dd", new Date());
  const toDate = parse(to, "yyyy-MM-dd", new Date());
  if (!isValid(fromDate) || !isValid(toDate)) return fixtures;

  return fixtures.filter((f) => {
    const d = parseFADate(f.date);
    if (!d) return false;
    return d >= fromDate && d <= toDate;
  });
}

function sortByDate(fixtures: FixtureRow[]): FixtureRow[] {
  return [...fixtures].sort((a, b) => {
    const da = parseFADate(a.date);
    const db = parseFADate(b.date);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });
}

function generateCSV(fixtures: FixtureRow[], from: string, to: string): string {
  const header = "Date,Time,Team/Age Group,Home Team,Away Team,Venue,Competition,Type";
  const rows = fixtures.map(
    (f) => `"${f.date}","${f.time}","${f.team}","${f.homeTeam}","${f.awayTeam}","${f.venue}","${f.competition}","${f.type}"`
  );
  const title = `PAFC Fixtures - Council Report (${from} to ${to})`;
  return `${title}\n${header}\n${rows.join("\n")}`;
}

function generatePDFHtml(fixtures: FixtureRow[], from: string, to: string): string {
  const fromFormatted = format(parse(from, "yyyy-MM-dd", new Date()), "dd/MM/yyyy");
  const toFormatted = format(parse(to, "yyyy-MM-dd", new Date()), "dd/MM/yyyy");

  const rows = fixtures
    .map(
      (f) =>
        `<tr><td>${f.date}</td><td>${f.time}</td><td>${f.team}</td><td>${f.homeTeam}</td><td>${f.awayTeam}</td><td>${f.venue}</td><td>${f.competition}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>PAFC Council Fixture Report</title>
<style>
  @page { size: A4 landscape; margin: 15mm; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #222; }
  h1 { font-size: 18px; margin-bottom: 2px; }
  h2 { font-size: 13px; color: #555; font-weight: normal; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #1a1a2e; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
  td { padding: 5px 8px; border-bottom: 1px solid #ddd; font-size: 10px; }
  tr:nth-child(even) { background: #f9f9f9; }
  .footer { margin-top: 16px; font-size: 9px; color: #888; text-align: center; }
  .total { margin-top: 10px; font-weight: bold; font-size: 12px; }
</style></head><body>
  <h1>Peterborough Athletic FC — Council Fixture Report</h1>
  <h2>Period: ${fromFormatted} — ${toFormatted}</h2>
  <table><thead><tr><th>Date</th><th>Time</th><th>Age Group</th><th>Home</th><th>Away</th><th>Venue</th><th>Competition</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <p class="total">Total Fixtures: ${fixtures.length}</p>
  <p class="footer">Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")} — Data sourced from FA Full-Time</p>
</body></html>`;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type VenueFilter = "all" | "home" | "away";

const CLUB_NAME = "Peterborough Athletic";

function filterByVenue(fixtures: FixtureRow[], venue: VenueFilter): FixtureRow[] {
  if (venue === "all") return fixtures;
  return fixtures.filter((f) => {
    const isHome = f.homeTeam.includes(CLUB_NAME);
    return venue === "home" ? isHome : !isHome;
  });
}

export function CouncilFixtureExport() {
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [fixtureCount, setFixtureCount] = useState<number | null>(null);
  const [venueFilter, setVenueFilter] = useState<VenueFilter>("all");

  const fetchAndExport = async (type: "csv" | "pdf") => {
    setLoading(true);
    setFixtureCount(null);
    try {
      const { data, error } = await supabase.functions.invoke("export-council-fixtures");
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch fixtures");

      const filtered = sortByDate(filterByVenue(filterByDateRange(data.fixtures as FixtureRow[], dateFrom, dateTo), venueFilter));
      setFixtureCount(filtered.length);

      if (filtered.length === 0) {
        toast.info("No fixtures found in that date range");
        return;
      }

      const venueLabel = venueFilter === "all" ? "" : `-${venueFilter.toUpperCase()}`;
      const fromLabel = format(parse(dateFrom, "yyyy-MM-dd", new Date()), "MMM-yyyy");
      const toLabel = format(parse(dateTo, "yyyy-MM-dd", new Date()), "MMM-yyyy");
      const filename = `PAFC-Fixtures${venueLabel}_${fromLabel}_to_${toLabel}`;

      if (type === "csv") {
        downloadBlob(generateCSV(filtered, dateFrom, dateTo), `${filename}.csv`, "text/csv");
        toast.success(`Downloaded ${filtered.length} fixtures as CSV`);
      } else {
        const htmlContent = generatePDFHtml(filtered, dateFrom, dateTo);
        // Open in new window for printing to PDF
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 500);
          toast.success(`Opened ${filtered.length} fixtures — use Print > Save as PDF`);
        } else {
          // Fallback: download as HTML
          downloadBlob(htmlContent, `${filename}.html`, "text/html");
          toast.success("Downloaded as HTML — open and print to PDF");
        }
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export fixtures. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Fixture Export</CardTitle>
        </div>
        <CardDescription>
          Download all team fixtures for a date range to submit to the council for pitch usage billing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">From</label>
            <DateInput value={dateFrom} onChange={setDateFrom} placeholder="Start date" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">To</label>
            <DateInput value={dateTo} onChange={setDateTo} placeholder="End date" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Home / Away</label>
          <div className="flex gap-2">
            {(["all", "home", "away"] as VenueFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setVenueFilter(v)}
                className={`text-xs font-display tracking-wider px-3 py-1.5 rounded-full border transition-colors ${venueFilter === v ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {v === "all" ? "All" : v === "home" ? "Home" : "Away"}
              </button>
            ))}
          </div>
        </div>

        {fixtureCount !== null && (
          <p className="text-sm text-muted-foreground">
            {fixtureCount === 0
              ? "No fixtures found in the selected range."
              : `${fixtureCount} fixtures found in the selected range.`}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => fetchAndExport("pdf")} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
          <Button onClick={() => fetchAndExport("csv")} disabled={loading} variant="outline" className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Table className="h-4 w-4 mr-2" />}
            Download CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
