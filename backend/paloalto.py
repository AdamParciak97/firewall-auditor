import requests
import os
import re
import urllib3
from dotenv import load_dotenv
import xml.etree.ElementTree as ET

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()

PA_HOST = os.getenv("PA_HOST")
PA_API_KEY = os.getenv("PA_API_KEY")


def get_firewall_rules():
    url = f"{PA_HOST}/api/"
    params = {
        "type": "config",
        "action": "get",
        "xpath": "/config/devices/entry/vsys/entry[@name='vsys1']/rulebase/security/rules",
        "key": PA_API_KEY
    }
    response = requests.get(url, params=params, verify=False)
    return parse_rules(response.text)


def parse_rules(xml_text):
    root = ET.fromstring(xml_text)
    rules = []

    for entry in root.findall(".//entry"):
        rule = {
            "name": entry.get("name"),
            "from": [m.text for m in entry.findall("./from/member")],
            "to": [m.text for m in entry.findall("./to/member")],
            "source": [m.text for m in entry.findall("./source/member")],
            "destination": [m.text for m in entry.findall("./destination/member")],
            "application": [m.text for m in entry.findall("./application/member")],
            "service": [m.text for m in entry.findall("./service/member")],
            "action": entry.findtext("./action"),
            "origin": "local"
        }
        rules.append(rule)

    return rules


def parse_operational_rules(text):
    rules = []

    # Podziel tekst na bloki reguł
    pattern = re.compile(r'"([^"]+)"(?:;\s*index:\s*\d+)?\s*\{([^}]+)\}', re.DOTALL)
    matches = pattern.findall(text)

    for name, body in matches:
        def get_field(field):
            match = re.search(rf'{field}\s+\[([^\]]+)\]', body)
            if match:
                return match.group(1).split()
            match = re.search(rf'{field}\s+([^;\n]+);', body)
            if match:
                val = match.group(1).strip()
                return [val] if val != "none" else []
            return []

        action_match = re.search(r'action\s+(\w+);', body)

        rule = {
            "name": name.strip(),
            "from": get_field("from"),
            "to": get_field("to"),
            "source": get_field("source"),
            "destination": get_field("destination"),
            "application": get_field("application/service"),
            "service": get_field("application/service"),
            "action": action_match.group(1) if action_match else None,
            "origin": "panorama"
        }
        rules.append(rule)

    return rules


def get_running_rules():
    url = f"{PA_HOST}/api/"
    response = requests.get(
        url,
        params={
            "type": "op",
            "cmd": "<show><running><security-policy></security-policy></running></show>",
            "key": PA_API_KEY
        },
        verify=False
    )
    return parse_operational_rules(response.text)


def get_all_rules():
    local_rules = get_firewall_rules()
    panorama_rules = get_running_rules()

    # Usuń duplikaty - reguły lokalne mogą się powtarzać w running
    local_names = {r["name"] for r in local_rules}
    unique_panorama = [r for r in panorama_rules if r["name"] not in local_names]

    return local_rules + unique_panorama
