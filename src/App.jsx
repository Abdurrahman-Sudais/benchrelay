import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Search,
  SlidersHorizontal,
  ClipboardList,
  FlaskConical,
  Layers,
  Download,
  RotateCcw,
  X,
  Menu,
  Link as LinkIcon,
  AlertTriangle,
  HelpCircle,
  MoveRight,
  Mail,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  requirements,
  reviewers,
  initialState,
  updateReview,
  filterRequirements,
  checklist,
} from "./model.js";
const email = "azeem@benchrelay.top";
const nav = [
  ["Product", "/#product"],
  ["How it works", "/#how-it-works"],
  ["Architecture", "/#architecture"],
  ["Team", "/#leadership"],
];
function Logo({ reversed = false }) {
  return (
    <img
      className="logo"
      src={
        reversed ? "/brand/benchrelay-light.svg" : "/brand/benchrelay-dark.svg"
      }
      width="186"
      height="38"
      alt="Benchrelay"
    />
  );
}
function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="shell nav">
        <a href="/" aria-label="Benchrelay home">
          <Logo />
        </a>
        <nav
          aria-label="Main navigation"
          className={open ? "navlinks open" : "navlinks"}
        >
          {nav.map(([n, h]) => (
            <a key={n} href={h} onClick={() => setOpen(false)}>
              {n}
            </a>
          ))}
          <a href="/#contact" onClick={() => setOpen(false)}>
            Contact
          </a>
        </nav>
        <a className="button small headercta" href="/#demo">
          Explore demo <ArrowUpRight size={16} />
        </a>
        <button
          className="menu iconbutton"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer>
      <div className="shell">
        <div className="footer-top">
          <div>
            <Logo reversed />
            <p>
              Method-transfer readiness
              <br />
              for testing laboratories.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            {nav.map(([n, h]) => (
              <a key={n} href={h}>
                {n}
              </a>
            ))}
            <a href="/brand">Brand assets</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
          <a href={"mailto:" + email}>
            {email} <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Benchrelay</span>
          <span>Careful preparation. Human judgement.</span>
          <a href="/#contact">Get in touch</a>
        </div>
      </div>
    </footer>
  );
}
function Eyebrow({ children }) {
  return (
    <p className="eyebrow">
      <span />
      {children}
    </p>
  );
}
function HeroSheet() {
  return (
    <div
      className="hero-notebook"
      aria-label="Example requirement and equipment comparison"
    >
      <div className="notebook-head">
        <span className="mono">TRANSFER NOTE / 017</span>
        <span className="stamp">Sample data</span>
      </div>
      <div className="sheet-paper">
        <div className="paper-heading">
          <FileText size={19} />
          <span>Procedure requirement</span>
          <span className="mono">01</span>
        </div>
        <p className="mono subtle">MAT-017 · REV C · §4.2</p>
        <h3>Thermal conditioning</h3>
        <p>Required conditioning setpoint</p>
        <div className="big-value">
          180 <span>°C</span>
        </div>
        <div className="paper-rule" />
        <p className="excerpt">
          “Equipment must support a conditioning setpoint of 180 °C.”
        </p>
      </div>
      <div className="equipment-slip">
        <div className="slip-title">
          <span className="mono">TC-02</span>
          <span>Receiving laboratory</span>
        </div>
        <div className="slip-main">
          <svg
            width="78"
            height="90"
            viewBox="0 0 78 90"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="12"
              y="8"
              width="54"
              height="70"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="19"
              y="16"
              width="40"
              height="42"
              rx="2"
              stroke="currentColor"
            />
            <path
              d="M25 26h28M25 34h28M25 42h28M53 64h6M18 78v6M60 78v6"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="25" cy="66" r="3" fill="currentColor" />
          </svg>
          <div>
            <p>Recorded upper limit</p>
            <strong>
              150 <small>°C</small>
            </strong>
          </div>
        </div>
        <div className="badge mismatch">
          <AlertTriangle size={14} /> Capability mismatch
        </div>
      </div>
      <div className="evidence-note">
        <LinkIcon size={15} />
        <span>2 source records linked</span>
        <span className="mono">180 ≠ 150</span>
      </div>
      <div className="hero-check">
        <ClipboardList size={20} />
        <div>
          <strong>A clearer handover starts here.</strong>
          <p>Gap identified. Ready for expert review.</p>
        </div>
      </div>
    </div>
  );
}
function Home() {
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <Eyebrow>FROM ONE BENCH TO THE NEXT</Eyebrow>
          <h1>
            Before the method moves,
            <br />
            <em>know what the next bench needs.</em>
          </h1>
          <p className="lead">
            Compare test procedures with receiving-laboratory equipment and
            records. Find capability gaps, organise evidence, and prepare the
            transfer for expert review.
          </p>
          <div className="cta-row">
            <a className="button" href="#demo">
              Explore a sample transfer <ArrowUpRight size={18} />
            </a>
            <a className="textlink" href="#contact">
              Request early access <ArrowRight size={17} />
            </a>
          </div>
          <p className="hero-foot">
            <span className="dot" /> Built around evidence. Guided by experts.
          </p>
        </div>
        <HeroSheet />
      </section>
      <div className="audience-strip">
        <div className="shell">
          <span>MADE FOR THE RECEIVING BENCH</span>
          <p>Independent testing labs</p>
          <i>·</i>
          <p>Industrial quality teams</p>
          <i>·</i>
          <p>Multi-site manufacturers</p>
        </div>
      </div>
      <section id="product" className="shell problem section">
        <div>
          <Eyebrow>THE SPACE BETWEEN SITES</Eyebrow>
          <h2>
            A procedure can travel.
            <br />
            Its context often doesn’t.
          </h2>
        </div>
        <div className="problem-copy">
          <p className="large-copy">
            A method arrives as a document. The receiving bench has a different
            set of equipment, records, and open questions.
          </p>
          <p>
            Before work proceeds, someone needs to reconcile what the procedure
            asks for with what the laboratory has documented. Benchrelay brings
            that preparation into one evidence-linked review.
          </p>
          <a href="#demo" className="textlink">
            See the gap, follow the source <ArrowRight size={17} />
          </a>
        </div>
      </section>
      <section className="capabilities shell">
        <div className="section-heading">
          <h2>
            Less scattered evidence.
            <br />A more considered handover.
          </h2>
          <p>
            From the source wording to the next preparation action, keep the
            reasoning visible.
          </p>
        </div>
        <div className="capability-layout">
          <div className="matrix-illustration">
            <div className="mini-label mono">
              RECEIVING BENCH / REQUIREMENT MATRIX
            </div>
            <div className="matrix-head">
              <span>Requirement</span>
              <span>Recorded</span>
              <span>Finding</span>
            </div>
            {requirements.map((r) => (
              <div className="matrix-row" key={r.id}>
                <span>
                  <small className="mono">{r.id}</small>
                  {r.name}
                </span>
                <span>{r.recorded}</span>
                <span className={"finding " + r.kind}>
                  {r.kind === "mismatch" ? (
                    <AlertTriangle size={17} />
                  ) : r.kind === "missing" ? (
                    <HelpCircle size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                </span>
              </div>
            ))}
            <p className="matrix-foot">
              Illustrative sample · Recorded fields only
            </p>
          </div>
          <div className="cap-list">
            {[
              [
                "01",
                "Read, then confirm",
                "Extract procedure requirements for human confirmation. Keep source wording and document references close.",
              ],
              [
                "02",
                "Map to the receiving bench",
                "Connect each requirement to equipment capabilities and supporting records. Surface range mismatches and missing evidence.",
              ],
              [
                "03",
                "Give every gap a next step",
                "Assign an expert, record preparation actions, and export a checklist that carries unresolved findings forward.",
              ],
            ].map(([n, t, p]) => (
              <div key={n}>
                <span className="mono">{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how-it-works" className="process section">
        <div className="shell">
          <Eyebrow>A TRACEABLE PATH</Eyebrow>
          <div className="section-heading">
            <h2>
              Prepare the transfer.
              <br />
              Keep judgement with your experts.
            </h2>
            <p>
              Designed for nonclinical materials-testing procedures and manually
              confirmed equipment records.
            </p>
          </div>
          <ol className="steps">
            {[
              ["Add procedure", "Bring the source and its revision into view."],
              [
                "Confirm requirements",
                "Check the extracted wording and units.",
              ],
              ["Map equipment", "Link receiving-site capability records."],
              ["Review gaps", "Inspect differences and missing evidence."],
              [
                "Record decisions",
                "Capture expert review and preparation actions.",
              ],
            ].map(([t, p], i) => (
              <li key={t}>
                <span className="step-number mono">0{i + 1}</span>
                <h3>{t}</h3>
                <p>{p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <Demo />
      <section className="shell scenarios section">
        <Eyebrow>DIFFERENT SITES. THE SAME NEED FOR CONTEXT.</Eyebrow>
        <h2>
          Make the receiving bench
          <br />
          part of the conversation.
        </h2>
        <div className="scenario-grid">
          {[
            [
              "Independent testing laboratories",
              "Prepare a supplied client procedure for review against the equipment and documents you actually hold.",
            ],
            [
              "Industrial quality teams",
              "Bring specification requirements and recorded operating ranges together before a transfer proceeds.",
            ],
            [
              "Multi-site manufacturers",
              "Make site differences visible when a procedure moves between laboratory teams.",
            ],
          ].map(([t, p], i) => (
            <article key={t}>
              <span className="mono">USE CASE / 0{i + 1}</span>
              <h3>{t}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
        <div className="scope-note">
          <FlaskConical size={22} />
          <p>
            Benchrelay assists preparation and expert review. It does not
            establish scientific method validity, certify laboratories, make
            clinical decisions, or control instruments.
          </p>
        </div>
      </section>
      <Architecture />
      <section id="leadership" className="shell section leadership">
        <Eyebrow>THE TEAM</Eyebrow>
        <h2>The People Building Benchrelay</h2>
        <div className="leaders">
          {[
            ["AS", "Azeem Salako", "Founder & CEO"],
            ["OO", "Osahon Osagiede", "Co-founder & CTO"],
          ].map(([i, n, t]) => (
            <article key={i}>
              <div className="avatar">{i}</div>
              <div>
                <h3>{n}</h3>
                <p>{t}</p>
              </div>
              <span className="leader-line" />
            </article>
          ))}
        </div>
      </section>
      <Contact />
    </>
  );
}
function Architecture() {
  return (
    <section id="architecture" className="architecture section">
      <div className="shell">
        <Eyebrow>PROPOSED PRODUCTION SYSTEM</Eyebrow>
        <div className="section-heading">
          <h2>
            Architecture on
            <br />
            Amazon Web Services
          </h2>
          <p>
            The proposed architecture connects procedure requirements,
            laboratory capability records, and expert readiness reviews. The
            interactive demo uses sample data.
          </p>
        </div>
        <div className="pipeline">
          {[
            [
              "01",
              "Procedure intake",
              "Cognito · S3",
              "Authenticate workspace users and receive procedure versions.",
            ],
            [
              "02",
              "Evidence storage",
              "S3 · RDS PostgreSQL",
              "Keep documents, equipment records, and requirement mappings.",
            ],
            [
              "03",
              "Extraction & mapping",
              "Textract · Bedrock",
              "Extract supported text and tables; assist comparison for human confirmation.",
            ],
            [
              "04",
              "Capability checks",
              "Lambda · RDS PostgreSQL",
              "Compare confirmed units, ranges, dates, and missing evidence.",
            ],
            [
              "05",
              "Expert review",
              "RDS PostgreSQL · S3",
              "Record reviewer decisions and preserve findings in exports.",
            ],
          ].map(([n, t, s, p]) => (
            <article key={n}>
              <span className="mono">
                {n}
                <ArrowRight size={18} />
              </span>
              <h3>{t}</h3>
              <p className="services">{s}</p>
              <p>{p}</p>
            </article>
          ))}
        </div>
        <div className="architecture-note">
          <p>
            <strong>
              Extraction is assistance. Comparison is structured. Scientific
              judgement stays human.
            </strong>{" "}
            A foundation model does not establish instrument fitness or method
            validity.
          </p>
          <p>
            These services are proposed, not deployed in this demo. Hosting for
            this marketing website is a separate decision.
          </p>
        </div>
      </div>
    </section>
  );
}
function Demo() {
  const [tab, setTab] = useState("Transfers");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [state, setState] = useState(initialState);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const rows = filterRequirements(query, filter, state);
  const change = (id, t, v) => setState((s) => updateReview(s, id, t, v));
  function exportData() {
    const data = JSON.stringify(checklist(state), null, 2);
    const url = URL.createObjectURL(
      new Blob([data], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "Benchrelay-TR-017-readiness.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Sample checklist downloaded with unresolved findings retained.");
  }
  return (
    <section id="demo" className="demo-section section">
      <div className="shell">
        <div className="section-heading">
          <div>
            <Eyebrow>LOOK INSIDE THE HANDOVER</Eyebrow>
            <h2>
              One transfer.
              <br />
              Every requirement in view.
            </h2>
          </div>
          <p>
            Explore the fictional MAT-017 transfer. Follow the evidence, assign
            a sample reviewer, and see what still needs attention.
          </p>
        </div>
        <div className="workspace">
          <div className="workspace-title">
            <span>
              <img
                src="/brand/benchrelay-symbol.svg"
                width="27"
                height="27"
                alt=""
              />
              <strong>Transfer workspace</strong>
            </span>
            <span className="demo-label">Interactive demo · Sample data</span>
          </div>
          <div className="workspace-body">
            <nav className="workspace-nav" aria-label="Sample workspace">
              {[
                ["Transfers", Layers],
                ["Procedures", FileText],
                ["Equipment", FlaskConical],
                ["Readiness Reviews", ClipboardList],
              ].map(([t, Icon]) => (
                <button
                  key={t}
                  aria-current={tab === t ? "page" : undefined}
                  className={tab === t ? "active" : ""}
                  onClick={() => {
                    setTab(t);
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  <Icon size={17} />
                  {t}
                </button>
              ))}
              <div className="workspace-nav-foot">
                <span className="dot" /> Browser-local demo
                <br />
                <small>No live AI or instrument connection</small>
              </div>
            </nav>
            <div className="workspace-main">
              <div className="workspace-breadcrumb mono">
                WEST BENCH / {tab.toUpperCase()}
              </div>
              <div className="transfer-heading">
                <div>
                  <h3>
                    {tab === "Transfers"
                      ? "Thermal conditioning transfer"
                      : tab === "Procedures"
                        ? "Procedure library"
                        : tab === "Equipment"
                          ? "Receiving-laboratory equipment"
                          : "Readiness review log"}
                  </h3>
                  <p>West Bench Materials Lab · Fictional example</p>
                </div>
                <span className="revision mono">
                  {tab === "Equipment" ? "4 RECORDS" : "TR-017 / REV C"}
                </span>
              </div>
              <div className="transfer-meta">
                <span>
                  <small>PROCEDURE</small>MAT-017 · Rev C
                </span>
                <span>
                  <small>SAMPLE REVIEW DATE</small>18 October 2026
                </span>
                <span>
                  <small>PREPARATION</small>Expert review required
                </span>
              </div>
              <div className="summary-cells">
                <div>
                  <strong>01</strong>
                  <span>Capability mismatch</span>
                </div>
                <div>
                  <strong>01</strong>
                  <span>Capability unknown</span>
                </div>
                <div>
                  <strong>02</strong>
                  <span>Recorded checks present</span>
                </div>
              </div>
              <div className="tools">
                <label className="search">
                  <Search size={17} />
                  <input
                    aria-label="Search sample records"
                    placeholder={
                      tab === "Equipment"
                        ? "Search equipment…"
                        : "Search transfer, requirement, equipment…"
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label className="filter">
                  <SlidersHorizontal size={16} />
                  <select
                    aria-label="Filter sample records"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All findings</option>
                    <option value="mismatch">Capability mismatch</option>
                    <option value="missing">Missing evidence</option>
                    <option value="unreviewed">Awaiting review</option>
                    <option value="reviewed">Expert review recorded</option>
                  </select>
                </label>
              </div>
              {tab === "Procedures" ? (
                <div className="procedure-view">
                  {rows.length > 0 ? (
                    <>
                      <div className="procedure-cover">
                        <FileText size={32} />
                        <span className="mono">MAT-017 / REV C</span>
                        <h4>Thermal conditioning of material specimens</h4>
                        <p>
                          Fictional procedure · Four supplied sample requirement
                          records
                        </p>
                      </div>
                      {rows.map((r) => (
                        <button
                          className="excerpt-row"
                          key={r.id}
                          onClick={() => setSelected(r.id)}
                        >
                          <span className="mono">{r.reference}</span>
                          <span>{r.excerpt}</span>
                          <ChevronRight size={17} />
                        </button>
                      ))}
                    </>
                  ) : (
                    <Empty />
                  )}
                </div>
              ) : (
                <div className="record-list">
                  {rows.length ? (
                    rows.map((r) => (
                      <button
                        className="record"
                        key={r.id}
                        onClick={() => setSelected(r.id)}
                      >
                        <span className={"record-icon " + r.kind}>
                          {tab === "Equipment" ? (
                            <FlaskConical size={19} />
                          ) : r.kind === "mismatch" ? (
                            <AlertTriangle size={19} />
                          ) : r.kind === "missing" ? (
                            <HelpCircle size={19} />
                          ) : (
                            <Check size={19} />
                          )}
                        </span>
                        <span className="record-name">
                          <small className="mono">
                            {tab === "Equipment" ? r.equipment : r.id}
                          </small>
                          <strong>
                            {tab === "Equipment" ? r.equipmentName : r.name}
                          </strong>
                          <small>
                            {tab === "Readiness Reviews"
                              ? state[r.id].reviewer
                                ? state[r.id].reviewer + " · Sample reviewer"
                                : "No reviewer assigned"
                              : tab === "Equipment"
                                ? r.recorded
                                : r.reference}
                          </small>
                        </span>
                        <span className="record-status">
                          <span className={"badge " + r.kind}>{r.status}</span>
                          <small>
                            {state[r.id].acknowledged
                              ? "Expert review recorded"
                              : state[r.id].action
                                ? "Preparation action assigned"
                                : "Awaiting expert review"}
                          </small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))
                  ) : (
                    <Empty />
                  )}
                </div>
              )}
              <div className="workspace-actions">
                <p>
                  <LinkIcon size={14} /> References present ≠ content verified
                </p>
                <div>
                  <button
                    className="textbutton"
                    onClick={() => {
                      setState(initialState());
                      setQuery("");
                      setFilter("all");
                      setSelected(null);
                      setNotice(
                        "Demo reset. Original sample records restored.",
                      );
                    }}
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                  <button className="button small" onClick={exportData}>
                    <Download size={15} /> Export checklist
                  </button>
                </div>
              </div>
              <p className="live-notice" role="status">
                {notice}
              </p>
            </div>
          </div>
          <div className="workspace-bottom">
            <span className="mono">READINESS / PREPARATION ONLY</span>
            <span>
              Technical records stay read-only. Review actions never change
              recorded capabilities.
            </span>
          </div>
        </div>
        <p className="demo-caption">
          All procedure excerpts, equipment, laboratory details, and reviewers
          in this workspace are fictional sample data. Changes remain in memory
          until reset or page reload.
        </p>
      </div>
      {selected && (
        <Detail
          requirement={requirements.find((r) => r.id === selected)}
          review={state[selected]}
          change={change}
          close={() => setSelected(null)}
        />
      )}
    </section>
  );
}
function Empty() {
  return (
    <div className="empty">
      <Search size={24} />
      <h4>No matching sample records</h4>
      <p>Try another search or choose “All findings”.</p>
    </div>
  );
}
function Detail({ requirement: r, review, change, close }) {
  const ref = useRef(null);
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");
  const [action, setAction] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => d.close();
  }, []);
  function add(type, value, clear) {
    change(r.id, type, value);
    clear("");
    setMsg(
      type === "evidence"
        ? "Simulated reference added, unverified. Technical finding is unchanged."
        : "Review entry recorded. Technical finding is unchanged.",
    );
  }
  return (
    <dialog
      ref={ref}
      className="detail-dialog"
      aria-labelledby="detail-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="dialog-head">
        <span className="mono">TR-017 / {r.id}</span>
        <button
          className="iconbutton"
          onClick={close}
          aria-label="Close requirement details"
        >
          <X />
        </button>
      </div>
      <div className="dialog-content">
        <Eyebrow>SAMPLE REQUIREMENT DETAIL</Eyebrow>
        <h2 id="detail-title">{r.name}</h2>
        <span className={"badge " + r.kind}>{r.status}</span>
        <section className="detail-box">
          <h3>Procedure excerpt</h3>
          <p className="mono">{r.reference} · Rev C</p>
          <blockquote>{r.excerpt}</blockquote>
        </section>
        <section className="detail-box">
          <h3>Mapped equipment record</h3>
          <p className="mono">
            {r.equipment} · {r.equipmentName}
          </p>
          <dl>
            <div>
              <dt>Required</dt>
              <dd>{r.required}</dd>
            </div>
            <div>
              <dt>Recorded</dt>
              <dd>{r.recorded}</dd>
            </div>
            {r.id === "REQ-02" && (
              <>
                <div>
                  <dt>Record date</dt>
                  <dd>30 September 2026</dd>
                </div>
                <div>
                  <dt>Review due</dt>
                  <dd>30 September 2027</dd>
                </div>
                <div>
                  <dt>Sample review</dt>
                  <dd>18 October 2026</dd>
                </div>
              </>
            )}
          </dl>
          <p>{r.detail}</p>
          <small>Read-only sample equipment specifications</small>
        </section>
        <section className="review-controls">
          <h3>Prepare the expert review</h3>
          <p>Review activity is separate from the technical finding.</p>
          <label>
            Sample expert reviewer
            <select
              value={review.reviewer}
              onChange={(e) => change(r.id, "reviewer", e.target.value)}
            >
              <option value="">Unassigned</option>
              {reviewers.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <small>All reviewer names are fictional sample data.</small>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add("note", note, setNote);
            }}
          >
            <label>
              Local review note
              <textarea
                required
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What should the next reviewer know?"
              />
            </label>
            <button className="outline-button" disabled={!note.trim()}>
              <Plus size={15} />
              Add note
            </button>
          </form>
          {review.notes.map((n, i) => (
            <p className="review-entry" key={i}>
              {n}
            </p>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add("evidence", evidence, setEvidence);
            }}
          >
            <label>
              Simulated evidence reference
              <input
                required
                maxLength={300}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="e.g. Equipment file, appendix B"
              />
            </label>
            <button className="outline-button" disabled={!evidence.trim()}>
              <LinkIcon size={15} />
              Add reference
            </button>
          </form>
          {review.evidence.map((n, i) => (
            <div className="review-entry" key={i}>
              <strong>{n.reference}</strong>
              <small>{n.verification}</small>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add("action", action, setAction);
            }}
          >
            <label>
              Preparation action
              <input
                required
                maxLength={500}
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="e.g. Request receiving-site capability record"
              />
            </label>
            <button className="outline-button" disabled={!action.trim()}>
              Record preparation action
            </button>
          </form>
          {review.action && (
            <p className="review-entry">
              Preparation action assigned
              {review.reviewer ? " to " + review.reviewer : ""}: {review.action}
            </p>
          )}
          <button
            className="button"
            disabled={review.acknowledged}
            onClick={() => {
              change(r.id, "acknowledge");
              setMsg(
                "Expert review recorded. Recorded capabilities and technical findings are unchanged.",
              );
            }}
          >
            <CheckCircle2 size={17} />
            {review.acknowledged
              ? "Expert review recorded"
              : "Record acknowledgement"}
          </button>
          <p role="status" className="live-notice">
            {msg}
          </p>
          <p className="detail-warning">
            An acknowledgement records that the finding was reviewed. It does
            not approve the transfer or confirm evidence content.
          </p>
        </section>
      </div>
    </dialog>
  );
}
function Contact() {
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  function message(form) {
    const f = new FormData(form);
    return `Name: ${f.get("name")}\nWork email: ${f.get("email")}\nCompany / laboratory: ${f.get("company")}\nLaboratory type: ${f.get("type")}\n\nMethod-transfer challenge:\n${f.get("challenge")}`;
  }
  function submit(e) {
    e.preventDefault();
    const body = message(e.currentTarget);
    setDraft(body);
    setStatus(
      "Email draft requested. Send it through your email application, or copy the message below.",
    );
    window.location.href = `mailto:${email}?subject=${encodeURIComponent("Benchrelay early access enquiry")}&body=${encodeURIComponent(body)}`;
  }
  async function copy(e) {
    const form = e.currentTarget.closest("form");
    if (!form.reportValidity()) return;
    const body = message(form);
    setDraft(body);
    try {
      await navigator.clipboard.writeText(body);
      setStatus("Message copied. Paste it into an email to " + email + ".");
    } catch {
      setStatus("Copy is unavailable. Select and copy the message below.");
    }
  }
  return (
    <section id="contact" className="contact section">
      <div className="shell contact-grid">
        <div>
          <Eyebrow>BUILDING WITH THE RECEIVING BENCH IN MIND</Eyebrow>
          <h2>
            Let’s talk about
            <br />
            your next transfer.
          </h2>
          <p className="large-copy">
            Benchrelay is being built for nonclinical materials-testing
            laboratories. We’re interested in the preparation challenges your
            team faces.
          </p>
          <p>
            For early access or to request pricing, tell us about your
            laboratory and workflow.
          </p>
          <a className="email-link" href={"mailto:" + email}>
            {email}
            <ArrowUpRight size={20} />
          </a>
        </div>
        <form onSubmit={submit} className="contact-form">
          <div className="form-pair">
            <label>
              Name
              <input name="name" autoComplete="name" required maxLength={100} />
            </label>
            <label>
              Work email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={200}
              />
            </label>
          </div>
          <label>
            Company or laboratory
            <input
              name="company"
              autoComplete="organization"
              required
              maxLength={200}
            />
          </label>
          <label>
            Laboratory type
            <select name="type" required defaultValue="">
              <option value="" disabled>
                Select your laboratory type
              </option>
              <option>Independent testing laboratory</option>
              <option>Industrial quality-control laboratory</option>
              <option>Manufacturer with multiple sites</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Current method-transfer challenge
            <textarea name="challenge" rows="3" required maxLength={2000} />
          </label>
          <p className="form-note">
            This opens an email draft. You must send it through your email
            application. No form data is submitted to Benchrelay by this
            website.
          </p>
          <div className="form-buttons">
            <button className="button">
              Open email draft <Mail size={17} />
            </button>
            <button className="textbutton" type="button" onClick={copy}>
              Copy message
            </button>
          </div>
          <p className="live-notice" role="status">
            {status}
          </p>
          {draft && (
            <label>
              Message fallback
              <textarea
                readOnly
                value={draft}
                rows={8}
                onFocus={(e) => e.target.select()}
              />
            </label>
          )}
        </form>
      </div>
    </section>
  );
}
function Brand() {
  const assets = [
    ["Primary logo · SVG", "benchrelay-dark.svg"],
    ["Reversed logo · SVG", "benchrelay-light.svg"],
    ["Standalone symbol · SVG", "benchrelay-symbol.svg"],
    ["Reversed symbol · SVG", "benchrelay-symbol-light.svg"],
    ["Primary logo · PNG", "benchrelay-dark.png"],
    ["Reversed logo · PNG", "benchrelay-light.png"],
    ["Square avatar · SVG", "benchrelay-avatar.svg"],
    ["Square avatar · PNG", "benchrelay-avatar.png"],
    ["Favicon · SVG", "favicon.svg"],
    ["Favicon · 16 px", "favicon-16.png"],
    ["Favicon · 32 px", "favicon-32.png"],
    ["Apple touch icon", "apple-touch-icon.png"],
  ];
  return (
    <main className="shell brand-page section">
      <Eyebrow>THE BENCHRELAY IDENTITY</Eyebrow>
      <h1>A considered connection.</h1>
      <p className="lead">Two benches. One careful handover.</p>
      <div className="brand-stage">
        <img src="/brand/benchrelay-dark.svg" alt="Benchrelay primary logo" />
      </div>
      <p>Primary mark · Deep teal on soft white</p>
      <div className="brand-stage reversed">
        <img src="/brand/benchrelay-light.svg" alt="Benchrelay reversed logo" />
      </div>
      <p>Reversed mark · Soft white on deep teal</p>
      <div className="brand-stage square">
        <img
          src="/brand/benchrelay-avatar.svg"
          alt="Benchrelay square symbol"
        />
      </div>
      <p>Square symbol · Comfortable padding for profile use</p>
      <div className="downloads">
        {assets.map(([n, f]) => (
          <a key={f} href={"/brand/" + f} download>
            {n}
            <Download size={17} />
          </a>
        ))}
      </div>
      <div className="palette">
        {[
          ["#F5F8F7", "Soft white"],
          ["#174E52", "Deep teal"],
          ["#DDEDE6", "Pale mint"],
          ["#785A78", "Muted plum"],
          ["#243432", "Text"],
        ].map(([c, n]) => (
          <div key={c}>
            <span style={{ background: c }} />
            <strong>{n}</strong>
            <code>{c}</code>
          </div>
        ))}
      </div>
    </main>
  );
}
function Legal({ type }) {
  return (
    <main className="shell legal section">
      <Eyebrow>REVIEW DRAFT · 18 OCTOBER 2026</Eyebrow>
      <h1>{type === "privacy" ? "Privacy" : "Terms of use"}</h1>
      {type === "privacy" ? (
        <>
          <p className="lead">How this review website handles information.</p>
          <h2>Interactive sample workspace</h2>
          <p>
            Sample review notes, reviewer assignments, and simulated evidence
            references remain in the browser’s memory. They are cleared by reset
            or page reload. This website does not upload laboratory documents,
            connect to instruments, invoke live AI, or send demo entries to a
            backend.
          </p>
          <h2>Contacting Benchrelay</h2>
          <p>
            The contact form can open your email application with a draft
            addressed to {email}. Nothing is sent until you send that message
            yourself. Your email provider handles the draft and delivery under
            its own terms. The copy action places your message on your device’s
            clipboard when your browser permits it.
          </p>
          <h2>Hosting and device information</h2>
          <p>
            No analytics or advertising scripts are included. No cookies or
            browser storage are used by the application. A future hosting
            provider may process ordinary request information, such as IP
            addresses and browser details, to serve and protect the website.
            Provider details and applicable operator disclosures must be
            confirmed before public launch.
          </p>
          <h2>Your information</h2>
          <p>
            Use fictional information when trying the sample workspace. Do not
            enter confidential laboratory records. To ask about information you
            email to Benchrelay, contact the address below.
          </p>
        </>
      ) : (
        <>
          <p className="lead">
            Terms for exploring this website and its fictional demonstration.
          </p>
          <h2>Preparation and expert review</h2>
          <p>
            Benchrelay is software intended to assist laboratory method-transfer
            preparation. The demo is an illustrative workflow, not a production
            laboratory system. It does not establish scientific validity,
            qualify instruments, certify laboratories, grant accreditation, make
            clinical decisions, or control equipment.
          </p>
          <h2>Sample information and exports</h2>
          <p>
            The laboratory, procedure, equipment records, and reviewers shown
            are fictional. Exports retain unresolved findings. An
            acknowledgement records review activity; it does not change a
            recorded technical capability or approve a method transfer.
          </p>
          <h2>Appropriate technical verification</h2>
          <p>
            Laboratory teams remain responsible for evaluating source records,
            technical suitability, safety, and the applicable requirements of
            their work. Appropriate expert assessment and scientific
            verification are required before using a transferred procedure.
          </p>
          <h2>Early access and availability</h2>
          <p>
            Enquiries do not create a subscription, access entitlement, delivery
            commitment, or pricing agreement. Product availability and any
            future service terms will be discussed separately.
          </p>
          <h2>Website assets</h2>
          <p>
            Brand assets are provided for accurate identification of Benchrelay.
            Do not use them to imply certification, accreditation, or an
            endorsement.
          </p>
        </>
      )}
      <h2>Contact</h2>
      <p>
        <a href={"mailto:" + email}>{email}</a>
      </p>
      <p className="legal-draft">
        Review-ready draft. Operator details, hosting disclosures, and any
        applicable legal requirements must be reviewed before public
        publication.
      </p>
    </main>
  );
}
function NotFound() {
  return (
    <main className="shell notfound section">
      <Eyebrow>PAGE NOT FOUND / 404</Eyebrow>
      <h1>This bench is empty.</h1>
      <p className="lead">
        The page you’re looking for isn’t here. Return to the workspace and
        follow the evidence.
      </p>
      <a className="button" href="/">
        Back to Benchrelay <ArrowRight size={17} />
      </a>
    </main>
  );
}
export default function App({ path = "/" }) {
  path = path.replace(/\/$/, "") || "/";
  return (
    <>
      <a className="skip" href="#main-content">
        Skip to content
      </a>
      <Header />
      <div id="main-content">
        {path === "/" ? (
          <main>
            <Home />
          </main>
        ) : path === "/brand" ? (
          <Brand />
        ) : path === "/privacy" ? (
          <Legal type="privacy" />
        ) : path === "/terms" ? (
          <Legal type="terms" />
        ) : (
          <NotFound />
        )}
      </div>
      <Footer />
    </>
  );
}
