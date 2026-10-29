"""Deterministic readiness evaluation (AWS Lambda).

Same rules as the prototype engine (src/app/engine.js). Both are tested against
backend/tests/fixtures/cases.json so they cannot drift apart silently.

Input:  {"requirement": {...}, "equipment": {...} | null, "context": {"transferDate", "marginDays"}}
Output: {"status", "findings": [{"kind", "detail"}]}

No AI is involved, and nothing here validates a method or qualifies an instrument.
"""
import json
from datetime import date, timedelta

UNITS = {
    "°C": ("temperature", 1),
    "mm": ("length", 1), "µm": ("length", 0.001), "um": ("length", 0.001),
    "s": ("time", 1), "ms": ("time", 0.001), "min": ("time", 60),
    "g": ("mass", 1), "mg": ("mass", 0.001), "kg": ("mass", 1000),
    "%RH": ("humidity", 1),
}
ORDER = ["Capability mismatch", "Unit mismatch", "Calibration due too soon", "Calibration record missing", "Capability unknown"]


def to_base(q):
    if q["unit"] not in UNITS:
        raise ValueError(f"unknown unit {q['unit']}")
    dimension, factor = UNITS[q["unit"]]
    return round(q["value"] * factor, 9), dimension


def add_days(iso, n):
    return (date.fromisoformat(iso) + timedelta(days=n)).isoformat()


def evaluate(req, eq, ctx):
    findings = []

    def add(kind, detail):
        findings.append({"kind": kind, "detail": detail})

    if not eq:
        add("No equipment mapped", "No receiving-lab equipment is mapped.")
        return {"status": "No equipment mapped", "findings": findings}
    if req["kind"] != "record":
        cap = (eq.get("capabilities") or {}).get(req["parameter"])
        if not cap:
            add("Capability unknown", "No recorded value.")
        else:
            need, need_dim = to_base(req["required"])
            have, have_dim = to_base(cap)
            if need_dim != have_dim:
                add("Unit mismatch", f"Recorded in {cap['unit']}, required in {req['required']['unit']}.")
            elif req["kind"] == "atLeast" and have < need:
                add("Capability mismatch", f"Reaches {cap['value']} {cap['unit']}.")
            elif req["kind"] == "atMost" and have > need:
                add("Capability mismatch", f"Records {cap['value']} {cap['unit']}.")
    if req["kind"] == "record" or req.get("calibrated"):
        cal = eq.get("calibration")
        until = add_days(ctx["transferDate"], ctx["marginDays"])
        if not cal:
            add("Calibration record missing", "No calibration record.")
        elif cal["due"] < until:
            add("Calibration due too soon", f"Due {cal['due']}; must stay valid until {until}.")
    if not findings:
        return {"status": "Meets requirement", "findings": findings}
    worst = next(k for k in ORDER if any(f["kind"] == k for f in findings))
    status = "Capability unknown" if worst == "Capability unknown" else "Calibration issue" if worst.startswith("Calibration") else "Capability mismatch"
    return {"status": status, "findings": findings}


def lambda_handler(event, _context):
    body = json.loads(event["body"]) if isinstance(event.get("body"), str) else event
    return evaluate(body["requirement"], body.get("equipment"), body["context"])
