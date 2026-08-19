import { installActionCount } from "./core/action-count.js";
import { bootstrapBackground } from "./core/background-bootstrap.js";
import { installContextBlockFeedback } from "./core/context-feedback.js";
import { installCookieBannerRuntime } from "./core/cookie-banner-runtime.js";
import { installCosmeticRuntime } from "./core/cosmetic-runtime.js";
import { createImportGuardedApi } from "./core/import-guard.js";
import { createMessageGuardedApi } from "./core/message-contract.js";
import { installPolicyConvergence } from "./core/policy-convergence.js";
import { installRefreshWatchdog } from "./core/refresh-watchdog.js";
import { createBackgroundRuntime } from "./core/runtime.js";
import { createResetPartitionedApi, installSettingsResetRuntime } from "./core/settings-reset-runtime.js";

const api = globalThis.browser ?? globalThis.chrome;
const coreMessageApi = createMessageGuardedApi(createResetPartitionedApi(api), { group: "core" });
const cosmeticMessageApi = createMessageGuardedApi(api, { group: "cosmetic", rejectUnknown: false });

bootstrapBackground({
  startCore() {
    const runtime = createBackgroundRuntime({ api: createImportGuardedApi(coreMessageApi) });
    runtime.start();
    return runtime;
  },
  installMandatoryRecovery(runtime) {
    return installPolicyConvergence({ api, controller: runtime });
  },
  optionalFeatures: [
    { name: "settings-reset", install: (runtime) => installSettingsResetRuntime({ api, core: runtime }) },
    { name: "refresh-watchdog", install: (runtime) => installRefreshWatchdog({ api, controller: runtime }) },
    { name: "action-count", install: () => installActionCount({ api }) },
    { name: "context-feedback", install: () => installContextBlockFeedback({ api }) },
    { name: "cosmetic-runtime", install: () => installCosmeticRuntime({ api: cosmeticMessageApi }) },
    { name: "cookie-banner-runtime", install: () => installCookieBannerRuntime({ api }) }
  ]
});
