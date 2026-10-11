import { useEffect } from "react";
import { TreePine, Star } from "lucide-react";
import { useSeasonalTheme } from "@/hooks/useSeasonalTheme";

function Pumpkin() {
  return <svg viewBox="0 0 100 100" className="seasonal-pumpkin" fill="currentColor">
    <path className="seasonal-stem" d="M46 26Q40 10 55 7L58 13Q48 14 54 27Z" />
    <ellipse cx="50" cy="59" rx="44" ry="33" />
    <ellipse className="seasonal-pumpkin-line" cx="50" cy="59" rx="24" ry="33" fill="none" stroke="currentColor" strokeWidth="2" />
    <path className="seasonal-cutout" d="M23 53L36 40L42 55ZM58 55L64 40L77 53ZM26 67L39 71L43 65L50 73L57 65L61 71L74 67Q51 96 26 67Z" />
  </svg>;
}

function Bat() {
  return <svg viewBox="0 0 100 45" fill="currentColor"><path d="M50 18L44 8L43 18Q23 5 3 2Q10 17 8 29Q21 23 27 37Q36 29 44 39L50 45L56 39Q64 29 73 37Q79 23 92 29Q90 17 97 2Q77 5 57 18L56 8Z" /></svg>;
}

export function SeasonalTheme() {
  const { theme } = useSeasonalTheme();
  useEffect(() => {
    if (theme === "off") delete document.documentElement.dataset.season;
    else document.documentElement.dataset.season = theme;
    return () => { delete document.documentElement.dataset.season; };
  }, [theme]);

  if (theme === "off") return null;
  return <div className={`seasonal-overlay seasonal-${theme}`} aria-hidden="true">
    {theme === "halloween" ? <>
      <div className="seasonal-corner seasonal-left"><Pumpkin /></div>
      <div className="seasonal-corner seasonal-right"><Pumpkin /></div>
      <div className="seasonal-bat seasonal-bat-one"><Bat /></div>
      <div className="seasonal-bat seasonal-bat-two"><Bat /></div>
    </> : <>
      <div className="seasonal-lights">{Array.from({ length: 24 }, (_, i) => <span key={i} />)}</div>
      <div className="seasonal-corner seasonal-left seasonal-tree"><Star /><TreePine /></div>
      <div className="seasonal-corner seasonal-right seasonal-tree"><Star /><TreePine /></div>
      <div className="seasonal-snow">{Array.from({ length: 18 }, (_, i) => <span key={i} />)}</div>
    </>}
  </div>;
}