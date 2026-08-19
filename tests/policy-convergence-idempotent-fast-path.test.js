import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/policy-convergence.js", import.meta.url), "utf8");

test("policy convergence returns an existing registration before recapturing collaborators", () => {
  const install = source.indexOf("export function installPolicyConvergence");
  const apiRead = source.indexOf('const api = optionValue(options, "api")', install);
  const existingRead = source.indexOf("const existing = REGISTRATIONS.get(api)", apiRead);
  const fastReturn = source.indexOf("if (existing) return existing", existingRead);
  const controllerRead = source.indexOf('const controller = optionValue(options, "controller")', fastReturn);
  const loggerCapture = source.indexOf("const errorLog = suppliedError(options)", fastReturn);
  const eventCapture = source.indexOf("const events = requireApi(api)", fastReturn);
  assert.ok(install >= 0 && apiRead > install && existingRead > apiRead && fastReturn > existingRead);
  assert.ok(controllerRead > fastReturn && loggerCapture > fastReturn && eventCapture > fastReturn);
});
