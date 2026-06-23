import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "F-1",
    scenario: "F",
    description: "A compliance assessor obtains a complete data-sharing evidence package",
    skip: true,
    skipCategory: "feature-absent",
    skipReason: "No compliance evidence package feature exists yet for controller, recipient, policy, log, and resource evidence.",
  },
];
