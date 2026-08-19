# Policy convergence lifecycle

The mandatory policy-convergence listener set is registered at most once per WebExtension API object during a worker lifetime.

Repeated installation returns the same registration instead of adding duplicate runtime-message, context-menu, or alarm listeners. The registration exposes `dispose()` for deterministic teardown in tests or explicit lifecycle transitions. Disposal marks the registration inactive before listener removal, so callbacks that race with teardown cannot queue new convergence work even on browser shims that do not expose `removeListener`.

A disposed registration may be installed again cleanly. Each live registration still coalesces qualifying recovery events to at most one `syncRules()` call in flight plus one remembered rerun.

This lifecycle state is process-local only. It stores no browsing data, request history, identifiers, telemetry, or persistent statistics.
