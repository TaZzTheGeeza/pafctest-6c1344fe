import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const money = (cents: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);

export function NicuContributions() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["nicu-contributions", offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_nicu_contributions", { _offset: offset });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
  const first = data?.[0];
  return <section id="donations" className="container mx-auto px-5 py-16 scroll-mt-32">
    <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
      <div><p className="text-primary text-sm mb-3">From our community</p><h2 className="text-3xl md:text-4xl">Your kindness, together</h2><p className="text-muted-foreground mt-4">Confirmed donations and gift purchases for the NICU Christmas collection.</p></div>
      {first && <div className="text-right"><p className="font-display text-4xl text-primary">{money(first.total_cents)}</p><p className="text-sm text-muted-foreground mt-1">from {first.contribution_count} {first.contribution_count === 1 ? "contribution" : "contributions"}</p></div>}
    </div>
    {isLoading ? <Loader2 aria-label="Loading contributions" className="h-6 w-6 animate-spin text-primary" /> : isError ? <div role="alert"><p className="text-muted-foreground mb-4">Contributions couldn't load just now.</p><Button variant="outline" disabled={isFetching} onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Try again</Button></div> : !data?.length ? <p className="text-muted-foreground py-6">Be the first to contribute. Every bit of kindness helps.</p> : <>
      <ul className="grid md:grid-cols-2 gap-x-12" aria-label="Confirmed contributions">
        {data.map((entry, index) => <li key={`${offset}-${index}`} className="flex items-center gap-4 py-5 border-b border-border">
          <Heart className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1"><p className="font-semibold break-words">{entry.display_name}</p><time dateTime={entry.contributed_at} className="text-xs text-muted-foreground">{new Date(entry.contributed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time></div>
          <span className="font-display text-2xl text-primary shrink-0">{money(entry.amount_cents)}</span>
        </li>)}
      </ul>
      {(offset > 0 || (first && first.contribution_count > offset + 20)) && <div className="flex items-center justify-between gap-4 mt-6"><Button variant="outline" disabled={offset === 0} onClick={() => setOffset(v => Math.max(0, v - 20))}>Previous</Button><Button variant="outline" disabled={!first || first.contribution_count <= offset + 20} onClick={() => setOffset(v => v + 20)}>Next</Button></div>}
    </>}
  </section>;
}