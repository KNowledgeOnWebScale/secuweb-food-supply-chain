import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "J-1",
    scenario: "J",
    description: "A compliance assessor attributes a data-sharing operation to an actor",
    skip: true,
    skipCategory: "feature-absent",
    skipReason: "No compliance operation evidence exists yet for actor attribution.",
  },
];
