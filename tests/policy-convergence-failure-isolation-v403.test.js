import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function event({ throwOnRemove = false } = {}) {
  const listeners = [];
  let removeAttempts = 0;
  return {
    addListener(listener) { listeners.push(listener); },
    removeListener(listener) {
      removeAttempts += 1;
      if (throwOnRemove) throw new Error("remove failed");
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    },
    emit(value) { for (const listener of [...listeners]) listener(value); },
    get removeAttempts() { return removeAttempts; },
    get listenerCount() { return listeners.length; }
  };
}

function api(events = {}) {
  const runtime = events.runtime ?? event();
  const context = events.context ?? event();
  const alarm = events.alarm ?? event();
  return {
    value: {
      runtime: { onMessage: runtime },
      contextMenus: { onClicked: context },
      alarms: { onAlarm: alarm }
    },
    runtime,
    context,
    alarm
  };
}

test("M403 throwing convergence logger cannot abort a remembered rerun", async () => {
  const fx = api();
  const first = deferred();
  let calls = 0;
  const controller = {
    syncRules() {
      assert.equal(this, controller);
      calls += 1;
      return calls === 1 ? first.promise : Promise.resolve();
    }
  };
  const logger = {
    error() {
      assert.equal(this, logger);
      throw new Error("logger failed");
    }
  };
  const convergence = installPolicyConvergence({ api: fx.value, controller, logger });

  const pending = convergence.queueConvergence("first");
  convergence.queueConvergence("remembered");
  first.reject(new Error("DNR failed"));
  assert.equal(await pending, true);
  assert.equal(calls, 2);

  await convergence.queueConvergence("later");
  assert.equal(calls, 3);
});

test("M403 dispose isolates listener-removal failures and still permits reinstall", () => {
  const runtime = event({ throwOnRemove: true });
  const context = event();
  const alarm = event();
  const fx = api({ runtime, context, alarm });
  const options = {
    api: fx.value,
    controller: { syncRules() { return Promise.resolve(); } },
    logger: { error() {} }
  };

  const first = installPolicyConvergence(options);
  assert.doesNotThrow(() => first.dispose());
  assert.doesNotThrow(() => first.dispose());
  assert.equal(runtime.removeAttempts, 1);
  assert.equal(context.removeAttempts, 1);
  assert.equal(alarm.removeAttempts, 1);
  assert.equal(context.listenerCount, 0);
  assert.equal(alarm.listenerCount, 0);

  const second = installPolicyConvergence(options);
  assert.notEqual(second, first);
  second.dispose();
});
