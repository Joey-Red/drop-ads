import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function reject(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} is obsolete current-state guidance`); }

const postMerge = read("docs/POST_MERGE_QUALIFICATION.md");
const runbook = read("docs/QUALIFICATION_RUNBOOK.md");
const settingsBoundaries = read("docs/SETTINGS_BOUNDARIES.md");
const milestone849 = read("docs/MILESTONES_849_858.md");
const milestone859 = read("docs/MILESTONES_859_868.md");
const milestone869 = read("docs/MILESTONES_869_878.md");
const milestone879 = read("docs/MILESTONES_879_888.md");
const milestone889 = read("docs/MILESTONES_889_898.md");
const roadmap = read("ROADMAP.md");
const packageJson = JSON.parse(read("package.json"));

for (const [source, needle, label] of [
  [postMerge, "PR #7 is already merged into `main`", "merged PR state"],
  [postMerge, "Issue #10 remains open and is the authoritative Firefox + Chromium runtime qualification gate", "Issue #10 browser gate"],
  [postMerge, "Any source commit after browser observation invalidates those observations", "exact-head invalidation"],
  [postMerge, "M859–M868 protects popup keyboard discoverability and shortcut interaction", "popup keyboard state"],
  [postMerge, "community-submission-hardening-audit", "community preflight gate"],
  [runbook, "community-submission-hardening-audit", "runbook community gate"],
  [runbook, "A repository/connector-created test that has not actually been executed is not a pass", "runbook execution distinction"],
  [runbook, "not a release qualification claim", "runbook release boundary"],
  [settingsBoundaries, "Repository tests and source audits are preflight evidence", "Settings preflight distinction"],
  [settingsBoundaries, "Issue #10 remains the authoritative real Firefox + Chromium qualification gate", "Settings browser gate"],
  [milestone849, "# Milestones 849–858", "M849-M858 milestone record"],
  [milestone859, "# Milestones 859–868 — Popup keyboard discoverability and shortcut hardening", "M859-M868 milestone record"],
  [milestone869, "# Milestones 869–878", "M869-M878 milestone record"],
  [milestone879, "# Milestones 879–888 — Community promotion workflow hardening", "M879-M888 milestone record"],
  [milestone889, "# Milestones 889–898 — Reviewed community issue moderation hardening", "M889-M898 milestone record"],
  [milestone889, "## M889 — Require explicit review attestations", "M889 attestation record"],
  [milestone889, "## M896 — Require reviewed context again at promotion time", "M896 reviewed promotion record"],
  [milestone889, "## M897 — Enforce the reviewed-community hardening gate", "M897 gate record"],
  [milestone889, "## M898 — Synchronize canonical state", "M898 synchronization record"],
  [milestone889, "were **not executed locally or in browsers here**", "M889-M898 execution boundary"],
  [roadmap, "`ROADMAP.md` is the sole authority for canonical milestone numbering", "canonical roadmap authority"],
  [roadmap, "M869–M878 — Community submission boundary hardening", "canonical M869-M878 block"],
  [roadmap, "M879–M888 — Community promotion workflow hardening", "canonical M879-M888 block"],
  [roadmap, "M889–M898 — Reviewed community issue moderation", "canonical M889-M898 block"],
  [roadmap, "Issue #10 remains the authoritative real Firefox + Chromium runtime qualification gate", "roadmap browser gate"],
  [roadmap, "Any source commit, source fingerprint, generated-member set, package identity, candidate hash/size, or qualification-record change invalidates earlier browser observations", "roadmap invalidation rule"]
]) requireText(source, needle, label);

const nextMatch = roadmap.match(/\*\*Next canonical milestone number: (\d+)\.\*\*/);
const canonicalRanges = [...roadmap.matchAll(/^- \*\*M(\d+)–M(\d+)\b/gm)]
  .map((match) => ({ start: Number(match[1]), end: Number(match[2]) }));
if (!nextMatch) throw new Error("roadmap next canonical milestone declaration is missing");
if (!canonicalRanges.length || canonicalRanges.some(({ start, end }) => !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start)) {
  throw new Error("roadmap canonical milestone history is malformed");
}
const highestCanonicalMilestone = Math.max(...canonicalRanges.map(({ end }) => end));
const expectedNextCanonicalMilestone = highestCanonicalMilestone + 1;
if (Number(nextMatch[1]) !== expectedNextCanonicalMilestone) {
  throw new Error(`roadmap next canonical milestone must be ${expectedNextCanonicalMilestone}`);
}

for (const script of [
  "settings-session-recovery-audit",
  "settings-import-hardening-audit",
  "settings-accessibility-audit",
  "settings-form-ergonomics-audit",
  "settings-list-filter-audit",
  "settings-reset-audit",
  "settings-recovery-controls-audit",
  "picker-selector-hardening-audit",
  "popup-lifecycle-audit",
  "popup-semantics-audit",
  "popup-keyboard-audit",
  "community-submission-hardening-audit",
  "community-review-hardening-audit"
]) {
  if (!packageJson.scripts?.[script]) throw new Error(`required current preflight gate is missing: ${script}`);
  if (!packageJson.scripts?.check?.includes(`npm run ${script}`)) throw new Error(`current preflight gate is not wired into npm run check: ${script}`);
}

for (const [pattern, label] of [
  [/^\s*(?:[-*]\s*)?PR #7 remains draft\b/im, "PR #7 remains-draft statement"],
  [/^\s*(?:[-*]\s*)?keep PR #7 draft\b/im, "PR #7 keep-draft instruction"],
  [/^\s*(?:[-*]\s*)?wait for qualification before merge\b/im, "pre-merge qualification instruction"],
  [/\*\*Next canonical milestone number: 879\.\*\*/, "stale M879 roadmap assertion"],
  [/\*\*Next canonical milestone number: 889\.\*\*/, "stale M889 roadmap assertion"]
]) {
  reject(postMerge, pattern, label);
  reject(runbook, pattern, `runbook ${label}`);
  reject(roadmap, pattern, `roadmap ${label}`);
}

console.log(`qualification-state-audit: current post-merge exact-head qualification state verified through M${highestCanonicalMilestone}`);
