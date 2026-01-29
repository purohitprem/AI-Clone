from flask import Blueprint, request, jsonify, render_template, send_file
from app.services.assistant_engine import process_user_message
from app.services.voice_service import text_to_speech
from datetime import datetime
from app.services.edge_tts_service import text_to_speech
from app.core.supabase_client import supabase
from app.services.pdf_service import generate_chat_pdf
import os
from dotenv import load_dotenv
import traceback

load_dotenv()

chat_bp = Blueprint("chat", __name__)

DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "local-user-001")

@chat_bp.route("/")
def index():
    return render_template("index.html")


# ---------------- CREATE NEW CHAT ----------------
@chat_bp.route("/chat/new", methods=["POST"])
def create_chat():
    chat = supabase.table("chats").insert({
        "user_id": DEFAULT_USER_ID,
        "title": "Chat " + datetime.now().strftime("%d %b %H:%M")
    }).execute()

    return jsonify(chat.data[0])


# ---------------- GET ALL CHATS ----------------
@chat_bp.route("/chats")
def get_chats():

    chats = supabase.table("chats") \
        .select("*") \
        .order("created_at", desc=True) \
        .execute()

    return jsonify(chats.data)


# ---------------- GET CHAT MESSAGES ----------------
@chat_bp.route("/chat/<chat_id>", methods=["GET"])
def get_messages(chat_id):
    messages = supabase.table("messages") \
        .select("*") \
        .eq("chat_id", chat_id) \
        .order("created_at") \
        .execute()

    return jsonify(messages.data)


# ---------------- SEND MESSAGE ----------------
@chat_bp.route("/chat/send", methods=["POST"])
def send_message():
    
    try:
        data = request.json

        chat_id = data.get("chat_id")
        message = data.get("message")
        msg_type = data.get("type", "text") 
        print("TYPE RECEIVED:", msg_type)  
        if not chat_id or not message:
            return jsonify({"error": "Invalid request"}), 400

        # ✅ 1️⃣ SAVE USER MESSAGE
        supabase.table("messages").insert({
            "chat_id": chat_id,
            "sender": "user",
            "content": message
        }).execute()

        # ✅ 2️⃣ COUNT ONLY USER MESSAGES
        user_msgs = supabase.table("messages") \
            .select("id") \
            .eq("chat_id", chat_id) \
            .eq("sender", "user") \
            .execute()

        # ✅ 3️⃣ FIRST MESSAGE → UPDATE TITLE
        if len(user_msgs.data) == 1:

            title = " ".join(message.split()[:5])

            supabase.table("chats").update({
                "title": title
            }).eq("id", chat_id).execute()

        # ✅ 4️⃣ AI REPLY
        ai_reply = process_user_message(message)

        # ⭐ VOICE GENERATE ONLY IF VOICE MODE
        audio_url = None

        if msg_type == "voice":
            print("Generating Voice...")
            audio_url = text_to_speech(ai_reply)

        # ✅ 5️⃣ SAVE BOT MESSAGE
        supabase.table("messages").insert({
            "chat_id": chat_id,
            "sender": "bot",
            "content": ai_reply
        }).execute()

        # ⭐ RETURN AUDIO ALSO
        return jsonify({
            "reply": ai_reply,
            "audio": audio_url
        })
        

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"reply": "Error occurred"})
    

# ---------------------DELETE ROUTE---------------------

@chat_bp.route("/chat/delete/<chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    try:
        # delete messages first (FK safety)
        supabase.table("messages").delete().eq("chat_id", chat_id).execute()

        # delete chat
        supabase.table("chats").delete().eq("id", chat_id).execute()

        return jsonify({"success": True})

    except Exception:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False}), 500

# -------------------PDF-------------------

@chat_bp.route("/chat/export/pdf/<chat_id>")
def export_chat_pdf(chat_id):

    try:

        res = supabase.table("messages") \
            .select("*") \
            .eq("chat_id", chat_id) \
            .order("created_at") \
            .execute()

        messages = res.data or []

        pdf_path = generate_chat_pdf(chat_id, messages)

        # ✅ DIRECT DOWNLOAD (LOCAL SAVE OPTION)
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=f"chat_{chat_id}.pdf"
        )

    except Exception as e:
        print("PDF ERROR:", e)
        return jsonify({"success": False})
