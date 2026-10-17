import attackPhoto from "@/assets/homework/attack-2v1.jpg";
import widthPhoto from "@/assets/homework/attack-width.jpg";
import scanPhoto from "@/assets/homework/attack-scan.jpg";
import widePhoto from "@/assets/homework/defend-wide.jpg";
import coverPhoto from "@/assets/homework/defend-cover.jpg";

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
];

export const findScenario = (id?: string | null) => HOMEWORK_SCENARIOS.find((s) => s.id === id);

/** Once confirmed, exploring other outcomes never replaces the first decision. */
export function retainFirstDecision(first: string | undefined, next: string): string { return first ?? next; }

export function scenarioDraft(scenario: HomeworkScenario) {
  return { id: null, question_type: "multiple_choice" as const, prompt: scenario.prompt,
    options: scenario.choices.map((c) => c.label), correct: [scenario.choices[scenario.best].label],
    required: true, scenario_id: scenario.id, scenario_media: {} as ScenarioMedia };
}