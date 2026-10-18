import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { readFile, access } from "node:fs/promises";
const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: "https://benchrelay.top/",
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
global.HTMLElement = window.HTMLElement;
global.FormData = window.FormData;
global.IS_REACT_ACT_ENVIRONMENT = true;
window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
const React = await import("react");
const { act } = React;
const { createRoot } = await import("react-dom/client");
const { default: App } = await import("../.cache/App.mjs");
const container = document.getElementById("root");
const root = createRoot(container);
const click = async (el) => {
  assert.ok(el, "click target exists");
  await act(async () =>
    el.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
  );
};
const buttons = () => [...container.querySelectorAll("button")];
const button = (text) => buttons().find((x) => x.textContent.includes(text));
const edit = async (el, value) => {
  assert.ok(el);
  await act(async () => {
    const proto =
      el.tagName === "SELECT"
        ? window.HTMLSelectElement.prototype
        : el.tagName === "TEXTAREA"
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(
      new window.Event(el.tagName === "SELECT" ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
};
const submit = async (form) =>
  await act(async () =>
    form.dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    ),
  );
test("DOM workflow: menus, tabs, search, filters, detail, review actions, export, reset and contact fallback", async () => {
  await act(async () => root.render(React.createElement(App, { path: "/" })));
  const menu = container.querySelector('[aria-label="Open menu"]');
  await click(menu);
  assert.equal(menu.getAttribute("aria-expanded"), "true");
  await click(container.querySelector('.navlinks a[href="/#leadership"]'));
  assert.equal(menu.getAttribute("aria-expanded"), "false");
  assert.match(
    container.querySelector("#leadership").textContent,
    /Azeem SalakoFounder & CEO/,
  );
  assert.match(
    container.querySelector("#leadership").textContent,
    /Osahon OsagiedeCo-founder & CTO/,
  );
  for (const tab of [
    "Procedures",
    "Equipment",
    "Readiness Reviews",
    "Transfers",
  ]) {
    await click(button(tab));
    assert.match(
      container.querySelector(".workspace-breadcrumb").textContent,
      new RegExp(tab.toUpperCase()),
    );
  }
  const search = container.querySelector(
    '[aria-label="Search sample records"]',
  );
  await edit(search, "TR-017");
  assert.equal(container.querySelectorAll(".record").length, 4);
  await edit(search, "DG-06");
  assert.equal(container.querySelectorAll(".record").length, 1);
  await edit(search, "No match");
  assert.ok(container.querySelector(".empty"));
  await edit(search, "");
  const filter = container.querySelector(
    '[aria-label="Filter sample records"]',
  );
  await edit(filter, "mismatch");
  assert.equal(container.querySelectorAll(".record").length, 1);
  await click(container.querySelector(".record"));
  assert.equal(container.querySelector("dialog").open, true);
  assert.match(container.querySelector("dialog").textContent, /180 °C/);
  assert.match(container.querySelector("dialog").textContent, /Up to 150 °C/);
  await edit(container.querySelector("dialog select"), "Mira Evans");
  await edit(
    container.querySelector("dialog textarea"),
    "Check the chamber range",
  );
  await submit(container.querySelector("dialog textarea").closest("form"));
  assert.match(
    container.querySelector("dialog").textContent,
    /Check the chamber range/,
  );
  await edit(container.querySelector("dialog input"), "Unrelated document");
  await submit(container.querySelector("dialog input").closest("form"));
  assert.match(
    container.querySelector("dialog").textContent,
    /Unverified simulated reference/,
  );
  const inputs = container.querySelectorAll("dialog input");
  await edit(inputs[1], "Request a suitable chamber record");
  await submit(inputs[1].closest("form"));
  await click(button("Record acknowledgement"));
  assert.match(
    container.querySelector("dialog .badge").textContent,
    /Capability mismatch/,
  );
  await click(
    container.querySelector('[aria-label="Close requirement details"]'),
  );
  await edit(filter, "reviewed");
  assert.equal(container.querySelectorAll(".record").length, 1);
  await edit(filter, "missing");
  await click(container.querySelector(".record"));
  await click(button("Record acknowledgement"));
  assert.match(
    container.querySelector("dialog .badge").textContent,
    /Capability unknown/,
  );
  await click(
    container.querySelector('[aria-label="Close requirement details"]'),
  );
  let exported;
  global.URL.createObjectURL = (blob) => {
    exported = blob;
    return "blob:sample";
  };
  global.URL.revokeObjectURL = () => {};
  const nativeClick = window.HTMLAnchorElement.prototype.click;
  window.HTMLAnchorElement.prototype.click = function () {};
  await click(button("Export checklist"));
  const data = JSON.parse(await exported.text());
  assert.equal(data.findings[0].unresolved, true);
  assert.equal(data.findings[2].unresolved, true);
  assert.equal(data.findings[0].review.notes[0], "Check the chamber range");
  window.HTMLAnchorElement.prototype.click = nativeClick;
  await click(button("Reset"));
  assert.equal(container.querySelectorAll(".record").length, 4);
  await click(container.querySelector(".record"));
  assert.equal(container.querySelector("dialog select").value, "");
  assert.equal(container.querySelectorAll(".review-entry").length, 0);
  await click(
    container.querySelector('[aria-label="Close requirement details"]'),
  );
  const form = container.querySelector(".contact-form");
  await edit(form.querySelector('[name="name"]'), "Sample Visitor");
  await edit(form.querySelector('[name="email"]'), "visitor@example.com");
  await edit(form.querySelector('[name="company"]'), "Sample Lab");
  await edit(
    form.querySelector('[name="type"]'),
    "Independent testing laboratory",
  );
  await edit(
    form.querySelector('[name="challenge"]'),
    "Moving procedures between sites",
  );
  assert.equal(form.checkValidity(), true);
  await click(button("Copy message"));
  assert.match(
    form.querySelector("textarea[readonly]").value,
    /Sample Visitor/,
  );
  assert.match(form.textContent, /Select and copy/);
  assert.equal(form.querySelector('[name="name"]').value, "Sample Visitor");
  assert.equal(
    container.querySelector(".email-link").getAttribute("href"),
    "mailto:azeem@benchrelay.top",
  );
  await act(async () => root.unmount());
});
test("prerendered routes, navigation targets, brand downloads and review metadata exist", async () => {
  for (const path of [
    "index.html",
    "privacy/index.html",
    "terms/index.html",
    "brand/index.html",
    "404.html",
  ]) {
    const html = await readFile("dist/" + path, "utf8");
    const d = new JSDOM(html).window.document;
    assert.equal(d.doctype.name, "html");
    assert.equal((html.match(/<!doctype html>/gi) || []).length, 1);
    assert.equal(
      d.querySelector('meta[name="robots"]').content,
      "noindex, nofollow",
    );
    assert.ok(d.querySelector("main"));
    assert.equal(d.querySelector('meta[property="og:image"]').content,'https://benchrelay.top/brand/social-preview.png');
    if(path.startsWith('privacy')) { assert.equal(d.title,'Privacy — Benchrelay'); assert.match(d.querySelector('meta[name="description"]').content,/browser-local/); }
    if(path.startsWith('terms')) assert.equal(d.title,'Terms of use — Benchrelay');
    if(path.startsWith('brand')) assert.equal(d.title,'Brand assets — Benchrelay');
    if(path==='404.html') assert.equal(d.title,'Page not found — Benchrelay');

    assert.ok(
      d
        .querySelector('link[rel="canonical"]')
        .href.startsWith("https://benchrelay.top/"),
    );
    for (const img of d.querySelectorAll("img"))
      await access("dist" + img.getAttribute("src"));
    for (const a of d.querySelectorAll("a[download]"))
      await access("dist" + a.getAttribute("href"));
  }
  const home = new JSDOM(await readFile("dist/index.html", "utf8")).window
    .document;
  assert.match(home.querySelector("h1").textContent, /Before the method moves/);
  assert.match(
    home.querySelector("#leadership").textContent,
    /Osahon Osagiede/,
  );
  for (const a of home.querySelectorAll('a[href^="#"],a[href^="/#"]')) {
    const hash = a.getAttribute("href").split("#")[1];
    assert.ok(home.getElementById(hash), hash + " exists");
  }
  const brand = new JSDOM(await readFile("dist/brand/index.html", "utf8"))
    .window.document;
  assert.equal(brand.querySelectorAll("a[download]").length, 12);
  assert.match(await readFile("dist/robots.txt", "utf8"), /Disallow: \//);
});
