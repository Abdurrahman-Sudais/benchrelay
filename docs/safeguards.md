# Review safeguards

| Safeguard | Prototype (`src/app/`) | Database (`db/schema.sql`) |
|---|---|---|
| Unit-safe comparisons | `toBase()` converts within a dimension and flags a unit mismatch across dimensions | `unit` table with dimension and factor |
| Unknown is not “meets” | A missing value means “Capability unknown”; a missing mapping means “No equipment mapped” | Result statuses constrained |
| Calibration lasts the transfer | Due date ≥ planned date + policy margin | Tenant `calibration_margin_days` (0–180) |
| Values carry their source | `recordCapability` requires a source | `capability.source_ref` NOT NULL, at least 3 characters |
| Only the lab updates its register | role check | `lab_*` RLS policies, `capability_writers`, `calibration_writers` |
| Measures approved independently | `approveMeasure` is reviewer-only | `check_disposition` trigger plus CHECK that the approver is not the proposer |
| Independent readiness with rationale | `recordReadiness` is reviewer-only, needs 20+ characters and no blockers | `check_readiness` trigger: reviewer only, not the owner, gate on results and requests |
| Changes revoke readiness | mapping, disposition, record and policy changes | `*_revokes` triggers; re-evaluation revokes only when a status changes |
| AI suggests only | mapping suggestions need an owner decision | — |
| Audit | every action | append-only trigger; admin-only reads |

## Tests

- `tests/engine.test.mjs` and `backend/tests/test_lambdas.py` both run `backend/tests/fixtures/cases.json`: unit conversion across length, time and mass, cross-dimension refusal, inclusive limits, calibration margin boundaries, and the ordering of combined findings.
- `tests/workflow.test.mjs`: remapping, AI confirmation, lab requests answered through the register, a compensating measure, independent readiness, revocation, the policy margin and permissions.
- `tests/prototype.test.mjs`: all four roles through the UI in jsdom, with persistence and reset.
- `db/test_rls.sql` on PostgreSQL 16: every database safeguard above.
