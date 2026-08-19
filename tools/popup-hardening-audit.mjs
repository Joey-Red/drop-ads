import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function requireMatch(source, pattern, label) {
  if (!pattern.test(source)) throw new Error(`${label} is missing`);
}

const html = read("src/popup/index.html");
const semantics = read("src/popup/popup-semantics.js");
const popup = read("src/popup/popup.js");

for (const [needle, label] of [
  ['id="popup-privacy-note">Local only · no telemetry</span>', "visible popup privacy cue"],
  ['id="enabled" type="checkbox" aria-label="Global blocking" aria-describedby="global-status global-help popup-privacy-note"', "global blocking privacy association"],
  ['id="settings" type="button" aria-describedby="global-status popup-privacy-note"', "Settings privacy association"],
  ['<script type="module" src="popup-semantics.js"></script>', "popup semantics module"]
]) requireText(html, needle, label);

for (const [needle, label] of [
  ['pauseSite.setAttribute("aria-pressed", paused ? "true" : "false")', "session pause toggle state"],
  ['siteEnabled?.setAttribute("aria-label", `Protection on ${site}`)', "site protection accessible name"],
  ['cookieSiteEnabled?.setAttribute("aria-label", `Cookie protection on ${site}`)', "site cookie accessible name"],
  ['pickElement?.setAttribute("aria-label", `Pick element to block on ${site}`)', "picker accessible name"],
  ['return "Cookie protection is disabled for this site by a local exception.";', "cookie exception derived status"],
  ['if (!pageActive || !sessionStatus || popupMain?.getAttribute("aria-busy") === "true") return;', "derived status lifecycle/busy guard"],
  ['window.addEventListener("pagehide", () => {', "popup semantics teardown"],
  ['siteLabelObserver?.disconnect()', "site label observer teardown"]
]) requireText(semantics, needle, label);

for (const [needle, label] of [
  ['let pageActive = true;', "popup page lifecycle flag"],
  ['pageActive = false;', "popup pagehide invalidation"],
  ['committedRenderGeneration += 1;', "committed render invalidation"],
  ['globalStatusRevision += 1;', "global status invalidation"],
  ['siteStatusRevision += 1;', "site status invalidation"],
  ['pendingMutations = 0;', "busy accounting invalidation"],
  ['if (!pageActive) return () => undefined;', "busy admission lifecycle guard"],
  ['if (!pageActive) return;', "busy release lifecycle guard"],
  ['if (!pageActive || generation !== committedRenderGeneration) return false;', "async committed render guard"],
  ['if (!pageActive || renderQueued) return;', "render queue lifecycle guard"],
  ['if (pageActive && enabled.isConnected) enabled.disabled = false;', "global finalizer lifecycle guard"],
  ['if (pageActive && siteEnabled.isConnected) siteEnabled.disabled = false;', "site finalizer lifecycle guard"],
  ['if (pageActive && cookieSiteEnabled.isConnected) cookieSiteEnabled.disabled = false;', "cookie finalizer lifecycle guard"],
  ['if (pageActive && pickElement.isConnected) pickElement.disabled = false;', "picker finalizer lifecycle guard"]
]) requireText(popup, needle, label);

for (const [pattern, label] of [
  [/function publishGlobalStatus\(text\)[\s\S]*if \(pageActive\) globalStatus\.textContent = text;/, "global status active-page publication"],
  [/function publishCommittedSiteStatus\(text, revision\)[\s\S]*if \(!pageActive \|\| revision !== siteStatusRevision\) return false;/, "site status revision/lifecycle guard"],
  [/function runCommittedRender\(\)[\s\S]*if \(!pageActive\) return;/, "queued render execution lifecycle guard"]
]) requireMatch(popup, pattern, label);

for (const path of [
  "tests/popup-session-pause-pressed-v799.test.js",
  "tests/popup-site-control-labels-v800.test.js",
  "tests/popup-cookie-exception-status-v801.test.js",
  "tests/popup-global-privacy-cue-v802.test.js",
  "tests/popup-page-lifecycle-v803.test.js",
  "tests/popup-render-queue-lifecycle-v804.test.js",
  "tests/popup-status-lifecycle-v805.test.js",
  "tests/popup-busy-finalizer-lifecycle-v806.test.js"
]) {
  if (!fs.existsSync(new URL(`../${path}`, import.meta.url))) throw new Error(`required popup regression is missing: ${path}`);
}

console.log("popup-hardening-audit: popup semantics and lifecycle invariants verified through canonical M816");
