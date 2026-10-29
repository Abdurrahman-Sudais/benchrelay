// Fictional seed data for the prototype. Every laboratory, procedure, instrument and person is invented.
// TR-017 requirements REQ-01 to REQ-04 match the sample workspace on the home page.
import { suggestMapping } from "./engine.js";

export const USERS = [
  {
    id: "u-mira",
    name: "Mira Evans",
    title: "Method owner (sending lab)",
    role: "owner",
    initials: "ME",
  },
  {
    id: "u-leon",
    name: "Leon Hart",
    title: "Receiving lab manager",
    role: "lab",
    initials: "LH",
  },
  {
    id: "u-nia",
    name: "Nia Brooks",
    title: "Independent expert reviewer",
    role: "reviewer",
    initials: "NB",
  },
  {
    id: "u-ravi",
    name: "Ravi Kumar",
    title: "Workspace administrator",
    role: "admin",
    initials: "RK",
  },
];

export const DEFAULT_POLICY = {
  calibrationMarginDays: 30,
  aiSuggestions: true,
  today: "2026-10-18",
};

const q = (value, unit) => ({ value, unit });
const R = (id, name, kind, parameter, parameterLabel, required, o = {}) => ({
  id,
  name,
  kind,
  parameter,
  parameterLabel,
  required,
  calibrated: false,
  ...o,
});

const PROCEDURES = [
  {
    id: "MAT-017",
    rev: "C",
    title: "Thermal conditioning of material specimens",
    requirements: [
      R(
        "REQ-01",
        "Conditioning temperature",
        "atLeast",
        "maxTemp",
        "Maximum temperature",
        q(180, "°C"),
        {
          calibrated: true,
          reference: "MAT-017 §4.2",
          excerpt: "Equipment must support a conditioning setpoint of 180 °C.",
        },
      ),
      R(
        "REQ-02",
        "Balance supporting record",
        "record",
        null,
        "Calibration record",
        null,
        {
          reference: "MAT-017 §4.3",
          excerpt:
            "Include the balance supporting calibration record in the transfer review.",
        },
      ),
      R(
        "REQ-03",
        "Thickness measurement",
        "atMost",
        "resolution",
        "Resolution",
        q(0.01, "mm"),
        {
          reference: "MAT-017 §4.4",
          excerpt:
            "Specimen thickness measurement resolution must be 0.01 mm or finer.",
        },
      ),
      R(
        "REQ-04",
        "Timing resolution",
        "atMost",
        "resolution",
        "Resolution",
        q(1, "s"),
        {
          reference: "MAT-017 §4.5",
          excerpt: "Timer resolution must be 1 second or finer.",
        },
      ),
      R(
        "REQ-05",
        "Chamber uniformity",
        "atMost",
        "uniformity",
        "Temperature uniformity",
        q(2, "°C"),
        {
          reference: "MAT-017 §4.2.1",
          excerpt:
            "Chamber temperature uniformity must be within 2 °C across the working volume.",
        },
      ),
      R(
        "REQ-06",
        "Humidity logging",
        "atMost",
        "resolution",
        "Resolution",
        q(1, "%RH"),
        {
          calibrated: true,
          reference: "MAT-017 §4.6",
          excerpt:
            "Log relative humidity during conditioning with a calibrated data logger, 1 %RH resolution or finer.",
        },
      ),
      R(
        "REQ-07",
        "Cooling before measurement",
        "atLeast",
        "capacity",
        "Specimen capacity",
        q(10, "mm"),
        {
          reference: "MAT-017 §4.7",
          excerpt:
            "Cool specimens in a desiccator before thickness measurement; specimens up to 10 mm thick.",
        },
      ),
    ],
  },
  {
    id: "MAT-009",
    rev: "B",
    title: "Specimen mass determination",
    requirements: [
      R(
        "REQ-11",
        "Balance readability",
        "atMost",
        "resolution",
        "Resolution",
        q(0.1, "mg"),
        {
          calibrated: true,
          reference: "MAT-009 §3.1",
          excerpt:
            "Weigh specimens on a calibrated balance with 0.1 mg readability or finer.",
        },
      ),
    ],
  },
];

const LABS = [
  {
    id: "WB",
    name: "West Bench Materials Lab (fictional)",
    equipment: [
      {
        id: "TC-02",
        name: "Conditioning chamber",
        type: "Environmental chamber",
        capabilities: { maxTemp: q(150, "°C"), uniformity: q(1.5, "°C") },
        calibration: {
          ref: "CAL-TC02-26",
          date: "2026-03-12",
          due: "2027-03-12",
        },
      },
      {
        id: "OV-07",
        name: "High-temperature oven",
        type: "Laboratory oven",
        capabilities: { maxTemp: q(250, "°C"), uniformity: q(2.5, "°C") },
        calibration: {
          ref: "CAL-OV07-26",
          date: "2026-05-02",
          due: "2027-05-02",
        },
      },
      {
        id: "BL-04",
        name: "Laboratory balance",
        type: "Analytical balance",
        capabilities: { resolution: q(0.1, "mg") },
        calibration: {
          ref: "CAL-BL04-26",
          date: "2026-09-30",
          due: "2027-09-30",
        },
      },
      {
        id: "DG-06",
        name: "Digital thickness gauge",
        type: "Thickness measurement gauge",
        capabilities: {},
        calibration: {
          ref: "CAL-DG06-26",
          date: "2026-08-15",
          due: "2027-08-15",
        },
      },
      {
        id: "TM-03",
        name: "Laboratory timer",
        type: "Timer",
        capabilities: { resolution: q(1, "s") },
        calibration: null,
      },
      {
        id: "DL-09",
        name: "Humidity data logger",
        type: "Humidity logger",
        capabilities: { resolution: q(0.5, "%RH") },
        calibration: {
          ref: "CAL-DL09-25",
          date: "2025-11-30",
          due: "2026-11-30",
        },
      },
      {
        id: "DS-11",
        name: "Glass desiccator",
        type: "Desiccator for cooling specimens",
        capabilities: { capacity: q(25, "mm") },
        calibration: null,
      },
    ],
  },
];

export function withSuggestions(t, procedure, lab, policy) {
  if (!policy.aiSuggestions) return t;
  const fresh = procedure.requirements
    .filter(
      (r) =>
        !t.mapping[r.id] &&
        !t.suggestions.some((s) => s.requirementId === r.id),
    )
    .map((r) => suggestMapping(r, lab))
    .filter(Boolean)
    .map((s) => ({
      ...s,
      id: `map:${s.requirementId}:${s.equipmentId}`,
      decision: "pending",
    }));
  return { ...t, suggestions: [...t.suggestions, ...fresh] };
}

export function seed() {
  const policy = { ...DEFAULT_POLICY };
  const procedures = structuredClone(PROCEDURES),
    labs = structuredClone(LABS);
  const M = (equipmentId) => ({
    equipmentId,
    confirmed: true,
    by: "u-mira",
    at: "2026-10-12T09:00:00Z",
  });
  const transfers = [
    withSuggestions(
      {
        id: "TR-017",
        procedureId: "MAT-017",
        labId: "WB",
        plannedDate: "2026-11-16",
        owner: "u-mira",
        created: "2026-10-12T09:00:00Z",
        mapping: {
          "REQ-01": M("TC-02"),
          "REQ-02": M("BL-04"),
          "REQ-03": M("DG-06"),
          "REQ-04": M("TM-03"),
          "REQ-05": M("TC-02"),
          "REQ-06": M("DL-09"),
        },
        suggestions: [],
        dispositions: {},
        requests: [],
        readiness: null,
      },
      procedures[0],
      labs[0],
      policy,
    ),
    {
      id: "TR-012",
      procedureId: "MAT-009",
      labId: "WB",
      plannedDate: "2026-09-21",
      owner: "u-mira",
      created: "2026-09-01T10:00:00Z",
      mapping: { "REQ-11": M("BL-04") },
      suggestions: [],
      dispositions: {},
      requests: [],
      readiness: {
        decision: "Ready for comparative testing",
        rationale: "Balance readability and calibration meet MAT-009 §3.1.",
        by: "u-nia",
        at: "2026-09-10T14:00:00Z",
      },
    },
  ];
  const audit = [
    [
      "2026-09-10T14:00:00Z",
      "u-nia",
      "Readiness recorded",
      "TR-012 · Ready for comparative testing",
    ],
    [
      "2026-10-12T09:00:00Z",
      "u-mira",
      "Transfer created",
      "TR-017 · MAT-017 Rev C → West Bench Materials Lab",
    ],
    [
      "2026-10-12T09:20:00Z",
      "u-mira",
      "Requirements mapped",
      "TR-017 · 6 of 7 requirements mapped",
    ],
  ].map(([at, user, action, detail], i) => ({
    id: i + 1,
    at,
    user,
    action,
    detail,
  }));
  return {
    version: 1,
    users: USERS.map((u) => ({ ...u })),
    policy,
    procedures,
    labs,
    transfers,
    audit,
  };
}
