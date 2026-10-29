import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { fmt, readinessBlockers, transferStatus } from "./engine.js";
import {
  approveMeasure,
  recordReadiness,
  results,
  procedureOf,
  labOf,
  displayName,
} from "./actions.js";
import { Link, PageHead, Status, Empty, fmtDate, fmtDay } from "./ui.jsx";

export function ReviewerQueue({ data }) {
  const rows = data.transfers.map((t) => ({ t, res: results(data, t) }));
  return (
    <>
      <PageHead
        title="Review queue"
        sub="Transfers you can review, and compensating measures waiting for your approval. You are independent of the method owner."
      />
      <div className="pa-card pa-tablewrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Transfer</th>
              <th>Status</th>
              <th className="num">Measures to approve</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, res }) => {
              const p = procedureOf(data, t);
              return (
                <tr key={t.id}>
                  <td>
                    <Link to={`#/review/${t.id}`}>
                      <strong>
                        {t.id} · {p.id} Rev {p.rev}
                      </strong>
                    </Link>
                    <small>
                      {p.title} → {labOf(data, t).name}
                    </small>
                  </td>
                  <td>
                    <Status value={transferStatus(t, res)} />
                  </td>
                  <td className="num">
                    {
                      Object.values(t.dispositions).filter(
                        (d) =>
                          d.type === "Accepted with compensating measure" &&
                          !d.approvedBy,
                      ).length
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ReviewerTransfer({ data, id, act, notify }) {
  const t = data.transfers.find((x) => x.id === id);
  const [decision, setDecision] = useState("Ready for comparative testing");
  const [rationale, setRationale] = useState("");
  if (!t)
    return (
      <div className="pa-card">
        <Empty>Transfer not found.</Empty>
      </div>
    );
  const p = procedureOf(data, t),
    res = results(data, t),
    b = readinessBlockers(t, res);
  return (
    <>
      <PageHead
        title={`Review ${t.id} · ${p.id} Rev ${p.rev}`}
        sub={`${p.title} → ${labOf(data, t).name} · planned ${fmtDay(t.plannedDate)} · prepared by ${displayName(data, t.owner)}`}
      />
      <div className="pa-review-status">
        <Status value={transferStatus(t, res)} />
      </div>
      <section className="pa-card pa-tablewrap">
        <h2>Requirements</h2>
        <table className="pa-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Required</th>
              <th>Equipment</th>
              <th>Result</th>
              <th>Disposition</th>
            </tr>
          </thead>
          <tbody>
            {res.map((r) => {
              const d = t.dispositions[r.req.id];
              return (
                <tr key={r.req.id}>
                  <td>
                    <strong>{r.req.id}</strong> {r.req.name}
                    <small>{r.req.reference}</small>
                  </td>
                  <td>
                    {r.req.required
                      ? `${r.req.kind === "atLeast" ? "≥" : "≤"} ${fmt(r.req.required)}`
                      : "Calibration record"}
                  </td>
                  <td>{r.eq ? r.eq.id : "—"}</td>
                  <td>
                    <Status value={r.status} />
                    <small>{r.findings.map((f) => f.detail).join(" ")}</small>
                  </td>
                  <td>
                    {d ? (
                      <>
                        {d.type}
                        <small>{d.note}</small>
                        {d.type === "Accepted with compensating measure" &&
                          (d.approvedBy ? (
                            <small>
                              Approved by {displayName(data, d.approvedBy)}
                            </small>
                          ) : (
                            !t.readiness && (
                              <button
                                className="textbutton"
                                onClick={() => {
                                  if (act(approveMeasure, t.id, r.req.id).ok)
                                    notify(`Measure for ${r.req.id} approved.`);
                                }}
                              >
                                <Check size={14} aria-hidden="true" /> Approve
                                measure
                              </button>
                            )
                          ))}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="pa-card">
        <h2>Readiness decision</h2>
        {t.readiness ? (
          <p>
            <Status
              value={
                t.readiness.decision === "Ready for comparative testing"
                  ? "Ready for comparative testing"
                  : "Not ready (recorded)"
              }
            />{" "}
            by {displayName(data, t.readiness.by)} on {fmtDate(t.readiness.at)}:
            “{t.readiness.rationale}”. Any later change to mappings, records or
            dispositions revokes it.
          </p>
        ) : (
          <form
            className="pa-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (act(recordReadiness, t.id, decision, rationale).ok)
                notify("Readiness recorded.");
            }}
          >
            {b.length > 0 && (
              <ul className="pa-checklist">
                {b.map((x) => (
                  <li key={x} className="bad">
                    <X size={14} aria-hidden="true" /> {x}
                  </li>
                ))}
              </ul>
            )}
            <label>
              Decision
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                <option>Ready for comparative testing</option>
                <option>Not ready</option>
              </select>
            </label>
            <label>
              Rationale
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                maxLength={1000}
                placeholder="What you checked and why it is (not) sufficient"
              />
            </label>
            <button className="button small">Record decision</button>
            <p className="pa-hint">
              “Ready” is only possible when every requirement is met or has an
              approved compensating measure, and no request is open. It means
              ready for comparative testing, not that the method is validated.
            </p>
          </form>
        )}
      </section>
    </>
  );
}
