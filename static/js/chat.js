/* ================= ELEMENTS ================= */
const chatBox = document.getElementById("chat-box");
let currentChatId = null;

function exportChatPDF() {
    if (!currentChatId) {
        alert("No chat selected");
        return;
    }

    window.location.href = `/chat/export/pdf/${currentChatId}`;
}

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
            audio.play().catch(() => {
                console.log("Audio blocked:", err);
            });
        }

    } catch (err) {
        console.error(err);
        removeThinking();
        addAiMsg("⚠️ AI error occurred.");
    }
}

function showPlayVoiceButton(audioUrl) {
    const btn = document.createElement("button");
    btn.innerText = "🔊 Play Voice";
    btn.className = "mt-2 text-sm text-blue-600 underline";

    btn.onclick = () => {
        const a = new Audio(audioUrl);
        a.play();
        btn.remove();
    };

    chatBox.appendChild(btn);
    scrollBottom();
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
    speakText(data.reply);
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
        const data = await res.json();

        if (!data.success || !data.pdf_url) {
            throw new Error("PDF generation failed");
        }

        // 🔽 FORCE LOCAL DOWNLOAD
        const response = await fetch(data.pdf_url);
        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "PremAI_Chat.pdf"; // 👈 filename
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (err) {
        console.error(err);
        alert("PDF download failed");
    }

    hidePdfLoader();
}

function showPdfLoader() {
    document.getElementById("pdfLoader").classList.remove("hidden");
}

function hidePdfLoader() {
    document.getElementById("pdfLoader").classList.add("hidden");
}

function speakText(text) {
    if (!("speechSynthesis" in window)) {
        alert("Voice not supported in this browser");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN"; // or en-US
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
}


/* ================= GLOBAL ================= */
window.sendMessage = sendMessage;
window.handleEnter = handleEnter;
window.startMic = startMic;
window.sendVoiceMessage = sendVoiceMessage;
window.exportChatPDF = exportChatPDF;


