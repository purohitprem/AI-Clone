# import edge_tts
# import uuid
# import asyncio
# import os


# async def generate_voice(text):

#     file_name = f"reply_{uuid.uuid4()}.mp3"
#     file_path = os.path.join("app", "static", "audio", file_name)

#     communicate = edge_tts.Communicate(
#         text=text,
#         voice="hi-IN-MadhurNeural"
#     )

#     await communicate.save(file_path)

#     return f"/static/audio/{file_name}"


# def text_to_speech(text):
#     return asyncio.run(generate_voice(text))
import os
import uuid
import tempfile
import edge_tts

async def generate_voice(text):
    temp_dir = tempfile.gettempdir()   # /tmp
    filename = f"reply_{uuid.uuid4()}.mp3"
    file_path = os.path.join(temp_dir, filename)

    communicate = edge_tts.Communicate(
        text=text,
        voice="en-IN-NeerjaNeural"
    )

    await communicate.save(file_path)
    return file_path


def text_to_speech(text):
    import asyncio
    return asyncio.run(generate_voice(text))
