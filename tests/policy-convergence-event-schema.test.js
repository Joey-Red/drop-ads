import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function createController() {
  let calls = 0;
  return {
    controller: {
      async syncRules() {
        calls += 1;
      }
    },
    calls: () => calls
  };
}

test("policy convergence never invokes accessor or inherited event discriminators", async () => {
  const mock = createMockWebExtension();
  const tracked = createController();
  const convergence = installPolicyConvergence({ api: mock.api, controller: tracked.controller });
  let getterCalls = 0;

  const accessorMessage = {};
  Object.defineProperty(accessorMessage, "type", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "drop-ads:set-enabled";
    }
  });
  mock.events.runtimeMessage.emit(accessorMessage);

  const inheritedMessage = Object.create({ type: "drop-ads:set-enabled" });
  mock.events.runtimeMessage.emit(inheritedMessage);

  const hiddenMessage = {};
  Object.defineProperty(hiddenMessage, "type", { enumerable: false, value: "drop-ads:set-enabled" });
  mock.events.runtimeMessage.emit(hiddenMessage);

  const accessorMenu = {};
  Object.defineProperty(accessorMenu, "menuItemId", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "drop-ads:block-domain";
    }
  });
  mock.events.menuClicked.emit(accessorMenu, { id: 1 });

  const accessorAlarm = {};
  Object.defineProperty(accessorAlarm, "name", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "drop-ads:list-refresh";
    }
  });
  mock.events.alarmEvent.emit(accessorAlarm);

  await convergence.whenIdle();
  assert.equal(getterCalls, 0);
  assert.equal(tracked.calls(), 0);
  convergence.dispose();
});

test("recognized plain-data policy events still queue convergence", async () => {
  const mock = createMockWebExtension();
  const tracked = createController();
  const convergence = installPolicyConvergence({ api: mock.api, controller: tracked.controller });

  mock.events.runtimeMessage.emit({ type: "drop-ads:set-enabled", enabled: true });
  await convergence.whenIdle();
  assert.equal(tracked.calls(), 1);

  mock.events.menuClicked.emit({ menuItemId: "drop-ads:block-exact" }, { id: 1 });
  await convergence.whenIdle();
  assert.equal(tracked.calls(), 2);

  mock.events.alarmEvent.emit({ name: "drop-ads:list-refresh" });
  await convergence.whenIdle();
  assert.equal(tracked.calls(), 3);

  convergence.dispose();
});

test("disposed convergence listeners remain inert even when the event shim cannot remove them", async () => {
  const mock = createMockWebExtension();
  const tracked = createController();
  const convergence = installPolicyConvergence({ api: mock.api, controller: tracked.controller });
  convergence.dispose();

  mock.events.runtimeMessage.emit({ type: "drop-ads:set-enabled", enabled: false });
  mock.events.menuClicked.emit({ menuItemId: "drop-ads:block-domain" }, { id: 1 });
  mock.events.alarmEvent.emit({ name: "drop-ads:list-refresh" });
  await convergence.whenIdle();
  assert.equal(tracked.calls(), 0);
});
