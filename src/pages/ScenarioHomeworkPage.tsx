import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, Target } from "lucide-react";
import { HOMEWORK_SCENARIOS, SCENARIO_SOURCES } from "@/lib/homeworkScenarios";
import ScenarioPlayer from "@/components/homework/ScenarioPlayer";
import { useAuth } from "@/contexts/AuthContext";

export default function ScenarioHomeworkPage() {
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState("All");
  const { isCoach } = useAuth();
  const active = HOMEWORK_SCENARIOS.find((s) => s.id === params.get("scenario")) || HOMEWORK_SCENARIOS[0];
  return <><Navbar /><SEO title="What Would You Do? | PAFC Homework" description="Attacking and defending football decision challenges with scenario photos and tactical outcome videos." path="/homework/scenarios" />
    <main className="container max-w-6xl pt-32 pb-16">
      <Button asChild variant="ghost" className="mb-5"><Link to="/hub?tab=homework"><ArrowLeft /> Team homework</Link></Button>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div><p className="text-primary text-xs font-display uppercase mb-2">Football IQ / Homework</p><h1 className="text-4xl sm:text-5xl font-display">What would you do?</h1><p className="mt-3 text-muted-foreground">Read the game. Make your decision.</p></div>
        {isCoach && <Button asChild><Link to={`/dashboard?section=homework&scenario=${active.id}`}><Target /> Set this as homework</Link></Button>}
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8">
        <section className="min-w-0"><div className="flex gap-3 items-center border-b border-border pb-3 mb-4"><span className="text-primary">{active.category === "Attacking" ? <Target /> : <Shield />}</span><h2 className="font-display text-2xl">{active.title}</h2><span className="ml-auto text-xs text-muted-foreground">{active.category}</span></div><ScenarioPlayer key={active.id} scenario={active} practice /></section>
        <aside className="space-y-4"><div className="flex gap-1" aria-label="Scenario categories">{["All", "Attacking", "Defending"].map((c) => <Button key={c} size="sm" variant={category === c ? "default" : "ghost"} onClick={() => setCategory(c)}>{c}</Button>)}</div>
          {HOMEWORK_SCENARIOS.filter((s) => category === "All" || s.category === category).map((s) => <Button key={s.id} variant="ghost" onClick={() => setParams({ scenario: s.id })} aria-pressed={active.id === s.id} className={`h-auto w-full justify-start p-0 overflow-hidden rounded-sm whitespace-normal text-left ${active.id === s.id ? "bg-primary/10 text-primary" : ""}`}><img src={s.photo} alt="" width={96} height={64} loading="lazy" className="w-24 h-16 object-cover shrink-0" /><span className="flex-1 py-2">{s.title}<span className="block text-xs text-muted-foreground">{s.category}</span></span><ArrowRight className="mr-2 shrink-0" /></Button>)}
        </aside>
      </div>
      <details className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground"><summary className="cursor-pointer">Coaching sources & image credits</summary><p className="my-3">Original PAFC practice questions inspired by these coaching principles. Scenario photos are AI-created illustrations, not club match footage. Outcome clips are tactical animations. Practice choices here are not sent to a coach; allocated homework is completed in your team Hub.</p><ul className="space-y-2">{SCENARIO_SOURCES.map((s) => <li key={s.url}><a className="text-primary underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul></details>
    </main><Footer /></>;
}