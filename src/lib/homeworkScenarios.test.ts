import { describe, it, expect } from "vitest";
import { HOMEWORK_SCENARIOS, scenarioDraft, retainFirstDecision } from "./homeworkScenarios";
import { scenarioVideos, scenarioWebmVideos } from "./homeworkScenarioVideos";

describe("scenario homework rules", () => {
  it("provides a distinct outcome video for every answer", () => {
    for (const scenario of HOMEWORK_SCENARIOS) {
      expect(scenarioVideos[scenario.id]).toHaveLength(scenario.choices.length);
      expect(new Set(scenarioVideos[scenario.id]).size).toBe(scenario.choices.length);
      expect(scenarioWebmVideos[scenario.id]).toHaveLength(scenario.choices.length);
    }
  });
  it("starts with the requested 2v1 attack and three choices", () => {
    expect(HOMEWORK_SCENARIOS[0].id).toBe("attack-2v1");
    expect(scenarioDraft(HOMEWORK_SCENARIOS[0]).options).toHaveLength(3);
  });
  it("includes attacking and defensive questions", () => {
    expect(HOMEWORK_SCENARIOS.filter((s) => s.category === "Attacking")).toHaveLength(5);
    expect(HOMEWORK_SCENARIOS.filter((s) => s.category === "Defending")).toHaveLength(5);
  });
  it("exploring an outcome cannot replace a confirmed first answer", () => {
    expect(retainFirstDecision("Dribble straight at the defender", "Shoot from distance")).toBe("Dribble straight at the defender");
    expect(retainFirstDecision(undefined, "Shoot from distance")).toBe("Shoot from distance");
  });
  it("creates a required multiple choice question with the coach answer key", () => {
    const draft = scenarioDraft(HOMEWORK_SCENARIOS[0]);
    expect(draft.required).toBe(true);
    expect(draft.question_type).toBe("multiple_choice");
    expect(draft.correct).toEqual(["Draw the defender, then pass to your teammate"]);
  });
});