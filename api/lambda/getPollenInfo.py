import json
import os
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta

import boto3
from botocore.exceptions import ClientError

URL_POLLEN = "https://admindata.atmo-france.org/api/v2/data/indices/pollens?format=geojson&date={date}&date_historique={date_historique}&code_zone={code_zone}&with_geom=false"
URL_AIR_QUALITY = "https://admindata.atmo-france.org/api/v2/data/indices/atmo?format=geojson&date={date}&date_historique={date_historique}&code_zone={code_zone}&with_geom=false"
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
airPollutantsMapping = {
    "code_pm25": "PM2,5",
    "code_pm10": "PM10",
    "code_no2": "NO₂",
    "code_o3": "O₃",
    "code_so2": "SO₂",
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


def extract_air_quality_info(air_data):
    """Extract the ATMO index and the five regulatory pollutant sub-indices."""
    air_info = {}
    details = {}
    for feature in air_data:
        properties = feature.get("properties", {})
        if "code_qual" in properties:
            air_info["qualité globale"] = properties["code_qual"]
        for code, label in airPollutantsMapping.items():
            if code in properties:
                air_info[label] = properties[code]
        details = {
            "qualité": properties.get("lib_qual"),
            "couleur": properties.get("coul_qual"),
            "date de mise à jour": properties.get("date_maj"),
            "date de diffusion": properties.get("date_dif"),
            "date d'échéance": properties.get("date_ech"),
            "source": properties.get("source"),
        }
    if details:
        air_info["_details"] = details
    return air_info


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


def fetch_and_extract_data(url_template, code_zone, target_date, token, extractor):
    request = urllib.request.Request(
        url_template.format(date=target_date, date_historique=target_date, code_zone=code_zone),
        headers={"Authorization": f"Bearer {token}", "accept": "application/json"},
    )
    with urllib.request.urlopen(request) as response:
        return extractor(json.loads(response.read().decode("utf-8")).get("features", []))


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
        f"atmo_environment_extracted_{today:%Y_%m_%d}_{code_zone}.json"
        if code_zone
        else f"atmo_environment_extracted_{today:%Y_%m_%d}.json"
    )

    cached_data = get_cached_data(cache_key)
    if cached_data is not None:
        print("Using cached data")
        return response(200, cached_data)

    try:
        token = get_atmo_token()
        if code_zone:
            fresh_data = {
                "pollen": {},
                "air": {},
            }
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {
                    executor.submit(fetch_and_extract_data, URL_POLLEN, code_zone, today_string, token, extract_pollen_info): ("pollen", "today"),
                    executor.submit(fetch_and_extract_data, URL_POLLEN, code_zone, tomorrow_string, token, extract_pollen_info): ("pollen", "tomorrow"),
                    executor.submit(fetch_and_extract_data, URL_AIR_QUALITY, code_zone, today_string, token, extract_air_quality_info): ("air", "today"),
                    executor.submit(fetch_and_extract_data, URL_AIR_QUALITY, code_zone, tomorrow_string, token, extract_air_quality_info): ("air", "tomorrow"),
                }
                for future in as_completed(futures):
                    data_type, day = futures[future]
                    fresh_data[data_type][day] = future.result()
        else:
            requests_to_fetch = {
                ("pollen", f"date_du_jour_{city}"): (URL_POLLEN, city_code, today_string, extract_pollen_info)
                for city, city_code in DEFAULT_CITIES.items()
            }
            requests_to_fetch.update({
                ("pollen", f"date_du_lendemain_{city}"): (URL_POLLEN, city_code, tomorrow_string, extract_pollen_info)
                for city, city_code in DEFAULT_CITIES.items()
            })
            requests_to_fetch.update({
                ("air", f"date_du_jour_{city}"): (URL_AIR_QUALITY, city_code, today_string, extract_air_quality_info)
                for city, city_code in DEFAULT_CITIES.items()
            })
            requests_to_fetch.update({
                ("air", f"date_du_lendemain_{city}"): (URL_AIR_QUALITY, city_code, tomorrow_string, extract_air_quality_info)
                for city, city_code in DEFAULT_CITIES.items()
            })
            fresh_data = {"pollen": {}, "air": {}}
            with ThreadPoolExecutor(max_workers=len(requests_to_fetch)) as executor:
                futures = {
                    executor.submit(fetch_and_extract_data, url, city_code, target_date, token, extractor): key
                    for key, (url, city_code, target_date, extractor) in requests_to_fetch.items()
                }
                for future in as_completed(futures):
                    data_type, key = futures[future]
                    fresh_data[data_type][key] = future.result()
        save_cached_data(cache_key, fresh_data)
        return response(200, fresh_data)
    except Exception as error:
        print(f"Failed to fetch pollen data: {error}")
        return response(500, {"error": "Failed to fetch data from Atmo API"})
