export const requirements = [
  {
    id: "REQ-01",
    name: "Conditioning temperature",
    kind: "mismatch",
    status: "Capability mismatch",
    equipment: "TC-02",
    equipmentName: "Conditioning chamber",
    required: "180 °C",
    recorded: "Up to 150 °C",
    reference: "MAT-017 §4.2",
    excerpt: "Equipment must support a conditioning setpoint of 180 °C.",
    detail:
      "The recorded upper temperature is 30 °C below the required setpoint. An acknowledgement or additional reference does not change this specification.",
  },
  {
    id: "REQ-02",
    name: "Balance supporting record",
    kind: "match",
    status: "Supporting record present",
    equipment: "BL-04",
    equipmentName: "Laboratory balance",
    required: "Supporting calibration record",
    recorded: "Record dated 30 September 2026",
    reference: "MAT-017 §4.3 · Sample excerpt",
    excerpt:
      "Include the balance supporting calibration record in the transfer review.",
    detail:
      "Recorded review due: 30 September 2027. Sample review: 18 October 2026. Within the recorded review date; this alone does not establish calibration validity for every application.",
  },
  {
    id: "REQ-03",
    name: "Thickness measurement",
    kind: "missing",
    status: "Capability unknown",
    equipment: "DG-06",
    equipmentName: "Digital thickness gauge",
    required: "0.01 mm or finer",
    recorded: "Resolution not documented",
    reference: "MAT-017 §4.4 · Sample excerpt",
    excerpt:
      "Specimen thickness measurement resolution must be 0.01 mm or finer.",
    detail:
      "A relevant capability value and human confirmation are required. Technical records are read-only in this demo, so this finding remains unknown.",
  },
  {
    id: "REQ-04",
    name: "Timing resolution",
    kind: "match",
    status: "No gap detected",
    equipment: "TM-03",
    equipmentName: "Laboratory timer",
    required: "1 second or finer",
    recorded: "1 second",
    reference: "MAT-017 §4.5 · Sample excerpt",
    excerpt: "Timer resolution must be 1 second or finer.",
    detail:
      "No gap detected against the recorded timer-resolution field only. This is not full instrument qualification or method validation.",
  },
];
export const reviewers = ["Mira Evans", "Leon Hart", "Nia Brooks"];
export function initialState() {
  return Object.fromEntries(
    requirements.map((r) => [
      r.id,
      {
        reviewer: "",
        notes: [],
        evidence: [],
        acknowledged: false,
        action: "",
      },
    ]),
  );
}
export function updateReview(state, id, type, value) {
  if (!state[id]) return state;
  const current = state[id];
  let patch = {};
  if (type === "reviewer" && (value === "" || reviewers.includes(value)))
    patch = { reviewer: value };
  if (type === "note" && value.trim())
    patch = { notes: [...current.notes, value.trim()] };
  if (type === "evidence" && value.trim())
    patch = {
      evidence: [
        ...current.evidence,
        {
          reference: value.trim(),
          verification: "Unverified simulated reference",
        },
      ],
    };
  if (type === "acknowledge") patch = { acknowledged: true };
  if (type === "action" && value.trim()) patch = { action: value.trim() };
  return { ...state, [id]: { ...current, ...patch } };
}
export function filterRequirements(query, filter, state) {
  const q = query.toLowerCase();
  return requirements
    .filter((r) =>
      (
        "TR-017 MAT-017 Rev C Thermal conditioning of material specimens West Bench Materials Lab " +
        Object.values(r).join(" ")
      )
        .toLowerCase()
        .includes(q),
    )
    .filter(
      (r) =>
        filter === "all" ||
        (filter === "mismatch" && r.kind === "mismatch") ||
        (filter === "missing" && r.kind === "missing") ||
        (filter === "unreviewed" && !state[r.id].acknowledged) ||
        (filter === "reviewed" && state[r.id].acknowledged),
    );
}
export function checklist(state) {
  return {
    title: "Benchrelay · Sample readiness checklist",
    transfer: "TR-017",
    procedure: "MAT-017 · Rev C",
    receivingLaboratory: "West Bench Materials Lab — fictional example",
    sampleReviewDate: "18 October 2026",
    stage: "Prepared for expert review",
    notice:
      "Sample data. Unverified references and reviewer acknowledgements do not establish technical fitness, scientific validity, certification or approval.",
    findings: requirements.map((r) => ({
      ...r,
      review: { ...state[r.id] },
      unresolved: r.kind !== "match",
    })),
  };
}
