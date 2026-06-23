import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "H-1",
    scenario: "H",
    description: "A governance rule is attributable to the actor that issued it",
    skip: true,
    skipCategory: "feature-absent",
    skipReason: "No executable governance-rule resource exists yet for issuer attribution.",
  },
];
