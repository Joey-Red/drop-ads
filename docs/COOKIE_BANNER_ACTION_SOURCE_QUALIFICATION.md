# Cookie-banner action-source, context, semantics, and localization safety qualification

This checklist supports the M962–M1019 cookie-banner action-source, action-identity, action-context, action-semantics, and expanded exact-localization hardening. It is **not** a browser-pass claim. Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.

## Prepare the exact candidate

From the exact source head being qualified:

```sh
npm ci
npm run qualify:preflight
npm run qualify:observation
node tools/cookie-banner-action-source-qualification-server.mjs
node tools/cookie-banner-localization-qualification-server.mjs
```

Load the exact generated Chromium package bound to the active qualification record, then repeat the same observations with the exact Firefox package. Use only the printed `127.0.0.1` fixture routes. The action-source server covers the historical safe/unsafe runtime matrix and the M1010 localized reject-all positive controls; the dedicated localization server covers the M1012–M1016 exactness, necessary-only, priority, and ambiguity matrix.

## Reject-mode observations

Set cookie-banner handling to **Reject cookie banners when possible**. Visit every route separately so one surface cannot influence another.

The safe `/control` route, the six M1010 localized reject-all controls, the six dedicated necessary-only routes, and the six dedicated reject-over-necessary priority routes have positive expectations described below. Every unsafe, generic-consent, non-exact, and equal-score ambiguity route must remain untouched automatically and must never display its FAIL status.

### Action-source and identity routes

- `/direct-overflow` — oversized direct naming source.
- `/descendant-overflow` — over-budget descendant action name.
- `/direct-visible-conflict` — direct `Reject all` versus visible `Accept all`.
- `/labelledby-conflict` — referenced `Reject all` versus visible `Accept all`.
- `/navigation-ancestor` — reject-looking role/button nested inside navigation ancestry; it must not navigate automatically.
- `/direct-channel-conflict` — input `value="Reject all"` versus `aria-label="Accept all"`.
- `/labelledby-interactive-descendant` — a referenced accessible-name target contains an interactive link descendant.
- `/dropads-descendant` — candidate visible text comes from a Drop Ads-owned descendant.
- `/interactive-descendant` — candidate contains a nested interactive `role=link` descendant.
- `/hidden-text` — the only reject-looking action text is hidden.
- `/invisible-format` — reject-looking action text contains a bidi/invisible formatting control.
- `/mixed-script` — reject-looking ASCII text has additional non-Latin semantic text that canonical ASCII normalization would otherwise erase.

### Action-context routes

- `/secondary-label-ancestor` — reject-looking action is nested inside a label that has its own secondary activation behavior.
- `/editable-ancestor` — candidate is inside an inherited editable region.
- `/editable-descendant` — candidate contains an explicitly editable descendant.
- `/editable-labelledby` — referenced accessible-name label tree is explicitly editable.
- `/aria-haspopup` — reject-looking button advertises popup/dialog launch semantics.
- `/toggle-semantics` — reject-looking button exposes toggle state rather than one-shot action semantics.
- `/popover-target` — reject-looking button is wired as an HTML popover target trigger.

### Action-semantics routes

- `/disclosure-state` — reject-looking button carries `aria-expanded` and must remain untouched whether the state says expanded or collapsed.
- `/reset-action` — reject-looking native reset control must not reset form state automatically.
- `/native-role-override` — a native button whose role is changed to `tab` must remain untouched; only a missing role or exact `button` role is compatible with automatic rejection.
- `/busy-context` — reject-looking action inside an `aria-busy="true"` context must remain untouched. The same rule applies through the bounded composed ancestry used by the runtime.
- `/controlled-region` — reject-looking action carrying `aria-controls` must remain untouched.
- `/command-target` — reject-looking action carrying declarative command/invocation targeting must remain untouched.

### M1010 localized reject-all positive controls

Each route below is a positive control on the action-source server. In reject mode it must activate only because its reviewed exact localized action label appears inside matching strong cookie/privacy-choice context.

- `/polish-control` — `Odrzuć wszystkie` under Polish privacy/cookie evidence; should display `PASS: Polish localized reject activated.`
- `/swedish-control` — `Avvisa alla` under Swedish privacy/cookie evidence; should display `PASS: Swedish localized reject activated.`
- `/danish-control` — `Afvis alle` under Danish privacy/cookie evidence; should display `PASS: Danish localized reject activated.`
- `/norwegian-control` — `Avvis alle` under Norwegian privacy/cookie evidence; should display `PASS: Norwegian localized reject activated.`
- `/finnish-control` — `Hylkää kaikki` under Finnish privacy/cookie evidence; should display `PASS: Finnish localized reject activated.`
- `/czech-control` — `Odmítnout vše` under Czech privacy/cookie evidence; should display `PASS: Czech localized reject activated.`

### M1012–M1016 dedicated localization matrix

Run `node tools/cookie-banner-localization-qualification-server.mjs` and exercise all five route classes for each of `polish`, `swedish`, `danish`, `norwegian`, `finnish`, and `czech`.

- `/<language>-generic-consent` — exact localized reject-all label in generic consent context with no strong cookie/privacy evidence. It must remain untouched and never display its FAIL status.
- `/<language>-exactness` — strong localized cookie/privacy context with extra text attached to an otherwise reviewed reject-all phrase. It must remain untouched; prefix/suffix/substring matching is not allowed.
- `/<language>-necessary` — exact reviewed necessary-only label under strong localized cookie/privacy evidence. It should activate and display its visible `PASS: <Language> necessary-only action activated.` status in reject mode.
- `/<language>-priority` — both reviewed reject-all and necessary-only actions are present. Reject-all must be the only automatic activation and should display `PASS: <Language> reject-all won priority.` Necessary-only activation is a failure.
- `/<language>-ambiguity` — two reviewed reject-all actions have equal top scores. Neither may activate automatically; either click displays a FAIL status.

Reload each route after the initial observation. Negative/ambiguity outcomes must remain fail-closed and positive outcomes must remain independently reproducible without carrying a page, action, locale, score, or language decision between loads.

## Off-mode control

Set cookie-banner handling to **Off** and reload all routes from both servers. The base `/control`, all six M1010 localized reject-all controls, all six dedicated `-necessary` routes, and all six dedicated `-priority` routes must now remain untouched. Negative and ambiguity routes must remain untouched exactly as in reject mode. Re-enable reject mode and confirm the positive controls activate again on later isolated loads.

## Identity, context, semantics, and localization checks

For both exact candidate browsers, additionally verify:

- input `value` and `aria-label` are independently bounded and must agree exactly when both are present;
- referenced labels cannot source action identity from nested interactive, Drop Ads-owned, or editable descendants and remain bounded by the reviewed label-tree ceilings;
- page action descendants cannot source identity from Drop Ads-owned, nested-interactive, hidden-text, or editable subtrees;
- empty decorative hidden descendants remain compatible and do not by themselves block an otherwise safe control;
- zero-width/BOM and bidi embedding/override/isolate controls fail closed rather than being normalized away;
- reviewed Latin diacritics remain supported, while surviving non-ASCII Unicode letters/numbers after bounded NFKD folding fail closed;
- secondary activation ancestors such as labels, summaries, controls, and navigation carriers fail closed under bounded composed ancestry;
- inherited editable contexts honor `contenteditable="false"` recovery while empty/true/plaintext-only editing states fail closed;
- `aria-haspopup`, toggle-state semantics, and popover target attributes remain untouched automatically;
- `aria-expanded`, `aria-controls`, native reset behavior, conflicting native-control roles, and declarative command/invocation attributes remain untouched automatically;
- an `aria-busy` value other than exact `false` on the candidate or within the bounded composed ancestry fails closed, while settled/missing busy state remains compatible;
- Polish, Swedish, Danish, Norwegian, Finnish, and Czech reviewed reject-all labels activate by exact normalized equality only under strong matching cookie/privacy evidence;
- the corresponding necessary-only labels remain exact and lower-priority than reject-all labels;
- generic non-cookie consent containing reject-looking localized text remains untouched;
- equal top localized rejection scores fail closed rather than choosing by DOM order;
- the localized lexicon itself is bounded to at most 32 frozen entries, each phrase is at most 96 chars, every tuple is exactly two fields, only reviewed 100/86 score classes are accepted, duplicate phrases are rejected, and every stored phrase must already equal its canonical normalized form;
- if localized lexicon validation fails, localized scoring fails closed while base-language rejection scoring remains available;
- no browser locale or language preference selects behavior: no `navigator.language`, `navigator.languages`, `Intl` locale profiling, or retained language profile participates in the decision;
- the same action-source, context, semantics, localization, and strong-consent rules are re-evaluated before native activation so late DOM/name/context/semantic changes cannot inherit an earlier safe decision.

## Repository audit support

Before browser observation, `npm run check` must include both:

```sh
npm run cookie-banner-hardening-audit
npm run cookie-banner-localization-audit
```

The dedicated localization audit protects the M1002–M1017 exact labels, strong-consent evidence, lexicon bounds, manifest parity, privacy boundary, and dedicated qualification matrix. The canonical hardening audit carries the compatibility chain through `extended through M1018`. These are repository preflight signals only and are never browser evidence.

## Independence and privacy checks

While exercising these routes, ordinary network/cookie/cosmetic blocking and existing site/session recovery controls must continue to behave independently. The extension must not persist action labels, accessible names, DOM/page snapshots, navigation/editing/popup/busy state, click outcomes, counts, scores, timestamps, locale/language profiles, identifiers, analytics, telemetry, or learned outcomes.

## Exact-head rule

Record observations only against the exact generated candidate identified by the active qualification record. Any source commit, source fingerprint, package hash/size, or candidate-record mismatch invalidates these observations. Rebuild and repeat rather than carrying results forward.

Use the guarded qualification commands from `docs/QUALIFICATION_RUNBOOK.md` to record only the real browser observations. Repository tests, audits, and local fixtures are supporting preflight evidence; they do not substitute for Chromium and Firefox observation.
