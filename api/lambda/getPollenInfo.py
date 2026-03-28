import json
import os
import urllib.request
from datetime import date, timedelta
import boto3
from botocore.exceptions import ClientError

URL_POLLEN_PARIS = "https://admindata.atmo-france.org/api/v2/data/indices/pollens?format=geojson&date={date}&date_historique={date_historique}&code_zone=75056&with_geom=false"
URL_POLLEN_NANTES = "https://admindata.atmo-france.org/api/v2/data/indices/pollens?format=geojson&date={date}&date_historique={date_historique}&code_zone=44109&with_geom=false"
URL_POLLEN_STRASBOURG = "https://admindata.atmo-france.org/api/v2/data/indices/pollens?format=geojson&date={date}&date_historique={date_historique}&code_zone=67482&with_geom=false"
URL_POLLEN_MARSEILLE = "https://admindata.atmo-france.org/api/v2/data/indices/pollens?format=geojson&date={date}&date_historique={date_historique}&code_zone=13055&with_geom=false"
URL_ATMO_LOGIN = "https://admindata.atmo-france.org/api/login"

s3 = boto3.client('s3')
bucket_name = "thomassed-repo-pollen"

# Dates
aujourd_hui = date.today()
date_du_jour = aujourd_hui.strftime("%Y-%m-%d")
date_du_jour_s3 = aujourd_hui.strftime("%Y_%m_%d")

lendemain = aujourd_hui + timedelta(days=1)
date_du_lendemain = lendemain.strftime("%Y-%m-%d")

codesPolluantsTranslationMapping = {
    "code_qual": 'qualité globale',
    "code_aul": 'aulne',
    "code_boul": 'bouleau',
    "code_oliv": 'olivier',
    "code_gram": 'graminées',
    "code_arm": 'armoise',
    "code_ambr": 'ambroisie'
}

def extract_pollen_info(pollen_data):
    """Extract pollen information from the data (from a list of features)."""
    pollen_info = {}
    for feature in pollen_data:
        properties = feature["properties"]
        for code, translation in codesPolluantsTranslationMapping.items():
            if code in properties:
                pollen_info[translation] = properties[code]
    return pollen_info

def get_atmo_token():
    username = os.environ.get("ATMO_USERNAME")
    password = os.environ.get("ATMO_PASSWORD")
    if not username or not password:
        raise Exception("ATMO_USERNAME or ATMO_PASSWORD environment variables are not set")
    data = json.dumps({"username": username, "password": password}).encode("utf-8")
    
    req = urllib.request.Request(
        URL_ATMO_LOGIN, 
        data=data, 
        headers={"Content-Type": "application/json", "accept": "*/*"}, 
        method="POST"
    )
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode("utf-8"))
        return res.get("token")

def fetch_and_extract_pollen_data(url_template, target_date, date_historique, token):
    url = url_template.format(date=target_date, date_historique=date_historique)
    req = urllib.request.Request(
        url, 
        headers={"Authorization": f"Bearer {token}", "accept": "application/json"}
    )
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode("utf-8"))
        # We pass the 'features' array directly to extract_pollen_info
        return extract_pollen_info(data.get("features", []))

def get_cached_data(cache_key):
    try:
        response = s3.get_object(Bucket=bucket_name, Key=cache_key)
        return json.loads(response['Body'].read().decode('utf-8'))
    except ClientError as e:
        if e.response['Error']['Code'] == "NoSuchKey":
            return None
        raise e

def save_cached_data(cache_key, data):
    s3.put_object(Bucket=bucket_name, Key=cache_key, Body=json.dumps(data))

def lambda_handler(event, context):
    cache_key = f"atmo_pollen_extracted_{date_du_jour_s3}.json"
    
    # 1. Try to fetch from S3 cache
    cached_data = get_cached_data(cache_key)
    if cached_data is not None:
        print("Using cached data")
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(cached_data),
        }

    # 2. If no cache, login to Atmo API and fetch data
    try:
        token = get_atmo_token()
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Failed to login to Atmo API", "details": str(e)})
        }

    try:
        urls_to_fetch = {
            "date_du_jour_paris": (URL_POLLEN_PARIS, date_du_jour, token),
            "date_du_lendemain_paris": (URL_POLLEN_PARIS, date_du_lendemain, token),
            "date_du_jour_nantes": (URL_POLLEN_NANTES, date_du_jour, token),
            "date_du_lendemain_nantes": (URL_POLLEN_NANTES, date_du_lendemain, token),
            "date_du_jour_strasbourg": (URL_POLLEN_STRASBOURG, date_du_jour, token),
            "date_du_lendemain_strasbourg": (URL_POLLEN_STRASBOURG, date_du_lendemain, token),
            "date_du_jour_marseille": (URL_POLLEN_MARSEILLE, date_du_jour, token),
            "date_du_lendemain_marseille": (URL_POLLEN_MARSEILLE, date_du_lendemain, token),
        }

        fresh_data = {}
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            future_to_key = {
                executor.submit(fetch_and_extract_pollen_data, url, req_date, req_date, tok): key
                for key, (url, req_date, tok) in urls_to_fetch.items()
            }
            
            for future in concurrent.futures.as_completed(future_to_key):
                key = future_to_key[future]
                fresh_data[key] = future.result()
        
        # 3. Save to S3 cache
        save_cached_data(cache_key, fresh_data)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(fresh_data),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Failed to fetch data from Atmo API", "details": str(e)})
        }