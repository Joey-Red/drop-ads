# Built-in and reviewed filter sources

Drop Ads keeps its own community list separate from third-party coverage. Third-party lists are fetched directly from their upstream project; Drop Ads does not need a custom list proxy/backend.

## Current built-in sources

All built-in sources are visible in Settings and retain canonical source metadata. Built-ins can be enabled/disabled but cannot be silently replaced by imported/persisted metadata.

### Drop Ads Community

Source: the `lists/default.txt` file in this repository. During private development a bundled copy is used as the offline baseline because the private GitHub raw URL cannot be fetched anonymously. When the repository becomes public, the same source can update directly from GitHub.

The bundled copy contains a deliberately small, conservative baseline: network rules for established advertising delivery hosts and script paths, plus safe declarative cosmetic selectors for common ad containers. It contains no scriptlets and never executes page-supplied code. This gives a fresh or offline install useful coverage before any remote source completes.

Default: **enabled**.

### HaGeZi Pro mini

Upstream project: `hagezi/dns-blocklists`

Source fetched directly by the extension:

`https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/pro.mini.txt`

Upstream license: GPL-3.0; see the HaGeZi repository for its current license, source documentation, disclaimer, and issue tracker.

Drop Ads does **not** vendor or redistribute the HaGeZi list contents. It stores only the upstream URL in its built-in subscription configuration and downloads the current list directly from that upstream when enabled.

The Pro mini feed was chosen because its upstream describes it as size-optimized for DNS/browser ad blockers. Its domain-oriented Adblock syntax maps efficiently to Drop Ads domain batches instead of consuming one dynamic browser rule per domain.

Default: **enabled**.

### StevenBlack Unified Hosts

Upstream project: `StevenBlack/hosts`

Source:

`https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts`

Format: hosts-style.

Upstream license: MIT.

Why it is included: large consolidated adware/malware hosts coverage with a simple format that maps cleanly to Drop Ads' existing hosts parser.

Default: **disabled / opt-in**. HaGeZi already overlaps significantly with large DNS/hosts aggregations, so this source should be enabled intentionally rather than stacked automatically.

### Block List Project — Ads

Upstream project: `blocklistproject/Lists`

Source:

`https://raw.githubusercontent.com/blocklistproject/Lists/main/alt-version/ads-nl.txt`

Format: bare-domain list parsed through Drop Ads' conservative third-party parser.

Upstream license: Unlicense.

Why this exact feed is used: the upstream root/AdGuard Ads variants are currently larger than Drop Ads' fixed 5 MiB remote-list ceiling. The upstream `alt-version/ads-nl.txt` feed was 4,944,431 bytes when reviewed, stays under that ceiling, and consists of a representation Drop Ads can normalize as domains. The extension does not raise its safety ceiling for the source; if a future upstream version exceeds the ceiling, the update fails closed and the previous last-known-good cache remains active.

Why it is included: category-specific policy gives users an additional Ads feed without automatically opting into unrelated content categories. Other Block List Project categories are not treated as advertising lists and should require explicit future product decisions if surfaced.

Default: **disabled / opt-in**.

### anudeepND Adservers

Upstream project: `anudeepND/blacklist`

Source:

`https://raw.githubusercontent.com/anudeepND/blacklist/master/adservers.txt`

Format: hosts-style.

Upstream license: MIT.

Why it is included: curated ads/tracking host coverage with a straightforward parser fit and simple trust boundary.

Default: **disabled / opt-in**.

## Reproducible source qualification

Run `npm run qualify:sources` from a reviewed commit to exercise every third-party built-in through the same bounded, hostile-input parser used by the extension. The developer-only report records supported network/cosmetic rule counts, optional upstream `Content-Length` diagnostics, overlap with earlier built-ins, and effective unique contribution. It deliberately reports counts rather than rule values.

A source may also be selected explicitly, for example `npm run qualify:sources -- stevenblack-hosts`. A nonzero exit means at least one selected source failed current download/parser safety checks. HEAD metadata is diagnostic only; admission still depends on the real bounded GET.

This command is **not** part of `npm run check` because it intentionally contacts live upstream projects and therefore cannot be deterministic or offline. Its observations belong with the exact commit/browser qualification record rather than being treated as a unit-test pass.

## Milestone 59 — richer compatibility candidates

The following active upstream projects remain high-priority compatibility candidates rather than current built-in defaults.

### EasyList / EasyPrivacy

Repository: `easylist/easylist`

EasyList is highly relevant because it contains both network and cosmetic rules. The repository also maintains EasyPrivacy and related lists.

Drop Ads should **not** simply point at every source fragment in this repository. Before becoming a built-in source we need to select the exact upstream feed(s), verify the upstream license terms for those feeds, measure how much syntax Drop Ads safely supports, and quantify overlap with HaGeZi/community/optional hosts policy. Unsupported procedural/scriptlet syntax must continue to fail closed.

Status: high-priority compatibility candidate.

### AdGuard Filters

Repository: `AdguardTeam/AdguardFilters`

Upstream license: GPL-3.0.

The project maintains actively updated ad/tracker/privacy/cosmetic and regional filter sections. It is a strong compatibility target, especially now that Drop Ads supports basic declarative cosmetic rules.

Drop Ads intentionally supports only a safe declarative subset today, so an exact built-in feed must not be selected until parser compatibility and unsupported-syntax behavior are measured against the real upstream data.

Status: high-priority compatibility candidate.

### Sources intentionally not selected

Archived or abandoned upstream projects should not become new built-ins merely because they still have a usable raw URL. A source must have an active maintenance path, a reviewable license, stable HTTPS delivery, a parser-compatible format, and acceptable overlap/breakage behavior.

## Source-admission requirements

Before a candidate becomes an enabled-by-default subscription, record and qualify:

- exact upstream repository and exact fetched URL
- upstream license and attribution/redistribution requirements
- source format and which syntax Drop Ads actually supports
- whether it is enabled or disabled by default and why
- raw rule count and effective unique rule count after dedupe against current built-ins
- browser DNR/memory impact
- cosmetic selector impact where applicable
- refresh/download size and response behavior
- false-positive/breakage observations
- last-known-good fallback behavior
- private/LAN target rejection and hostile-input validation

`npm run qualify:sources` supplies the repeatable parser/count/overlap/download portion. Browser DNR/memory cost and real breakage remain native-browser observations and stay in Issue #10; they must not be inferred from the developer report.

A candidate source must never weaken the existing HTTPS-only, redirect-rejecting, credential-free/referrer-free, bounded-download, transactional-activation model.

## Privacy of list refreshes

Filter-list downloads use no Drop Ads account, no custom backend, no browser/request history, no matched-rule data, no analytics parameters, `credentials: omit`, and `referrerPolicy: no-referrer`.

As with any direct HTTP request, the upstream hosting provider can observe ordinary network metadata inherent to serving the request, such as the connecting IP address. Users who do not want their browser contacting an optional upstream can leave it disabled.

## Response integrity

HTTP `200 OK` is not enough to replace cached policy. Drop Ads rejects explicit HTML/XHTML, JSON, and XML document media types before parsing. It also sniffs the bounded response body for obvious HTML/XML documents so a mislabeled login, proxy, CDN, or upstream error page cannot be interpreted as filter syntax.

After parsing, a remote response must contain at least one supported network or declarative cosmetic rule. Empty files, comment-only responses, and unsupported-only lists are treated as source failures rather than valid updates. This preserves the last-known-good cache when an upstream accidentally returns an empty maintenance response.

Ordinary `text/plain`, missing content-type, and `application/octet-stream` delivery remain supported. These checks are layered on top of the existing HTTPS requirement, redirect rejection, credential/referrer omission, streaming byte ceiling, parser safety checks, DNR-budget preflight, and transactional activation.
