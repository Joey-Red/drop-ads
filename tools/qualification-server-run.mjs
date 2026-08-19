import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { applyQualificationFixtureBounds } from "./qualification-server-bounds.mjs";
import { DEFAULT_PORT, startQualificationServer } from "./qualification-server.mjs";
import { snapshotQualificationServerOptions } from "./qualification-server-options.mjs";
import { installQualificationRequestGuards } from "./qualification-server-request-guard.mjs";

export function qualificationServerOptionsFromEnvironment(environment = process.env) {
  const port = environment.DROP_ADS_QUALIFY_PORT ?? DEFAULT_PORT;
  return snapshotQualificationServerOptions({ port, quiet: false }, DEFAULT_PORT);
}

export async function runQualificationServer(options) {
  const safe = snapshotQualificationServerOptions(options, DEFAULT_PORT);
  const fixture = await startQualificationServer(safe);
  applyQualificationFixtureBounds(fixture);
  return installQualificationRequestGuards(fixture);
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  runQualificationServer(qualificationServerOptionsFromEnvironment()).catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
