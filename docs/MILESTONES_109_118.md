# Milestones 109–118

Completed sequentially on `agent/bootstrap-core`. The browser qualification gate in issue #10 remains intentionally open; repository coverage is preflight and does not substitute for current-head Chromium/Firefox qualification.

## 109 — Canonical bounded rule-key parsing and removal

Serialized network-rule keys are now reversible, bounded, NUL-safe, and canonical. Removal rejects malformed/noncanonical keys before scanning or mutation, and conflict helpers use the same canonical format.

## 110 — Descriptor-safe exact object schemas

Exact policy/message object validation now inspects all own keys and descriptors, rejecting symbols, hidden properties, accessors, arrays, and custom prototypes without invoking getters.

## 111 — Descriptor-safe list-cache container

The raw cache container is constrained to a plain/null-prototype record with at most 256 enumerable string data entries before byte accounting or entry decoding.

## 112 — Idempotent refresh-watchdog registration

One worker/API object now owns one due-source watchdog listener and one alarm-establishment pass. Repeated installation cannot duplicate refresh work.

## 113 — Exact session-state schema and pause typing

Session-only disabled-site state has an exact object schema and its direct mutation helper requires a real boolean, while missing state remains compatible with the empty default and raw collection limits stay intact.

## 114 — Atomic optional-feature bootstrap preflight

The complete optional background feature registry is validated before mandatory startup side effects. Feature count/name bounds, duplicate names, and invalid installers fail before any optional installer runs; runtime failures remain independently isolated afterward.

## 115 — Coalesced policy convergence recovery

Mandatory source-of-truth convergence permits only one sync in flight and coalesces overlapping mutation events into a remembered rerun. Failed repair attempts are logged without poisoning later recovery.

## 116 — Bounded context-feedback pending work

Right-click feedback retains at most 128 pending entries/timers, evicting the oldest through the normal cleanup path. Invalid negative tab IDs retain no work and disposal clears retained timers.

## 117 — Idempotent action-count preference runtime

The browser-owned Protection actions badge preference installs one listener/queue per API object, can be disposed/reinstalled cleanly, and treats corrupted non-boolean stored preference as the reviewed default-on setting without migration writes.

## 118 — Context-feedback lifecycle teardown

Context feedback now installs once per API object, fully deactivates on dispose, removes listeners when supported, clears/reset transient UI state, guards racing callbacks, and supports a clean reinstall without duplicate work.

## Privacy invariant

None of these milestones adds request observation, browsing history, retained statistics, telemetry, analytics, identifiers, a Drop Ads backend, or new extension permissions.
