-- Verifies db/schema.sql on a scratch PostgreSQL database. Run as a superuser:
--   createdb benchrelay_test && psql -v ON_ERROR_STOP=1 -d benchrelay_test -f db/schema.sql -f db/test_rls.sql
-- Every check raises an exception on failure; the last line prints ALL CHECKS PASSED.

CREATE ROLE benchrelay_app LOGIN;
GRANT USAGE ON SCHEMA public TO benchrelay_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO benchrelay_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO benchrelay_app;

-- Seed as the superuser (RLS bypassed).
INSERT INTO tenant (tenant_id, name) VALUES ('11111111-1111-1111-1111-111111111111', 'A'), ('22222222-2222-2222-2222-222222222222', 'B');
INSERT INTO laboratory VALUES ('11111111-1111-1111-1111-111111111111', 'WB', 'West Bench'), ('11111111-1111-1111-1111-111111111111', 'EB', 'East Bench'), ('22222222-2222-2222-2222-222222222222', 'ZZ', 'Other');
INSERT INTO app_user (user_id, tenant_id, idp_subject, display_name, role, lab_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'mira', 'Mira', 'owner', NULL),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'leon', 'Leon', 'lab', 'WB'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'nia', 'Nia', 'reviewer', NULL),
  ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'ravi', 'Ravi', 'admin', NULL),
  ('a0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'eve', 'Eve', 'lab', 'EB');
INSERT INTO procedure VALUES ('11111111-1111-1111-1111-111111111111', 'MAT-017', 'C', 'Thermal conditioning', NULL);
INSERT INTO requirement VALUES
  ('11111111-1111-1111-1111-111111111111', 'MAT-017', 'REQ-01', 'Conditioning temperature', 'atLeast', 'maxTemp', 180, '°C', true, '§4.2', 'Setpoint 180 °C'),
  ('11111111-1111-1111-1111-111111111111', 'MAT-017', 'REQ-03', 'Thickness', 'atMost', 'resolution', 0.01, 'mm', false, '§4.4', '0.01 mm or finer');
INSERT INTO equipment VALUES
  ('11111111-1111-1111-1111-111111111111', 'WB', 'TC-02', 'Chamber', 'Chamber'),
  ('11111111-1111-1111-1111-111111111111', 'WB', 'DG-06', 'Gauge', 'Gauge'),
  ('11111111-1111-1111-1111-111111111111', 'EB', 'EB-01', 'East oven', 'Oven'),
  ('22222222-2222-2222-2222-222222222222', 'ZZ', 'ZZ-01', 'Secret', 'Secret');
INSERT INTO capability VALUES ('11111111-1111-1111-1111-111111111111', 'TC-02', 'maxTemp', 150, '°C', 'Datasheet', 'a0000000-0000-0000-0000-000000000002', now());
INSERT INTO transfer VALUES ('11111111-1111-1111-1111-111111111111', 'TR-017', 'MAT-017', 'WB', '2026-11-16', 'a0000000-0000-0000-0000-000000000001');
INSERT INTO mapping VALUES ('11111111-1111-1111-1111-111111111111', 'TR-017', 'REQ-01', 'TC-02', 'a0000000-0000-0000-0000-000000000001'), ('11111111-1111-1111-1111-111111111111', 'TR-017', 'REQ-03', 'DG-06', 'a0000000-0000-0000-0000-000000000001');
INSERT INTO requirement_result (tenant_id, transfer_id, requirement_id, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TR-017', 'REQ-01', 'Capability mismatch'),
  ('11111111-1111-1111-1111-111111111111', 'TR-017', 'REQ-03', 'Capability unknown');
INSERT INTO lab_request VALUES ('11111111-1111-1111-1111-111111111111', 'R1', 'TR-017', 'WB', 'REQ-03', 'DG-06', 'Record capability value', false);

CREATE FUNCTION as_user(t text, u text, r text, lab text) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('app.tenant_id', t, false), set_config('app.user_id', u, false), set_config('app.role', r, false), set_config('app.lab_id', coalesce(lab, ''), false); $$;
CREATE FUNCTION expect(ok boolean, what text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF NOT ok THEN RAISE EXCEPTION 'FAILED: %', what; END IF; END $$;
CREATE FUNCTION expect_error(stmt text, pattern text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE stmt;
  RAISE EXCEPTION 'FAILED: expected an error matching "%" from: %', pattern, stmt;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'FAILED:%' OR SQLERRM NOT LIKE '%' || pattern || '%' THEN RAISE; END IF;
END $$;
SET ROLE benchrelay_app;

-- Tenant isolation
SELECT as_user('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'owner', NULL);
SELECT expect((SELECT count(*) FROM equipment) = 3, 'owner sees only own-tenant equipment');
SELECT expect_error($$INSERT INTO procedure VALUES ('22222222-2222-2222-2222-222222222222','X','A','x',NULL)$$, 'row-level security');

-- Lab scoping: West Bench sees its register and requests only, and no assessments
SELECT as_user('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'lab', 'WB');
SELECT expect((SELECT array_agg(equipment_id ORDER BY equipment_id) FROM equipment) = '{DG-06,TC-02}', 'lab sees its own equipment');
SELECT expect((SELECT count(*) FROM requirement_result) = 0, 'lab cannot read assessments');
SELECT expect((SELECT count(*) FROM lab_request) = 1, 'lab sees its request');
SELECT expect_error($$INSERT INTO capability VALUES ('11111111-1111-1111-1111-111111111111','EB-01','maxTemp',300,'°C','Datasheet',app_user(),now())$$, 'row-level security');
SELECT expect_error($$INSERT INTO capability VALUES ('11111111-1111-1111-1111-111111111111','DG-06','resolution',1,'µm','',app_user(),now())$$, 'capability_source_ref_check');
INSERT INTO capability VALUES ('11111111-1111-1111-1111-111111111111', 'DG-06', 'resolution', 1, 'µm', 'Datasheet DG-6', app_user(), now());
SELECT as_user('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000005', 'lab', 'EB');
SELECT expect((SELECT count(*) FROM lab_request) = 0, 'other lab does not see West Bench requests');

-- Only owners map; only labs record capabilities
SELECT as_user('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003', 'reviewer', NULL);
SELECT expect_error($$INSERT INTO mapping VALUES ('11111111-1111-1111-1111-111111111111','TR-017','REQ-02','TC-02',app_user())$$, 'row-level security');
SELECT expect_error($$INSERT INTO capability VALUES ('11111111-1111-1111-1111-111111111111','TC-02','uniformity',1.5,'°C','Datasheet',app_user(),now())$$, 'row-level security');

-- Readiness gate and independence
SELECT expect_error($$INSERT INTO readiness VALUES ('11111111-1111-1111-1111-111111111111','TR-017','Ready for comparative testing','Everything looks fine to me today.',app_user(),now())$$, 'not met');
SELECT as_user('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'owner', NULL);
INSERT INTO disposition VALUES ('11111111-1111-1111-1111-111111111111', 'TR-017', 'REQ-01', 'Accepted with compensating measure', 'Use the oven at another site for conditioning.', app_user(), NULL);
SELECT expect_error($$UPDATE disposition SET approved_by = app_user() WHERE requirement_id = 'REQ-01'$$, 'only an expert reviewer');
SELECT expect_error($$INSERT INTO readiness VALUES ('11111111-1111-1111-1111-111111111111','TR-017','Not ready','Prepared by me, but I think not ready.',app_user(),now())$$, 'only an expert reviewer');
SELECT as_user('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003', 'reviewer', NULL);
UPDATE disposition SET approved_by = app_user() WHERE requirement_id = 'REQ-01';
UPDATE requirement_result SET status = 'Meets requirement' WHERE requirement_id = 'REQ-03';
SELECT expect_error($$INSERT INTO readiness VALUES ('11111111-1111-1111-1111-111111111111','TR-017','Ready for comparative testing','Measure approved and gauge resolution recorded.',app_user(),now())$$, 'requests to the receiving lab are open');
UPDATE lab_request SET done = true;
INSERT INTO readiness VALUES ('11111111-1111-1111-1111-111111111111', 'TR-017', 'Ready for comparative testing', 'Measure approved and gauge resolution recorded.', app_user(), now());
SELECT expect((SELECT count(*) FROM readiness) = 1, 'readiness recorded');

-- Re-evaluation with the same result keeps readiness; a changed record revokes it
UPDATE requirement_result SET evaluated_at = now() WHERE requirement_id = 'REQ-03';
SELECT expect((SELECT count(*) FROM readiness) = 1, 'unchanged result keeps readiness');
SELECT as_user('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'lab', 'WB');
INSERT INTO calibration VALUES ('11111111-1111-1111-1111-111111111111', 'DG-06', 'CAL-DG06-27', '2026-10-20', '2027-10-20', NULL, app_user());
SELECT as_user('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003', 'reviewer', NULL);
SELECT expect((SELECT count(*) FROM readiness) = 0, 'a calibration change revokes readiness');

-- Audit
INSERT INTO audit_event (tenant_id, user_id, action, detail) VALUES (app_tenant(), app_user(), 'Readiness recorded', 'TR-017');
SELECT expect((SELECT count(*) FROM audit_event) = 0, 'reviewer cannot read audit');
SELECT as_user('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000004', 'admin', NULL);
SELECT expect((SELECT count(*) FROM audit_event) = 1, 'admin reads audit');
SELECT expect_error($$DELETE FROM audit_event$$, 'append-only');

SELECT 'ALL CHECKS PASSED' AS result;
