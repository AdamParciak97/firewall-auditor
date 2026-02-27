import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

client = Anthropic()


def analyze_rules(rules: list) -> str:
    rules_json = json.dumps(rules, indent=2, ensure_ascii=False)
    today = datetime.now().strftime("%d.%m.%Y")

    prompt = f"""Jesteś ekspertem ds. bezpieczeństwa sieci i certyfikowanym inżynierem Palo Alto Networks.
Dzisiaj jest {today}. Użyj tej daty w raporcie.
W raporcie jako Analityk wpisz: "Adam Parciak"
Przeanalizuj poniższe reguły firewall...

Dla każdego problemu podaj:
- Nazwę reguły której dotyczy
- Opis problemu
- Poziom ryzyka: KRYTYCZNY / WYSOKI / ŚREDNI / NISKI
- Konkretną rekomendację jak to naprawić

Sprawdź w szczególności:
1. Reguły z source/destination/application ustawionym na "any"
2. Reguły bez logowania
3. Reguły z akcją "allow" bez określonej aplikacji
4. Kolejność reguł (shadowing)
5. Brakujące reguły deny na końcu
6. Niebezpieczne protokoły (Telnet, FTP, HTTP zamiast HTTPS)

Reguły firewall do analizy:
{rules_json}

Zakończ raport podsumowaniem z liczbą problemów według poziomu ryzyka oraz top 3 najważniejszymi działaniami do natychmiastowego podjęcia."""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=16200,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return message.content[0].text