import json
from typing import List, Optional, Union
import urllib.request

# Les champs de recherche disponible sont :
# - "code_no2" : qualificatif pour le sous-indice du polluant NO₂ ;
# - "code_o3" : qualificatif pour le sous-indice du polluantl’indice O₃ ;
# - "code_pm10" : qualificatif pour le sous-indice du polluant PM10 ;
# - "code_pm25" : qualificatif pour le sous-indice du polluant PM2,5 ;
# - "code_so2" : qualificatif pour le sous-indice du polluant l’indice SO₂ ;
# - "code_qual", qualificatif de l’indice ATMO ;
# - "code_zone", code commune ou EPCI selon l’INSEE ;
# - "date_ech", date de l’indice, au format international (YYYY-MM-DD) ;

type Response = dict[
    "count": int,
    "next": Optional[str],
    "previous": Optional[str],
    "results": List[dict[
        "id": int,
        "date_diffusion": str,
        "polluant": str,
        "seuil": str,
        "couleur": str,
        "param_persistance": Optional[str],
        "param_arrete_pref": Union[str, None],
        "param_arrete_min": Optional[str],
        "date_heure_debut": str,
        "date_heure_fin": str,
        "communique": Optional[str],
        "id_diffusion": int,
        "code_polluant": str,
        "param_seuil": int,
        "code_departement": str,
        "niveau": Optional[str]
    ]]
]

codesPolluantsTranslationMapping = {
    24: 'graminées'
}

TOKEN_SECRET = "mon_token_secret"
URL_POLLEN = "https://data.airpl.org/api/v1/alerte/description-alerte/?format=json&limit=50"

def get_pollen_data() -> Response:
    """Fetch pollen data for a specific pollen code."""
    with urllib.request.urlopen(URL_POLLEN) as response:
        raw = response.read().decode("utf-8")
        data = json.loads(raw)
    return data

def lambda_handler(event, context):
    params = event.get("queryStringParameters", {})
    if params.get("token") != TOKEN_SECRET:
        return {"statusCode": 403, "body": "Accès refusé"}

    pollenData = get_pollen_data()
    # filter data to get graminées
    graminees = [p for p in pollenData["results"] if p["code_polluant"] == "24"]
    # get results[0] 
    gramineesFirstResult = graminees[0]
    
    response_body = {
        "ville": "Nantes",
        "pollens": {
            "graminees": {
                "niveau": gramineesFirstResult["niveau"] if gramineesFirstResult else None,
                "date": gramineesFirstResult["date_heure_debut"] if gramineesFirstResult else None,
                "communique": gramineesFirstResult["communique"] if gramineesFirstResult else None
            }
        }
    }

    return {
        "statusCode": 200,
        "body": json.dumps(response_body)
    }
