# Manifest release integrity qualification

This is supporting guidance for Issue #10. Repository manifests, contracts, audits, tests, and generated packages are preflight evidence only; they are not real Chromium or Firefox observations.

## Exact-head preflight

From the clean source head that produces the candidate packages:

```sh
npm ci
npm run qualify:preflight
```

The canonical check chain includes `manifest-audit`, `manifest-parity-audit`, `manifest-content-contract-audit`, `manifest-platform-audit`, `manifest-surface-audit`, and `manifest-release-integration-audit` before packaging. Do not record a browser pass from those commands alone.

## Reviewed manifest contract

Both browsers must retain the same two ordered HTTP(S) content-script groups:

1. the all-frame document-start message/cosmetic/picker/context-cleanup stack;
2. the top-frame-only document-start cookie-banner utility/composition/localization/action-safety/shadow/consent/executor/controller stack.

Every declared content script is a unique local JavaScript file under `src/`. Remote/bare/escaping content-script paths are not part of the contract.

Chromium launches `background.js` as a module service worker. Firefox launches the same module through its background-script shape and retains only the reviewed bootstrap static DNR compatibility declaration plus Gecko extension identity/minimum version. Both browsers share the same popup and options entry points.

Top-level manifest keys are exact. New execution, embedding, override, external-connectivity, or permission surfaces require explicit source review rather than being silently accepted.

## Exact candidate browser observations

Use the exact generated Chromium and Firefox artifacts bound to the active qualification record. In each browser:

- load the candidate package without manifest-registration errors;
- confirm the background runtime starts using the browser-specific reviewed launch mechanism;
- open the toolbar popup and Settings page and confirm both load normally;
- exercise a normal first-party page and verify cosmetic/picker/context-cleanup functionality still loads in ordinary HTTP(S) documents;
- run the required `cookie-banner-rejection` scenario and verify immediate and delayed/open-shadow behavior still works through the reviewed top-frame cookie-banner stack;
- verify child frames do not gain automatic cookie-banner activation from the top-frame-only group while normal all-frame content functionality remains available where designed;
- inspect the browser extension details/permission UI and confirm no unexpected permission or externally connectable surface was introduced;
- confirm Firefox's bootstrap DNR compatibility declaration does not interfere with dynamic policy and Chromium has no corresponding static declaration;
- confirm popup/options/background/content behavior remains equivalent across browsers except for the explicitly reviewed platform differences.

Any source commit, source fingerprint, generated artifact hash/size, or qualification-record mismatch invalidates the observation. Re-run exact-head qualification rather than carrying results forward.

## Privacy boundary

Manifest qualification retains no browsing/request history, page or DOM snapshots, content-script observations, action outcomes, URLs, titles, referrers, permission-use history, timestamps, identifiers, analytics, or telemetry. No owned Drop Ads backend is introduced.

Record only the existing guarded Issue #10 scenario results and browser-specific notes required by the qualification observation format. Do not create a hidden per-page or per-script results database.
