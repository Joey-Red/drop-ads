import { communityCandidateFromRule } from "../core/community.js";
import { parseRuleKey } from "../core/rules.js";

const blockForm = document.querySelector("#block-form");
const blockSubmit = blockForm?.querySelector('button[type="submit"]');
const blockList = document.querySelector("#block-list");
const blockError = document.querySelector("#block-error");
const communitySection = document.querySelector("#community-settings");
const autoSubmit = document.querySelector("#auto-submit");
let blockListObserver = null;
let blockSubmitObserver = null;
let autoSubmitObserver = null;
let pendingManualAction = null;
let pendingAutoBaseline = null;
let pendingPreference = null;

function appendDescription(control, id) {
  if (!control || !id) return;
  const tokens = new Set((control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
  tokens.add(id);
  control.setAttribute("aria-describedby", [...tokens].join(" "));
}

function ensureCommunityStatus() {
  let status = document.querySelector("#community-status");
  if (status || !communitySection) return status;
  status = document.createElement("p");
  status.id = "community-status";
  status.className = "hint community-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  communitySection.append(status);
  return status;
}

const communityStatus = ensureCommunityStatus();
appendDescription(autoSubmit, "community-status");

function blockRows() {
  return [...(blockList?.querySelectorAll("li[data-rule-key]") ?? [])];
}

function candidateForRow(row) {
  const key = row?.dataset?.ruleKey;
  if (!key) return null;
  try { return communityCandidateFromRule(parseRuleKey(key)); }
  catch { return null; }
}

function ruleKeys() {
  return new Set(blockRows().map((row) => row.dataset.ruleKey).filter(Boolean));
}

function manualCommunityAction(row) {
  return [...(row?.querySelectorAll?.("button.secondary-action") ?? [])]
    .find((button) => button.getAttribute("aria-label")?.startsWith("Prepare community submission for ")) ?? null;
}

function enforceCommunityEligibility() {
  if (!blockList) return;
  for (const row of blockRows()) {
    const action = manualCommunityAction(row);
    if (!action) continue;
    const candidate = candidateForRow(row);
    if (!candidate) {
      action.remove();
      continue;
    }
    action.textContent = `Prepare ${candidate.value}`;
    action.setAttribute("aria-label", `Prepare community submission for ${candidate.value}`);
    action.dataset.communityCandidate = candidate.value;
    appendDescription(action, "community-status");
  }
}

function handleCommunityClick(event) {
  const action = event.target?.closest?.("button[data-community-candidate]");
  if (!action || !blockList?.contains(action)) return;
  pendingManualAction = action;
  if (communityStatus) communityStatus.textContent = "Opening a GitHub draft for your review…";
}

function finishManualCommunityAction() {
  if (!pendingManualAction || pendingManualAction.disabled || !pendingManualAction.isConnected) return;
  pendingManualAction = null;
  if (!communityStatus) return;
  communityStatus.textContent = blockError?.textContent?.trim()
    ? "Community draft could not be opened. Your local block remains active."
    : "GitHub draft opened for review. Nothing was submitted automatically.";
}

function beginAutomaticCommunityFeedback() {
  if (!autoSubmit?.checked) return;
  pendingAutoBaseline = ruleKeys();
  if (communityStatus) communityStatus.textContent = "Adding the local block; an eligible community draft will be opened for review.";
}

function finishAutomaticCommunityFeedback() {
  if (!pendingAutoBaseline || blockSubmit?.disabled) return;
  const before = pendingAutoBaseline;
  pendingAutoBaseline = null;
  const addedRow = blockRows().find((row) => row.dataset.ruleKey && !before.has(row.dataset.ruleKey));
  if (!addedRow || !communityStatus) return;
  const candidate = candidateForRow(addedRow);
  if (!candidate) {
    communityStatus.textContent = "Local block is active. This rule stays local and is not eligible for community submission.";
    return;
  }
  const communityFailed = blockError?.textContent?.includes("optional GitHub community submission could not be prepared") === true;
  communityStatus.textContent = communityFailed
    ? "Local block is active; the optional community draft could not be opened."
    : "Local block is active; a GitHub draft was opened for review. Nothing was submitted automatically.";
}

function beginCommunityPreferenceSave() {
  if (!autoSubmit) return;
  pendingPreference = autoSubmit.checked;
  autoSubmit.setAttribute("aria-busy", "true");
  if (communityStatus) communityStatus.textContent = "Saving community contribution preference…";
}

function finishCommunityPreferenceSave() {
  if (pendingPreference === null || autoSubmit?.disabled) return;
  const desired = pendingPreference;
  pendingPreference = null;
  autoSubmit?.removeAttribute("aria-busy");
  if (!communityStatus || !autoSubmit) return;
  communityStatus.textContent = autoSubmit.checked === desired
    ? `Automatic community draft preparation is ${desired ? "enabled" : "disabled"}. Drafts always require your review before submission.`
    : "Community contribution preference could not be saved. The previous setting remains active.";
}

function handleBlockListMutations() {
  enforceCommunityEligibility();
  finishManualCommunityAction();
}

enforceCommunityEligibility();
blockForm?.addEventListener("submit", beginAutomaticCommunityFeedback, true);
autoSubmit?.addEventListener("change", beginCommunityPreferenceSave, true);
if (blockList && typeof globalThis.MutationObserver === "function") {
  blockList.addEventListener("click", handleCommunityClick, true);
  blockListObserver = new globalThis.MutationObserver(handleBlockListMutations);
  blockListObserver.observe(blockList, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
}
if (blockSubmit && typeof globalThis.MutationObserver === "function") {
  blockSubmitObserver = new globalThis.MutationObserver(finishAutomaticCommunityFeedback);
  blockSubmitObserver.observe(blockSubmit, { attributes: true, attributeFilter: ["disabled"] });
}
if (autoSubmit && typeof globalThis.MutationObserver === "function") {
  autoSubmitObserver = new globalThis.MutationObserver(finishCommunityPreferenceSave);
  autoSubmitObserver.observe(autoSubmit, { attributes: true, attributeFilter: ["disabled"] });
}

window.addEventListener("pagehide", () => {
  try { blockListObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  blockListObserver = null;
  try { blockSubmitObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  blockSubmitObserver = null;
  try { autoSubmitObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  autoSubmitObserver = null;
  blockList?.removeEventListener("click", handleCommunityClick, true);
  blockForm?.removeEventListener("submit", beginAutomaticCommunityFeedback, true);
  autoSubmit?.removeEventListener("change", beginCommunityPreferenceSave, true);
  autoSubmit?.removeAttribute("aria-busy");
  pendingManualAction = null;
  pendingAutoBaseline = null;
  pendingPreference = null;
}, { once: true });
