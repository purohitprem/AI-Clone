import edge_tts
import uuid
import asyncio
import os


async def generate_voice(text):

    file_name = f"reply_{uuid.uuid4()}.mp3"
    file_path = os.path.join("app", "static", "audio", file_name)

    communicate = edge_tts.Communicate(
        text=text,
        voice="hi-IN-SwaraNeural"
    )

    await communicate.save(file_path)

    return f"/static/audio/{file_name}"


def text_to_speech(text):
    return asyncio.run(generate_voice(text))
