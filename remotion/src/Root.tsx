import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { MainVideoV2 } from "./MainVideoV2";

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
  </>
);
