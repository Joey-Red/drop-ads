# Community submissions

Local blocking never depends on community contribution.

A user can explicitly choose **Submit** beside a local block, or opt in to automatically prepare a submission after adding a new block. Automatic preparation is off by default. Because Drop Ads has no custom backend and embeds no writable GitHub credential, the extension opens a prefilled GitHub issue and the user reviews/submits it through GitHub.

## Local blocking comes first

Automatic community preparation is a best-effort side effect **after** a new local block has been validated, activated in DNR, and persisted successfully. Its outcome is separate from the local policy transaction:

- `not-requested` — auto-submit is off, the rule is not a new personal block, or the block was already present
- `prepared` — the local block succeeded and Drop Ads opened the prefilled GitHub issue
- `failed` — the local block succeeded, but the optional community candidate was not eligible or the GitHub tab could not be opened

A `failed` contribution outcome does not roll back, remove, or misreport the local block. Settings explicitly tells the user that the rule is active locally while GitHub preparation failed. Context-menu blocking likewise keeps the local rule active and only logs the contribution-side failure.

Duplicate/no-op blocks do not open duplicate GitHub submissions. Manual **Submit** is different: it is an explicit GitHub-only action, so an ineligible candidate or failure to open GitHub may be reported normally without changing the already-existing local rule.

## Privacy boundary

The submission flow sends only a normalized candidate domain. If the local rule is an exact URL, the path, query string, fragment, and source page are discarded before the GitHub issue URL is created. No browsing history, request log, browser fingerprint, analytics identifier, or unrelated request is included.

Local/private network targets are rejected **before a GitHub URL is constructed or a browser tab is opened**. This includes localhost, private/link-local IP targets, `.local`, `home.arpa`, and other destinations rejected by the shared remote-policy safety classifier. A user can still deliberately block those targets locally; they simply cannot be prepared for community contribution. This client-side check matters because relying only on GitHub-side validation would disclose the local-network candidate merely by opening the prefilled issue URL.

Manual GitHub submissions are treated more strictly than ordinary local rules: community validation rejects URL/path/query-shaped candidate input instead of silently reducing it to a domain. This helps prevent someone from accidentally publishing a tokenized or otherwise sensitive request URL in the moderation format.

## Automated validation

Issues whose title begins with `[Community block]` are checked by `.github/workflows/community-submission.yml`. The reusable validator accepts exactly one fenced `block domain` candidate and reports one of these states:

- `ready` — normalized and eligible for human review
- `duplicate` — already present exactly
- `covered` — an existing blocked parent domain already covers the candidate
- `conflict` — an existing allowed parent domain would override the candidate
- `invalid` — malformed, unsafe, non-domain, local/private, or otherwise unsupported

Editing an issue updates one marked validation comment instead of adding repeated bot comments. The validation workflow has **read-only content permission** and cannot write `lists/default.txt` or any other repository content.

## Maintainer approval and promotion

A candidate reaches the promotion stage only when the `community-approved` label is applied. The write-capable promotion workflow independently verifies that the actor who applied the label has `write`, `maintain`, or `admin` repository permission before doing anything with its repository write token.

The promotion workflow re-runs the strict validator and accepts only `ready` candidates. It changes only `lists/default.txt` on a deterministic bot branch named `community/issue-N`, then creates or refreshes a pull request linked to the source issue.

The workflow does **not** push directly to `main`, enable auto-merge, or merge its PR. Normal PR review and merge is the second human gate. Reapplying the label is idempotent: an already-promoted candidate becomes a no-op, and an existing bot branch/open PR is refreshed rather than multiplied.

## Trust boundaries

Issue text is untrusted input. The extension never embeds a GitHub token. Validation cannot write repository contents. Promotion can write only after the repository-permission check and still produces a reviewable branch/PR instead of production policy.

After merge, the community list remains subject to the same parser, remote-rule safety checks, browser DNR budget checks, transactional activation, and last-known-good fallback as every other shared list update.
