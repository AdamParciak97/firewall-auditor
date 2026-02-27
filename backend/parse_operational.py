import re


def parse_operational_rules(text):
    rules = []
    # Podziel na bloki reguł - każda zaczyna się od nazwy w cudzysłowie lub bez
    blocks = re.split(r'\n(?="|\w[^{]*{)', text)

    for block in blocks:
        if '{' not in block:
            continue

        # Pobierz nazwę reguły
        name_match = re.match(r'^"?([^";{]+)"?\s*;?\s*(?:index:\s*\d+)?\s*"?\s*\{', block.strip())
        if not name_match:
            continue
        name = name_match.group(1).strip()

        def get_field(field):
            match = re.search(rf'{field}\s+\[([^\]]+)\]|{field}\s+([^;\n]+);', block)
            if match:
                val = match.group(1) or match.group(2)
                return [v.strip() for v in val.split()]
            return []

        rule = {
            "name": name,
            "from": get_field("from"),
            "to": get_field("to"),
            "source": get_field("source"),
            "destination": get_field("destination"),
            "application": get_field("application/service"),
            "service": get_field("application/service"),
            "action": (re.search(r'action\s+(\w+);', block) or [None, None])[1],
            "source": "panorama"
        }
        rules.append(rule)

    return rules
