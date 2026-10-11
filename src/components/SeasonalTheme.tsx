import { useEffect, type CSSProperties } from "react";
import { Ghost, Sparkles, CandyCane, Snowflake } from "lucide-react";
import { useSeasonalTheme } from "@/hooks/useSeasonalTheme";
import halloweenGarland from "@/assets/seasonal/halloween-garland.png";
import christmasGarland from "@/assets/seasonal/christmas-garland.png";


export function Bat() {
  return <svg viewBox="0 0 100 45" fill="currentColor"><path d="M50 18L44 8L43 18Q23 5 3 2Q10 17 8 29Q21 23 27 37Q36 29 44 39L50 45L56 39Q64 29 73 37Q79 23 92 29Q90 17 97 2Q77 5 57 18L56 8Z" /></svg>;
}

export function SeasonalTheme() {
  const { theme } = useSeasonalTheme();
  useEffect(() => {
    if (theme === "off") delete document.documentElement.dataset.season;
    else document.documentElement.dataset.season = theme;
    const root = document.documentElement;
    root.style.setProperty("--season-garland-art", `url("${theme === "halloween" ? halloweenGarland : christmasGarland}")`);
    return () => {
      delete root.dataset.season;
      root.style.removeProperty("--season-garland-art");

    };
  }, [theme]);

  if (theme === "off") return null;
  return <div className={`seasonal-overlay seasonal-${theme}`} aria-hidden="true">
    <div className="seasonal-header-art"><img src={theme === "halloween" ? halloweenGarland : christmasGarland} alt="" width={1536} height={512} /></div>
    {theme === "halloween" ? <>
      {Array.from({ length: 8 }, (_, i) => <div key={i} className={`seasonal-floater seasonal-floater-${i}`}>
        {i % 3 === 0 ? <Ghost /> : <Bat />}
      </div>)}
      <div className="seasonal-web seasonal-web-left"><svg viewBox="0 0 100 100"><path d="M0 0L100 100M0 0L100 40M0 0L40 100M0 25Q18 18 25 0M0 50Q36 36 50 0M0 75Q55 55 75 0M0 100Q72 72 100 0M12 30Q30 25 30 12M22 54Q52 46 54 22M32 78Q77 65 78 32" /></svg></div>
      <div className="seasonal-web seasonal-web-right"><svg viewBox="0 0 100 100"><path d="M0 0L100 100M0 0L100 40M0 0L40 100M0 25Q18 18 25 0M0 50Q36 36 50 0M0 75Q55 55 75 0M0 100Q72 72 100 0" /></svg></div>
    </> : <>
      <div className="seasonal-lights">{Array.from({ length: 36 }, (_, i) => <span key={i} />)}</div>
      {Array.from({ length: 8 }, (_, i) => <div key={i} className={`seasonal-floater seasonal-floater-${i}`}>
        {i % 3 === 0 ? <CandyCane /> : i % 3 === 1 ? <Snowflake /> : <Sparkles />}
      </div>)}
    </>}
    <div className="seasonal-weather">{Array.from({ length: theme === "christmas" ? 64 : 24 }, (_, i) => <span key={i}
      style={{ "--particle-x": `${(i * 37 + 7) % 100}%`, "--particle-delay": `${-(i * 3.7) % 24}s`, "--particle-duration": `${14 + (i % 6) * 3}s`, "--particle-size": `${3 + i % 5}px` } as CSSProperties} />)}</div>
  </div>;
}