# Community contribution eligibility

Automatic community preparation is optional and disabled by default. It is intentionally narrower than Drop Ads local policy.

Only an **unscoped domain block** or **unscoped exact HTTP(S) URL block** is eligible for automatic preparation. Exact URLs are reduced to their normalized public domain before a GitHub issue URL is built; path, query, fragment, and source-page information are never included.

Local policy that is useful to one user but not an appropriate shared-domain candidate is marked `not-eligible` and remains local. This includes URL-pattern rules, country/ccTLD suffix policy, and rules constrained to resource types. No GitHub tab is opened for these rules and the local mutation is not reported as a contribution failure.

Public-looking domain/URL eligibility is only the first gate. The existing remote-policy safety validator still rejects localhost, private/link-local addresses, `.local`, `home.arpa`, single-label intranet names, and related non-public targets before any GitHub URL is created. Those remain a failed contribution outcome while the deliberate personal block stays active locally.

This distinction keeps contribution UX accurate without broadening the data sent to GitHub or weakening local blocking capabilities.
