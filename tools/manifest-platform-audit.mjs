import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const chromium = JSON.parse(await readFile(resolve(root, "manifests/chromium.json"), "utf8"));
const firefox = JSON.parse(await readFile(resolve(root, "manifests/firefox.json"), "utf8"));
const violations = [];

const sharedAction = { default_title: "drop-ads", default_popup: "popup/index.html" };
const sharedOptions = { page: "options/index.html", open_in_tab: true };
const chromiumBackground = { service_worker: "background.js", type: "module" };
const firefoxBackground = { scripts: ["background.js"], type: "module" };
const firefoxDnr = { rule_resources: [{ id: "bootstrap", enabled: true, path: "rules/static.json" }] };
const firefoxSettings = { gecko: { id: "drop-ads@local.invalid", strict_min_version: "128.0" } };

const exact = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);

if (!exact(chromium.background, chromiumBackground)) violations.push("chromium: background launch contract changed");
if (!exact(firefox.background, firefoxBackground)) violations.push("firefox: background launch contract changed");
for (const [browser, manifest] of [["chromium", chromium], ["firefox", firefox]]) {
  if (!exact(manifest.action, sharedAction)) violations.push(`${browser}: action popup contract changed`);
  if (!exact(manifest.options_ui, sharedOptions)) violations.push(`${browser}: options UI contract changed`);
}
if (chromium.declarative_net_request != null) violations.push("chromium: Firefox compatibility DNR declaration must remain absent");
if (chromium.browser_specific_settings != null) violations.push("chromium: Firefox browser-specific settings must remain absent");
if (!exact(firefox.declarative_net_request, firefoxDnr)) violations.push("firefox: bootstrap DNR compatibility contract changed");
if (!exact(firefox.browser_specific_settings, firefoxSettings)) violations.push("firefox: Gecko identity/minimum-version contract changed");

if (violations.length) {
  console.error("Manifest platform audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Manifest platform audit passed: browser launch/UI and Firefox compatibility boundaries remain exact.");
}
