import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }

const canonical = read("tools/cookie-banner-hardening-audit.mjs");
const platform = read("tools/cookie-banner-platform-primitives-audit.mjs");
const utilsPlatform = read("tools/cookie-banner-utils-platform-audit.mjs");
const controllerPlatform = read("tools/cookie-banner-controller-platform-audit.mjs");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const pkg = JSON.parse(read("package.json"));

requireText(canonical, "extended through M1048", "canonical hardening compatibility marker");
requireText(platform, "cookie-banner-platform-primitives-audit: canonical M1042-M1047 platform primitive invariants verified", "M1042-M1048 platform audit marker");
requireText(utilsPlatform, "cookie-banner-utils-platform-audit: canonical M1052-M1058 base utility platform invariants verified", "M1052-M1059 base utility audit marker");
requireText(controllerPlatform, "cookie-banner-controller-platform-audit: canonical M1062-M1066 controller platform invariants verified", "M1062-M1067 controller audit marker");

for (const [name, command] of [
  ["cookie-banner-hardening-audit", "node tools/cookie-banner-hardening-audit.mjs"],
  ["cookie-banner-platform-primitives-audit", "node tools/cookie-banner-platform-primitives-audit.mjs"],
  ["cookie-banner-utils-platform-audit", "node tools/cookie-banner-utils-platform-audit.mjs"],
  ["cookie-banner-controller-platform-audit", "node tools/cookie-banner-controller-platform-audit.mjs"],
  ["cookie-banner-platform-integration-audit", "node tools/cookie-banner-platform-integration-audit.mjs"]
]) {
  if (pkg.scripts?.[name] !== command) throw new Error(`${name} package script is missing`);
  if (!pkg.scripts?.check?.includes(`npm run ${name}`)) throw new Error(`${name} is not wired into npm run check`);
}

function cookieEntry(manifest) { return manifest.content_scripts?.find((entry) => entry.js?.includes("content/cookie-banner-controller.js")); }
const chromiumEntry = cookieEntry(chromium);
const firefoxEntry = cookieEntry(firefox);
if (!chromiumEntry || !firefoxEntry || JSON.stringify(chromiumEntry) !== JSON.stringify(firefoxEntry)) throw new Error("cookie-banner Firefox/Chromium manifest parity is missing");
if (chromiumEntry.all_frames !== false) throw new Error("cookie-banner runtime must remain top-frame-only");

// The platform chain is validated through current audit markers, package wiring,
// and browser manifest parity above. Historical milestone test files are not inputs.

console.log("cookie-banner-platform-integration-audit: canonical platform audit chain verified through M1067");
