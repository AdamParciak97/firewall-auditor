from paloalto import get_firewall_rules
from analyzer import analyze_rules
from datetime import datetime

print("Pobieranie reguł z Palo Alto...")
rules = get_firewall_rules()
print(f"Pobrano {len(rules)} reguł. Analizuję...\n")

report = analyze_rules(rules)
print(report)

# Zapis do pliku
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
filename = f"raport_{timestamp}.txt"
with open(filename, "w", encoding="utf-8") as f:
    f.write(f"Raport bezpieczeństwa Firewall\n")
    f.write(f"Wygenerowano: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    f.write(f"Liczba analizowanych reguł: {len(rules)}\n")
    f.write("="*60 + "\n\n")
    f.write(report)

print(f"\n✅ Raport zapisany do pliku: {filename}")
