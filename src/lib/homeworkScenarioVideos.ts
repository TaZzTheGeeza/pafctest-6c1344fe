import attack2a from "@/assets/homework/videos/attack-2v1-a.mp4.asset.json";
import attack2b from "@/assets/homework/videos/attack-2v1-b.mp4.asset.json";
import attack2c from "@/assets/homework/videos/attack-2v1-c.mp4.asset.json";
import widtha from "@/assets/homework/videos/attack-width-a.mp4.asset.json";
import widthb from "@/assets/homework/videos/attack-width-b.mp4.asset.json";
import widthc from "@/assets/homework/videos/attack-width-c.mp4.asset.json";
import scana from "@/assets/homework/videos/attack-scan-a.mp4.asset.json";
import scanb from "@/assets/homework/videos/attack-scan-b.mp4.asset.json";
import scanc from "@/assets/homework/videos/attack-scan-c.mp4.asset.json";
import defend2a from "@/assets/homework/videos/defend-2v1-a.mp4.asset.json";
import defend2b from "@/assets/homework/videos/defend-2v1-b.mp4.asset.json";
import defend2c from "@/assets/homework/videos/defend-2v1-c.mp4.asset.json";
import widea from "@/assets/homework/videos/defend-wide-a.mp4.asset.json";
import wideb from "@/assets/homework/videos/defend-wide-b.mp4.asset.json";
import widec from "@/assets/homework/videos/defend-wide-c.mp4.asset.json";
import covera from "@/assets/homework/videos/defend-cover-a.mp4.asset.json";
import coverb from "@/assets/homework/videos/defend-cover-b.mp4.asset.json";
import coverc from "@/assets/homework/videos/defend-cover-c.mp4.asset.json";

export const scenarioVideos: Record<string, string[]> = {
  "attack-2v1": [attack2a.url, attack2b.url, attack2c.url],
  "attack-width": [widtha.url, widthb.url, widthc.url],
  "attack-scan": [scana.url, scanb.url, scanc.url],
  "defend-2v1": [defend2a.url, defend2b.url, defend2c.url],
  "defend-wide": [widea.url, wideb.url, widec.url],
  "defend-cover": [covera.url, coverb.url, coverc.url],
};