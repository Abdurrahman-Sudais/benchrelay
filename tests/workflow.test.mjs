import { test } from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/app/seed.js";
import * as A from "../src/app/actions.js";
import { transferStatus } from "../src/app/engine.js";

const t = (n = 0) => new Date(Date.UTC(2026, 9, 18, 9, n)).toISOString();
const T = "TR-017";

test("map, request, lab records, compensating measure, independent readiness", () => {
  const d = seed();
  const tr = () => A.transferById(d, T);
  const status = (id) => A.results(d, tr()).find((r) => r.req.id === id).status;

  // Owner remaps conditioning to the oven, which reaches 250 °C; its uniformity then misses REQ-05.
  assert.throws(
    () => A.mapRequirement(d, "u-leon", T, "REQ-01", "OV-07", t()),
    A.PermissionError,
  );
  A.mapRequirement(d, "u-mira", T, "REQ-01", "OV-07", t(1));
  A.mapRequirement(d, "u-mira", T, "REQ-05", "OV-07", t(2));
  assert.equal(status("REQ-01"), "Meets requirement");
  assert.equal(status("REQ-05"), "Capability mismatch");
  A.decideSuggestion(d, "u-mira", T, tr().suggestions[0].id, true, "", t(3));
  assert.equal(
    status("REQ-07"),
    "Meets requirement",
    "desiccator holds 25 mm specimens",
  );

  // Requests to the lab; only the lab may answer them by updating the register.
  A.requestFromLab(
    d,
    "u-mira",
    T,
    "REQ-03",
    "Record capability value",
    "Gauge resolution",
    t(4),
  );
  A.requestFromLab(
    d,
    "u-mira",
    T,
    "REQ-06",
    "Upload calibration record",
    "",
    t(5),
  );
  assert.equal(
    transferStatus(tr(), A.results(d, tr())),
    "Waiting on receiving lab",
  );
  assert.throws(
    () =>
      A.recordCapability(
        d,
        "u-mira",
        "WB",
        "DG-06",
        "resolution",
        0.001,
        "mm",
        "DS-DG06",
        t(),
      ),
    A.PermissionError,
  );
  assert.throws(
    () =>
      A.recordCapability(
        d,
        "u-leon",
        "WB",
        "DG-06",
        "resolution",
        0.001,
        "mm",
        "",
        t(),
      ),
    /source/,
  );
  A.recordCapability(
    d,
    "u-leon",
    "WB",
    "DG-06",
    "resolution",
    1,
    "µm",
    "Datasheet DG-6 rev 2",
    t(6),
  );
  A.recordCalibration(
    d,
    "u-leon",
    "WB",
    "DL-09",
    "CAL-DL09-26",
    "2026-10-10",
    "2027-10-10",
    t(7),
  );
  assert.equal(status("REQ-03"), "Meets requirement");
  assert.equal(status("REQ-06"), "Meets requirement");
  assert.ok(tr().requests.every((r) => r.done));

  // Compensating measure for uniformity, approved by the independent reviewer only.
  assert.throws(
    () =>
      A.proposeDisposition(
        d,
        "u-mira",
        T,
        "REQ-05",
        "Accepted with compensating measure",
        "short",
        t(),
      ),
    /15 characters/,
  );
  A.proposeDisposition(
    d,
    "u-mira",
    T,
    "REQ-05",
    "Accepted with compensating measure",
    "Use the mapped central working volume (1.8 °C) only; map before each run.",
    t(8),
  );
  assert.throws(
    () =>
      A.recordReadiness(
        d,
        "u-nia",
        T,
        "Ready for comparative testing",
        "All requirements are covered by evidence.",
        t(),
      ),
    /reviewer approval/,
  );
  assert.throws(
    () => A.approveMeasure(d, "u-mira", T, "REQ-05", t()),
    A.PermissionError,
  );
  A.approveMeasure(d, "u-nia", T, "REQ-05", t(9));
  assert.equal(
    transferStatus(tr(), A.results(d, tr())),
    "Ready for expert review",
  );
  assert.throws(
    () =>
      A.recordReadiness(
        d,
        "u-mira",
        T,
        "Ready for comparative testing",
        "Prepared it myself, all good.",
        t(),
      ),
    A.PermissionError,
  );
  assert.throws(
    () =>
      A.recordReadiness(
        d,
        "u-nia",
        T,
        "Ready for comparative testing",
        "ok",
        t(),
      ),
    /20 characters/,
  );
  A.recordReadiness(
    d,
    "u-nia",
    T,
    "Ready for comparative testing",
    "Oven, gauge and logger records reviewed; uniformity measure acceptable.",
    t(10),
  );
  assert.equal(
    transferStatus(tr(), A.results(d, tr())),
    "Ready for comparative testing",
  );

  // A later record change revokes readiness.
  A.recordCalibration(
    d,
    "u-leon",
    "WB",
    "OV-07",
    "CAL-OV07-27",
    "2026-10-20",
    "2027-10-20",
    t(11),
  );
  assert.equal(tr().readiness, null);
  assert.ok(d.audit.some((a) => a.action === "Readiness revoked"));
  const rep = A.readinessReport(d, tr());
  assert.match(rep.notice, /does not establish method validity/);
  assert.equal(
    rep.requirements.find((r) => r.id === "REQ-05").disposition.approvedBy,
    "Nia Brooks",
  );
});

test("not-ready decision, policy margin, new transfer, roles", () => {
  const d = seed();
  A.recordReadiness(
    d,
    "u-nia",
    T,
    "Not ready",
    "Conditioning chamber cannot reach 180 °C.",
    t(),
  );
  assert.equal(
    transferStatus(A.transferById(d, T), A.results(d, A.transferById(d, T))),
    "Not ready (recorded)",
  );
  A.setPolicy(d, "u-ravi", "calibrationMarginDays", 0, t());
  assert.equal(A.transferById(d, T).readiness, null, "policy change revokes");
  assert.equal(
    A.results(d, A.transferById(d, T)).find((r) => r.req.id === "REQ-06")
      .status,
    "Meets requirement",
    "DL-09 due 30 Nov is after 16 Nov with no margin",
  );
  assert.throws(
    () => A.setPolicy(d, "u-ravi", "calibrationMarginDays", 400, t()),
    /between/,
  );
  const id = A.createTransfer(
    d,
    "u-mira",
    { procedureId: "MAT-009", labId: "WB", plannedDate: "2026-12-07" },
    t(),
  );
  assert.equal(id, "TR-018");
  assert.deepEqual(
    A.transferById(d, id).suggestions.map((s) => s.equipmentId),
    ["BL-04"],
  );
  assert.throws(
    () => A.setRole(d, "u-ravi", "u-ravi", "owner", t()),
    /own administrator/,
  );
});

test("early-access validation and HubSpot payload", async () => {
  const { validateLead, leadPayload, hubspotConfig } =
    await import("../src/lead.js");
  const f = {
    name: "Ana Ruiz",
    email: "ana@example.com",
    company: "Lab Co",
    role: "QA lead",
    type: "Independent testing laboratory",
    volume: "5–20",
    challenge: "Moving methods",
    consent: false,
    marketing: false,
  };
  assert.match(validateLead(f), /agree/);
  assert.equal(validateLead({ ...f, consent: true }), "");
  assert.deepEqual(
    leadPayload({ ...f, consent: true }, {}, {}).fields.map((x) => x.name),
    [
      "firstname",
      "lastname",
      "email",
      "company",
      "jobtitle",
      "laboratory_type",
      "transfers_per_year",
      "transfer_challenge",
    ],
  );
  assert.equal(hubspotConfig({}), null);
});
