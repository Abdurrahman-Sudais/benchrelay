import React from "react";
import { ArrowUpRight, ArrowRight, Check } from "lucide-react";

// Sections added alongside the original home page. Copy describes the prototype and the proposed
// product only: no customer numbers, testimonials, accreditation claims or invented prices.

function Eyebrow({ children }) {
  return (
    <p className="eyebrow">
      <span />
      {children}
    </p>
  );
}

export function PrototypeCta() {
  return (
    <section
      id="prototype"
      className="prototype-cta section"
      aria-labelledby="prototype-heading"
    >
      <div className="shell prototype-grid">
        <div>
          <Eyebrow>INTERACTIVE PROTOTYPE</Eyebrow>
          <h2 id="prototype-heading">
            Run the whole transfer.
            <br />
            <em>Every role, end to end.</em>
          </h2>
        </div>
        <div>
          <p>
            The workspace above shows four requirements. The prototype runs the
            full loop with fictional data: map each requirement to receiving-lab
            equipment, compare capabilities with unit conversion, check that
            calibration stays valid past the transfer date, ask the receiving
            lab for missing records, propose compensating measures, and have an
            independent expert record readiness.
          </p>
          <ul className="role-list">
            <li>
              <strong>Method owner</strong> Transfers, mappings, AI suggestions,
              requests and proposed dispositions.
            </li>
            <li>
              <strong>Receiving lab</strong> Its equipment register and the
              requests addressed to it.
            </li>
            <li>
              <strong>Expert reviewer</strong> Approves compensating measures
              and records readiness with a rationale.
            </li>
            <li>
              <strong>Administrator</strong> Roles, calibration policy, audit
              log and aggregate figures.
            </li>
          </ul>
          <div className="cta-row">
            <a className="button" href="/app">
              Open the prototype <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <span className="small-note">
              No sign-up. Changes stay in your browser.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const BENEFITS = [
  [
    "Compare like with like",
    "Required values and recorded capabilities are converted to the same unit before comparing, so 10 µm and 0.01 mm are treated as equal, and °C is never compared with mm.",
  ],
  [
    "Calibration that lasts the transfer",
    "A record is not enough. Calibration must stay valid until the transfer date plus your policy margin, so nothing expires mid-study.",
  ],
  [
    "Unknown stays unknown",
    "A missing capability value is “capability unknown”, never “meets”. The receiving lab is asked for the record, and the result updates when it arrives.",
  ],
  [
    "Compensating measures, approved",
    "When a gap is acceptable with a measure, the measure is written down and an independent reviewer approves it before readiness.",
  ],
  [
    "Independent readiness",
    "Readiness for comparative testing is recorded by an expert reviewer, not the person who prepared the transfer, with a written rationale.",
  ],
  [
    "One checklist for the file",
    "Export a readiness checklist with every requirement, its evidence, its disposition and who decided.",
  ],
];

export function Benefits() {
  return (
    <section
      id="benefits"
      className="shell section benefits"
      aria-labelledby="benefits-heading"
    >
      <Eyebrow>WHY LABORATORIES WOULD USE IT</Eyebrow>
      <h2 id="benefits-heading">
        Fewer surprises
        <br />
        <em>on the receiving bench.</em>
      </h2>
      <div className="card-grid">
        {BENEFITS.map(([t, c], i) => (
          <article className="grid-card" key={t}>
            <span className="mono">0{i + 1}</span>
            <h3>{t}</h3>
            <p>{c}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const USES = [
  [
    "Client procedures arriving at a contract lab",
    "Check a supplied procedure against the instruments and records you actually hold before quoting or scheduling.",
  ],
  [
    "Moving a method between sites",
    "Make the receiving site’s differences visible: a chamber that tops out lower, a gauge with coarser resolution.",
  ],
  [
    "Revised procedures",
    "When a procedure revision tightens a requirement, see which instruments no longer meet it.",
  ],
  [
    "Calibration planning",
    "Find instruments whose calibration falls due during or soon after a planned transfer.",
  ],
  [
    "Equipment substitutions",
    "Test whether a different oven or balance meets every requirement it would cover.",
  ],
  [
    "Audit preparation",
    "Show what was compared, which gaps were accepted with which measures, and who decided.",
  ],
];

export function UseCases() {
  return (
    <section
      id="use-cases"
      className="shell section usecases"
      aria-labelledby="uses-heading"
    >
      <Eyebrow>USE CASES</Eyebrow>
      <h2 id="uses-heading">
        Where transfers
        <br />
        <em>tend to stall.</em>
      </h2>
      <div className="card-grid">
        {USES.map(([t, c]) => (
          <article className="grid-card plain" key={t}>
            <h3>{t}</h3>
            <p>{c}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const SAFEGUARDS = [
  [
    "Not validation or certification",
    "Benchrelay prepares a transfer for expert review. It does not validate methods, qualify instruments, certify laboratories or control equipment.",
  ],
  [
    "People map, AI suggests",
    "AI may suggest which instrument covers a requirement, quoting both. The method owner confirms or dismisses it.",
  ],
  [
    "Records come from the lab",
    "Only the receiving lab updates its equipment register. Each value carries its source.",
  ],
  [
    "Independent readiness",
    "Readiness needs a reviewer who is not the method owner, a written rationale, and no open gaps or requests.",
  ],
  [
    "Changes revoke readiness",
    "Changing a mapping, a record, a disposition or the calibration policy revokes recorded readiness.",
  ],
  [
    "Traceable",
    "Every mapping, request, record, approval and decision is in an exportable audit log.",
  ],
];

export function Safeguards() {
  return (
    <section
      id="safeguards"
      className="safeguards section"
      aria-labelledby="safeguards-heading"
    >
      <div className="shell">
        <Eyebrow>SAFEGUARDS</Eyebrow>
        <h2 id="safeguards-heading">
          Software prepares.
          <br />
          <em>Experts decide.</em>
        </h2>
        <p className="lead-note">
          The prototype already enforces these review gates. Hosting and
          security items describe the proposed production design.
        </p>
        <div className="card-grid">
          {SAFEGUARDS.map(([t, c]) => (
            <article className="grid-card" key={t}>
              <Check size={18} aria-hidden="true" />
              <h3>{t}</h3>
              <p>{c}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  [
    "Pilot",
    "One receiving lab, a handful of procedures.",
    [
      "Guided setup of your equipment register",
      "Requirement mapping and capability checks",
      "Calibration validity checks",
      "Exportable readiness checklists",
    ],
  ],
  [
    "Laboratory",
    "Method owners, labs and reviewers together.",
    [
      "Everything in Pilot",
      "Roles, independent review and audit log",
      "AI mapping suggestions",
      "Calibration policy controls",
    ],
  ],
  [
    "Multi-site",
    "Networks of labs and manufacturers.",
    [
      "Everything in Laboratory",
      "Single sign-on",
      "Asset-management and LIMS record import",
      "Data-region options and a data-processing agreement",
    ],
  ],
];

export function Plans() {
  return (
    <section
      id="pricing"
      className="shell section plans"
      aria-labelledby="pricing-heading"
    >
      <Eyebrow>PLANS</Eyebrow>
      <h2 id="pricing-heading">
        Start with one bench.
        <br />
        <em>Grow across sites.</em>
      </h2>
      <p className="lead-note">
        Proposed plans for early access. Prices are agreed with each
        early-access customer; none are published yet.
      </p>
      <div className="plan-grid">
        {PLANS.map(([name, d, items], i) => (
          <article className={`plan ${i === 1 ? "featured" : ""}`} key={name}>
            {i === 1 && <span className="plan-tag">Most complete</span>}
            <h3>{name}</h3>
            <p className="plan-price">Pricing on request</p>
            <p>{d}</p>
            <ul>
              {items.map((x) => (
                <li key={x}>
                  <Check size={14} aria-hidden="true" /> {x}
                </li>
              ))}
            </ul>
            <a
              className={i === 1 ? "button small" : "textlink"}
              href="#contact"
            >
              Request early access <ArrowRight size={16} aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  [
    "Does Benchrelay validate methods or qualify instruments?",
    "No. It compares a procedure’s requirements with recorded capabilities and calibration, organises evidence and records expert decisions. Validation and qualification remain your laboratory’s responsibility.",
  ],
  [
    "What does “meets requirement” mean?",
    "That the recorded value for the mapped instrument satisfies the requirement after unit conversion and, where needed, that calibration stays valid past the transfer date plus your margin. It covers the recorded field only.",
  ],
  [
    "What does the AI do?",
    "In the proposed product, AI suggests which instrument may cover an unmapped requirement, quoting the requirement and the equipment record. The method owner confirms or dismisses it.",
  ],
  [
    "Who records readiness?",
    "An expert reviewer who is not the method owner. Readiness needs every requirement met or covered by an approved compensating measure, and no open requests.",
  ],
  [
    "What if the receiving lab has no value on record?",
    "The requirement stays “capability unknown”. The method owner can ask the lab for the value, and the result updates when the lab records it with its source.",
  ],
  [
    "Is it for clinical laboratories?",
    "Benchrelay is being built for nonclinical materials-testing laboratories. It does not make clinical decisions.",
  ],
  [
    "Is it available today?",
    "Benchrelay is in the building stage. The prototype runs in your browser with fictional data; uploads, extraction and AI need the production backend described in the architecture section.",
  ],
  [
    "How do we get early access?",
    "Use the form above to tell us about your laboratory and workflow. We reply by email.",
  ],
];

export function Faq() {
  return (
    <section
      id="faq"
      className="shell section faq"
      aria-labelledby="faq-heading"
    >
      <Eyebrow>FAQ</Eyebrow>
      <h2 id="faq-heading">
        Questions laboratories
        <br />
        <em>ask.</em>
      </h2>
      <div className="faq-list">
        {FAQS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
