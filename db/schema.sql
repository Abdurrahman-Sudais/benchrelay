-- Benchrelay PostgreSQL schema (Amazon RDS for PostgreSQL), matching the proposed architecture on the website.
-- Design goals: tenant isolation and receiving-lab scoping through row-level security, values that carry
-- their source, independent expert readiness enforced in the database, and an append-only audit log.
-- Verified locally with PostgreSQL 16 by db/test_rls.sql (see README). Not deployed anywhere.
--
-- The API sets these per transaction (SET LOCAL) from the verified JWT:
--   app.tenant_id, app.user_id, app.role ('owner' | 'lab' | 'reviewer' | 'admin'), app.lab_id (lab users)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION app_tenant() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.tenant_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION app_user() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION app_role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('app.role', true) $$;
CREATE OR REPLACE FUNCTION app_lab() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.lab_id', true), '') $$;

CREATE TABLE tenant (
  tenant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calibration_margin_days int NOT NULL DEFAULT 30 CHECK (calibration_margin_days BETWEEN 0 AND 180),
  ai_suggestions boolean NOT NULL DEFAULT true
);

CREATE TYPE user_role AS ENUM ('owner', 'lab', 'reviewer', 'admin');
CREATE TABLE laboratory (
  tenant_id uuid NOT NULL REFERENCES tenant ON DELETE CASCADE,
  lab_id text NOT NULL,
  name text NOT NULL,
  PRIMARY KEY (tenant_id, lab_id)
);
CREATE TABLE app_user (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenant ON DELETE CASCADE,
  idp_subject text NOT NULL,
  display_name text NOT NULL,
  role user_role NOT NULL,
  lab_id text,
  CHECK ((role = 'lab') = (lab_id IS NOT NULL)),
  UNIQUE (tenant_id, idp_subject)
);

CREATE TYPE unit_dim AS ENUM ('temperature', 'length', 'time', 'mass', 'humidity');
CREATE TABLE unit (
  unit text PRIMARY KEY,
  dimension unit_dim NOT NULL,
  factor numeric NOT NULL CHECK (factor > 0)
);
INSERT INTO unit VALUES ('°C','temperature',1), ('mm','length',1), ('µm','length',0.001), ('s','time',1), ('ms','time',0.001), ('min','time',60), ('g','mass',1), ('mg','mass',0.001), ('kg','mass',1000), ('%RH','humidity',1);

CREATE TABLE procedure (
  tenant_id uuid NOT NULL REFERENCES tenant ON DELETE CASCADE,
  procedure_id text NOT NULL,
  rev text NOT NULL,
  title text NOT NULL,
  source_s3_key text,
  PRIMARY KEY (tenant_id, procedure_id)
);
CREATE TABLE requirement (
  tenant_id uuid NOT NULL,
  procedure_id text NOT NULL,
  requirement_id text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('atLeast', 'atMost', 'record')),
  parameter text,
  required_value numeric,
  required_unit text REFERENCES unit,
  calibrated boolean NOT NULL DEFAULT false,
  reference text NOT NULL,
  excerpt text NOT NULL,
  CHECK ((kind = 'record') = (parameter IS NULL AND required_value IS NULL AND required_unit IS NULL)),
  PRIMARY KEY (tenant_id, procedure_id, requirement_id),
  FOREIGN KEY (tenant_id, procedure_id) REFERENCES procedure ON DELETE CASCADE
);

CREATE TABLE equipment (
  tenant_id uuid NOT NULL,
  lab_id text NOT NULL,
  equipment_id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  PRIMARY KEY (tenant_id, equipment_id),
  FOREIGN KEY (tenant_id, lab_id) REFERENCES laboratory
);
-- Every capability value carries its source; there is no value without provenance.
CREATE TABLE capability (
  tenant_id uuid NOT NULL,
  equipment_id text NOT NULL,
  parameter text NOT NULL,
  value numeric NOT NULL CHECK (value > 0),
  unit text NOT NULL REFERENCES unit,
  source_ref text NOT NULL CHECK (length(trim(source_ref)) >= 3),
  recorded_by uuid NOT NULL REFERENCES app_user,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, equipment_id, parameter),
  FOREIGN KEY (tenant_id, equipment_id) REFERENCES equipment ON DELETE CASCADE
);
CREATE TABLE calibration (
  tenant_id uuid NOT NULL,
  equipment_id text NOT NULL,
  certificate_ref text NOT NULL,
  calibrated_on date NOT NULL,
  due date NOT NULL CHECK (due > calibrated_on),
  certificate_s3_key text,
  recorded_by uuid NOT NULL REFERENCES app_user,
  PRIMARY KEY (tenant_id, equipment_id),
  FOREIGN KEY (tenant_id, equipment_id) REFERENCES equipment ON DELETE CASCADE
);

CREATE TABLE transfer (
  tenant_id uuid NOT NULL,
  transfer_id text NOT NULL,
  procedure_id text NOT NULL,
  lab_id text NOT NULL,
  planned_date date NOT NULL,
  owner_id uuid NOT NULL REFERENCES app_user,
  PRIMARY KEY (tenant_id, transfer_id),
  FOREIGN KEY (tenant_id, procedure_id) REFERENCES procedure,
  FOREIGN KEY (tenant_id, lab_id) REFERENCES laboratory
);
CREATE TABLE mapping (
  tenant_id uuid NOT NULL,
  transfer_id text NOT NULL,
  requirement_id text NOT NULL,
  equipment_id text NOT NULL,
  confirmed_by uuid NOT NULL REFERENCES app_user,
  PRIMARY KEY (tenant_id, transfer_id, requirement_id),
  FOREIGN KEY (tenant_id, transfer_id) REFERENCES transfer ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, equipment_id) REFERENCES equipment
);
-- Written by the evaluate_readiness Lambda after every relevant change.
CREATE TABLE requirement_result (
  tenant_id uuid NOT NULL,
  transfer_id text NOT NULL,
  requirement_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('Meets requirement', 'Capability mismatch', 'Capability unknown', 'Calibration issue', 'No equipment mapped', 'Mapping unconfirmed')),
  findings jsonb NOT NULL DEFAULT '[]',
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, transfer_id, requirement_id),
  FOREIGN KEY (tenant_id, transfer_id) REFERENCES transfer ON DELETE CASCADE
);
CREATE TABLE lab_request (
  tenant_id uuid NOT NULL,
  request_id text NOT NULL,
  transfer_id text NOT NULL,
  lab_id text NOT NULL,
  requirement_id text NOT NULL,
  equipment_id text,
  kind text NOT NULL CHECK (kind IN ('Record capability value', 'Upload calibration record', 'Confirm equipment availability')),
  done boolean NOT NULL DEFAULT false,
  PRIMARY KEY (tenant_id, request_id),
  FOREIGN KEY (tenant_id, transfer_id) REFERENCES transfer ON DELETE CASCADE
);
CREATE TABLE disposition (
  tenant_id uuid NOT NULL,
  transfer_id text NOT NULL,
  requirement_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('Accepted with compensating measure', 'Action planned')),
  note text NOT NULL CHECK (length(trim(note)) >= 15),
  proposed_by uuid NOT NULL REFERENCES app_user,
  approved_by uuid REFERENCES app_user,
  CHECK (approved_by IS NULL OR type = 'Accepted with compensating measure'),
  CHECK (approved_by IS NULL OR approved_by <> proposed_by),
  PRIMARY KEY (tenant_id, transfer_id, requirement_id),
  FOREIGN KEY (tenant_id, transfer_id) REFERENCES transfer ON DELETE CASCADE
);
CREATE TABLE readiness (
  tenant_id uuid NOT NULL,
  transfer_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('Ready for comparative testing', 'Not ready')),
  rationale text NOT NULL CHECK (length(trim(rationale)) >= 20),
  decided_by uuid NOT NULL REFERENCES app_user,
  decided_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, transfer_id),
  FOREIGN KEY (tenant_id, transfer_id) REFERENCES transfer ON DELETE CASCADE
);
CREATE TABLE audit_event (
  event_id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  action text NOT NULL,
  detail text NOT NULL
);

-- Independence and the readiness gate (mirrors approveMeasure, recordReadiness and readinessBlockers).
CREATE OR REPLACE FUNCTION check_reviewer(uid uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_user WHERE user_id = uid AND role = 'reviewer') THEN
    RAISE EXCEPTION 'only an expert reviewer may do this'; END IF;
END $$;

CREATE OR REPLACE FUNCTION check_disposition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.approved_by IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.approved_by IS DISTINCT FROM NEW.approved_by) THEN
    PERFORM check_reviewer(NEW.approved_by);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER disposition_reviewer BEFORE INSERT OR UPDATE ON disposition FOR EACH ROW EXECUTE FUNCTION check_disposition();

CREATE OR REPLACE FUNCTION check_readiness() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner uuid;
BEGIN
  PERFORM check_reviewer(NEW.decided_by);
  SELECT owner_id INTO owner FROM transfer WHERE tenant_id = NEW.tenant_id AND transfer_id = NEW.transfer_id;
  IF owner = NEW.decided_by THEN RAISE EXCEPTION 'the method owner cannot record readiness'; END IF;
  IF NEW.decision = 'Ready for comparative testing' THEN
    IF EXISTS (SELECT 1 FROM requirement_result r WHERE r.tenant_id = NEW.tenant_id AND r.transfer_id = NEW.transfer_id AND r.status <> 'Meets requirement'
                 AND NOT EXISTS (SELECT 1 FROM disposition d WHERE d.tenant_id = r.tenant_id AND d.transfer_id = r.transfer_id AND d.requirement_id = r.requirement_id
                                 AND d.type = 'Accepted with compensating measure' AND d.approved_by IS NOT NULL)) THEN
      RAISE EXCEPTION 'requirements are not met or covered by an approved measure'; END IF;
    IF EXISTS (SELECT 1 FROM lab_request WHERE tenant_id = NEW.tenant_id AND transfer_id = NEW.transfer_id AND NOT done) THEN
      RAISE EXCEPTION 'requests to the receiving lab are open'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER readiness_gate BEFORE INSERT OR UPDATE ON readiness FOR EACH ROW EXECUTE FUNCTION check_readiness();

-- Any change to the facts behind a transfer removes recorded readiness (the API also logs it).
CREATE OR REPLACE FUNCTION revoke_readiness() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  r := coalesce(NEW, OLD);
  IF TG_TABLE_NAME IN ('mapping', 'disposition', 'requirement_result') THEN
    DELETE FROM readiness WHERE tenant_id = r.tenant_id AND transfer_id = r.transfer_id;
  ELSE -- capability or calibration: every transfer that maps this equipment
    DELETE FROM readiness x USING mapping m
     WHERE x.tenant_id = m.tenant_id AND x.transfer_id = m.transfer_id AND m.tenant_id = r.tenant_id AND m.equipment_id = r.equipment_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER mapping_revokes AFTER INSERT OR UPDATE OR DELETE ON mapping FOR EACH ROW EXECUTE FUNCTION revoke_readiness();
CREATE TRIGGER disposition_revokes AFTER INSERT OR DELETE ON disposition FOR EACH ROW EXECUTE FUNCTION revoke_readiness();
CREATE TRIGGER capability_revokes AFTER INSERT OR UPDATE OR DELETE ON capability FOR EACH ROW EXECUTE FUNCTION revoke_readiness();
CREATE TRIGGER calibration_revokes AFTER INSERT OR UPDATE OR DELETE ON calibration FOR EACH ROW EXECUTE FUNCTION revoke_readiness();
-- Re-evaluation only revokes when a result actually changes.
CREATE TRIGGER result_change_revokes AFTER UPDATE ON requirement_result FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION revoke_readiness();

CREATE OR REPLACE FUNCTION audit_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'audit_event is append-only'; END $$;
CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON audit_event FOR EACH ROW EXECUTE FUNCTION audit_append_only();

-- Row-level security. FORCE applies it to the table owner too.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['laboratory','app_user','procedure','requirement','equipment','capability','calibration','transfer','mapping','requirement_result','lab_request','disposition','readiness','audit_event'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (tenant_id = app_tenant()) WITH CHECK (tenant_id = app_tenant())', t);
  END LOOP;
END $$;

-- Restrictive policies narrow tenant_isolation.
-- Lab users see and edit only their own laboratory's register and requests.
CREATE POLICY lab_equipment ON equipment AS RESTRICTIVE USING (app_role() <> 'lab' OR lab_id = app_lab());
CREATE POLICY lab_capability ON capability AS RESTRICTIVE USING (app_role() <> 'lab' OR EXISTS (SELECT 1 FROM equipment e WHERE e.tenant_id = capability.tenant_id AND e.equipment_id = capability.equipment_id AND e.lab_id = app_lab()));
CREATE POLICY lab_calibration ON calibration AS RESTRICTIVE USING (app_role() <> 'lab' OR EXISTS (SELECT 1 FROM equipment e WHERE e.tenant_id = calibration.tenant_id AND e.equipment_id = calibration.equipment_id AND e.lab_id = app_lab()));
CREATE POLICY lab_requests ON lab_request AS RESTRICTIVE USING (app_role() <> 'lab' OR lab_id = app_lab());
-- Only lab users write capability and calibration records.
CREATE POLICY capability_writers ON capability AS RESTRICTIVE FOR INSERT WITH CHECK (app_role() = 'lab');
CREATE POLICY calibration_writers ON calibration AS RESTRICTIVE FOR INSERT WITH CHECK (app_role() = 'lab');
-- Lab users do not see transfer assessments, dispositions or readiness.
CREATE POLICY no_lab_results ON requirement_result AS RESTRICTIVE FOR SELECT USING (app_role() <> 'lab');
CREATE POLICY no_lab_dispositions ON disposition AS RESTRICTIVE FOR SELECT USING (app_role() <> 'lab');
-- Only owners map requirements.
CREATE POLICY owner_mapping ON mapping AS RESTRICTIVE FOR INSERT WITH CHECK (app_role() = 'owner');
-- Only admins read the audit log; everyone may append.
CREATE POLICY audit_read ON audit_event AS RESTRICTIVE FOR SELECT USING (app_role() = 'admin');
