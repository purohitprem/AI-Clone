/* ================= ELEMENTS ================= */
const chatBox = document.getElementById("chat-box");

/* ================= SEND MESSAGE ================= */
async function sendMessage() {

    const input = document.getElementById("user-input");
    const message = input.value.trim();
    if (!message) return;

    input.value = "";

    addUserMsg(message);
    addThinking();
    scrollBottom();

    try {
        const res = await fetch("/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                type: "text"
            })
        });

        const data = await res.json();

        removeThinking();
        addAiMsg(data.reply || "No reply");
        scrollBottom();

        if (data.audio) {
            const audio = new Audio(data.audio);
            audio.play().catch(() => {});
        }

    } catch (err) {
        console.error(err);
        removeThinking();
        addAiMsg("⚠️ AI error occurred.");
    }
}

/* ================= VOICE MESSAGE ================= */
async function sendVoiceMessage(text) {

    addUserMsg(text);
    addThinking();
    scrollBottom();

    const res = await fetch("/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: text,
            type: "voice"
        })
    });

    const data = await res.json();

    removeThinking();
    addAiMsg(data.reply || "");
    scrollBottom();

    if (data.audio) {
        new Audio(data.audio).play();
    }
}

/* ================= ENTER KEY ================= */
function handleEnter(e) {
    if (e.key === "Enter") sendMessage();
}

/* ================= UI HELPERS ================= */
function addUserMsg(text) {
    chatBox.innerHTML += `
    <div class="flex justify-end mb-2">
        <div class="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
            ${text}
        </div>
    </div>`;
}

function addAiMsg(text) {
    chatBox.innerHTML += `
    <div class="flex justify-start mb-2">
        <div class="bg-gray-200 dark:bg-slate-800 px-4 py-2 rounded-lg max-w-md">
            ${text}
        </div>
    </div>`;
}

function addThinking() {
    chatBox.innerHTML += `
    <div id="thinking" class="text-gray-400 text-sm mb-2">
        🤖 thinking...
    </div>`;
}

function removeThinking() {
    const t = document.getElementById("thinking");
    if (t) t.remove();
}

function scrollBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

/* ================= MIC INPUT ================= */
function startMic() {

    const overlay = document.getElementById("micOverlay");
    overlay.classList.remove("hidden");

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Mic not supported");
        overlay.classList.add("hidden");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        overlay.classList.add("hidden");
        sendVoiceMessage(transcript);
    };

    recognition.onerror = () => {
        overlay.classList.add("hidden");
    };

    setTimeout(() => {
        try { recognition.stop(); } catch {}
        overlay.classList.add("hidden");
    }, 10000);
}

/* ================= EXPORT PDF ================= */
async function exportChatPDF() {

    showPdfLoader();

    try {
        const res = await fetch("/chat/export/pdf");

        if (!res.ok) throw new Error("PDF failed");

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "PremAI_Chat.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);

    } catch {
        alert("PDF export failed");
    }

    hidePdfLoader();
}

function showPdfLoader() {
    document.getElementById("pdfLoader").classList.remove("hidden");
}

function hidePdfLoader() {
    document.getElementById("pdfLoader").classList.add("hidden");
}

/* ================= GLOBAL ================= */
window.sendMessage = sendMessage;
window.handleEnter = handleEnter;
window.startMic = startMic;
window.sendVoiceMessage = sendVoiceMessage;
window.exportChatPDF = exportChatPDF;
