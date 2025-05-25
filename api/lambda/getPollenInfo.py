import json
import urllib.request
from datetime import date, timedelta
import boto3

codesPolluantsTranslationMapping = {
    24: 'graminées'
}
URL_POLLEN = "https://data.airpl.org/media/pollens/prevision_communale_Pays_de_la_Loire_"
s3 = boto3.client('s3')
bucket_name = "thomassed-repo-pollen"


def getS3PollenFiles():
    try:
        response = s3.list_objects_v2(Bucket=bucket_name)
        files = [obj['Key'] for obj in response.get('Contents', [])]
        return {
            "statusCode": 200,
            "body": {
                "files": files
            }
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": f"Erreur : {str(e)}"
        }

files = getS3PollenFiles()

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
    "code_gram": 'graminées',
    "code_arm": 'armoise',
    "code_ambr": 'ambroisie'
}

def get_pollen_data(date):
    """If data is already downloaded on s3, fetch it from there."""
    if date in files:
        return s3.get_object(Bucket=bucket_name, Key=date)['Body'].read().decode('utf-8')

    """Fetch pollen data for a specific date."""
    with urllib.request.urlopen(URL_POLLEN + date  + '.geojson') as response:
        raw = response.read().decode("utf-8")
        data = json.loads(raw)['features']
    # Save the data to S3
    s3.put_object(Bucket=bucket_name, Key=date, Body=json.dumps(data))
    
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

    pollenDataToday = get_pollen_data(date_du_jour)
    pollenDataTomorrow = get_pollen_data(date_du_lendemain)

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