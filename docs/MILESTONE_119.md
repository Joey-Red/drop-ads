# Milestone 119 — Idempotent policy-convergence registration

Status: implementation in progress on `agent/bootstrap-core`.

This milestone makes the mandatory policy-convergence registration idempotent per WebExtension API object, disposable, race-safe after teardown, and reinstallable without duplicate listeners or duplicate repair work.
