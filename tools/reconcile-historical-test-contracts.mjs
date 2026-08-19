import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const testsDirectory = resolve(root, "tests");
const apply = process.argv.includes("--apply");

const counters = Object.create(null);
const changedFiles = [];

function count(label, amount = 1) {
  counters[label] = (counters[label] ?? 0) + amount;
}

function replaceLiteral(source, before, after, label) {
  if (!source.includes(before)) return source;
  const parts = source.split(before);
  count(label, parts.length - 1);
  return parts.join(after);
}

function ensureResolveImport(source) {
  if (/from ["']node:path["']/.test(source)) return source;
  count("native-path-import");
  return `import { resolve } from "node:path";\n${source}`;
}

function reconcile(source) {
  let next = source;

  // URL.pathname is not a native Windows pathname. import.meta.dirname is already
  // platform-native on the supported Node versions.
  next = replaceLiteral(
    next,
    'const root = resolve(new URL("..", import.meta.url).pathname);',
    'const root = resolve(import.meta.dirname, "..");',
    "windows-file-url-root"
  );
  if (next.includes('const root = new URL("..", import.meta.url);')
    || next.includes('const root = new URL("../", import.meta.url);')) {
    next = ensureResolveImport(next);
    next = replaceLiteral(next, 'const root = new URL("..", import.meta.url);', 'const root = resolve(import.meta.dirname, "..");', "url-root-to-native-path");
    next = replaceLiteral(next, 'const root = new URL("../", import.meta.url);', 'const root = resolve(import.meta.dirname, "..");', "url-root-to-native-path");
  }

  // The semantic contract is that the default check gate executes the package test
  // script. `npm test` and `npm run test` are equivalent npm spellings.
  next = replaceLiteral(next, '/npm run test/u', '/(?:^|&&\\s*)npm(?: run)? test(?:\\s*&&|$)/u', "npm-test-command-spelling");
  next = replaceLiteral(next, '/npm run test/', '/(?:^|&&\\s*)npm(?: run)? test(?:\\s*&&|$)/', "npm-test-command-spelling");
  next = replaceLiteral(next, '/(?:^|&&\\s*)npm run test(?:\\s*&&|$)/u', '/(?:^|&&\\s*)npm(?: run)? test(?:\\s*&&|$)/u', "npm-test-command-spelling");

  // A completed historical tranche cannot own the live roadmap's current "next"
  // pointer forever. The same tests retain tranche and Issue #10 assertions.
  next = next.replace(
    /^\s*assert\.match\(roadmap, \/.*Next canonical milestone number:.*\/u?\);\s*\r?\n/gm,
    () => { count("obsolete-live-roadmap-next-pointer"); return ""; }
  );

  // Hardened Settings storage-listener ownership moved into one descriptor-safe helper.
  next = replaceLiteral(next, '/installOptionsStorageListener/', '/installOwnedOptionsStorageListener/', "options-storage-listener-owner");
  next = replaceLiteral(next, 'installOptionsStorageListener', 'installOwnedOptionsStorageListener', "options-storage-listener-owner");

  // Action-count storage event access is captured via data-property inspection rather
  // than an ordinary property read. Preserve the collaborator-ownership assertion.
  next = replaceLiteral(
    next,
    '/const storageChanged = api\\.storage\\.onChanged;/',
    '/const storageChanged = storage[\\s\\S]*?captureDataProperty\\(storage, "onChanged"/',
    "action-count-storage-capture"
  );

  // Exact-object validation gained a more explicit diagnostic while preserving the
  // same fail-closed boundary. Historical tests should accept either reviewed wording.
  next = replaceLiteral(next, '/unsupported field/', '/(?:unknown or )?unsupported field/', "exact-object-diagnostic-wording");
  next = replaceLiteral(next, '/own enumerable data field/', '/(?:own enumerable data field|enumerable own data)/', "data-field-diagnostic-wording");

  // Response-reader ownership now retains releaseLock for deterministic cleanup, and
  // timeout cleanup snapshots/clears the timer before invoking the captured clearer.
  next = replaceLiteral(
    next,
    '/return Object\\.freeze\\(\\{ read, cancel \\}\\);/',
    '/return Object\\.freeze\\(\\{ read, cancel(?:, releaseLock)? \\}\\);/',
    "response-reader-release-lock"
  );
  next = replaceLiteral(
    next,
    '/finally \\{\\s*clearTimeoutBestEffort\\(clearTimeoutImpl, timer\\);\\s*\\}/s',
    '/finally \\{[\\s\\S]*?clearTimeoutBestEffort\\(clearTimeoutImpl, timer(?:ToClear)?\\);[\\s\\S]*?\\}/s',
    "timeout-cleanup-expansion"
  );

  // Message-guard construction now diagnoses the exact missing captured collaborator
  // instead of the broader namespace. Both forms prove fail-closed admission.
  next = replaceLiteral(next, '/requires runtime\\.onMessage/', '/(?:requires runtime\\.onMessage|runtime\\.onMessage(?:\\.addListener)? is unavailable)/', "message-guard-diagnostic-specificity");

  // Popup markup accumulated stronger naming/description metadata. Match semantic
  // elements and required state rather than freezing the complete opening tag.
  next = replaceLiteral(next, '/<main id="popup-main" aria-busy="false">/', '/<main id="popup-main"[^>]*aria-busy="false"[^>]*>/', "popup-main-semantic-markup");
  next = replaceLiteral(next, '/<h1>drop-ads<\\/h1>/', '/<h1[^>]*>drop-ads<\\/h1>/', "popup-title-semantic-markup");
  next = replaceLiteral(next, '/<details id="shortcut-help" class="shortcut-help">/', '/<details id="shortcut-help" class="shortcut-help"[^>]*>/', "popup-shortcut-details-semantic-markup");
  next = replaceLiteral(next, '/<section id="site-section" aria-labelledby="site-name" aria-describedby="site-help" hidden>/', '/<section id="site-section"[^>]*aria-labelledby="site-name"[^>]*hidden>/', "popup-site-section-semantic-markup");

  // Shortcut routing now consumes a shared canonical catalog and a dedicated
  // availability helper instead of duplicating those contracts in popup-keyboard.js.
  next = replaceLiteral(next, '/const shortcutDefinitions = Object\\.freeze\\(\\[/', '/const shortcutDefinitions = POPUP_SHORTCUTS;/', "popup-shared-shortcut-catalog");
  next = replaceLiteral(
    next,
    '/popupMain\\?\\.getAttribute\\("aria-busy"\\) !== "true"/',
    '/popupMain\\?\\.getAttribute\\?\\.\\("aria-busy"\\) === "true"/',
    "popup-shared-busy-guard"
  );

  // Picker uniqueness is still required, but the exact callback is captured once and
  // selector generation now uses a bounded probe wrapper.
  next = replaceLiteral(next, '/helpers\\.selectorUniquelyIdentifies\\(selector, target, documentRef\\)/', '/selectorUniquelyIdentifies\\(selector, target, documentRef\\)/', "picker-captured-uniqueness-helper");
  next = replaceLiteral(
    next,
    '/for \\(const candidate of directCandidates\\) if \\(unique\\(documentRef, candidate, element\\)\\) return candidate/',
    '/for \\(const candidate of directCandidates\\) if \\(probe\\(documentRef, candidate, element\\)\\) return candidate/',
    "picker-bounded-uniqueness-probe"
  );
  next = replaceLiteral(next, '/function stableIdIsUnique\\(element, documentRef\\)/', '/function stableIdIsUnique\\(element, documentRef, probe = unique\\)/', "picker-bounded-id-probe");
  next = replaceLiteral(
    next,
    '/if \\(direct && selectorCarriesIdentity\\(direct, element\\) && unique\\(documentRef, direct, element\\)\\) return direct/',
    '/selectorCarriesIdentity[\\s\\S]*?probe\\(documentRef, selector, element\\)/',
    "picker-bounded-direct-probe"
  );

  // Localized cookie-banner scoring was hardened from repeated linear equality checks
  // to one immutable exact-phrase lookup.
  next = replaceLiteral(next, '/if \\(text === phrase\\) return score/', '/Object\\.prototype\\.hasOwnProperty\\.call\\(LOCALIZED_SCORE_BY_PHRASE, text\\)/', "cookie-banner-lookup-refactor");

  // Settings list filtering now observes presentation and disabled-state changes in
  // addition to child insertion/removal so filtered focus recovery stays correct.
  next = replaceLiteral(next, '/controller\\.observer\\.observe\\(list, \\{ childList: true \\}\\)/', '/controller\\.observer\\.observe\\(list, \\{[\\s\\S]*?childList: true[\\s\\S]*?\\}\\)/', "settings-filter-observer-expansion");
  next = replaceLiteral(next, '/row\\.hidden \\|\\| row\\.classList\\.contains\\("empty"\\)/', '/!row\\.hidden && !row\\.classList\\.contains\\("empty"\\)/', "settings-filter-visible-row-refactor");

  // The privacy cue gained an explicit keyboard-recovery sentence. Require the stable
  // privacy promise as a prefix, not the complete help copy.
  next = replaceLiteral(next, '/FILTER_PRIVACY_TEXT = "Filters only this Settings page and is not saved\\."/', '/FILTER_PRIVACY_TEXT = "Filters only this Settings page and is not saved\\./', "settings-filter-privacy-copy-prefix");
  next = replaceLiteral(next, '/const FILTER_PRIVACY_TEXT = "Filters only this Settings page and is not saved\\."/', '/const FILTER_PRIVACY_TEXT = "Filters only this Settings page and is not saved\\./', "settings-filter-privacy-copy-prefix");

  // Array admission helpers were consolidated into one descriptor-safe shape helper.
  // Keep historical tests focused on containing Array.isArray traps rather than a
  // particular helper name or return representation.
  next = replaceLiteral(next, '/function safeArrayCandidate\\(value\\)/', '/function (?:safeArrayCandidate|safeArrayKind)\\(value\\)/', "safe-array-helper-consolidation");
  next = replaceLiteral(
    next,
    '/function safeArrayCandidate\\(value\\) \\{\\s*try \\{ return Array\\.isArray\\(value\\); \\}\\s*catch \\{ return false; \\}\\s*\\}/s',
    '/function (?:safeArrayCandidate|safeArrayKind)\\(value\\)[\\s\\S]*?Array\\.isArray\\(value\\)[\\s\\S]*?\\}/s',
    "safe-array-helper-consolidation"
  );

  // Configured reset/session recovery moved out of list-filter landmarks into the
  // explicit recovery bootstrap chain. Point historical loader tests at its owner.
  if ((next.includes('reset-settings-ui\\.js') || next.includes('session-pauses\\.js'))
    && next.includes('../src/options/list-filter-landmarks.js')) {
    next = replaceLiteral(next, '../src/options/list-filter-landmarks.js', '../src/options/recovery-controls.js', "settings-recovery-loader-owner");
  }
  next = replaceLiteral(next, '/resetButton\\.setAttribute\\("aria-controls", "reset-settings-confirmation"\\)/', '/button\\.setAttribute\\("aria-controls", "reset-settings-confirmation"\\)/', "settings-reset-construction-refactor");
  next = replaceLiteral(
    next,
    '/busyDepth = 0;\\n  section\\.removeAttribute\\("aria-busy"\\)/',
    '/busyDepth = 0;[\\s\\S]*?section\\?\\.removeAttribute\\("aria-busy"\\)/',
    "settings-session-teardown-expansion"
  );

  return next;
}

const entries = (await readdir(testsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.js"))
  .map((entry) => entry.name)
  .sort();

for (const name of entries) {
  const path = resolve(testsDirectory, name);
  const source = await readFile(path, "utf8");
  const next = reconcile(source);
  if (next === source) continue;
  changedFiles.push(name);
  if (apply) await writeFile(path, next, "utf8");
}

console.log(`${apply ? "Applied" : "Would apply"} historical test reconciliation to ${changedFiles.length} file(s).`);
for (const [label, amount] of Object.entries(counters).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`${label}: ${amount}`);
}
if (changedFiles.length) {
  console.log("files:");
  for (const name of changedFiles) console.log(`- ${name}`);
}
if (!apply && changedFiles.length) {
  console.log("Dry run only. Re-run with --apply to write the reviewed mechanical changes.");
}
