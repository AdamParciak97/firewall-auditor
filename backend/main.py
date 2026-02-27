from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from paloalto import get_all_rules
from analyzer import analyze_rules
from datetime import datetime

app = FastAPI(title="Firewall Auditor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "Firewall Auditor API działa!"}

@app.get("/rules")
def fetch_rules():
    try:
        rules = get_all_rules()
        return {"count": len(rules), "rules": rules}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audit")
def run_audit():
    try:
        rules = get_all_rules()
        report = analyze_rules(rules)
        return {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "rules_count": len(rules),
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rules/stats")
def get_rules_stats():
    try:
        rules = get_all_rules()

        any_source = sum(1 for r in rules if "any" in r.get("source", []))
        any_dest = sum(1 for r in rules if "any" in r.get("destination", []))
        any_app = sum(1 for r in rules if "any" in r.get("application", []))
        allow_rules = sum(1 for r in rules if r.get("action") == "allow")
        deny_rules = sum(1 for r in rules if r.get("action") == "deny")

        return {
            "total": len(rules),
            "allow": allow_rules,
            "deny": deny_rules,
            "any_source": any_source,
            "any_destination": any_dest,
            "any_application": any_app,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
