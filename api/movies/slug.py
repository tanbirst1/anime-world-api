import os
import base64
import json
import requests
import hashlib
from Crypto.Cipher import AES
from bs4 import BeautifulSoup
from flask import Request, Response

SECRET = os.getenv("VIDEO_SECRET", "super_secret_key")
SECRET_KEY = hashlib.sha256(SECRET.encode()).digest()
IV = bytes(16)

def encrypt(url: str) -> str:
    cipher = AES.new(SECRET_KEY, AES.MODE_CBC, IV)
    pad_len = 16 - (len(url) % 16)
    padded_url = url + chr(pad_len) * pad_len
    encrypted_bytes = cipher.encrypt(padded_url.encode())
    encoded = base64.b64encode(encrypted_bytes).decode()
    return encoded.replace("+", "-").replace("/", "_").replace("=", "")

def handler(request: Request) -> Response:
    try:
        slug = request.args.get("slug")
        if not slug:
            return Response(json.dumps({"error": "Slug missing"}), status=400, mimetype="application/json")

        base_url = "https://watchanimeworld.in"
        page_url = f"{base_url}/movies/{slug}/"
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(page_url, headers=headers, timeout=10)
        if r.status_code != 200:
            return Response(json.dumps({"error": "Failed to fetch movie page"}), status=500, mimetype="application/json")

        soup = BeautifulSoup(r.text, "html.parser")

        title = soup.select_one("h1.entry-title").text.strip() if soup.select_one("h1.entry-title") else "Unknown"
        poster = soup.select_one(".post img")["src"] if soup.select_one(".post img") else ""
        description_tag = soup.select_one(".description p")
        description = description_tag.text.strip() if description_tag else ""

        servers = []
        for i, iframe in enumerate(soup.select(".video-player iframe"), start=1):
            src = iframe.get("src") or iframe.get("data-src")
            if src:
                servers.append({"server": f"Server {i}", "url": f"/v/{encrypt(src)}"})

        return Response(json.dumps({
            "status": "ok",
            "title": title,
            "poster": poster,
            "description": description,
            "servers": servers
        }), status=200, mimetype="application/json")

    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype="application/json")
