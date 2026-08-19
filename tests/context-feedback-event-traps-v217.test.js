import assert from "node:assert/strict";
import test from "node:test";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";
import { MENU_BLOCK_DEFAULT } from "../src/core/runtime.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function fakeTimers() {
  return { setTimeout: () => 1, clearTimeout: () => undefined };
}

function install(mock) {
  const timers = fakeTimers();
  return installContextBlockFeedback({ api: mock.api, setTimeoutImpl: timers.setTimeout, clearTimeoutImpl: timers.clearTimeout });
}

test("context feedback contains throwing descriptor/prototype traps", () => {
  const mock = createMockWebExtension();
  install(mock);
  const descriptorTrap = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error("descriptor trap"); } });
  const prototypeTrap = new Proxy({}, { getPrototypeOf() { throw new Error("prototype trap"); } });
  assert.doesNotThrow(() => mock.events.menuClicked.emit(descriptorTrap, { id: 1 }));
  assert.doesNotThrow(() => mock.events.menuClicked.emit(prototypeTrap, { id: 1 }));
});

test("context feedback ignores custom-prototype event containers", () => {
  const mock = createMockWebExtension();
  install(mock);
  const info = Object.assign(Object.create({ custom: true }), { menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://example.com/ad.png" });
  const tab = Object.assign(Object.create({ custom: true }), { id: 2 });
  assert.doesNotThrow(() => mock.events.menuClicked.emit(info, tab));
});

test("context feedback accepts null-prototype browser-style data", () => {
  const mock = createMockWebExtension();
  install(mock);
  const info = Object.assign(Object.create(null), { menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://example.com/ad.png" });
  const tab = Object.assign(Object.create(null), { id: 3 });
  assert.doesNotThrow(() => mock.events.menuClicked.emit(info, tab));
});
