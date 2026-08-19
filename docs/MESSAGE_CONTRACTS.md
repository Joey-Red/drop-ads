# Internal runtime message contracts

Drop Ads uses WebExtension runtime messaging only between its own packaged extension contexts. The manifests do not declare `externally_connectable`, and the message boundary is not a public API.

Even so, background and content-script messages are treated as untrusted structured input. Extension pages can be stale, browser restore/debug tooling can replay malformed values, and content scripts execute alongside arbitrary web pages. Messages are therefore validated before they enter policy queues or DOM-control handlers.

## Background-directed actions

`src/core/message-contract.js` owns the accepted background action names and exact payload schemas. Core policy actions and cosmetic actions are separate groups so one listener can ignore a message owned by the other without weakening validation.

Validation rejects:

- non-object/array envelopes
- unknown action names at the core boundary
- unknown payload fields
- missing required fields
- type-confused booleans/strings/arrays
- oversized rule values, keys, selectors, domains, subscription strings, and backup text
- invalid rules/domains/subscriptions through the same production normalizers used by storage and policy code

The core message guard is installed **outside** the settings-import preflight wrapper. An oversized or malformed import message is rejected before backup parsing, cache/source activation preflight, the serialized mutation queue, storage writes, or DNR work.

Read-only UI/cosmetic policy snapshots accept only `{ type }` and remain side-effect free.

## Tab/content-script control messages

Manifest content scripts load `content/message-contract.js` first. It exposes three intentionally tiny controls:

- `{ type: "drop-ads:start-element-picker" }`
- `{ type: "drop-ads:cosmetic-refresh" }`
- `{ type: "drop-ads:cleanup-context-target", targetUrl }`

Picker start and cosmetic refresh accept no payload fields. Context cleanup accepts only one bounded target URL. Extra fields such as page text, `innerHTML`, DOM snapshots, selectors, or arbitrary metadata cause the control message to be ignored.

The contract does not persist messages, log them, or turn them into telemetry/history. It exists only to bound and validate immediate extension-internal control flow.
