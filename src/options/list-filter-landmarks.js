import "./list-filter-ergonomics.js";

// list-filter.js owns the synthetic "no matching entries" row. Do not import
// list-filter-no-match.js here: its independent MutationObserver/placeholder
// ownership conflicts with list-filter.js and can create an endless remove /
// re-append microtask loop while the Settings page is loading.
const filters = [...document.querySelectorAll(".list-filter")];

for (const filter of filters) {
  const label = filter.querySelector("label");
  const input = filter.querySelector('input[type="search"]');
  const listId = input?.getAttribute("aria-controls");
  if (!label || !input || !listId) continue;
  if (!label.id) label.id = `${listId}-filter-label`;
  filter.setAttribute("role", "search");
  filter.setAttribute("aria-labelledby", label.id);
  filter.setAttribute("aria-controls", listId);
}
