import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

test("prototype route and new sections are prerendered", async () => {
  const html = await readFile("dist/app/index.html", "utf8");
  assert.match(html, /<title>Interactive prototype — Benchrelay<\/title>/);
  assert.match(html, /Prototype · fictional data/);
  assert.match(html, /Good morning, Mira/);
  assert.match(html, /noindex, nofollow/);
  const home = await readFile("dist/index.html", "utf8");
  for (const id of [
    "prototype",
    "benefits",
    "use-cases",
    "safeguards",
    "pricing",
    "faq",
  ])
    assert.match(home, new RegExp(`id="${id}"`), id);
  assert.doesNotMatch(home, /[£$€]\d/, "no invented prices");
});

test("prototype across all four roles in a simulated DOM (not browser layout QA)", async () => {
  const dom = new JSDOM('<div id="app"></div>', {
    url: "https://benchrelay.top/app",
  });
  const w = dom.window;
  Object.assign(globalThis, {
    window: w,
    document: w.document,
    location: w.location,
    localStorage: w.localStorage,
    HTMLElement: w.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  globalThis.addEventListener = w.addEventListener.bind(w);
  globalThis.removeEventListener = w.removeEventListener.bind(w);
  const downloads = [];
  globalThis.URL.createObjectURL = () => "blob:x";
  globalThis.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {
    downloads.push(this.download);
  };
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { default: App } = await import("../.cache/App.mjs");
  const container = document.getElementById("app");
  let root = createRoot(container);
  await act(async () =>
    root.render(React.createElement(App, { path: "/app" })),
  );
  const text = () => document.body.textContent;
  const btn = (s) =>
    [...document.querySelectorAll("button")].find((b) =>
      b.textContent.trim().startsWith(s),
    );
  const link = (s) =>
    [...document.querySelectorAll("a")].find((a) =>
      a.textContent.trim().startsWith(s),
    );
  const click = async (el) => {
    assert.ok(el, "control exists");
    await act(async () =>
      el.dispatchEvent(
        new w.MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    );
  };
  const change = async (el, value) => {
    assert.ok(el, "field exists");
    const proto =
      el.tagName === "SELECT"
        ? w.HTMLSelectElement.prototype
        : el.tagName === "TEXTAREA"
          ? w.HTMLTextAreaElement.prototype
          : w.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    await act(async () =>
      el.dispatchEvent(
        new w.Event(el.tagName === "SELECT" ? "change" : "input", {
          bubbles: true,
        }),
      ),
    );
  };
  const nav = async (hash) => {
    await act(async () => {
      w.location.hash = hash;
      w.dispatchEvent(new w.HashChangeEvent("hashchange"));
    });
  };
  const submit = (form) =>
    act(async () =>
      form.dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      ),
    );
  const demoAs = (name) =>
    change(
      document.querySelector('[aria-label="Demo as user"]'),
      [...document.querySelectorAll('[aria-label="Demo as user"] option')].find(
        (o) => o.textContent.startsWith(name),
      ).value,
    );

  // Method owner: remap REQ-01 to the oven, confirm the AI mapping, ask the lab for REQ-03.
  await nav("#/transfers/TR-017/requirements/REQ-01");
  assert.match(
    document.querySelector(".pa-finding").textContent,
    /TC-02 reaches 150 °C; REQ-01 needs at least 180 °C/,
  );
  await change(document.querySelector(".pa-inline-form select"), "OV-07");
  await submit(document.querySelector(".pa-inline-form"));
  assert.match(text(), /REQ-01 mapped to OV-07/);
  await click(link("AI suggestions"));
  await click(btn("Confirm mapping"));
  assert.match(text(), /REQ-07 mapped to DS-11/);
  await nav("#/transfers/TR-017/requirements/REQ-03");
  await submit(document.querySelector(".pa-subforms form"));
  assert.match(text(), /Request sent to the receiving lab/);
  await click(btn("Readiness checklist"));
  assert.deepEqual(downloads, ["benchrelay-TR-017-readiness.json"]);

  // Receiving lab answers through its register.
  await demoAs("Leon Hart");
  assert.equal(w.location.hash, "#/lab");
  const form = document.querySelector(".pa-mini");
  const inputs = form.querySelectorAll("input");
  await change(inputs[0], "1");
  await change(form.querySelectorAll("select")[1], "µm");
  await change(inputs[1], "Datasheet DG-6 rev 2");
  await submit(form);
  assert.match(text(), /DG-06 capability recorded/);
  await nav("#/transfers/TR-017");
  assert.match(text(), /Not available for this role/);

  // Persistence, then the reviewer sees what is still open.
  await act(async () => root.unmount());
  root = createRoot(container);
  await act(async () =>
    root.render(React.createElement(App, { path: "/app" })),
  );
  await demoAs("Nia Brooks");
  await nav("#/review/TR-017");
  assert.match(text(), /REQ-06 \(Calibration issue\)/);
  assert.doesNotMatch(
    text(),
    /REQ-03 \(Capability unknown\)/,
    "the lab's record resolved REQ-03",
  );
  await change(document.querySelector(".pa-form select"), "Not ready");
  await change(
    document.querySelector(".pa-form textarea"),
    "Humidity logger calibration expires during the study window.",
  );
  await submit(document.querySelector(".pa-form"));
  assert.match(text(), /Readiness recorded/);

  // Admin audit and reset.
  await demoAs("Ravi Kumar");
  await nav("#/admin/audit");
  assert.match(text(), /Capability recorded/);
  await click(btn("Reset demo data"));
  assert.equal(localStorage.getItem("benchrelay-prototype-v1"), null);
  await nav("#/transfers/TR-017/requirements/REQ-01");
  assert.match(
    document.querySelector(".pa-finding").textContent,
    /TC-02 reaches 150 °C/,
  );
  await act(async () => root.unmount());
  w.close();
});
