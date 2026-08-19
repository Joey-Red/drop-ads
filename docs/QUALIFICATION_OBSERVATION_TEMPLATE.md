# Browser qualification observation template

Use this worksheet only for the exact candidate described by the generated qualification record. If the source commit or either package hash changes, discard these observations and start again.

Run `npm run qualification-record-audit` and require it to pass against `artifacts/qualification-record.json`, then run `npm run qualify:observation` to create the schema-v3 `artifacts/qualification-observation.json` seed. Candidate commit, source fingerprint, Chromium/Firefox artifact hashes, and artifact byte sizes are copied **verbatim** from the validated record. Do not recompute, normalize, shorten, or hand-edit those identity values.

The generated file starts every canonical scenario with an independent Chromium and Firefox `{ status: "UNOBSERVED", notes: "" }` result. Generation is preparation only, not browser observation. If a non-identical observation artifact already exists, preparation refuses to overwrite it. Only after intentionally discarding invalidated prior evidence should `npm run qualify:observation:replace` be used.

Legacy schema-v2 observation artifacts are not active qualification evidence. Their scenario notes were shared by the Chromium/Firefox result pair, so note ownership cannot be safely auto-migrated. Do not copy a shared v2 note into either browser slot by guesswork; regenerate the exact-head schema-v3 seed instead.

## Candidate identity

- Git commit: copied from the validated qualification record
- Source fingerprint: copied from the validated qualification record
- Chromium ZIP SHA-256 and bytes: copied from the validated qualification record
- Firefox XPI SHA-256 and bytes: copied from the validated qualification record

These fields bind observations to the validated exact-head record. They are not manual input fields. If any identity value differs from `artifacts/qualification-record.json`, the observations are invalid.

## Browser identity

Record browser versions with the guarded editor instead of hand-editing JSON:

```sh
npm run qualify:mark -- browser chromium --version "<observed version>"
npm run qualify:mark -- browser firefox --version "<observed version>"
```

Optional concise behavior-only browser notes may be supplied with `--notes`. Changing previously recorded browser metadata requires explicit `--replace`.

Browser versions live in the `browsers` section of the schema-v3 observation record. Scenario outcomes live only in the matching canonical scenario id under `scenarios`; each browser has its own `status` and `notes` fields. Do not invent new ids, move a result to a different group, or copy one browser's note into the other browser's evidence.

Do **not** record hostname, username, cwd/absolute paths, timestamps, environment dumps, device identifiers, browsing/request history, URLs from personal browsing, per-site/lifetime statistics, cookies, DOM/page captures, or any other user-derived data.

## Scenario status

Use only `PASS`, `FAIL`, or `N/A` after a real observation. Leave the generated `UNOBSERVED` value in place until that browser actually exercises the scenario. A `PASS` means the behavior was actually observed in that browser against the candidate above; repository/connector-created tests do not count as a browser observation.

Record results through the guarded CLI:

```sh
npm run qualify:mark -- scenario startup-core chromium PASS
npm run qualify:mark -- scenario startup-core firefox PASS
npm run qualify:mark -- scenario protection-recovery chromium PASS --notes "recovery controls restored protection"
```

A scenario note belongs only to the selected browser result. Previously observed status or note changes require `--replace` for that browser only. Resetting one browser with `UNOBSERVED --replace` clears only that browser's note and preserves the other browser's result. `UNOBSERVED` cannot be supplied with `--notes`.

| Canonical scenario id | Scenario group | Chromium status | Chromium note | Firefox status | Firefox note |
|---|---|---|---|---|---|
| `startup-core` | Startup / extension load |  |  |  |  |
| `protection-recovery` | Global/site/session protection recovery |  |  |  |  |
| `personal-precedence` | Personal block/allow precedence |  |  |  |  |
| `cookie-policy` | Cookie protection and exceptions |  |  |  |  |
| `list-cache` | Built-in/external list activation and LKG fallback |  |  |  |  |
| `dnr-capacity-recovery` | DNR capacity/reserve/rollback recovery |  |  |  |  |
| `settings-popup-sync` | Settings / popup live synchronization |  |  |  |  |
| `country-policy` | Country / region TLD policy |  |  |  |  |
| `cosmetics-picker-cleanup` | Cosmetics / picker / context cleanup |  |  |  |  |
| `community-boundary` | Community contribution boundary |  |  |  |  |
| `backup-import` | Settings backup/import |  |  |  |  |
| `hostile-input-bounds` | Hostile input / size / timeout boundaries |  |  |  |  |
| `deterministic-fixture` | Deterministic fixture scenarios |  |  |  |  |
| `cookie-banner-rejection` | Cookie-banner rejection |  |  |  |  |
| `privacy-invariants` | Privacy invariants |  |  |  |  |

The schema-v3 audit requires this exact scenario set. Each browser's scenario note must remain empty while that browser's status is `UNOBSERVED`.

## Guardrails on every edit

`qualify:mark` rejects legacy schema v2, validates the current schema-v3 observation against the qualification record, verifies the record still matches the exact clean checkout, applies only the requested browser/status/note mutation, revalidates the complete result, and atomically replaces the observation artifact. It never accepts candidate identity from CLI arguments.

Observation preparation/reset and edits share a metadata-free exclusive lock. Conflict-checked writes fail rather than overwrite an observation that changed after it was read.

If the source checkout is dirty, the qualification record is stale, the source fingerprint differs, the observation belongs to another candidate, an enum is invalid, browser version is missing for an observed status, bounded text is invalid, or an existing observation would be overwritten without explicit replacement, the operation fails without claiming a browser pass.

## Next-step and status helpers

```sh
npm run qualify:next -- chromium
npm run qualify:next -- firefox
npm run qualify:status
```

Both active helpers require schema v3 and validate the exact current clean checkout. `qualify:next` reports only browser-version presence, the next action, and at most one canonical scenario id. `qualify:status` reports only PASS/FAIL/N/A/UNOBSERVED counts, completeness/passing booleans, scenario count, and overall readiness. Neither emits candidate identity, browser-version values, notes, URLs, machine/user/environment details, or browsing/request history.

## Browser-specific differences

Record only concise product behavior differences needed to reproduce or track an issue. Keep the note in the browser result that actually exhibited the behavior. Do not paste page contents, request logs, personal URLs, identifiers, or environment details. If a difference requires a source fix, open an issue and invalidate these observations after the source changes.

## Final validity check

- [ ] `npm run qualification-record-audit` passed for the record used to seed this observation.
- [ ] The observation artifact is schema v3; no legacy schema-v2 shared note was guessed into a browser slot.
- [ ] Browser versions were recorded with `qualify:mark` before observed scenario statuses.
- [ ] Scenario statuses were entered only after real browser observations.
- [ ] Each scenario note is attached only to the browser that produced that observation.
- [ ] `npm run qualification-observation-record-audit` passes for the current schema-v3 observation record.
- [ ] `npm run qualify:status` reports no unexpected `FAIL` or `UNOBSERVED` result.
- [ ] Candidate commit still matches the qualification record.
- [ ] Chromium package hash/size still match the qualification record.
- [ ] Firefox package hash/size still match the qualification record.
- [ ] No candidate identity value was recomputed or hand-edited.
- [ ] No source commit occurred after either browser observation.
- [ ] Every relevant Issue #10 scenario has an observed result under its canonical scenario id.
- [ ] No telemetry, analytics, browsing/request history, retained statistics database, user/device identifiers, or owned Drop Ads tracking backend was introduced.
