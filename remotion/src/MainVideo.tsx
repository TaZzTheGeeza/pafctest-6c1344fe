import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { SceneIntro } from "./scenes/SceneIntro";
import { SceneScreenshot } from "./scenes/SceneScreenshot";
import { SceneOutro } from "./scenes/SceneOutro";

const TRANS_DUR = 20;

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Background gradient that shifts through the video
  const hueShift = interpolate(frame, [0, 2700], [0, 30]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Subtle animated background */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 30% 50%, hsla(${38 + hueShift}, 45%, 15%, 0.4) 0%, transparent 70%),
                       radial-gradient(ellipse at 70% 80%, hsla(${38 + hueShift}, 40%, 10%, 0.3) 0%, transparent 60%)`,
        }}
      />

      {/* Scene transitions */}
      <TransitionSeries>
        {/* Scene 1: Intro */}
        <TransitionSeries.Sequence durationInFrames={383}>
          <SceneIntro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS_DUR })}
        />

        {/* Scene 2: Teams */}
        <TransitionSeries.Sequence durationInFrames={345}>
          <SceneScreenshot
            screenshotSrc={staticFile("screenshots/03-teams.png")}
            title="OUR TEAMS"
            subtitle="10 teams · U7 to U14"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANS_DUR })}
        />

        {/* Scene 3: Tournament */}
        <TransitionSeries.Sequence durationInFrames={357}>
          <SceneScreenshot
            screenshotSrc={staticFile("screenshots/04-tournament.png")}
            title="TOURNAMENT 2026"
            subtitle="Enter your team online"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: TRANS_DUR })}
        />

        {/* Scene 4: Shop */}
        <TransitionSeries.Sequence durationInFrames={307}>
          <SceneScreenshot
            screenshotSrc={staticFile("screenshots/05-shop.png")}
            title="CLUB SHOP"
            subtitle="Official PAFC merchandise"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS_DUR })}
        />

        {/* Scene 5: PAFC TV */}
        <TransitionSeries.Sequence durationInFrames={344}>
          <SceneScreenshot
            screenshotSrc={staticFile("screenshots/06-pafctv.png")}
            title="PAFC TV"
            subtitle="Watch · Subscribe · Replay"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: TRANS_DUR })}
        />

        {/* Scene 6: Raffle */}
        <TransitionSeries.Sequence durationInFrames={321}>
          <SceneScreenshot
            screenshotSrc={staticFile("screenshots/08-raffle.png")}
            title="CLUB RAFFLE"
            subtitle="Win prizes · Support the club"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANS_DUR })}
        />

        {/* Scene 7: Contact */}
        <TransitionSeries.Sequence durationInFrames={257}>
          <SceneScreenshot
            screenshotSrc={staticFile("screenshots/07-contact.png")}
            title="CONTACT US"
            subtitle="Get in touch"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS_DUR })}
        />

        {/* Scene 8: Outro */}
        <TransitionSeries.Sequence durationInFrames={350}>
          <SceneOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Audio voiceovers - sequential timing */}
      <Sequence from={0}>
        <Audio src={staticFile("audio/01-intro.mp3")} />
      </Sequence>
      <Sequence from={383 - TRANS_DUR}>
        <Audio src={staticFile("audio/02-teams.mp3")} />
      </Sequence>
      <Sequence from={383 + 345 - 2 * TRANS_DUR}>
        <Audio src={staticFile("audio/03-tournament.mp3")} />
      </Sequence>
      <Sequence from={383 + 345 + 357 - 3 * TRANS_DUR}>
        <Audio src={staticFile("audio/04-shop.mp3")} />
      </Sequence>
      <Sequence from={383 + 345 + 357 + 307 - 4 * TRANS_DUR}>
        <Audio src={staticFile("audio/05-pafctv.mp3")} />
      </Sequence>
      <Sequence from={383 + 345 + 357 + 307 + 344 - 5 * TRANS_DUR}>
        <Audio src={staticFile("audio/06-raffle.mp3")} />
      </Sequence>
      <Sequence from={383 + 345 + 357 + 307 + 344 + 321 - 6 * TRANS_DUR}>
        <Audio src={staticFile("audio/07-contact.mp3")} />
      </Sequence>
      <Sequence from={383 + 345 + 357 + 307 + 344 + 321 + 257 - 7 * TRANS_DUR}>
        <Audio src={staticFile("audio/08-outro.mp3")} />
      </Sequence>
    </AbsoluteFill>
  );
};
