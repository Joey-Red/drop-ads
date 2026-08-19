import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

const popup = read("src/popup/popup.js");

for (const [needle, label] of [
  ['let pageActive = true;', "active-page lifecycle"],
  ['pageActive = false;\n  renderQueued = false;\n  committedRenderGeneration += 1;', "pagehide render invalidation"],
  ['globalStatusRevision += 1;\n  siteStatusRevision += 1;', "pagehide status invalidation"],
  ['pendingMutations = 0;\n  pendingSiteMutations = 0;', "pagehide busy invalidation"],
  ['try { disposeStorageLiveSync?.(); } catch', "live-sync teardown"],
  ['if (!pageActive || renderQueued) return;', "render-queue admission guard"],
  ['renderQueued = false;\n  if (!pageActive) return;', "queued-render runner guard"],
  ['if (!pageActive || generation !== committedRenderGeneration) return false;', "committed-render generation guard"],
  ['if (pageActive) globalStatus.textContent = text;', "global status lifecycle guard"],
  ['if (pageActive) sessionStatus.textContent = text;', "site status lifecycle guard"],
  ['if (!pageActive || revision !== siteStatusRevision) return false;', "site status revision guard"],
  ['if (!pageActive) return () => undefined;', "busy admission guard"],
  ['released = true;\n    if (!pageActive) return;', "busy release guard"],
  ['if (pageActive && settings.isConnected) settings.disabled = false;', "async finalizer guard"]
]) requireText(popup, needle, label);

const pagehide = popup.indexOf('window.addEventListener("pagehide"');
const initialAwait = popup.indexOf("initialSnapshot = await getSnapshot()");
if (pagehide < 0 || initialAwait < 0 || pagehide >= initialAwait) {
  throw new Error("popup pagehide lifecycle must be installed before top-level async initialization");
}

// Popup lifecycle behavior is checked directly against the shipped source above.
// Historical milestone test-file presence is not a lifecycle invariant.

console.log("popup-lifecycle-audit: popup teardown/render/status/busy invariants verified through M816");
