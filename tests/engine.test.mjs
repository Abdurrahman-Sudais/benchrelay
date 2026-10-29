import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  evaluate,
  evaluateTransfer,
  toBase,
  suggestMapping,
  readinessBlockers,
  transferStatus,
  csv,
} from "../src/app/engine.js";
import { seed } from "../src/app/seed.js";

const fx = JSON.parse(
  await readFile("backend/tests/fixtures/cases.json", "utf8"),
);

test("readiness rules match the shared fixtures used by the Python Lambda", () => {
  for (const c of fx.cases) {
    const req = {
      id: "REQ-X",
      name: "X",
      parameterLabel: "Value",
      calibrated: false,
      ...c.req,
    };
    const eq = c.eq ? { id: "EQ-X", ...c.eq } : null;
    const r = evaluate(req, eq, fx.context);
    assert.equal(r.status, c.status, `${c.name}: status`);
    assert.deepEqual(
      r.findings.map((f) => f.kind),
      c.kinds,
      `${c.name}: kinds`,
    );
  }
});

test("unit conversion", () => {
  assert.deepEqual(toBase({ value: 10, unit: "µm" }), {
    value: 0.01,
    dimension: "length",
  });
  assert.deepEqual(toBase({ value: 2, unit: "min" }), {
    value: 120,
    dimension: "time",
  });
  assert.throws(() => toBase({ value: 1, unit: "furlong" }), /Unknown unit/);
});

test("seed TR-017 matches the home-page workspace and blocks readiness", () => {
  const d = seed();
  const t = d.transfers[0];
  const res = evaluateTransfer(t, d.procedures[0], d.labs[0], d.policy);
  const s = Object.fromEntries(res.map((r) => [r.req.id, r.status]));
  assert.deepEqual(s, {
    "REQ-01": "Capability mismatch",
    "REQ-02": "Meets requirement",
    "REQ-03": "Capability unknown",
    "REQ-04": "Meets requirement",
    "REQ-05": "Meets requirement",
    "REQ-06": "Calibration issue",
    "REQ-07": "No equipment mapped",
  });
  assert.deepEqual(
    t.suggestions.map((x) => [x.requirementId, x.equipmentId]),
    [["REQ-07", "DS-11"]],
  );
  assert.equal(transferStatus(t, res), "In preparation");
  assert.equal(readinessBlockers(t, res).length, 1);
  assert.equal(
    suggestMapping({ name: "Ultrasonic bath", excerpt: "Sonicate" }, d.labs[0]),
    null,
  );
});

test("csv escaping", () =>
  assert.equal(
    csv([
      ["a", "b,c"],
      ['"q"', "x\ny"],
    ]),
    'a,"b,c"\n"""q""","x\ny"',
  ));
