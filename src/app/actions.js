// State transitions for the prototype. Each action mutates a draft copy of the workspace data,
// checks the acting user's role first, and writes an audit entry. The UI clones, applies and
// persists; tests call these directly.
import { evaluateTransfer, readinessBlockers, toBase } from "./engine.js";
import { withSuggestions } from "./seed.js";

export const PERMISSIONS = [
  [
    "View transfers and findings",
    {
      owner: true,
      lab: "Requests and own equipment register",
      reviewer: true,
      admin: "Aggregates only",
    },
  ],
  [
    "Create transfers, map requirements, decide AI suggestions",
    { owner: true, lab: false, reviewer: false, admin: false },
  ],
  [
    "Request records from the receiving lab, propose dispositions",
    { owner: true, lab: false, reviewer: false, admin: false },
  ],
  [
    "Update equipment capabilities and calibration records",
    { owner: false, lab: true, reviewer: false, admin: false },
  ],
  [
    "Approve compensating measures, record readiness",
    { owner: false, lab: false, reviewer: true, admin: false },
  ],
  [
    "Change roles and policy",
    { owner: false, lab: false, reviewer: false, admin: true },
  ],
  [
    "View audit log",
    { owner: false, lab: false, reviewer: false, admin: true },
  ],
];
export const DISPOSITIONS = [
  "Accepted with compensating measure",
  "Action planned",
];
export const REQUESTS = [
  "Record capability value",
  "Upload calibration record",
  "Confirm equipment availability",
];

export class PermissionError extends Error {}
export const userById = (d, id) => d.users.find((u) => u.id === id);
export const transferById = (d, id) => d.transfers.find((t) => t.id === id);
export const procedureOf = (d, t) =>
  d.procedures.find((p) => p.id === t.procedureId);
export const labOf = (d, t) => d.labs.find((l) => l.id === t.labId);
export const displayName = (d, id) =>
  id === "system" ? "System" : userById(d, id)?.name || id;
export const results = (d, t) =>
  evaluateTransfer(t, procedureOf(d, t), labOf(d, t), d.policy);

function guard(d, userId, roles, what) {
  const u = userById(d, userId);
  if (!u || !roles.includes(u.role))
    throw new PermissionError(`${u ? u.name : "This user"} cannot ${what}.`);
  return u;
}
export function audit(d, userId, action, detail, now) {
  d.audit.push({
    id: (d.audit.at(-1)?.id || 0) + 1,
    at: now,
    user: userId,
    action,
    detail,
  });
}
function revoke(d, t, userId, now, why) {
  if (t.readiness) {
    audit(d, userId, "Readiness revoked", `${t.id} · ${why}`, now);
    t.readiness = null;
  }
}
function refresh(d, i) {
  const t = d.transfers[i];
  d.transfers[i] = withSuggestions(t, procedureOf(d, t), labOf(d, t), d.policy);
}

export function createTransfer(d, userId, input, now) {
  guard(d, userId, ["owner"], "create transfers");
  if (!d.procedures.some((p) => p.id === input.procedureId))
    throw new Error("Choose a procedure.");
  if (!d.labs.some((l) => l.id === input.labId))
    throw new Error("Choose a receiving laboratory.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.plannedDate || ""))
    throw new Error("Enter the planned transfer date.");
  const id = `TR-${String(Math.max(...d.transfers.map((t) => Number(t.id.slice(3)))) + 1).padStart(3, "0")}`;
  d.transfers.unshift({
    id,
    procedureId: input.procedureId,
    labId: input.labId,
    plannedDate: input.plannedDate,
    owner: userId,
    created: now,
    mapping: {},
    suggestions: [],
    dispositions: {},
    requests: [],
    readiness: null,
  });
  refresh(d, 0);
  audit(
    d,
    userId,
    "Transfer created",
    `${id} · ${input.procedureId} → ${input.labId}`,
    now,
  );
  return id;
}

export function mapRequirement(d, userId, tid, reqId, equipmentId, now) {
  guard(d, userId, ["owner"], "map requirements");
  const i = d.transfers.findIndex((t) => t.id === tid);
  const t = d.transfers[i];
  if (equipmentId && !labOf(d, t).equipment.some((e) => e.id === equipmentId))
    throw new Error("Unknown equipment.");
  if (equipmentId)
    t.mapping[reqId] = { equipmentId, confirmed: true, by: userId, at: now };
  else delete t.mapping[reqId];
  delete t.dispositions[reqId];
  t.suggestions
    .filter((s) => s.requirementId === reqId && s.decision === "pending")
    .forEach((s) =>
      Object.assign(s, {
        decision: s.equipmentId === equipmentId ? "confirmed" : "superseded",
        by: userId,
        at: now,
      }),
    );
  revoke(d, t, userId, now, `${reqId} mapping changed`);
  audit(
    d,
    userId,
    "Requirement mapped",
    `${tid} · ${reqId} → ${equipmentId || "unmapped"}`,
    now,
  );
  refresh(d, i);
}

export function decideSuggestion(d, userId, tid, sid, confirm, reason, now) {
  guard(d, userId, ["owner"], "decide AI suggestions");
  const t = transferById(d, tid);
  const s = t.suggestions.find((x) => x.id === sid);
  if (!confirm && (!reason || reason.trim().length < 10))
    throw new Error(
      "Give a reason of at least 10 characters for dismissing a suggestion.",
    );
  if (confirm) {
    t.mapping[s.requirementId] = {
      equipmentId: s.equipmentId,
      confirmed: true,
      by: userId,
      at: now,
    };
    revoke(d, t, userId, now, `${s.requirementId} mapping changed`);
  }
  Object.assign(s, {
    decision: confirm ? "confirmed" : "dismissed",
    reason: confirm ? "" : reason.trim(),
    by: userId,
    at: now,
  });
  audit(
    d,
    userId,
    confirm ? "AI mapping confirmed" : "AI mapping dismissed",
    `${tid} · ${s.requirementId} → ${s.equipmentId}${confirm ? "" : ` · ${s.reason}`}`,
    now,
  );
}

export function requestFromLab(d, userId, tid, reqId, kind, note, now) {
  guard(d, userId, ["owner"], "send requests");
  const t = transferById(d, tid);
  if (!REQUESTS.includes(kind)) throw new Error("Choose what you need.");
  const equipmentId = t.mapping[reqId]?.equipmentId || null;
  if (kind !== "Confirm equipment availability" && !equipmentId)
    throw new Error("Map the requirement to equipment first.");
  if (t.requests.some((r) => r.reqId === reqId && r.kind === kind && !r.done))
    throw new Error("That request is already open.");
  t.requests.push({
    id: `${tid}-R${t.requests.length + 1}`,
    reqId,
    equipmentId,
    kind,
    note: (note || "").trim(),
    by: userId,
    at: now,
    done: false,
  });
  audit(
    d,
    userId,
    "Request sent to receiving lab",
    `${tid} · ${reqId} · ${kind}`,
    now,
  );
}

export function proposeDisposition(d, userId, tid, reqId, type, note, now) {
  guard(d, userId, ["owner"], "propose dispositions");
  const t = transferById(d, tid);
  if (!DISPOSITIONS.includes(type)) throw new Error("Choose a disposition.");
  if (!note || note.trim().length < 15)
    throw new Error("Describe the measure or action (at least 15 characters).");
  const r = results(d, t).find((x) => x.req.id === reqId);
  if (r.status === "Meets requirement")
    throw new Error(`${reqId} already meets the requirement.`);
  t.dispositions[reqId] = {
    type,
    note: note.trim(),
    by: userId,
    at: now,
    approvedBy: null,
  };
  revoke(d, t, userId, now, `${reqId} disposition changed`);
  audit(d, userId, "Disposition proposed", `${tid} · ${reqId} · ${type}`, now);
}

/* ---------- Receiving lab ---------- */
function touchEquipment(d, userId, labId, equipmentId, kinds, now) {
  d.transfers
    .filter(
      (t) =>
        t.labId === labId &&
        Object.values(t.mapping).some((m) => m.equipmentId === equipmentId),
    )
    .forEach((t) => {
      t.requests
        .filter(
          (r) =>
            r.equipmentId === equipmentId && kinds.includes(r.kind) && !r.done,
        )
        .forEach((r) => Object.assign(r, { done: true, doneAt: now }));
      revoke(d, t, userId, now, `${equipmentId} record changed`);
    });
}

export function recordCapability(
  d,
  userId,
  labId,
  equipmentId,
  parameter,
  value,
  unit,
  ref,
  now,
) {
  guard(d, userId, ["lab"], "update equipment records");
  const e = d.labs
    .find((l) => l.id === labId)
    .equipment.find((x) => x.id === equipmentId);
  const v = Number(value);
  if (!parameter) throw new Error("Choose the capability.");
  if (!Number.isFinite(v) || v <= 0)
    throw new Error("Enter the recorded value.");
  toBase({ value: v, unit });
  if (!ref || ref.trim().length < 3)
    throw new Error("Enter the source of the value (datasheet, certificate…).");
  e.capabilities[parameter] = {
    value: v,
    unit,
    ref: ref.trim(),
    by: userId,
    at: now,
  };
  touchEquipment(
    d,
    userId,
    labId,
    equipmentId,
    ["Record capability value"],
    now,
  );
  audit(
    d,
    userId,
    "Capability recorded",
    `${labId} · ${equipmentId} · ${parameter} ${v} ${unit} · ${ref.trim()}`,
    now,
  );
}

export function recordCalibration(
  d,
  userId,
  labId,
  equipmentId,
  ref,
  date,
  due,
  now,
) {
  guard(d, userId, ["lab"], "update calibration records");
  const e = d.labs
    .find((l) => l.id === labId)
    .equipment.find((x) => x.id === equipmentId);
  if (
    !ref?.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date || "") ||
    !/^\d{4}-\d{2}-\d{2}$/.test(due || "")
  )
    throw new Error(
      "Enter the certificate reference, calibration date and due date.",
    );
  if (due <= date)
    throw new Error("The due date must be after the calibration date.");
  e.calibration = { ref: ref.trim(), date, due, by: userId, at: now };
  touchEquipment(
    d,
    userId,
    labId,
    equipmentId,
    ["Upload calibration record"],
    now,
  );
  audit(
    d,
    userId,
    "Calibration recorded",
    `${labId} · ${equipmentId} · ${ref.trim()} due ${due}`,
    now,
  );
}

export function confirmAvailability(d, userId, tid, requestId, note, now) {
  guard(d, userId, ["lab"], "answer requests");
  const t = transferById(d, tid);
  const r = t.requests.find((x) => x.id === requestId);
  if (r.kind !== "Confirm equipment availability")
    throw new Error("Answer this request by updating the equipment record.");
  Object.assign(r, { done: true, doneAt: now, answer: (note || "").trim() });
  audit(d, userId, "Availability confirmed", `${tid} · ${r.reqId}`, now);
}

/* ---------- Reviewer ---------- */
export function approveMeasure(d, userId, tid, reqId, now) {
  guard(d, userId, ["reviewer"], "approve compensating measures");
  const t = transferById(d, tid);
  const disp = t.dispositions[reqId];
  if (disp?.type !== "Accepted with compensating measure")
    throw new Error("Only compensating measures need approval.");
  disp.approvedBy = userId;
  disp.approvedAt = now;
  audit(d, userId, "Compensating measure approved", `${tid} · ${reqId}`, now);
}

export function recordReadiness(d, userId, tid, decision, rationale, now) {
  guard(d, userId, ["reviewer"], "record readiness");
  const t = transferById(d, tid);
  if (!rationale || rationale.trim().length < 20)
    throw new Error("Write the rationale (at least 20 characters).");
  if (decision === "Ready for comparative testing") {
    const b = readinessBlockers(t, results(d, t));
    if (b.length) throw new Error(b.join(" "));
  } else if (decision !== "Not ready") throw new Error("Choose a decision.");
  t.readiness = { decision, rationale: rationale.trim(), by: userId, at: now };
  audit(d, userId, "Readiness recorded", `${tid} · ${decision}`, now);
}

export function setRole(d, userId, targetId, role, now) {
  guard(d, userId, ["admin"], "change roles");
  if (targetId === userId && role !== "admin")
    throw new Error("You cannot remove your own administrator role.");
  const t = userById(d, targetId);
  const old = t.role;
  t.role = role;
  audit(d, userId, "Role changed", `${t.name}: ${old} → ${role}`, now);
}

export function setPolicy(d, userId, key, value, now) {
  guard(d, userId, ["admin"], "change policy");
  if (key === "calibrationMarginDays") {
    value = Number(value);
    if (!Number.isFinite(value) || value < 0 || value > 180)
      throw new Error("Calibration margin must be between 0 and 180 days.");
  }
  if (key === "today" && !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Enter a valid date.");
  const old = d.policy[key];
  d.policy[key] = value;
  if (key === "calibrationMarginDays")
    d.transfers.forEach((t) =>
      revoke(d, t, userId, now, "calibration margin changed"),
    );
  audit(d, userId, "Policy changed", `${key}: ${old} → ${value}`, now);
}

/** JSON readiness checklist for export. */
export function readinessReport(d, t) {
  const p = procedureOf(d, t),
    l = labOf(d, t);
  return {
    title: `Benchrelay prototype · readiness checklist ${t.id}`,
    notice:
      "Fictional sample data. Readiness for comparative testing is a recorded expert judgement; it does not establish method validity, qualify instruments or certify a laboratory.",
    transfer: {
      id: t.id,
      procedure: `${p.id} Rev ${p.rev} · ${p.title}`,
      receivingLaboratory: l.name,
      plannedDate: t.plannedDate,
      calibrationMarginDays: d.policy.calibrationMarginDays,
    },
    readiness: t.readiness && {
      ...t.readiness,
      by: displayName(d, t.readiness.by),
    },
    requirements: results(d, t).map((r) => ({
      id: r.req.id,
      name: r.req.name,
      reference: r.req.reference,
      required: r.req.required,
      equipment: r.eq?.id || null,
      status: r.status,
      findings: r.findings,
      disposition: t.dispositions[r.req.id]
        ? {
            ...t.dispositions[r.req.id],
            approvedBy: t.dispositions[r.req.id].approvedBy
              ? displayName(d, t.dispositions[r.req.id].approvedBy)
              : null,
          }
        : null,
    })),
    openRequests: t.requests
      .filter((r) => !r.done)
      .map((r) => ({
        requirement: r.reqId,
        equipment: r.equipmentId,
        kind: r.kind,
      })),
  };
}
