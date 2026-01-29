import os
from google import genai
from dotenv import load_dotenv
from ..prompts.clone import CLONE_PROFILE

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def get_ai_reply(user_message: str) -> str:
    prompt = f"""
{CLONE_PROFILE}

User: {user_message}
AI:
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt
    )

    return response.text.strip()
