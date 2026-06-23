import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "L-1",
    scenario: "L",
    description: "An explicit governance rule authorizes the Packager and excludes other actors",
    skip: true,
    skipCategory: "feature-absent",
    skipReason: "No executable governance-rule model exists yet to compare against runtime authorization.",
  },
];
