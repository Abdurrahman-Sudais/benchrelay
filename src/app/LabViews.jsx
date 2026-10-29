import React, { useState } from "react";
import { Upload } from "lucide-react";
import { fmt } from "./engine.js";
import {
  recordCapability,
  recordCalibration,
  confirmAvailability,
  displayName,
} from "./actions.js";
import { PageHead, Empty, fmtDate } from "./ui.jsx";

const PARAMS = [
  ["maxTemp", "Maximum temperature", "°C"],
  ["uniformity", "Temperature uniformity", "°C"],
  ["resolution", "Resolution", "mm"],
  ["capacity", "Specimen capacity", "mm"],
];
const UNITS = ["°C", "mm", "µm", "s", "ms", "min", "g", "mg", "kg", "%RH"];

function CapabilityForm({ lab, eq, act, notify, initial }) {
  const [f, setF] = useState({
    parameter: initial?.parameter || "resolution",
    value: "",
    unit: initial?.unit || "mm",
    ref: "",
  });
  return (
    <form
      className="pa-form pa-mini"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          act(
            recordCapability,
            lab.id,
            eq.id,
            f.parameter,
            f.value,
            f.unit,
            f.ref,
          ).ok
        )
          notify(`${eq.id} capability recorded; transfers re-evaluated.`);
      }}
    >
      <div className="pa-form-grid">
        <label>
          Capability
          <select
            value={f.parameter}
            onChange={(e) => {
              const p = PARAMS.find((x) => x[0] === e.target.value);
              setF((x) => ({
                ...x,
                parameter: e.target.value,
                unit: p?.[2] || x.unit,
              }));
            }}
          >
            {PARAMS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Value
          <input
            type="number"
            step="any"
            min="0"
            value={f.value}
            onChange={(e) => setF((x) => ({ ...x, value: e.target.value }))}
          />
        </label>
        <label>
          Unit
          <select
            value={f.unit}
            onChange={(e) => setF((x) => ({ ...x, unit: e.target.value }))}
          >
            {UNITS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
        <label>
          Source
          <input
            value={f.ref}
            onChange={(e) => setF((x) => ({ ...x, ref: e.target.value }))}
            placeholder="Datasheet or certificate ref"
            maxLength={80}
          />
        </label>
      </div>
      <button className="button small">
        <Upload size={14} aria-hidden="true" /> Record capability
      </button>
    </form>
  );
}

function CalibrationForm({ lab, eq, act, notify }) {
  const [f, setF] = useState({ ref: "", date: "", due: "" });
  return (
    <form
      className="pa-form pa-mini"
      onSubmit={(e) => {
        e.preventDefault();
        if (act(recordCalibration, lab.id, eq.id, f.ref, f.date, f.due).ok)
          notify(`${eq.id} calibration recorded; transfers re-evaluated.`);
      }}
    >
      <div className="pa-form-grid">
        <label>
          Certificate reference
          <input
            value={f.ref}
            onChange={(e) => setF((x) => ({ ...x, ref: e.target.value }))}
            maxLength={60}
          />
        </label>
        <label>
          Calibrated on
          <input
            type="date"
            value={f.date}
            onChange={(e) => setF((x) => ({ ...x, date: e.target.value }))}
          />
        </label>
        <label>
          Due
          <input
            type="date"
            value={f.due}
            onChange={(e) => setF((x) => ({ ...x, due: e.target.value }))}
          />
        </label>
      </div>
      <button className="button small">
        <Upload size={14} aria-hidden="true" /> Record calibration (simulated
        upload)
      </button>
    </form>
  );
}

export function LabRequests({ data, act, notify }) {
  const lab = data.labs[0];
  const open = data.transfers
    .filter((t) => t.labId === lab.id)
    .flatMap((t) => t.requests.filter((r) => !r.done).map((r) => ({ t, r })));
  const [answer, setAnswer] = useState({});
  return (
    <>
      <PageHead
        title="Requests from method owners"
        sub={`${lab.name}. You see what is asked of your equipment register, not the transfer assessment.`}
      />
      {open.length ? (
        open.map(({ t, r }) => {
          const eq = lab.equipment.find((e) => e.id === r.equipmentId);
          const req = data.procedures
            .find((p) => p.id === t.procedureId)
            .requirements.find((x) => x.id === r.reqId);
          return (
            <section
              className="pa-card"
              key={r.id}
              aria-labelledby={`r-${r.id}`}
            >
              <h2 id={`r-${r.id}`}>
                {r.kind}
                {eq ? ` · ${eq.id} ${eq.name}` : ""}
              </h2>
              <p className="pa-hint">
                {t.id} · {req.name} ({req.reference}) · asked by{" "}
                {displayName(data, r.by)} · {fmtDate(r.at)}
                {r.note ? ` · “${r.note}”` : ""}
              </p>
              {r.kind === "Record capability value" && (
                <CapabilityForm
                  lab={lab}
                  eq={eq}
                  act={act}
                  notify={notify}
                  initial={{
                    parameter: req.parameter,
                    unit: req.required?.unit,
                  }}
                />
              )}
              {r.kind === "Upload calibration record" && (
                <CalibrationForm lab={lab} eq={eq} act={act} notify={notify} />
              )}
              {r.kind === "Confirm equipment availability" && (
                <form
                  className="pa-comment-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      act(confirmAvailability, t.id, r.id, answer[r.id] || "")
                        .ok
                    )
                      notify("Answer sent.");
                  }}
                >
                  <label>
                    <span className="sr-only">Answer</span>
                    <input
                      value={answer[r.id] || ""}
                      onChange={(e) =>
                        setAnswer((x) => ({ ...x, [r.id]: e.target.value }))
                      }
                      placeholder="Availability, booking or loan details"
                      maxLength={200}
                    />
                  </label>
                  <button className="button small">Send answer</button>
                </form>
              )}
            </section>
          );
        })
      ) : (
        <div className="pa-card">
          <Empty>
            No open requests. When a method owner asks for a record it appears
            here. Try it: switch “Demo as” to Mira Evans, open TR-017 → REQ-03
            and ask for the gauge resolution.
          </Empty>
        </div>
      )}
    </>
  );
}

export function LabRegister({ data, act, notify }) {
  const lab = data.labs[0];
  return (
    <>
      <PageHead
        title="Equipment register"
        sub={`${lab.name}. In production, records come from your asset system and certificates are uploaded and read for you to confirm.`}
      />
      {lab.equipment.map((eq) => (
        <section className="pa-card" key={eq.id} aria-labelledby={`e-${eq.id}`}>
          <h2 id={`e-${eq.id}`}>
            {eq.id} · {eq.name}
          </h2>
          <p className="pa-hint">{eq.type}</p>
          <table className="pa-table">
            <tbody>
              {Object.entries(eq.capabilities).map(([k, v]) => (
                <tr key={k}>
                  <td>{PARAMS.find((p) => p[0] === k)?.[1] || k}</td>
                  <td>
                    {fmt(v)}
                    {v.ref ? <small>source {v.ref}</small> : null}
                  </td>
                </tr>
              ))}
              {!Object.keys(eq.capabilities).length && (
                <tr>
                  <td colSpan="2">No capability values recorded.</td>
                </tr>
              )}
              <tr>
                <td>Calibration</td>
                <td>
                  {eq.calibration
                    ? `${eq.calibration.ref} · ${eq.calibration.date} → due ${eq.calibration.due}`
                    : "No record"}
                </td>
              </tr>
            </tbody>
          </table>
          <details>
            <summary>Update this record</summary>
            <CapabilityForm lab={lab} eq={eq} act={act} notify={notify} />
            <CalibrationForm lab={lab} eq={eq} act={act} notify={notify} />
          </details>
        </section>
      ))}
    </>
  );
}
