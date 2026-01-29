import requests
import os

ELEVEN_KEY = os.getenv("ELEVEN_API_KEY")
VOICE_ID = "EXAVITQu4vr4xnSDxMaL"   # default good voice

def text_to_speech(text):

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    headers = {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json"
    }

    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2"
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code == 200:
        path = "app/static/audio/reply.mp3"
        with open(path, "wb") as f:
            f.write(response.content)
        return "/static/audio/reply.mp3"

    return None
