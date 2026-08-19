# Milestones 609–618 — Qualification record and loopback fixture hardening

This block hardens the non-browser qualification tooling that creates the exact-head candidate record and serves the local browser fixture. It does **not** replace the real Chromium + Firefox observations required by Issue #10.

## M609 — Bound qualification record metadata reads

Qualification-record generation now reads Chromium/Firefox `build-info.json` and `release-manifest.json` through the shared regular-file, strict-UTF-8 qualification reader with a 256 KiB ceiling. Oversized, empty, malformed UTF-8, non-regular, or malformed-JSON metadata fails before record construction.

## M610 — Stream qualification package verification

Chromium ZIP and Firefox XPI verification no longer reads the entire package into memory. `qualification-artifact-verify.mjs` hashes package bytes incrementally, rejects symlink/non-regular paths, requires the exact manifest byte count, and detects size/hash disagreement or growth/shrink during verification.

## M611 — Snapshot qualification record construction inputs

The exported qualification-record constructor snapshots its exact input contract through descriptor-only data inspection before validation. Accessors, symbols, extra fields, custom prototypes, inspection traps, malformed artifact arrays, and unsupported values fail closed without executing getters. Clean-worktree, source-fingerprint, package, artifact, and toolchain checks remain unchanged.

## M612 — Sanitize qualification record serialization

Schema-v4 records are validated before serialization and then pass through the shared descriptor-safe qualification JSON sanitizer. The serialized record is capped at 256 KiB. `toJSON`, accessors, symbols, custom prototypes, traps, extra fields, and unsupported values cannot influence persisted/stdout record output.

## M613 — Atomically persist qualification records

`qualify:record --output` now uses a repository-contained output helper. The destination must be a relative path that remains inside the checkout, parent components must be real directories rather than symlinks, and persistence uses an exclusive same-directory `0600` temporary file followed by atomic rename and failure cleanup.

## M614 — Bound qualification Git inspection

Exact-head Git inspection is centralized in `qualification-git.mjs`. It uses fixed `execFile` argument vectors with no shell, a 1 MiB output buffer ceiling, and a 10-second timeout for `rev-parse HEAD` and porcelain worktree status. Both record generation and observation exact-head validation use this boundary.

## M615 — Validate qualification fixture startup options

`npm run qualify:serve` now enters through `qualification-server-run.mjs`. Startup accepts only descriptor-safe `port`/`quiet` fields; ports are canonical decimal integers in the range 0–65535, with port 0 retained for ephemeral test use. Accessors, symbols, extra fields, custom prototypes, traps, malformed ports, and non-boolean `quiet` values fail closed.

## M616 — Bound qualification fixture server resources

Every first-party and simulated third-party loopback listener receives explicit limits: 64 headers, 5-second header/request/inactivity timeouts, 1-second keep-alive timeout, and 64 requests per socket. These are local fixture resource bounds only; no request logging or retained activity was introduced.

## M617 — Guard qualification fixture requests

The active fixture wraps every listener with the same request admission boundary. Only `GET` and `HEAD` origin-form targets up to 2,048 characters are accepted, and `Host` must exactly match the listener's `127.0.0.x:<port>` address. Invalid targets, methods, or Host values are rejected before fixture routing. Responses receive `nosniff`, `no-referrer`, restrictive camera/microphone/geolocation permissions, and cross-origin resource policy compatible with the multi-loopback fixture.

## M618 — Enforce the hardening contract

`qualification-runtime-hardening-audit` statically checks the active M609–M617 boundaries and is part of `npm run check`. It protects bounded metadata reads, streamed package verification, descriptor-safe record construction/serialization, atomic record persistence, bounded Git inspection, the validated fixture entrypoint, listener resource limits, request guards, and the no-telemetry/no-identity surface.

## Evidence boundary

All code, tests, audits, and documentation in this block were created through the connected repository workflow. They were **not** executed locally in this continuation and no Chromium or Firefox browser matrix was run here. Connector-created tests/audits are repository coverage and preflight definitions only until actually executed.

Issue #10 remains the authoritative real Firefox + Chromium release gate. Any source change after a real browser observation invalidates that observation for the new head.

Privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, matched-element/DOM history, retained blocked-request statistics database, user/device identifiers, or owned Drop Ads tracking backend.
