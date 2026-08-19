import fs from "node:fs";

const SETTINGS_SOURCES = [
  "src/options/options.js",
  "src/options/country.js",
  "src/options/cosmetics.js",
  "src/options/action-count.js",
  "src/core/options-runtime.js",
  "src/core/options-storage-listener.js"
];

const FORBIDDEN_PATTERNS = [
  [/\bfetch\s*\(/, "direct fetch"],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
  [/\bWebSocket\b/, "WebSocket"],
  [/\bEventSource\b/, "EventSource"],
  [/\bsendBeacon\s*\(/, "sendBeacon"],
  [/\bwebRequest\b/, "webRequest"],
  [/\bdeclarativeNetRequestFeedback\b/, "declarativeNetRequestFeedback"],
  [/(?:browser|chrome)\.history\b/, "browser history API"],
  [/\bindexedDB\b/, "IndexedDB"],
  [/\blocalStorage\b/, "localStorage"],
  [/\bsessionStorage\b/, "sessionStorage"]
];

for (const path of SETTINGS_SOURCES) {
  const source = fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  for (const [pattern, label] of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) throw new Error(`${path} must not use ${label}`);
  }
}

console.log("settings-privacy-surface-audit: Settings UI and shared collaborators have no direct network/request-history persistence surface");
