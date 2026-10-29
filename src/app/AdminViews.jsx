import React, { useState } from "react";
import { Download, Check, X } from "lucide-react";
import { transferStatus, csv } from "./engine.js";
import {
  setRole,
  setPolicy,
  results,
  PERMISSIONS,
  displayName,
} from "./actions.js";
import { PageHead, Kpi, StackBar, Empty, fmtDate, download } from "./ui.jsx";

const ROLE_LABEL = {
  owner: "Method owner",
  lab: "Receiving lab",
  reviewer: "Expert reviewer",
  admin: "Administrator",
};

export function AdminOverview({ data }) {
  const rows = data.transfers.map((t) => ({ t, res: results(data, t) }));
  const all = rows.flatMap((x) => x.res);
  const kinds = all
    .flatMap((r) => r.findings.map((f) => f.kind))
    .reduce((m, k) => ({ ...m, [k]: (m[k] || 0) + 1 }), {});
  const ai = data.transfers.flatMap((t) => t.suggestions);
  const cal = data.labs
    .flatMap((l) => l.equipment)
    .filter((e) => e.calibration);
  return (
    <>
      <PageHead
        title="Workspace overview"
        sub="Aggregate figures only. Transfer details stay with method owners and reviewers."
      />
      <div className="pa-kpis">
        <Kpi value={data.transfers.length} label="transfers" />
        <Kpi
          value={
            data.transfers.filter(
              (t) => t.readiness?.decision === "Ready for comparative testing",
            ).length
          }
          label="ready for comparative testing"
        />
        <Kpi
          value={all.filter((r) => r.status !== "Meets requirement").length}
          label="requirements not met"
        />
        <Kpi
          value={`${cal.length}/${data.labs.flatMap((l) => l.equipment).length}`}
          label="instruments with a calibration record"
        />
      </div>
      <div className="pa-grid2">
        <section className="pa-card">
          <h2>Findings by kind</h2>
          {Object.keys(kinds).length ? (
            <table className="pa-table">
              <tbody>
                {Object.entries(kinds).map(([k, n]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td className="num">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>No findings.</Empty>
          )}
          <h2>Transfers by status</h2>
          <table className="pa-table">
            <tbody>
              {Object.entries(
                rows.reduce((m, x) => {
                  const s = transferStatus(x.t, x.res);
                  return { ...m, [s]: (m[s] || 0) + 1 };
                }, {}),
              ).map(([k, n]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="num">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="pa-card">
          <h2>AI mapping suggestions</h2>
          <StackBar
            parts={[
              {
                label: "Confirmed",
                value: ai.filter((s) => s.decision === "confirmed").length,
                tone: "ok",
              },
              {
                label: "Dismissed or superseded",
                value: ai.filter((s) =>
                  ["dismissed", "superseded"].includes(s.decision),
                ).length,
                tone: "muted",
              },
              {
                label: "Pending",
                value: ai.filter((s) => s.decision === "pending").length,
                tone: "ai",
              },
            ]}
          />
          <p className="pa-hint">
            How often method owners accept the suggested equipment. Track it
            across prompt and model changes.
          </p>
        </section>
      </div>
    </>
  );
}

export function AdminUsers({ data, user, act, notify }) {
  return (
    <>
      <PageHead
        title="Users & roles"
        sub="The expert reviewer role is separate from the method owner, so readiness is always an independent judgement."
      />
      <div className="pa-card pa-tablewrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="pa-avatar">{u.initials}</span> {u.name}
                  {u.id === user.id && " (you)"}
                </td>
                <td>{u.title}</td>
                <td>
                  <select
                    aria-label={`Role for ${u.name}`}
                    value={u.role}
                    onChange={(e) => {
                      if (act(setRole, u.id, e.target.value).ok)
                        notify(
                          `${u.name} is now ${ROLE_LABEL[e.target.value]}.`,
                        );
                    }}
                  >
                    {Object.entries(ROLE_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminPolicy({ data, act, notify }) {
  const p = data.policy;
  return (
    <>
      <PageHead
        title="Policy"
        sub="Workspace-wide controls. Every change is written to the audit log."
      />
      <section className="pa-card pa-form">
        <label>
          Calibration must stay valid this many days after the transfer
          <input
            type="number"
            min="0"
            max="180"
            defaultValue={p.calibrationMarginDays}
            key={`m-${p.calibrationMarginDays}`}
            onBlur={(e) => {
              if (
                Number(e.target.value) !== p.calibrationMarginDays &&
                act(setPolicy, "calibrationMarginDays", e.target.value).ok
              )
                notify(
                  "Calibration margin updated; recorded readiness was revoked.",
                );
            }}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={p.aiSuggestions}
            onChange={(e) => {
              if (act(setPolicy, "aiSuggestions", e.target.checked).ok)
                notify(
                  `AI suggestions ${e.target.checked ? "on" : "off"} for new transfers.`,
                );
            }}
          />{" "}
          AI mapping suggestions
        </label>
        <p className="pa-hint">
          Capability and calibration checks always run. AI only suggests
          mappings; method owners decide and expert reviewers record readiness.
        </p>
      </section>
    </>
  );
}

export function AdminAudit({ data }) {
  const [q, setQ] = useState("");
  const rows = data.audit
    .filter((a) =>
      `${a.action} ${a.detail} ${displayName(data, a.user)}`
        .toLowerCase()
        .includes(q.toLowerCase()),
    )
    .reverse();
  return (
    <>
      <PageHead
        title="Audit log"
        sub="Append-only record of who did what, and when."
      >
        <button
          className="textbutton"
          onClick={() =>
            download(
              "benchrelay-audit.csv",
              csv([
                ["id", "time", "user", "action", "detail"],
                ...data.audit.map((a) => [
                  a.id,
                  a.at,
                  displayName(data, a.user),
                  a.action,
                  a.detail,
                ]),
              ]),
              "text/csv",
            )
          }
        >
          <Download size={16} aria-hidden="true" /> Export CSV
        </button>
      </PageHead>
      <div className="pa-filters">
        <label>
          <span className="sr-only">Filter audit log</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by action, transfer or person…"
          />
        </label>
      </div>
      <div className="pa-card pa-tablewrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Who</th>
              <th>Action</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{fmtDate(a.at)}</td>
                <td>{displayName(data, a.user)}</td>
                <td>{a.action}</td>
                <td>{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>No entries match.</Empty>}
      </div>
    </>
  );
}

export function AdminPermissions() {
  const cell = (v) =>
    v === true ? (
      <Check size={14} aria-label="Allowed" />
    ) : v === false ? (
      <X size={14} aria-label="Not allowed" />
    ) : (
      <small>{v}</small>
    );
  return (
    <>
      <PageHead
        title="Permissions"
        sub="What each role can do. The prototype checks this on every action; production enforces it on the server and in PostgreSQL row-level security."
      />
      <div className="pa-card pa-tablewrap">
        <table className="pa-table pa-matrix">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Method owner</th>
              <th>Receiving lab</th>
              <th>Expert reviewer</th>
              <th>Administrator</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(([label, r]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{cell(r.owner)}</td>
                <td>{cell(r.lab)}</td>
                <td>{cell(r.reviewer)}</td>
                <td>{cell(r.admin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
