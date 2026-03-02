from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from paloalto import get_all_rules
from analyzer import analyze_rules
from scoring import calculate_score
from database import save_audit, get_all_audits, get_audit_by_id
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
        score_data = calculate_score(rules)

        audit_id = save_audit(
            rules_count=len(rules),
            score_data=score_data,
            report_text=report
        )

        return {
            "id": audit_id,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "rules_count": len(rules),
            "report": report,
            "score": score_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/audits")
def list_audits():
    try:
        audits = get_all_audits()
        return [
            {
                "id": a.id,
                "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "rules_count": a.rules_count,
                "score": a.score,
                "grade": a.grade,
                "critical": a.critical,
                "high": a.high,
                "medium": a.medium,
            }
            for a in audits
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/audits/{audit_id}")
def get_audit(audit_id: int):
    try:
        audit = get_audit_by_id(audit_id)
        if not audit:
            raise HTTPException(status_code=404, detail="Audyt nie znaleziony")
        return {
            "id": audit.id,
            "timestamp": audit.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "rules_count": audit.rules_count,
            "score": audit.score,
            "grade": audit.grade,
            "critical": audit.critical,
            "high": audit.high,
            "medium": audit.medium,
            "report": audit.report,
        }
    except HTTPException:
        raise
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


@app.get("/score")
def get_security_score():
    try:
        rules = get_all_rules()
        score = calculate_score(rules)
        return score
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
