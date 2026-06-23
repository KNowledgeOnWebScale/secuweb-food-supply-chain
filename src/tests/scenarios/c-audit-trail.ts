import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "C-1",
    scenario: "C",
    description: "The Farmer inspects recorded access and update operations for shared data",
    skip: true,
    skipCategory: "feature-absent",
    skipReason: "No audit log mechanism exists yet, so the architecture cannot produce the required read/update operation evidence.",
  },
];
