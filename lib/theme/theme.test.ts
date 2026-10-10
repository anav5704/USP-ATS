import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { resolveTheme, themeInitScript, THEME_STORAGE_KEY } from "./theme";
import { getServerTheme, getTheme, setTheme, subscribeToTheme } from "./theme-store";

test("only light and dark are supported, with dark as the SSR default", () => {
  for (const value of [null, undefined, "", "system", "invalid", "dark"]) {
    assert.equal(resolveTheme(value), "dark");
  }
  assert.equal(resolveTheme("light"), "light");
  assert.equal(getServerTheme(), "dark");
});

test("the pre-paint script restores a saved preference and handles blocked storage", () => {
  for (const saved of [null, "light", "dark", "system"]) {
    const document = { documentElement: { dataset: { theme: "dark" } } };
    runInNewContext(themeInitScript, {
      document,
      localStorage: { getItem: (key: string) => {
        assert.equal(key, THEME_STORAGE_KEY);
        return saved;
      } },
    });
    assert.equal(document.documentElement.dataset.theme, resolveTheme(saved));
  }
  const document = { documentElement: { dataset: {} as { theme: string } } };
  runInNewContext(themeInitScript, {
    document,
    get localStorage() { throw new Error("Storage blocked"); },
  });
  assert.equal(document.documentElement.dataset.theme, "dark");
});

test("switching, persistence, subscriber remount, cross-tab sync and storage failure", (t) => {
  const document = { documentElement: { dataset: { theme: "dark" } } };
  const window = new EventTarget();
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const names = ["document", "window", "localStorage"] as const;
  const descriptors = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: document },
    window: { configurable: true, value: window },
    localStorage: { configurable: true, value: storage },
  });
  t.after(() => names.forEach((name, index) => {
    const descriptor = descriptors[index];
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }));

  let notifications = 0;
  const unsubscribe = subscribeToTheme(() => { notifications++; });
  setTheme("light");
  assert.equal(getTheme(), "light");
  assert.equal(values.get(THEME_STORAGE_KEY), "light");
  setTheme("dark");
  assert.equal(getTheme(), "dark");
  assert.equal(values.get(THEME_STORAGE_KEY), "dark");
  assert.equal(notifications, 2);
  setTheme("light");
  unsubscribe();
  const cleanup = subscribeToTheme(() => { notifications++; });
  assert.equal(getTheme(), "light", "navigation/remount preserves the root theme");

  const storageEvent = (key: string | null, newValue: string | null) => {
    window.dispatchEvent(Object.assign(new Event("storage"), { key, newValue }));
  };
  storageEvent("unrelated-setting", "dark");
  assert.equal(getTheme(), "light");
  storageEvent(THEME_STORAGE_KEY, "dark");
  assert.equal(getTheme(), "dark");
  storageEvent(THEME_STORAGE_KEY, "light");
  assert.equal(getTheme(), "light");
  storageEvent(null, null);
  assert.equal(getTheme(), "dark");
  storage.setItem = () => { throw new Error("Quota exceeded"); };
  setTheme("light");
  assert.equal(getTheme(), "light");
  cleanup();
  const previous = notifications;
  setTheme("dark");
  assert.equal(notifications, previous, "unmounted subscribers are removed");
});
