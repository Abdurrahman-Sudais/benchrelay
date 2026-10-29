"""Run from the repository root: python3 backend/tests/test_lambdas.py (standard library only)."""
import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "backend" / "lambdas" / name / "handler.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


evaluate_readiness = load("evaluate_readiness")
suggest_mappings = load("suggest_mappings")
FX = json.loads((ROOT / "backend" / "tests" / "fixtures" / "cases.json").read_text())


class EvaluateReadinessTest(unittest.TestCase):
    def test_shared_fixtures_match_prototype_engine(self):
        for c in FX["cases"]:
            with self.subTest(c["name"]):
                req = {"calibrated": False, **c["req"]}
                out = evaluate_readiness.evaluate(req, c["eq"], FX["context"])
                self.assertEqual(out["status"], c["status"])
                self.assertEqual([f["kind"] for f in out["findings"]], c["kinds"])

    def test_units_and_handler(self):
        self.assertEqual(evaluate_readiness.to_base({"value": 10, "unit": "µm"}), (0.01, "length"))
        with self.assertRaises(ValueError):
            evaluate_readiness.to_base({"value": 1, "unit": "furlong"})
        out = evaluate_readiness.lambda_handler({"body": json.dumps({"requirement": {"kind": "record"}, "equipment": None, "context": FX["context"]})}, None)
        self.assertEqual(out["status"], "No equipment mapped")


class SuggestMappingsTest(unittest.TestCase):
    payload = {"requirement": "Cool specimens in a desiccator before thickness measurement.", "equipment": [{"id": "DS-11", "description": "Glass desiccator for cooling specimens"}, {"id": "TM-03", "description": "Laboratory timer"}]}

    def test_rejects_identifying_input(self):
        with self.assertRaises(ValueError):
            suggest_mappings.check_input({**self.payload, "client": "Acme"})

    def test_keeps_only_evidence_bound_suggestions(self):
        p = suggest_mappings.check_input(self.payload)
        draft = {"suggestions": [
            {"equipment_id": "DS-11", "requirement_quote": "in a desiccator", "equipment_quote": "Glass desiccator", "explanation": "Both name a desiccator."},
            {"equipment_id": "OV-99", "requirement_quote": "in a desiccator", "equipment_quote": "Glass desiccator", "explanation": "Unknown id."},
            {"equipment_id": "TM-03", "requirement_quote": "in a desiccator", "equipment_quote": "Glass desiccator", "explanation": "Quote not in TM-03."},
        ]}
        kept, rejected = suggest_mappings.validate(draft, p)
        self.assertEqual([k["equipment_id"] for k in kept], ["DS-11"])
        self.assertEqual(kept[0]["decision"], "pending")
        self.assertEqual(len(rejected), 2)

    def test_fails_closed(self):
        p = suggest_mappings.check_input(self.payload)
        self.assertEqual(suggest_mappings.validate(None, p)[0], [])
        self.assertEqual(suggest_mappings.validate({"suggestions": 1}, p)[0], [])


if __name__ == "__main__":
    unittest.main()
