import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "A-1",
    scenario: "A",
    description: "The Packager reconstructs and verifies cross-actor product provenance",
    skip: true,
    skipCategory: "under-specified",
    skipReason: "The scenario still needs sharper acceptance criteria before a single executable check can represent it.",
  },
];
