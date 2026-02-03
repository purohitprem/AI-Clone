import os
import tempfile
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

def generate_chat_pdf(messages):
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, "PremAI_Chat.pdf")

    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4

    y = height - 50
    c.setFont("Helvetica", 10)

    for msg in messages:
        text = f"{msg['sender'].upper()}: {msg['content']}"
        c.drawString(40, y, text)
        y -= 15
        if y < 50:
            c.showPage()
            y = height - 50

    c.save()
    return file_path
