import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Play, RotateCcw } from "lucide-react";
import { HomeworkScenario, ScenarioMedia } from "@/lib/homeworkScenarios";
import { scenarioVideos, scenarioWebmVideos } from "@/lib/homeworkScenarioVideos";
import { getHomeworkMediaUrl } from "@/lib/homework";

interface Props {
  scenario: HomeworkScenario; firstAnswer?: string; onConfirm?: (answer: string) => void;
  media?: ScenarioMedia; practice?: boolean;
}

export default function ScenarioPlayer({ scenario, firstAnswer, onConfirm, media, practice = false }: Props) {
  const [selected, setSelected] = useState<string | undefined>(firstAnswer);
  const [viewed, setViewed] = useState<string | undefined>(firstAnswer);
  const [confirmed, setConfirmed] = useState<string | undefined>(firstAnswer);
  const [photo, setPhoto] = useState(scenario.photo);
  const [customVideos, setCustomVideos] = useState<Record<string, string>>({});
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    setSelected(firstAnswer); setViewed(firstAnswer); setConfirmed(firstAnswer);
  }, [scenario.id, firstAnswer]);
  useEffect(() => {
    let cancelled = false;
    setPhoto(scenario.photo); setCustomVideos({});
    (async () => {
      const [image, videos] = await Promise.all([
        media?.photo ? getHomeworkMediaUrl(media.photo) : Promise.resolve(null),
        Promise.all(Object.entries(media?.videos || {}).map(async ([label, path]) => [label, await getHomeworkMediaUrl(path)] as const)),
      ]);
      if (!cancelled) {
        if (image) setPhoto(image);
        setCustomVideos(Object.fromEntries(videos.filter((pair): pair is readonly [string, string] => !!pair[1])));
      }
    })();
    return () => { cancelled = true; };
  }, [scenario.id, media?.photo, media?.videos]);
  const viewIndex = scenario.choices.findIndex((c) => c.label === viewed);
  const choice = scenario.choices[viewIndex];
  const video = viewed ? customVideos[viewed] || scenarioVideos[scenario.id]?.[viewIndex] : undefined;
  const webm = viewed && !customVideos[viewed] ? scenarioWebmVideos[scenario.id]?.[viewIndex] : undefined;
  useEffect(() => { setVideoError(false); }, [video]);

  return <div className="space-y-4">
    <img src={photo} alt={`${scenario.title}: ${scenario.situation}`} width={1280} height={720} loading="lazy" className="w-full aspect-video object-cover rounded-sm" />
    <p className="text-sm text-muted-foreground leading-relaxed">{scenario.situation}</p>
    <h3 className="text-xl font-display text-foreground">{scenario.prompt}</h3>
    <div className="grid gap-2">
      {scenario.choices.map((c, i) => <Button key={c.label} type="button" variant={selected === c.label ? "default" : "outline"}
        aria-pressed={selected === c.label} className="h-auto min-h-12 justify-start whitespace-normal text-left py-3"
        onClick={() => { setSelected(c.label); if (confirmed) setViewed(c.label); }}>
        <span className="font-display text-lg w-6 shrink-0">{String.fromCharCode(65 + i)}</span><span className="flex-1">{c.label}</span>
        {confirmed === c.label && <Check aria-label="First answer" className="shrink-0" />}
      </Button>)}
    </div>
    {!confirmed && <Button type="button" disabled={!selected} onClick={() => {
      if (!selected) return;
      setConfirmed(selected); setViewed(selected); onConfirm?.(selected);
    }}><Play /> Confirm answer & see outcome</Button>}
    {confirmed && choice && <section className="border-t border-border pt-4 space-y-3" aria-live="polite">
      <p className="text-xs text-primary">{practice ? "First practice choice" : "First answer"}: {confirmed}</p>
      <h4 className="font-display text-lg">What could happen</h4>
      {video && !videoError ? <video key={video} controls playsInline preload="metadata" aria-label={`${scenario.title} outcome ${String.fromCharCode(65 + viewIndex)}`} onError={() => setVideoError(true)} className="w-full aspect-video rounded-sm bg-muted">
        <source src={video} type={webm ? "video/mp4" : undefined} />
        {webm && <source src={webm} type="video/webm" />}
      </video>
        : <p className="text-xs text-muted-foreground">{videoError ? "This video could not load. The coaching explanation is below." : "Outcome video is being prepared. The coaching explanation is below."}</p>}
      <p className="text-sm leading-relaxed">{choice.outcome}</p>
      <p className="text-sm text-primary">{scenario.principle}</p>
      <p className="text-xs text-muted-foreground">One possible outcome, not a guarantee. A different touch, run or defender position can change the decision.</p>
      {practice && <Button variant="ghost" size="sm" onClick={() => { setConfirmed(undefined); setSelected(undefined); setViewed(undefined); }}><RotateCcw /> Start again</Button>}
    </section>}
  </div>;
}