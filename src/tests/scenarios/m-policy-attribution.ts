import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "M-1",
    scenario: "M",
    description: "An auditor verifies the policy basis for the Packager access grant",
    skip: true,
    skipCategory: "feature-absent",
    skipReason: "No access-decision evidence exists yet to attribute the Packager grant to a policy basis.",
  },
];
