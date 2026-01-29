from flask import current_app
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime


def generate_chat_pdf(chat_id, messages):

    # ✅ REAL STATIC PATH (NO DOUBLE APP ISSUE)
    folder = os.path.join(current_app.root_path, "static", "pdf")
    os.makedirs(folder, exist_ok=True)

    file_path = os.path.join(folder, f"chat_{chat_id}.pdf")

    c = canvas.Canvas(file_path, pagesize=A4)

    width, height = A4
    y = height - 50

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Prem AI Chat Export")

    y -= 30

    c.setFont("Helvetica", 10)
    c.drawString(
        50,
        y,
        f"Generated: {datetime.now().strftime('%d %b %Y %I:%M %p')}"
    )

    y -= 40

    c.setFont("Helvetica", 11)

    for msg in messages:
        sender = msg.get("sender", "unknown").upper()
        content = msg.get("content", "")

        text_line = f"{sender}: {content}"

        if y < 50:
            c.showPage()
            c.setFont("Helvetica", 11)
            y = height - 50

        c.drawString(50, y, text_line[:100])
        y -= 20

    c.save()

    return file_path
