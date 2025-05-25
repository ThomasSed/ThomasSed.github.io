import json
import urllib.request
from datetime import date, timedelta

codesPolluantsTranslationMapping = {
    24: 'graminées'
}
URL_POLLEN = "https://data.airpl.org/media/pollens/prevision_communale_Pays_de_la_Loire_"


# Date du jour
aujourd_hui = date.today()
date_du_jour = aujourd_hui.strftime("%Y_%m_%d")

# Date du lendemain
lendemain = aujourd_hui + timedelta(days=1)
date_du_lendemain = lendemain.strftime("%Y_%m_%d")

codesPolluantsTranslationMapping = {
    "code_qual": 'qualité globale',
    "code_aul": 'aulne',
    "code_boul": 'bouleau',
    "code_oliv": 'olivier',
    "code_gram": 'graminees',
    "code_arm": 'armoise',
    "code_ambr": 'ambroisie'
}

def get_pollen_data(date):
    """Fetch pollen data for a specific date."""
    with urllib.request.urlopen(URL_POLLEN + date  + '.geojson') as response:
        raw = response.read().decode("utf-8")
        data = json.loads(raw)['features']
    return data

def extract_pollen_info(pollen_data):
    """Extract pollen information from the data."""
    pollen_info = {}
    for feature in pollen_data:
        properties = feature["properties"]
        for code, translation in codesPolluantsTranslationMapping.items():
            if code in properties:
                pollen_info[translation] = properties[code]
    return pollen_info
def lambda_handler(event, context):
    print("Starting lambda_handler")

    pollenDataToday = get_pollen_data(date_du_jour)
    pollenDataTomorrow = get_pollen_data(date_du_lendemain)

    print("passed get_pollen_data")


    pollen_info_today = extract_pollen_info(pollenDataToday)
    pollen_info_tomorrow = extract_pollen_info(pollenDataTomorrow)

    response_body = {
        "ville": "Nantes",
        "pollens": {
            "aujourd_hui": pollen_info_today,
            "demain": pollen_info_tomorrow
        }
    }

    return {
        "statusCode": 200,
        "body": json.dumps(response_body)
    }