import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { qualificationScenarioGuidance } from "./qualification-scenario-guide.mjs";
import { cookieBannerQualificationPhase } from "./qualification-cookie-banner-checklist.mjs";
import { cookieBannerQualificationFixture } from "./qualification-cookie-banner-fixtures.mjs";

export function qualificationScenarioCommand(argv) {
  if (!Array.isArray(argv) || (argv.length !== 1 && argv.length !== 3) || typeof argv[0] !== "string" || !argv[0]) {
    throw new TypeError("qualification scenario guidance accepts a scenario id and optional --phase phase-id");
  }
  const id = argv[0];
  const guidance = qualificationScenarioGuidance(id);
  if (argv.length === 1) return Object.freeze({ schemaVersion: 1, scenario: id, guidance });
  if (argv[1] !== "--phase" || typeof argv[2] !== "string" || !argv[2]) {
    throw new TypeError("qualification scenario phase guidance requires --phase phase-id");
  }
  if (id !== "cookie-banner-rejection" || !guidance) {
    throw new TypeError("qualification scenario does not expose phase guidance");
  }
  const phase = cookieBannerQualificationPhase(argv[2]);
  if (!guidance.phases.includes(phase.id)) throw new TypeError("qualification scenario phase is not canonical");
  const fixtures = Object.freeze(phase.fixtureIds.map((fixtureId) => cookieBannerQualificationFixture(fixtureId)));
  return Object.freeze({ schemaVersion: 1, scenario: id, phase, fixtures });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    const result = qualificationScenarioCommand(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
