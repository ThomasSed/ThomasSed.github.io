import json
from typing import List, Optional, Union
import urllib.request

codesPolluantsTranslationMapping = {
    24: 'graminées'
}
URL_POLLEN = "https://data.airpl.org/api/v1/alerte/description-alerte/?format=json&limit=50"

def lambda_handler(event, context):
    def get_pollen_data():
        """Fetch pollen data for a specific pollen code."""
        with urllib.request.urlopen(URL_POLLEN) as response:
            raw = response.read().decode("utf-8")
            data = json.loads(raw)
        return data

    pollenData = get_pollen_data()
    # filter data to get graminées
    graminees = [p for p in pollenData["results"] if p["code_polluant"] == "24" and p["code_departement"] == "44"]
    # get results[0] 
    gramineesFirstResult = graminees[0]

    response_body = {
        "ville": "Nantes",
        "pollens": {
            "graminees": {
                "seuil": gramineesFirstResult["seuil"] if gramineesFirstResult else None,
                "param_seuil": gramineesFirstResult["param_seuil"] if gramineesFirstResult else None,
                "date": gramineesFirstResult["date_heure_debut"] if gramineesFirstResult else None,
                "communique": gramineesFirstResult["communique"] if gramineesFirstResult else None
            }
        }
    }

    return {
        "statusCode": 200,
        "body": json.dumps(response_body)
    }
