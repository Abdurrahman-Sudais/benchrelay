import { test } from "node:test";
import assert from "node:assert/strict";
import {
  requirements,
  initialState,
  updateReview,
  filterRequirements,
  checklist,
} from "../src/model.js";
test("review actions preserve technical records and unresolved findings", () => {
  const original = JSON.stringify(requirements);
  let s = initialState();
  for (const id of ["REQ-01", "REQ-03"]) {
    s = updateReview(s, id, "reviewer", "Mira Evans");
    s = updateReview(s, id, "evidence", "Unrelated delivery sheet");
    s = updateReview(s, id, "note", "Please inspect");
    s = updateReview(s, id, "action", "Request relevant capability record");
    s = updateReview(s, id, "acknowledge");
  }
  assert.equal(JSON.stringify(requirements), original);
  const c = checklist(s);
  assert.equal(c.findings[0].required, "180 °C");
  assert.equal(c.findings[0].recorded, "Up to 150 °C");
  assert.equal(c.findings[0].unresolved, true);
  assert.equal(c.findings[2].status, "Capability unknown");
  assert.equal(c.findings[2].unresolved, true);
  assert.equal(
    c.findings[2].review.evidence[0].verification,
    "Unverified simulated reference",
  );
});
test("sample supporting-record dates and limited timer result remain explicit", () => {
  assert.match(requirements[1].recorded, /30 September 2026/);
  assert.match(requirements[1].detail, /30 September 2027/);
  assert.match(requirements[1].detail, /18 October 2026/);
  assert.match(requirements[3].detail, /timer-resolution field only/);
});
test("search covers transfers, requirements, equipment and status filters", () => {
  const s = initialState();
  assert.equal(filterRequirements("TR-017", "all", s).length, 4);
  assert.equal(filterRequirements("DG-06", "all", s)[0].id, "REQ-03");
  assert.equal(filterRequirements("REQ-01", "mismatch", s).length, 1);
  assert.equal(filterRequirements("", "missing", s).length, 1);
  assert.equal(filterRequirements("", "reviewed", s).length, 0);
  assert.equal(
    filterRequirements("", "reviewed", updateReview(s, "REQ-01", "acknowledge"))
      .length,
    1,
  );
  assert.equal(filterRequirements("nonsense", "all", s).length, 0);
});
test("reset creates clean isolated state", () => {
  let s = initialState();
  s = updateReview(s, "REQ-01", "note", "changed");
  assert.deepEqual(initialState()["REQ-01"].notes, []);
  assert.notDeepEqual(initialState(), s);
});
