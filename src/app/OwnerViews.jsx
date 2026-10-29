import React, { useState } from "react";
import { ArrowRight, Download, Check, X, Send, FileText } from "lucide-react";
import { fmt, readinessBlockers, transferStatus } from "./engine.js";
import {
  createTransfer,
  mapRequirement,
  decideSuggestion,
  requestFromLab,
  proposeDisposition,
  readinessReport,
  results,
  procedureOf,
  labOf,
  displayName,
  DISPOSITIONS,
  REQUESTS,
} from "./actions.js";
import {
  Link,
  PageHead,
  AiBadge,
  Status,
  Kpi,
  Empty,
  StackBar,
  fmtDate,
  fmtDay,
  download,
} from "./ui.jsx";

const NEXT = {
  "In preparation": [
    "Resolve findings or propose dispositions",
    "requirements",
  ],
  "Waiting on receiving lab": [
    "Waiting for the receiving lab’s records",
    "requests",
  ],
  "Ready for expert review": [
    "An expert reviewer records readiness",
    "readiness",
  ],
  "Ready for comparative testing": ["Readiness recorded", "readiness"],
  "Not ready (recorded)": ["Address the reviewer’s rationale", "readiness"],
};

/* ---------------- Dashboard ---------------- */
export function OwnerDashboard({ data, user }) {
  const rows = data.transfers.map((t) => ({ t, res: results(data, t) }));
  const open = rows.filter((x) => !x.t.readiness);
  const all = open.flatMap((x) => x.res);
  const st = (s) => all.filter((r) => r.status === s).length;
  const ai = open.reduce(
    (s, x) =>
      s + x.t.suggestions.filter((g) => g.decision === "pending").length,
    0,
  );
  return (
    <>
      <PageHead
        title={`Good morning, ${user.name.split(" ")[0]}`}
        sub="Transfers in preparation, and what the receiving bench still needs."
      />
      <div className="pa-kpis">
        <Kpi
          value={open.length}
          label="transfers in preparation"
          to="#/transfers"
        />
        <Kpi value={st("Capability mismatch")} label="capability mismatches" />
        <Kpi
          value={
            st("Capability unknown") +
            st("No equipment mapped") +
            st("Mapping unconfirmed")
          }
          label="unknown or unmapped requirements"
        />
        <Kpi value={ai} label="AI mapping suggestions to decide" />
      </div>
      <div className="pa-grid2">
        <section className="pa-card" aria-labelledby="tr">
          <h2 id="tr">Transfers</h2>
          <ul className="pa-list">
            {rows.map(({ t, res }) => {
              const s = transferStatus(t, res);
              const p = procedureOf(data, t);
              return (
                <li key={t.id}>
                  <Link to={`#/transfers/${t.id}/${NEXT[s][1]}`}>
                    <strong>
                      {t.id} · {p.id} Rev {p.rev}
                    </strong>
                    <small>
                      {p.title} → {labOf(data, t).name} · planned{" "}
                      {fmtDay(t.plannedDate)}
                    </small>
                  </Link>
                  <Status value={s} />
                  <span className="pa-next">
                    {NEXT[s][0]} <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="pa-card" aria-labelledby="mix">
          <h2 id="mix">Requirements in open transfers</h2>
          <StackBar
            parts={[
              { label: "Meets", value: st("Meets requirement"), tone: "ok" },
              {
                label: "Calibration issue",
                value: st("Calibration issue"),
                tone: "warn",
              },
              {
                label: "Unknown / unmapped",
                value:
                  st("Capability unknown") +
                  st("No equipment mapped") +
                  st("Mapping unconfirmed"),
                tone: "muted",
              },
              {
                label: "Mismatch",
                value: st("Capability mismatch"),
                tone: "bad",
              },
            ]}
          />
          <ul className="pa-legend">
            <li>
              <i className="ok" />
              Meets {st("Meets requirement")}
            </li>
            <li>
              <i className="warn" />
              Calibration {st("Calibration issue")}
            </li>
            <li>
              <i className="muted" />
              Unknown or unmapped{" "}
              {st("Capability unknown") +
                st("No equipment mapped") +
                st("Mapping unconfirmed")}
            </li>
            <li>
              <i className="bad" />
              Mismatch {st("Capability mismatch")}
            </li>
          </ul>
          <p className="pa-hint">
            Calibration must stay valid until the planned transfer date plus{" "}
            {data.policy.calibrationMarginDays} days (policy).
          </p>
          <h2>Recent activity</h2>
          <ol className="pa-feed">
            {data.audit
              .slice(-5)
              .reverse()
              .map((a) => (
                <li key={a.id}>
                  <span>{a.action}</span>
                  <small>
                    {a.detail} · {fmtDate(a.at)}
                  </small>
                </li>
              ))}
          </ol>
        </section>
      </div>
    </>
  );
}

/* ---------------- List ---------------- */
export function TransferList({ data }) {
  return (
    <>
      <PageHead
        title="Transfers"
        sub="Each transfer compares one procedure revision with one receiving laboratory’s equipment register."
      >
        <Link className="button small" to="#/transfers/new">
          New transfer
        </Link>
      </PageHead>
      <div className="pa-card pa-tablewrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Transfer</th>
              <th>Receiving lab</th>
              <th>Planned</th>
              <th className="num">Not met</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.transfers.map((t) => {
              const res = results(data, t);
              const p = procedureOf(data, t);
              return (
                <tr key={t.id}>
                  <td>
                    <Link to={`#/transfers/${t.id}`}>
                      <strong>
                        {t.id} · {p.id} Rev {p.rev}
                      </strong>
                    </Link>
                    <small>{p.title}</small>
                  </td>
                  <td>{labOf(data, t).name}</td>
                  <td>{fmtDay(t.plannedDate)}</td>
                  <td className="num">
                    {res.filter((r) => r.status !== "Meets requirement").length}
                  </td>
                  <td>
                    <Status value={transferStatus(t, res)} />
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

/* ---------------- New transfer ---------------- */
export function NewTransfer({ data, act, go, notify }) {
  const [f, setF] = useState({ procedureId: "", labId: "", plannedDate: "" });
  return (
    <>
      <PageHead
        title="New transfer"
        sub="In production you upload the procedure and requirements are extracted for you to confirm. Here, choose a procedure already in the library."
      >
        <button
          type="button"
          className="textbutton"
          onClick={() =>
            setF({
              procedureId: "MAT-009",
              labId: "WB",
              plannedDate: "2026-12-07",
            })
          }
        >
          <FileText size={16} aria-hidden="true" /> Fill with an example
        </button>
      </PageHead>
      <form
        className="pa-card pa-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const r = act(createTransfer, f);
          if (r.ok) {
            notify(
              `${r.result} created. Map each requirement to receiving-lab equipment.`,
            );
            go(`#/transfers/${r.result}`);
          }
        }}
      >
        <div className="pa-form-grid">
          <label>
            Procedure
            <select
              value={f.procedureId}
              onChange={(e) =>
                setF((x) => ({ ...x, procedureId: e.target.value }))
              }
            >
              <option value="">Choose…</option>
              {data.procedures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} Rev {p.rev} · {p.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Receiving laboratory
            <select
              value={f.labId}
              onChange={(e) => setF((x) => ({ ...x, labId: e.target.value }))}
            >
              <option value="">Choose…</option>
              {data.labs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Planned transfer date
            <input
              type="date"
              value={f.plannedDate}
              onChange={(e) =>
                setF((x) => ({ ...x, plannedDate: e.target.value }))
              }
            />
          </label>
        </div>
        <button className="button small">Create transfer</button>
      </form>
    </>
  );
}

/* ---------------- Detail ---------------- */
const TABS = [
  ["requirements", "Requirements"],
  ["ai", "AI suggestions"],
  ["requests", "Requests"],
  ["readiness", "Readiness"],
  ["activity", "Activity"],
];

export function TransferDetail(props) {
  const { data, id, tab } = props;
  const t = data.transfers.find((x) => x.id === id);
  if (!t)
    return (
      <div className="pa-card pa-denied">
        <h1>Transfer not found</h1>
        <Link className="button small" to="#/transfers">
          All transfers
        </Link>
      </div>
    );
  const p = procedureOf(data, t),
    lab = labOf(data, t),
    res = results(data, t);
  const counts = {
    requirements: res.filter((r) => r.status !== "Meets requirement").length,
    ai: t.suggestions.filter((s) => s.decision === "pending").length,
    requests: t.requests.filter((r) => !r.done).length,
  };
  const Tab =
    {
      requirements: RequirementsTab,
      ai: AiTab,
      requests: RequestsTab,
      readiness: ReadinessTab,
      activity: ActivityTab,
    }[tab] || RequirementsTab;
  return (
    <>
      <PageHead
        title={`${t.id} · ${p.id} Rev ${p.rev}`}
        sub={`${p.title} → ${lab.name} · planned ${fmtDay(t.plannedDate)}`}
      >
        <button
          className="textbutton"
          onClick={() =>
            download(
              `benchrelay-${t.id}-readiness.json`,
              JSON.stringify(readinessReport(data, t), null, 2),
              "application/json",
            )
          }
        >
          <Download size={16} aria-hidden="true" /> Readiness checklist
        </button>
      </PageHead>
      <div className="pa-review-status">
        <Status value={transferStatus(t, res)} />
        <span>Owner {displayName(data, t.owner)}</span>
      </div>
      <nav className="pa-tabs" aria-label="Transfer sections">
        {TABS.map(([k, label]) => (
          <Link
            key={k}
            to={`#/transfers/${t.id}/${k}`}
            aria-current={k === tab ? "page" : undefined}
          >
            {label}
            {counts[k] ? <span className="pa-count">{counts[k]}</span> : null}
          </Link>
        ))}
      </nav>
      <Tab {...props} t={t} p={p} lab={lab} res={res} />
    </>
  );
}

function RequirementsTab({ data, t, lab, res, reqId, act, notify, go }) {
  const sel =
    res.find((r) => r.req.id === reqId) ||
    res.find((r) => r.status !== "Meets requirement") ||
    res[0];
  return (
    <div className="pa-split">
      <section className="pa-card" aria-label="Requirements">
        <ul className="pa-findings">
          {res.map((r) => (
            <li key={r.req.id}>
              <button
                className={r.req.id === sel.req.id ? "active" : ""}
                aria-pressed={r.req.id === sel.req.id}
                onClick={() =>
                  go(`#/transfers/${t.id}/requirements/${r.req.id}`)
                }
              >
                <span className="pa-fid">{r.req.id}</span>
                <span>
                  <strong>{r.req.name}</strong>
                  <small>
                    {r.req.required
                      ? `needs ${r.req.kind === "atLeast" ? "≥" : "≤"} ${fmt(r.req.required)}`
                      : "calibration record"}{" "}
                    ·{" "}
                    {r.eq
                      ? r.eq.id
                      : t.mapping[r.req.id]?.equipmentId
                        ? `${t.mapping[r.req.id].equipmentId} (unconfirmed)`
                        : "unmapped"}
                  </small>
                </span>
                <Status value={r.status} />
                {t.dispositions[r.req.id] && (
                  <Status
                    value={t.dispositions[r.req.id].type}
                    label={
                      t.dispositions[r.req.id].approvedBy
                        ? "Measure approved"
                        : t.dispositions[r.req.id].type
                    }
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <RequirementPanel
        key={sel.req.id + (t.mapping[sel.req.id]?.equipmentId || "")}
        data={data}
        t={t}
        lab={lab}
        r={sel}
        act={act}
        notify={notify}
      />
    </div>
  );
}

function RequirementPanel({ data, t, lab, r, act, notify }) {
  const [eq, setEq] = useState(t.mapping[r.req.id]?.equipmentId || "");
  const [req, setReq] = useState({
    kind: r.findings.some((f) => f.kind.startsWith("Calibration"))
      ? "Upload calibration record"
      : "Record capability value",
    note: "",
  });
  const [disp, setDisp] = useState({ type: DISPOSITIONS[0], note: "" });
  const locked = !!t.readiness;
  const d = t.dispositions[r.req.id];
  return (
    <section className="pa-card pa-finding" aria-labelledby="req-title">
      <p className="eyebrow">
        {r.req.id} · {r.req.reference}
      </p>
      <h2 id="req-title">{r.req.name}</h2>
      <div className="pa-row">
        <Status value={r.status} />
      </div>
      <p className="pa-quote">{r.req.excerpt}</p>
      <div className="detail-values">
        <div>
          <small>Required</small>
          <strong>
            {r.req.required
              ? `${r.req.kind === "atLeast" ? "≥" : "≤"} ${fmt(r.req.required)}`
              : "Valid calibration record"}
            {r.req.calibrated ? " · calibrated" : ""}
          </strong>
        </div>
        <div>
          <small>Recorded on {r.eq ? r.eq.id : "—"}</small>
          <strong>
            {r.eq
              ? r.req.parameter
                ? fmt(r.eq.capabilities[r.req.parameter])
                : r.eq.calibration
                  ? `${r.eq.calibration.ref}, due ${r.eq.calibration.due}`
                  : "no calibration record"
              : "—"}
          </strong>
        </div>
      </div>
      {r.findings.length > 0 && (
        <ul className="pa-checklist">
          {r.findings.map((f) => (
            <li key={f.kind} className="bad">
              <X size={14} aria-hidden="true" />{" "}
              <span>
                <strong>{f.kind}.</strong> {f.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
      {r.status === "Meets requirement" && (
        <p className="pa-hint">
          No gap against the recorded field
          {r.req.calibrated || r.req.kind === "record"
            ? " and calibration validity"
            : ""}{" "}
          only. This is not instrument qualification or method validation.
        </p>
      )}
      {d && (
        <p className="pa-callout">
          <strong>{d.type}</strong>: {d.note}
          {d.approvedBy
            ? ` · approved by ${displayName(data, d.approvedBy)}`
            : " · awaiting expert approval"}
        </p>
      )}
      {!locked && (
        <>
          <form
            className="pa-form pa-inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (act(mapRequirement, t.id, r.req.id, eq).ok)
                notify(`${r.req.id} mapped to ${eq || "nothing"}.`);
            }}
          >
            <label>
              Receiving-lab equipment
              <select value={eq} onChange={(e) => setEq(e.target.value)}>
                <option value="">Unmapped</option>
                {lab.equipment.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.id} · {x.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button small secondary">Save mapping</button>
          </form>
          <div className="pa-grid2 pa-subforms">
            <form
              className="pa-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (act(requestFromLab, t.id, r.req.id, req.kind, req.note).ok)
                  notify("Request sent to the receiving lab.");
              }}
            >
              <h3>Ask the receiving lab</h3>
              <label>
                Request
                <select
                  value={req.kind}
                  onChange={(e) =>
                    setReq((x) => ({ ...x, kind: e.target.value }))
                  }
                >
                  {REQUESTS.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <label>
                Note
                <input
                  value={req.note}
                  onChange={(e) =>
                    setReq((x) => ({ ...x, note: e.target.value }))
                  }
                  maxLength={300}
                  placeholder="e.g. Resolution from the gauge datasheet"
                />
              </label>
              <button className="button small secondary">
                <Send size={14} aria-hidden="true" /> Send request
              </button>
            </form>
            {r.status !== "Meets requirement" && (
              <form
                className="pa-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    act(
                      proposeDisposition,
                      t.id,
                      r.req.id,
                      disp.type,
                      disp.note,
                    ).ok
                  )
                    notify("Disposition proposed.");
                }}
              >
                <h3>Propose a disposition</h3>
                <label>
                  Disposition
                  <select
                    value={disp.type}
                    onChange={(e) =>
                      setDisp((x) => ({ ...x, type: e.target.value }))
                    }
                  >
                    {DISPOSITIONS.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Measure or action
                  <input
                    value={disp.note}
                    onChange={(e) =>
                      setDisp((x) => ({ ...x, note: e.target.value }))
                    }
                    maxLength={400}
                    placeholder="What will be done, and why it is sufficient"
                  />
                </label>
                <button className="button small secondary">Propose</button>
              </form>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function AiTab({ data, t, act, notify }) {
  const [reason, setReason] = useState({});
  return (
    <section className="pa-card">
      <h2>AI mapping suggestions</h2>
      <p className="pa-hint">
        In production, Amazon Bedrock reads each unmapped requirement and the
        equipment register and suggests a match, quoting both. The method owner
        decides.{" "}
        {data.policy.aiSuggestions
          ? ""
          : "AI suggestions are switched off by your administrator."}
      </p>
      {t.suggestions.length ? (
        t.suggestions.map((s) => (
          <article className="pa-suggestion" key={s.id}>
            <div className="pa-row between">
              <span>
                <AiBadge />{" "}
                <strong>
                  {s.requirementId} → {s.equipmentId}
                </strong>
              </span>
              <Status
                value={s.decision}
                label={
                  s.decision === "pending" ? "Needs a decision" : s.decision
                }
              />
            </div>
            <p className="pa-quote">{s.quote}</p>
            <p className="pa-hint">
              Shared wording with the equipment record:{" "}
              {s.shared.map((w) => `“${w}”`).join(", ")}.
            </p>
            {s.decision !== "pending" && (
              <p className="pa-hint">
                Decided by {displayName(data, s.by)} · {fmtDate(s.at)}
                {s.reason ? ` · “${s.reason}”` : ""}
              </p>
            )}
            {s.decision === "pending" && !t.readiness && (
              <div className="pa-actions">
                <button
                  className="button small"
                  onClick={() => {
                    if (act(decideSuggestion, t.id, s.id, true, "").ok)
                      notify(`${s.requirementId} mapped to ${s.equipmentId}.`);
                  }}
                >
                  <Check size={16} aria-hidden="true" /> Confirm mapping
                </button>
                <form
                  className="pa-reason"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      act(
                        decideSuggestion,
                        t.id,
                        s.id,
                        false,
                        reason[s.id] || "",
                      ).ok
                    )
                      notify("Suggestion dismissed.");
                  }}
                >
                  <label>
                    Dismiss, because…
                    <input
                      value={reason[s.id] || ""}
                      onChange={(e) =>
                        setReason((x) => ({ ...x, [s.id]: e.target.value }))
                      }
                      maxLength={300}
                      placeholder="e.g. Specimens cool in the conditioning chamber instead"
                    />
                  </label>
                  <button className="textbutton">
                    <X size={16} aria-hidden="true" /> Dismiss
                  </button>
                </form>
              </div>
            )}
          </article>
        ))
      ) : (
        <Empty>
          No suggestions. They appear for requirements without a mapping.
        </Empty>
      )}
    </section>
  );
}

function RequestsTab({ data, t }) {
  return (
    <section className="pa-card">
      <h2>Requests to the receiving lab</h2>
      {t.requests.length ? (
        <table className="pa-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Request</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {t.requests.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.reqId}
                  <small>{r.equipmentId || "—"}</small>
                </td>
                <td>
                  {r.kind}
                  <small>
                    {r.note || "—"} · {displayName(data, r.by)} ·{" "}
                    {fmtDate(r.at)}
                    {r.answer ? ` · answer: ${r.answer}` : ""}
                  </small>
                </td>
                <td>
                  <Status
                    value={r.done ? "done" : "open"}
                    label={r.done ? "Done" : "Open"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty>No requests yet. Send one from a requirement.</Empty>
      )}
    </section>
  );
}

function ReadinessTab({ data, t, res }) {
  const b = readinessBlockers(t, res);
  return (
    <section className="pa-card">
      <h2>Readiness</h2>
      {t.readiness ? (
        <p>
          <Status
            value={
              t.readiness.decision === "Ready for comparative testing"
                ? "Ready for comparative testing"
                : "Not ready (recorded)"
            }
          />{" "}
          by {displayName(data, t.readiness.by)} on {fmtDate(t.readiness.at)}: “
          {t.readiness.rationale}”
        </p>
      ) : b.length ? (
        <ul className="pa-checklist">
          {b.map((x) => (
            <li key={x} className="bad">
              <X size={14} aria-hidden="true" /> {x}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Every requirement is met or has an approved compensating measure. An
          independent expert reviewer can now record readiness.
        </p>
      )}
      <p className="pa-hint">
        Readiness is recorded by an expert reviewer, not the method owner. It
        means ready for comparative testing; it does not validate the method or
        qualify instruments.
      </p>
    </section>
  );
}

function ActivityTab({ data, t }) {
  const rows = data.audit.filter((a) => a.detail.startsWith(t.id)).reverse();
  return (
    <section className="pa-card">
      <h2>Activity</h2>
      {rows.length ? (
        <ol className="pa-feed">
          {rows.map((a) => (
            <li key={a.id}>
              <span>
                {a.action} · {displayName(data, a.user)}
              </span>
              <small>
                {a.detail} · {fmtDate(a.at)}
              </small>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>No activity yet.</Empty>
      )}
    </section>
  );
}
