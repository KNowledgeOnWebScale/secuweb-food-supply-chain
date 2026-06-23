import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "D-1",
    scenario: "D",
    description: "An auditor verifies that a shipment access followed a governance rule",
    skip: true,
    skipCategory: "feature-absent",
    skipReason: "No governance audit log exists yet to correlate a rule, access decision, and actor.",
  },
];
