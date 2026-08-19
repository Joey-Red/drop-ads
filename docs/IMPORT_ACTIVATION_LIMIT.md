# Settings import remote-activation budget

Settings import is transactional, but a valid backup can still request many enabled remote filter sources. Every missing source has its own 30-second download deadline, so allowing an unbounded sequence would turn one import into excessive network/time work before DNR activation.

Before the background runtime receives an import message, Drop Ads parses the candidate settings and compares candidate source identities with the currently configured source identities that have reusable cache. The packaged **Drop Ads Community** baseline is treated as locally available. Disabled sources and enabled sources with cache reusable by canonical `format + source URL` identity do not consume this budget.

At most **16 enabled sources that still require a remote download** may be activated by one settings import. If the candidate needs more, the import is rejected before the runtime transaction and before any of those source downloads begin. Nothing is partially imported or silently disabled. The user can import with some sources disabled, then enable additional sources individually through the normal one-source transactional control.

This guard does not replace source validation, the per-source 30-second deadline, the 1 MB backup ceiling, structural backup collection limits, DNR budget preflight, or rollback behavior. It only bounds remote activation work before those existing controls run.
