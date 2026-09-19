import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { MainVideoV2 } from "./MainVideoV2";
import { MainVideoSales, TOTAL_FRAMES as SALES_TOTAL } from "./MainVideoSales";
import { MainVideoMagna, TOTAL as MAGNA_TOTAL } from "./MainVideoMagna";
import { MainVideoYourClub, TOTAL as YC_TOTAL } from "./MainVideoYourClub";
import { MainVideoMyFamily, MY_FAMILY_TOTAL } from "./MainVideoMyFamily";
import { MainVideoHomework, HOMEWORK_TOTAL } from "./MainVideoHomework";
import { MainVideoHomeworkParents, HOMEWORK_PARENT_TOTAL } from "./MainVideoHomeworkParents";

const V2_SCENES = [462, 347, 506, 474, 553, 552, 893, 370, 564, 526, 531, 1017, 943, 709, 614];
const V2_TRANS = 20;
const V2_TOTAL = V2_SCENES.reduce((a, b) => a + b, 0) - (V2_SCENES.length - 1) * V2_TRANS;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={2700}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="sales-pitch"
      component={MainVideoV2}
      durationInFrames={V2_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="club-platform-sales"
      component={MainVideoSales}
      durationInFrames={SALES_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="magna-overview"
      component={MainVideoMagna}
      durationInFrames={MAGNA_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="your-club-overview"
      component={MainVideoYourClub}
      durationInFrames={YC_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="my-family-explainer-v2"
      component={MainVideoMyFamily}
      durationInFrames={MY_FAMILY_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="homework-coach-showcase"
      component={MainVideoHomework}
      durationInFrames={HOMEWORK_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="homework-parent-showcase"
      component={MainVideoHomeworkParents}
      durationInFrames={HOMEWORK_PARENT_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
