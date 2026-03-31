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
import { SceneIntroV2 } from "./scenes/SceneIntroV2";
import { SceneFeatureHighlight } from "./scenes/SceneFeatureHighlight";
import { SceneOutroV2 } from "./scenes/SceneOutroV2";

const T = 20; // transition duration

const SCENES = [
  { dur: 462, audio: "01-intro.mp3" },
  { dur: 347, audio: "02-hub-overview.mp3" },
  { dur: 506, audio: "03-hub-chat.mp3" },
  { dur: 474, audio: "04-hub-availability.mp3" },
  { dur: 553, audio: "05-hub-payments.mp3" },
  { dur: 552, audio: "06-hub-meetings.mp3" },
  { dur: 893, audio: "07-hub-extras.mp3" },
  { dur: 370, audio: "08-tournament-intro.mp3" },
  { dur: 564, audio: "09-tournament-detail.mp3" },
  { dur: 526, audio: "10-tournament-admin.mp3" },
  { dur: 531, audio: "11-dashboard.mp3" },
  { dur: 1017, audio: "12-raffle-overview.mp3" },
  { dur: 943, audio: "13-raffle-admin.mp3" },
  { dur: 709, audio: "14-sales-pitch.mp3" },
  { dur: 614, audio: "15-outro.mp3" },
];

function getAudioStarts() {
  const starts: number[] = [0];
  let pos = 0;
  for (let i = 1; i < SCENES.length; i++) {
    pos += SCENES[i - 1].dur - T;
    starts.push(pos);
  }
  return starts;
}

export const MainVideoV2: React.FC = () => {
  const frame = useCurrentFrame();
  const audioStarts = getAudioStarts();
  const hueShift = interpolate(frame, [0, 9000], [0, 50]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 30% 50%, hsla(${38 + hueShift}, 45%, 12%, 0.3) 0%, transparent 70%)`,
        }}
      />

      <TransitionSeries>
        {/* 0: Intro */}
        <TransitionSeries.Sequence durationInFrames={SCENES[0].dur}>
          <SceneIntroV2 />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        {/* 1: Hub Overview */}
        <TransitionSeries.Sequence durationInFrames={SCENES[1].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/hub-chat.png")}
            title="THE CLUB HUB"
            subtitle="YOUR PRIVATE COMMAND CENTRE"
            bullets={[
              "Replaces WhatsApp groups & paper lists",
              "One unified system for every team",
              "Role-based access for coaches, parents & players",
            ]}
            layout="left"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />

        {/* 2: Hub Chat */}
        <TransitionSeries.Sequence durationInFrames={SCENES[2].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/hub-chat.png")}
            title="TEAM CHAT"
            subtitle="REAL-TIME COMMUNICATION"
            bullets={[
              "Dedicated channels per team",
              "Coaches, parents & players connected",
              "Team-isolated — U7 sees only U7",
            ]}
            layout="right"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={linearTiming({ durationInFrames: T })} />

        {/* 3: Hub Availability */}
        <TransitionSeries.Sequence durationInFrames={SCENES[3].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/hub-availability.png")}
            title="AVAILABILITY"
            subtitle="MATCH DAY HEADCOUNT"
            bullets={[
              "Yes / No / Maybe per fixture",
              "Live headcount for coaches",
              "Parents respond for multiple children",
            ]}
            layout="left"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        {/* 4: Hub Payments */}
        <TransitionSeries.Sequence durationInFrames={SCENES[4].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/hub-payments.png")}
            title="PAYMENTS"
            subtitle="STRIPE-POWERED · AUTOMATED"
            bullets={[
              "Monthly direct debit subscriptions",
              "One-off payment requests for kit & trips",
              "No more chasing cash",
            ]}
            layout="right"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={linearTiming({ durationInFrames: T })} />

        {/* 5: Hub Meetings */}
        <TransitionSeries.Sequence durationInFrames={SCENES[5].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/hub-meetings.png")}
            title="VIDEO MEETINGS"
            subtitle="BUILT-IN CONFERENCING"
            bullets={[
              "Schedule & host directly in-platform",
              "Triple notification — email, push & in-app",
              "Committee meetings, coach briefings, AGMs",
            ]}
            layout="left"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />

        {/* 6: Hub Extras (with carpool screenshot) */}
        <TransitionSeries.Sequence durationInFrames={SCENES[6].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/hub-carpool.png")}
            title="AND MORE..."
            subtitle="CARPOOL · ATTENDANCE · GUARDIANS"
            bullets={[
              "Carpool board for away game lifts",
              "Attendance tracking & stats for coaches",
              "Guardian system links parents to children",
              "Notification centre keeps everyone informed",
            ]}
            layout="right"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        {/* 7: Tournament Intro */}
        <TransitionSeries.Sequence durationInFrames={SCENES[7].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/tournament-overview.png")}
            title="TOURNAMENT SYSTEM"
            subtitle="ENTRY TO FINAL WHISTLE"
            bullets={[
              "Complete tournament management",
              "Online registration & payment",
              "Not just a signup form",
            ]}
            layout="left"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />

        {/* 8: Tournament Detail */}
        <TransitionSeries.Sequence durationInFrames={SCENES[8].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/tournament-overview.png")}
            title="8 AGE GROUPS"
            subtitle="U7 — U14 · 5v5 & 7v7"
            bullets={[
              "Configurable team caps & match formats",
              "Automatic group stage logic",
              "Digital squad list submission",
              "Stripe-powered entry fee collection",
            ]}
            layout="right"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={linearTiming({ durationInFrames: T })} />

        {/* 9: Tournament Admin */}
        <TransitionSeries.Sequence durationInFrames={SCENES[9].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/tournament-bottom.png")}
            title="ADMIN TOOLS"
            subtitle="MANAGE FROM YOUR PHONE"
            bullets={[
              "Schedule matches & enter live scores",
              "Custom pitch layout SVG map",
              "Quick enquiry form for questions",
              "Reminders, stats & real-time updates",
            ]}
            layout="left"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        {/* 10: Dashboard */}
        <TransitionSeries.Sequence durationInFrames={SCENES[10].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/dashboard.png")}
            title="ADMIN DASHBOARD"
            subtitle="EVERYTHING IN ONE PLACE"
            bullets={[
              "User & role management",
              "Coach tools — match reports & POTM cards",
              "Safeguarding, documents & registrations",
              "Secure, role-gated access",
            ]}
            layout="right"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={linearTiming({ durationInFrames: T })} />

        {/* 11: Raffle Overview */}
        <TransitionSeries.Sequence durationInFrames={SCENES[11].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/raffle-create.png")}
            title="CLUB RAFFLE"
            subtitle="DIGITAL FUNDRAISING"
            bullets={[
              "Create raffles in seconds — title, prize & price",
              "Visual number grid for supporters",
              "Instant Stripe payments per ticket",
              "No spreadsheets, no cash handling",
            ]}
            layout="left"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />

        {/* 12: Raffle Admin */}
        <TransitionSeries.Sequence durationInFrames={SCENES[12].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/raffle-admin.png")}
            title="RAFFLE ADMIN"
            subtitle="DRAW · TRACK · REPEAT"
            bullets={[
              "Live ticket sales & revenue dashboard",
              "One-click random winner draw",
              "Auto-draw when sold out option",
              "Run multiple raffles simultaneously",
            ]}
            layout="right"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        {/* 13: Sales Pitch */}
        <TransitionSeries.Sequence durationInFrames={SCENES[13].dur}>
          <SceneFeatureHighlight
            screenshotSrc={staticFile("screenshots/01-homepage.png")}
            title="PLUS EVERYTHING ELSE"
            subtitle="A COMPLETE CLUB ECOSYSTEM"
            bullets={[
              "Club shop powered by Shopify",
              "PAFC TV pulling YouTube content",
              "News, events, gallery & player registration",
              "Everything a grassroots club needs",
            ]}
            layout="left"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        {/* 14: Outro */}
        <TransitionSeries.Sequence durationInFrames={SCENES[14].dur}>
          <SceneOutroV2 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Audio */}
      {SCENES.map((scene, i) => (
        <Sequence key={i} from={audioStarts[i]}>
          <Audio src={staticFile(`audio/${scene.audio}`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
