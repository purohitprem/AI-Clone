from app.services.ai_service import get_ai_reply

def process_user_message(message):
    return get_ai_reply(message)