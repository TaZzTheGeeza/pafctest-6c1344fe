import attackPhoto from "@/assets/homework/attack-2v1.jpg";
import widthPhoto from "@/assets/homework/attack-width.jpg";
import scanPhoto from "@/assets/homework/attack-scan.jpg";
import widePhoto from "@/assets/homework/defend-wide.jpg";
import coverPhoto from "@/assets/homework/defend-cover.jpg";
import giveGoPhoto from "@/assets/homework/attack-give-go.jpg";
import cutbackPhoto from "@/assets/homework/attack-cutback.jpg";
import recoveryPhoto from "@/assets/homework/defend-recovery.jpg";
import goalSidePhoto from "@/assets/homework/defend-goal-side.jpg";

export interface ScenarioChoice { label: string; outcome: string }
export interface HomeworkScenario {
  id: string; category: "Attacking" | "Defending"; title: string; situation: string;
  prompt: string; photo: string; choices: ScenarioChoice[]; best: number; principle: string;
}
export interface ScenarioMedia { photo?: string; videos?: Record<string, string> }

export const SCENARIO_SOURCES = [
  { title: "England Football: overloads and finishing", url: "https://learn.englandfootball.com/sessions/resources/2022/Finishing-session-overloads-underloads-and-matched-up-numbers" },
  { title: "England Football: individual tactics", url: "https://learn.englandfootball.com/articles-and-resources/coaching/resources/2024/How-to-help-players-develop-individual-tactics" },
  { title: "England Football: pressing and covering", url: "https://learn.englandfootball.com/sessions/resources/2025/Session-programme-pressing-and-covering-to-stop-goals" },
  { title: "FIFA Training Centre: defending 1v1", url: "https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/deny-and-protect/defending-in-1v1-orientating-attackers-away-from-goal.php" },
];

export const HOMEWORK_SCENARIOS: HomeworkScenario[] = [
  { id: "attack-2v1", category: "Attacking", title: "2v1 attack", photo: attackPhoto,
    situation: "You have the ball outside the box. One defender stands between you and goal. Your teammate is onside and free on your right. The goalkeeper is ready, and the defender starts moving towards you.",
    prompt: "How do you use the extra player?", best: 1, principle: "Draw the defender, then use the space they leave. If they protect the pass instead, carry the ball into the open space.",
    choices: [
      { label: "Dribble straight at the defender", outcome: "The defender can tackle you before you get past. Your free teammate never gets involved." },
      { label: "Draw the defender, then pass to your teammate", outcome: "As the defender commits to you, the pass reaches your teammate in space and creates a clearer shooting chance." },
      { label: "Shoot from distance", outcome: "With the goalkeeper set and a defender in the way, the shot can be saved or blocked. You miss the chance to get closer together." },
    ] },
  { id: "attack-width", category: "Attacking", title: "Make the pitch bigger", photo: widthPhoto,
    situation: "Your teammate has the ball centrally. Two defenders crowd the middle. You are the supporting attacker on the right, with space beside the touchline.",
    prompt: "Where should you move to help?", best: 0, principle: "Width stretches defenders and creates passing lanes. Stay available, then move as the ball travels.",
    choices: [
      { label: "Stay wide and offer a clear passing option", outcome: "Your teammate can pass into the free wide space. The defenders have to spread out, opening more room inside." },
      { label: "Run into the crowded centre", outcome: "You bring another player into an already crowded area. A central pass can be intercepted." },
      { label: "Stand directly behind a defender", outcome: "The defender blocks the passing lane. Your teammate cannot find you with a clear pass." },
    ] },
  { id: "attack-scan", category: "Attacking", title: "Look before you receive", photo: scanPhoto,
    situation: "A pass is coming to you. A defender presses from behind your left shoulder. There is open space to your right, but you need to look to spot it.",
    prompt: "What should you do before your first touch?", best: 0, principle: "Check your shoulders before the ball arrives. Use what you see to decide where to take your first touch.",
    choices: [
      { label: "Scan, open your body and touch into the free space", outcome: "You spot the pressure early and take the ball right, away from the defender, ready to play forward." },
      { label: "Take a blind touch towards your left", outcome: "Your touch takes the ball towards the pressing defender, who can win it." },
      { label: "Stop the ball and wait", outcome: "Waiting gives the defender time to close you down and reduces your options." },
    ] },
  { id: "defend-2v1", category: "Defending", title: "Outnumbered: defend the 2v1", photo: attackPhoto,
    situation: "You are the red defender facing two attackers. One carries the ball, the other is free to their right. A teammate is recovering behind you. Your goalkeeper is set.",
    prompt: "How can you give your team time to recover?", best: 1, principle: "Protect the dangerous central route and delay. Stay balanced, watch the ball and be ready to react to a poor touch.",
    choices: [
      { label: "Rush straight at the ball carrier", outcome: "The attacker can pass around you to the free teammate, leaving an open route to goal." },
      { label: "Drop centrally, protect the pass and delay", outcome: "You slow the move and make the central pass harder. Your recovering teammate has time to help." },
      { label: "Only mark the attacker without the ball", outcome: "The ball carrier can drive directly towards goal because nobody protects their route." },
    ] },
  { id: "defend-wide", category: "Defending", title: "Show them away from goal", photo: widePhoto,
    situation: "A winger has the ball near the touchline. You are between them and goal, with time to approach under control. The central route is the biggest danger.",
    prompt: "How should you approach the winger?", best: 0, principle: "Approach under control and get side-on. Guide play away from goal without diving into a tackle.",
    choices: [
      { label: "Stay side-on and guide them towards the touchline", outcome: "You make the route inside harder and keep the attacker in a less dangerous wide area." },
      { label: "Dive into a tackle immediately", outcome: "A mistimed challenge lets the winger take the ball inside and get beyond you." },
      { label: "Leave the winger and run back to the goalkeeper", outcome: "The winger can carry the ball forward without pressure and choose a pass or shot." },
    ] },
  { id: "defend-cover", category: "Defending", title: "Be the covering defender", photo: coverPhoto,
    situation: "Your teammate is pressing the ball carrier. You are the second red defender, slightly behind and inside. Another attacker is available wide.",
    prompt: "Where are you most useful?", best: 0, principle: "One player applies pressure; the other covers. Stay close enough to help, protect space behind and communicate.",
    choices: [
      { label: "Cover diagonally behind your teammate", outcome: "If the attacker beats the first defender, you are positioned to intercept or slow them down." },
      { label: "Chase the same attacker together", outcome: "Both defenders get drawn to the ball. A pass can release the other attacker into the space you left." },
      { label: "Stay far away and watch", outcome: "If your teammate is beaten, you are too far away to help and the attacker can progress." },
    ] },
  { id: "attack-give-go", category: "Attacking", title: "Pass and move", photo: giveGoPhoto,
    situation: "You have the ball outside the box. A defender is closing you down. Your teammate is ahead on your right, with space behind the defender for you to run into.",
    prompt: "What should you do after passing?", best: 0, principle: "A pass is not the end of your involvement. Move into useful space and offer a return pass, staying onside.",
    choices: [
      { label: "Pass, then run beyond the defender for a return", outcome: "Your run gives your teammate a forward option. A well-timed return pass can put you into the space behind the defender." },
      { label: "Pass, then stand still", outcome: "Your teammate receives the ball but has no moving forward option. The defender has time to get back into position." },
      { label: "Keep the ball and dribble towards the defender", outcome: "The defender can close the space and tackle you. Your available teammate never gets a chance to help." },
    ] },
  { id: "attack-cutback", category: "Attacking", title: "Find the cutback", photo: cutbackPhoto,
    situation: "You are near the right byline with a tight shooting angle. The goalkeeper and defenders cover the near post. A teammate is arriving unmarked near the penalty spot.",
    prompt: "Where is the clearest chance?", best: 1, principle: "Look up before playing the final ball. A cutback can find a teammate facing goal while defenders are looking towards their own goal.",
    choices: [
      { label: "Shoot towards the crowded near post", outcome: "The goalkeeper covers the tight angle and can save the shot. Your teammate's clearer shooting position goes unused." },
      { label: "Pull the ball back to your arriving teammate", outcome: "The pass travels away from the crowded goalmouth. Your teammate meets it in space with a clearer view of goal." },
      { label: "Lift a high cross into the marked goalmouth", outcome: "The defenders are already in position to challenge for the cross and can clear it before your team gets a shot." },
    ] },
  { id: "defend-recovery", category: "Defending", title: "Recover towards goal", photo: recoveryPhoto,
    situation: "Your team has lost the ball. An attacker carries it towards goal with a teammate wide. You are the red defender behind play, and the central route to goal is open.",
    prompt: "Where should your recovery run take you?", best: 1, principle: "React quickly when possession changes. Recover towards the dangerous space between the ball and your goal, then slow the attack under control.",
    choices: [
      { label: "Chase the ball directly from behind", outcome: "The attacker can stay ahead of you. Chasing their current position leaves the route to goal open." },
      { label: "Recover inside towards goal, then delay the attacker", outcome: "Your diagonal run helps protect the central route. Getting into a balanced position can slow the attack and give teammates time to recover." },
      { label: "Stop running and appeal for a foul", outcome: "If play continues, the attacker can carry on towards goal without you helping to protect it." },
    ] },
  { id: "defend-goal-side", category: "Defending", title: "Stay goal-side", photo: goalSidePhoto,
    situation: "You are marking a runner near the box. A wide attacker has the ball and is preparing a pass. Your goal is behind you, so you need to track the runner as well as the ball.",
    prompt: "How can you protect the space behind you?", best: 2, principle: "Stay between your opponent and goal. Adjust your body so you can see the ball and the runner, and move as they move.",
    choices: [
      { label: "Watch only the ball", outcome: "The runner can move behind you while you are looking away. The wide player can pass into the space they reach." },
      { label: "Stand on the side of the runner furthest from goal", outcome: "The runner has a head start towards goal and can receive the pass closer to goal than you." },
      { label: "Stay goal-side, see both players and follow the run", outcome: "You stay in position to challenge or intercept the pass, making it harder for the runner to receive behind you." },
    ] },
];

export const findScenario = (id?: string | null) => HOMEWORK_SCENARIOS.find((s) => s.id === id);

/** Once confirmed, exploring other outcomes never replaces the first decision. */
export function retainFirstDecision(first: string | undefined, next: string): string { return first ?? next; }

export function scenarioDraft(scenario: HomeworkScenario) {
  return { id: null, question_type: "multiple_choice" as const, prompt: scenario.prompt,
    options: scenario.choices.map((c) => c.label), correct: [scenario.choices[scenario.best].label],
    required: true, scenario_id: scenario.id, scenario_media: {} as ScenarioMedia };
}