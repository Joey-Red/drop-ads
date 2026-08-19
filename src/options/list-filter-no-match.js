const FILTER_QUERY_LIMIT = 256;
const bindings = [];
let pageActive = true;

function activeQuery(input) {
  const value = typeof input?.value === "string" ? input.value : "";
  return value.slice(0, FILTER_QUERY_LIMIT).trim().length > 0;
}

function syntheticPresentationRow(row, placeholder) {
  return row === placeholder || row?.classList?.contains("list-filter-no-match") === true;
}

function policyRows(list, placeholder) {
  return [...list.children].filter((row) => !syntheticPresentationRow(row, placeholder) && !row.classList?.contains("empty"));
}

function ensurePlaceholder(binding) {
  if (binding.placeholder.parentElement !== binding.list) binding.list.append(binding.placeholder);
}

function updateNoMatch(binding) {
  if (!pageActive) return;
  ensurePlaceholder(binding);
  const rows = policyRows(binding.list, binding.placeholder);
  const show = activeQuery(binding.input) && rows.length > 0 && !rows.some((row) => !row.hidden);
  binding.placeholder.hidden = !show;
}

function queueUpdate(binding) {
  if (!pageActive || binding.queued) return;
  binding.queued = true;
  const run = () => {
    binding.queued = false;
    updateNoMatch(binding);
  };
  try { queueMicrotask(run); }
  catch { run(); }
}

for (const wrapper of document.querySelectorAll(".list-filter")) {
  const input = wrapper.querySelector('input[type="search"][aria-controls]');
  const listId = input?.getAttribute("aria-controls");
  const list = listId ? document.getElementById(listId) : null;
  if (!input || !list) continue;

  const placeholder = document.createElement("li");
  placeholder.className = "list-filter-no-match";
  placeholder.textContent = "No entries match this filter.";
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.hidden = true;

  const binding = { input, list, placeholder, observer: null, queued: false, onInput: null };
  binding.onInput = () => queueUpdate(binding);
  input.addEventListener("input", binding.onInput);

  if (typeof globalThis.MutationObserver === "function") {
    binding.observer = new globalThis.MutationObserver(() => queueUpdate(binding));
    binding.observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  }

  bindings.push(binding);
  updateNoMatch(binding);
}

window.addEventListener("pagehide", () => {
  pageActive = false;
  for (const binding of bindings) {
    binding.input.removeEventListener("input", binding.onInput);
    try { binding.observer?.disconnect(); } catch { /* Best-effort Settings teardown. */ }
    binding.observer = null;
    binding.queued = false;
    binding.placeholder.remove();
  }
  bindings.length = 0;
}, { once: true });
