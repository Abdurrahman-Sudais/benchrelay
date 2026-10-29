"""AI equipment-mapping suggestions (AWS Lambda + Amazon Bedrock).

Scope: for a requirement without a mapping, suggest which receiving-lab instrument may cover it.
Capability and calibration comparisons stay in evaluate_readiness.

Safeguards enforced in code:
  * Input minimisation: only the requirement text and equipment names/types are sent. Client, lab,
    people, serial numbers and tenant identifiers are rejected.
  * Evidence-bound output: each suggestion must name a supplied equipment id and quote text found
    verbatim in the requirement AND in that equipment's description. Anything else is discarded;
    malformed output yields nothing.
  * Suggestions are pending until the method owner confirms or dismisses them. Nothing here
    validates a method or qualifies an instrument.

Environment: BEDROCK_MODEL_ID, GUARDRAIL_ID (optional), GUARDRAIL_VERSION (optional).
"""
import json
import os

PROMPT_VERSION = "2026-10-v1"
FORBIDDEN_KEYS = {"client", "laboratory", "lab_name", "serial", "user", "email", "tenant_id"}

SYSTEM = (
    "You help a laboratory method owner. Given one requirement and a list of instruments, say which "
    "instrument may cover the requirement. Quote the exact words from the requirement and from the "
    "instrument description. Do not judge capability or validity. Output ONLY JSON matching the schema."
)
SCHEMA = {"suggestions": [{"equipment_id": "one of the supplied ids", "requirement_quote": "exact text", "equipment_quote": "exact text", "explanation": "one sentence"}]}


def check_input(req):
    bad = FORBIDDEN_KEYS.intersection(req)
    if bad:
        raise ValueError(f"forbidden keys in model input: {sorted(bad)}")
    if not isinstance(req.get("requirement"), str) or not isinstance(req.get("equipment"), list):
        raise ValueError("requirement must be a string and equipment a list")
    return {"requirement": req["requirement"], "equipment": [{"id": e["id"], "description": str(e["description"])} for e in req["equipment"]]}


def build_prompt(payload):
    return f"Input: {json.dumps(payload, ensure_ascii=False)}\nSchema: {json.dumps(SCHEMA)}"


def validate(draft, payload, limit=3):
    items = draft.get("suggestions") if isinstance(draft, dict) else None
    if not isinstance(items, list):
        return [], ["output is not {suggestions: [...]}"]
    known = {e["id"]: e["description"] for e in payload["equipment"]}
    kept, rejected = [], []
    for s in items[:limit]:
        if not isinstance(s, dict) or s.get("equipment_id") not in known:
            rejected.append("unknown equipment")
            continue
        rq, eq, why = s.get("requirement_quote"), s.get("equipment_quote"), str(s.get("explanation", "")).strip()
        if not rq or rq not in payload["requirement"]:
            rejected.append("requirement quote not found")
        elif not eq or eq not in known[s["equipment_id"]]:
            rejected.append("equipment quote not found")
        elif not why or len(why) > 300:
            rejected.append("missing or overlong explanation")
        else:
            kept.append({"equipment_id": s["equipment_id"], "requirement_quote": rq, "equipment_quote": eq, "explanation": why, "decision": "pending"})
    return kept, rejected


def lambda_handler(event, _context):  # pragma: no cover - needs AWS
    import boto3

    req = json.loads(event["body"]) if isinstance(event.get("body"), str) else event
    payload = check_input(req)
    params = {
        "modelId": os.environ["BEDROCK_MODEL_ID"],
        "system": [{"text": SYSTEM}],
        "messages": [{"role": "user", "content": [{"text": build_prompt(payload)}]}],
        "inferenceConfig": {"maxTokens": 500, "temperature": 0},
    }
    if os.environ.get("GUARDRAIL_ID"):
        params["guardrailConfig"] = {"guardrailIdentifier": os.environ["GUARDRAIL_ID"], "guardrailVersion": os.environ.get("GUARDRAIL_VERSION", "DRAFT")}
    text = boto3.client("bedrock-runtime").converse(**params)["output"]["message"]["content"][0]["text"]
    try:
        draft = json.loads(text)
    except json.JSONDecodeError:
        draft = None
    kept, rejected = validate(draft, payload)
    return {"suggestions": kept, "rejected": len(rejected), "model_id": params["modelId"], "prompt_version": PROMPT_VERSION}
