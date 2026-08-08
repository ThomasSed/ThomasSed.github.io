import json
import os
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta

import boto3
from botocore.exceptions import ClientError

URL_POLLEN = "https://admindata.atmo-france.org/api/v2/data/indices/pollens?format=geojson&date={date}&date_historique={date_historique}&code_zone={code_zone}&with_geom=false"
URL_ATMO_LOGIN = "https://admindata.atmo-france.org/api/login"
CODE_ZONE_PATTERN = re.compile(r"^\d{5}$")
DEFAULT_CITIES = {
    "paris": "75056",
    "nantes": "44109",
    "strasbourg": "67482",
    "marseille": "13055",
}

s3 = boto3.client("s3")
bucket_name = "thomassed-repo-pollen"

codesPolluantsTranslationMapping = {
    "code_qual": "qualité globale",
    "code_aul": "aulne",
    "code_boul": "bouleau",
    "code_oliv": "olivier",
    "code_gram": "graminées",
    "code_arm": "armoise",
    "code_ambr": "ambroisie",
}
concentrationMapping = {
    "conc_aul": "aulne",
    "conc_boul": "bouleau",
    "conc_oliv": "olivier",
    "conc_gram": "graminées",
    "conc_arm": "armoise",
    "conc_ambr": "ambroisie",
}


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body),
    }


def extract_pollen_info(pollen_data):
    """Extract the useful pollen indices from Atmo's GeoJSON features."""
    pollen_info = {}
    details = {}
    for feature in pollen_data:
        properties = feature.get("properties", {})
        for code, translation in codesPolluantsTranslationMapping.items():
            if code in properties:
                pollen_info[translation] = properties[code]
        concentrations = {
            translation: properties[code]
            for code, translation in concentrationMapping.items()
            if code in properties
        }
        details = {
            "qualité": properties.get("lib_qual"),
            "alerte": properties.get("alerte"),
            "date de mise à jour": properties.get("date_maj"),
            "date de diffusion": properties.get("date_dif"),
            "date d'échéance": properties.get("date_ech"),
            "pollens responsables": properties.get("pollen_resp"),
            "source": properties.get("source"),
            "concentrations": concentrations,
        }
    if details:
        pollen_info["_details"] = details
    return pollen_info


def get_atmo_token():
    username = os.environ.get("ATMO_USERNAME")
    password = os.environ.get("ATMO_PASSWORD")
    if not username or not password:
        raise RuntimeError("ATMO_USERNAME or ATMO_PASSWORD environment variables are not set")

    request = urllib.request.Request(
        URL_ATMO_LOGIN,
        data=json.dumps({"username": username, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json", "accept": "*/*"},
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8")).get("token")


def fetch_and_extract_pollen_data(code_zone, target_date, token):
    request = urllib.request.Request(
        URL_POLLEN.format(date=target_date, date_historique=target_date, code_zone=code_zone),
        headers={"Authorization": f"Bearer {token}", "accept": "application/json"},
    )
    with urllib.request.urlopen(request) as response:
        return extract_pollen_info(json.loads(response.read().decode("utf-8")).get("features", []))


def get_cached_data(cache_key):
    try:
        response = s3.get_object(Bucket=bucket_name, Key=cache_key)
        return json.loads(response["Body"].read().decode("utf-8"))
    except ClientError as error:
        if error.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def save_cached_data(cache_key, data):
    s3.put_object(Bucket=bucket_name, Key=cache_key, Body=json.dumps(data))


def lambda_handler(event, context):
    params = event.get("queryStringParameters") or {}
    code_zone = params.get("code_zone")
    if code_zone is not None and (not isinstance(code_zone, str) or not CODE_ZONE_PATTERN.fullmatch(code_zone)):
        return response(400, {"error": "Le paramètre code_zone doit être un code INSEE à 5 chiffres."})

    today = date.today()
    today_string = today.strftime("%Y-%m-%d")
    tomorrow_string = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    cache_key = (
        f"atmo_pollen_extracted_{today:%Y_%m_%d}_{code_zone}.json"
        if code_zone
        else f"atmo_pollen_extracted_{today:%Y_%m_%d}.json"
    )

    cached_data = get_cached_data(cache_key)
    if cached_data is not None:
        print("Using cached data")
        return response(200, cached_data)

    try:
        token = get_atmo_token()
        if code_zone:
            fresh_data = {
                "today": fetch_and_extract_pollen_data(code_zone, today_string, token),
                "tomorrow": fetch_and_extract_pollen_data(code_zone, tomorrow_string, token),
            }
        else:
            requests_to_fetch = {
                f"date_du_jour_{city}": (city_code, today_string)
                for city, city_code in DEFAULT_CITIES.items()
            }
            requests_to_fetch.update({
                f"date_du_lendemain_{city}": (city_code, tomorrow_string)
                for city, city_code in DEFAULT_CITIES.items()
            })
            fresh_data = {}
            with ThreadPoolExecutor(max_workers=len(requests_to_fetch)) as executor:
                futures = {
                    executor.submit(fetch_and_extract_pollen_data, city_code, target_date, token): key
                    for key, (city_code, target_date) in requests_to_fetch.items()
                }
                for future in as_completed(futures):
                    fresh_data[futures[future]] = future.result()
        save_cached_data(cache_key, fresh_data)
        return response(200, fresh_data)
    except Exception as error:
        print(f"Failed to fetch pollen data: {error}")
        return response(500, {"error": "Failed to fetch data from Atmo API"})
