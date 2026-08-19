const freezeStrings = (values) => Object.freeze([...values]);

const contentGroup = ({ matches, js, run_at, all_frames }) => Object.freeze({
  matches: freezeStrings(matches),
  js: freezeStrings(js),
  run_at,
  all_frames
});

export const CANONICAL_CONTENT_SCRIPTS = Object.freeze([
  contentGroup({
    matches: ["http://*/*", "https://*/*"],
    js: [
      "content/message-contract.js",
      "content/selector-utils.js",
      "content/cosmetic.js",
      "content/picker-save-guard.js",
      "content/picker-ui.js",
      "content/picker.js",
      "content/context-cleanup.js"
    ],
    run_at: "document_start",
    all_frames: true
  }),
  contentGroup({
    matches: ["http://*/*", "https://*/*"],
    js: [
      "content/cookie-banner-utils.js",
      "content/cookie-banner-utils-composition.js",
      "content/cookie-banner-locale-extension.js",
      "content/cookie-banner-action-source-safety.js",
      "content/cookie-banner-action-context-safety.js",
      "content/cookie-banner-action-semantics-safety.js",
      "content/cookie-banner-shadow-roots.js",
      "content/cookie-banner-consent-safety.js",
      "content/cookie-banner-executor.js",
      "content/cookie-banner-controller.js"
    ],
    run_at: "document_start",
    all_frames: false
  })
]);

export const CANONICAL_CONTENT_SCRIPT_FILES = Object.freeze(
  CANONICAL_CONTENT_SCRIPTS.flatMap((entry) => entry.js)
);
