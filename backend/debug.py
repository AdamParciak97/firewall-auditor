import requests
import os
import urllib3
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

PA_HOST = os.getenv("PA_HOST")
PA_API_KEY = os.getenv("PA_API_KEY")

response = requests.get(
    f"{PA_HOST}/api/",
    params={
        "type": "op",
        "cmd": "<show><running><security-policy></security-policy></running></show>",
        "key": PA_API_KEY
    },
    verify=False
)
print(response.text)
