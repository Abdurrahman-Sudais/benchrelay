// Method-transfer readiness checks for the Benchrelay prototype. Pure functions, no DOM.
// The same rules are implemented in backend/lambdas/evaluate_readiness/handler.py; both are tested
// against backend/tests/fixtures/cases.json so the prototype and the proposed Lambda stay in step.

/** Units grouped by dimension, with factors to a base unit. Temperatures are only compared in °C. */
const UNITS = {
  "°C": ["temperature", 1],
  mm: ["length", 1],
  µm: ["length", 0.001],
  um: ["length", 0.001],
  s: ["time", 1],
  ms: ["time", 0.001],
  min: ["time", 60],
  g: ["mass", 1],
  mg: ["mass", 0.001],
  kg: ["mass", 1000],
  "%RH": ["humidity", 1],
};

/** {value, unit} → {value in base unit, dimension}. Throws for an unknown unit. */
export function toBase(q) {
  const u = UNITS[q.unit];
  if (!u) throw new Error(`Unknown unit “${q.unit}”.`);
  return { value: Math.round(q.value * u[1] * 1e9) / 1e9, dimension: u[0] };
}

export const fmt = (q) => (q ? `${q.value} ${q.unit}` : "not recorded");
const DAY = 86400000;
export const addDays = (iso, n) =>
  new Date(Date.parse(iso + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);

/**
 * Evaluate one requirement against the mapped equipment record.
 * kinds: "atLeast" (capability ≥ required), "atMost" (capability ≤ required, e.g. resolution or
 * uniformity), "record" (a valid calibration record is the requirement).
 * Calibration is checked whenever the requirement says `calibrated: true` or kind is "record":
 * it must exist and stay valid until the transfer date plus the policy margin.
 */
export function evaluate(req, eq, ctx) {
  const findings = [];
  const add = (kind, detail) => findings.push({ kind, detail });
  if (!eq) {
    add(
      "No equipment mapped",
      `No receiving-lab equipment is mapped to ${req.id}.`,
    );
    return { status: "No equipment mapped", findings };
  }
  if (req.kind !== "record") {
    const cap = eq.capabilities?.[req.parameter];
    if (!cap) {
      add(
        "Capability unknown",
        `${eq.id} has no recorded ${req.parameterLabel.toLowerCase()}. A capability value and human confirmation are needed.`,
      );
    } else {
      const need = toBase(req.required),
        have = toBase(cap);
      if (need.dimension !== have.dimension)
        add(
          "Unit mismatch",
          `${req.parameterLabel} is recorded in ${cap.unit} but required in ${req.required.unit}.`,
        );
      else if (req.kind === "atLeast" && have.value < need.value)
        add(
          "Capability mismatch",
          `${eq.id} reaches ${fmt(cap)}; ${req.id} needs at least ${fmt(req.required)}.`,
        );
      else if (req.kind === "atMost" && have.value > need.value)
        add(
          "Capability mismatch",
          `${eq.id} records ${fmt(cap)}; ${req.id} needs ${fmt(req.required)} or finer.`,
        );
    }
  }
  if (req.kind === "record" || req.calibrated) {
    const cal = eq.calibration;
    const until = addDays(ctx.transferDate, ctx.marginDays);
    if (!cal)
      add("Calibration record missing", `${eq.id} has no calibration record.`);
    else if (cal.due < until)
      add(
        "Calibration due too soon",
        `${cal.ref} is due ${cal.due}; it must stay valid until ${until} (transfer ${ctx.transferDate} + ${ctx.marginDays} days).`,
      );
  }
  if (!findings.length) return { status: "Meets requirement", findings };
  const order = [
    "Capability mismatch",
    "Unit mismatch",
    "Calibration due too soon",
    "Calibration record missing",
    "Capability unknown",
  ];
  const worst = order.find((k) => findings.some((f) => f.kind === k));
  const status =
    worst === "Capability unknown"
      ? "Capability unknown"
      : worst.startsWith("Calibration")
        ? "Calibration issue"
        : "Capability mismatch";
  return { status, findings };
}

/** Evaluate every requirement of a transfer. */
export function evaluateTransfer(t, procedure, lab, policy) {
  const ctx = {
    transferDate: t.plannedDate,
    marginDays: policy.calibrationMarginDays,
  };
  return procedure.requirements.map((req) => {
    const m = t.mapping[req.id];
    if (m && !m.confirmed)
      return {
        req,
        eq: null,
        status: "Mapping unconfirmed",
        findings: [
          {
            kind: "Mapping unconfirmed",
            detail: `Proposed ${m.equipmentId}; a method owner must confirm the mapping.`,
          },
        ],
      };
    const eq = m ? lab.equipment.find((e) => e.id === m.equipmentId) : null;
    return { req, eq, ...evaluate(req, eq, ctx) };
  });
}

/**
 * Simulated AI mapping suggestion. In production Amazon Bedrock reads the requirement text and the
 * equipment register and must quote both. Here a deterministic word-overlap rule produces the shape.
 */
const words = (t) =>
  String(t || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 3);
export function suggestMapping(req, lab) {
  const mine = new Set(words(`${req.name} ${req.excerpt}`));
  const ranked = lab.equipment
    .map((e) => ({
      e,
      shared: [...new Set(words(`${e.name} ${e.type}`))].filter((w) =>
        mine.has(w),
      ),
    }))
    .filter((x) => x.shared.length)
    .sort(
      (a, b) =>
        b.shared.length - a.shared.length || a.e.id.localeCompare(b.e.id),
    );
  return ranked[0]
    ? {
        requirementId: req.id,
        equipmentId: ranked[0].e.id,
        shared: ranked[0].shared,
        quote: req.excerpt,
      }
    : null;
}

/** Reasons the transfer cannot be marked ready. Empty = may record readiness. */
export function readinessBlockers(t, results) {
  const out = [];
  const open = results.filter(
    (r) =>
      r.status !== "Meets requirement" &&
      t.dispositions[r.req.id]?.type !== "Accepted with compensating measure",
  );
  if (open.length)
    out.push(
      `${open.length} requirement${open.length > 1 ? "s are" : " is"} not met: ${open.map((r) => `${r.req.id} (${r.status})`).join(", ")}.`,
    );
  const unapproved = Object.entries(t.dispositions).filter(
    ([, d]) => d.type === "Accepted with compensating measure" && !d.approvedBy,
  );
  if (unapproved.length)
    out.push(
      `${unapproved.length} compensating measure${unapproved.length > 1 ? "s need" : " needs"} reviewer approval.`,
    );
  const req = t.requests.filter((r) => !r.done).length;
  if (req)
    out.push(
      `${req} request${req > 1 ? "s to the receiving lab are" : " to the receiving lab is"} open.`,
    );
  return out;
}

export function transferStatus(t, results) {
  if (t.readiness?.decision === "Ready for comparative testing")
    return "Ready for comparative testing";
  if (t.readiness?.decision === "Not ready") return "Not ready (recorded)";
  if (t.requests.some((r) => !r.done)) return "Waiting on receiving lab";
  return readinessBlockers(t, results).length
    ? "In preparation"
    : "Ready for expert review";
}

export function csv(rows) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}
