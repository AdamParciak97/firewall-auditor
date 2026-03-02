def calculate_score(rules):
    score = 100
    findings = []
    mitre = []

    for rule in rules:
        name = rule.get("name", "")
        source = rule.get("source", [])
        destination = rule.get("destination", [])
        application = rule.get("application", [])
        action = rule.get("action", "")
        frm = rule.get("from", [])

        # ALLOW ANY ANY ANY - krytyczne
        if (action == "allow" and "any" in source and
                "any" in destination and "any" in application):
            score -= 25
            findings.append({
                "rule": name,
                "issue": "Reguła ALLOW ANY ANY — pełny dostęp bez ograniczeń",
                "severity": "KRYTYCZNY",
                "points": -25
            })
            mitre.append({
                "rule": name,
                "tactic": "Initial Access",
                "technique": "T1190 — Exploit Public-Facing Application",
                "description": "Brak ograniczeń aplikacji umożliwia eksploatację dowolnej usługi"
            })
            mitre.append({
                "rule": name,
                "tactic": "Lateral Movement",
                "technique": "T1021 — Remote Services",
                "description": "Nieograniczony ruch między strefami umożliwia poruszanie się po sieci"
            })

        else:
            # Source ANY
            if action == "allow" and "any" in source:
                score -= 10
                findings.append({
                    "rule": name,
                    "issue": "Source ustawiony na ANY — dowolny host może inicjować ruch",
                    "severity": "WYSOKI",
                    "points": -10
                })
                mitre.append({
                    "rule": name,
                    "tactic": "Discovery",
                    "technique": "T1046 — Network Service Discovery",
                    "description": "Brak ograniczenia źródła umożliwia skanowanie sieci"
                })

            # Destination ANY
            if action == "allow" and "any" in destination:
                score -= 8
                findings.append({
                    "rule": name,
                    "issue": "Destination ustawiony na ANY — ruch do dowolnego celu",
                    "severity": "WYSOKI",
                    "points": -8
                })
                mitre.append({
                    "rule": name,
                    "tactic": "Exfiltration",
                    "technique": "T1041 — Exfiltration Over C2 Channel",
                    "description": "Brak ograniczenia celu umożliwia eksfiltrację danych"
                })

            # Application ANY
            if action == "allow" and "any" in application:
                score -= 7
                findings.append({
                    "rule": name,
                    "issue": "Aplikacja ustawiona na ANY — brak kontroli App-ID",
                    "severity": "ŚREDNI",
                    "points": -7
                })
                mitre.append({
                    "rule": name,
                    "tactic": "Command and Control",
                    "technique": "T1071 — Application Layer Protocol",
                    "description": "Brak kontroli aplikacji umożliwia użycie niestandardowych protokołów C2"
                })

        # Strefa MGMT w regułach
        if ("MGMT" in frm or "MGMT_ZONE" in frm) and action == "allow" and "any" in destination:
            score -= 15
            findings.append({
                "rule": name,
                "issue": "Ruch ze strefy MGMT do ANY — strefa zarządzania powinna być izolowana",
                "severity": "KRYTYCZNY",
                "points": -15
            })
            mitre.append({
                "rule": name,
                "tactic": "Privilege Escalation",
                "technique": "T1078 — Valid Accounts",
                "description": "Kompromitacja strefy MGMT daje pełny dostęp do infrastruktury"
            })

    # Ogranicz score do 0-100
    score = max(0, min(100, score))

    # Ocena słowna
    if score >= 80:
        grade = "Dobry"
        color = "green"
    elif score >= 60:
        grade = "Wymaga poprawy"
        color = "yellow"
    elif score >= 40:
        grade = "Słaby"
        color = "orange"
    else:
        grade = "Krytyczny"
        color = "red"

    return {
        "score": score,
        "grade": grade,
        "color": color,
        "findings": findings,
        "mitre": mitre,
        "summary": {
            "critical": sum(1 for f in findings if f["severity"] == "KRYTYCZNY"),
            "high": sum(1 for f in findings if f["severity"] == "WYSOKI"),
            "medium": sum(1 for f in findings if f["severity"] == "ŚREDNI"),
        }
    }
