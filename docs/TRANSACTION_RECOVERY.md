# Transaction recovery and convergence

Drop Ads treats persisted local/session/list-cache state as the source of truth and browser DNR as the active projection of that state.

Normal policy mutations are transactional: candidate DNR is activated first, matching state is persisted second, and a persistence failure attempts to restore the previously managed DNR. The original operation still fails if persistence does not commit.

A second failure can occur while restoring the old DNR. In that case the runtime deliberately invalidates its applied-policy fingerprints rather than claiming either policy is known-active. The background convergence layer queues `syncRules()` behind every policy-affecting runtime message, supported context-menu block, and scheduled list refresh. Because the main runtime owns a single serialized task queue, this convergence pass executes after the triggering mutation finishes.

On an ordinary successful mutation the pass is semantically a no-op: current managed DNR already equals persisted policy, so no DNR rewrite occurs. If persistence failed and rollback DNR also failed, the queued pass reloads persisted local/session/cache state and converges managed DNR back to that stored policy automatically.

If the convergence pass itself fails, it is logged locally and no success is fabricated. The runtime's invalid fingerprints ensure later startup, storage-repair, explicit synchronization, or another convergence trigger retries from persisted state.

This recovery mechanism stores no request history, browsing history, telemetry, identifiers, or rollback statistics.
