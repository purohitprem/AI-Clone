let currentChatId = null;
let audioContext;
let analyser;
let micStream;
let waveInterval;

/* ================= ELEMENTS ================= */
const chatBox = document.getElementById("chat-box");

/* ---------------- LOAD CHATS ---------------- */
async function loadChats() {

    const res = await fetch("/chats");
    const chats = await res.json();

    const chatList = document.getElementById("chat-list");
    chatList.innerHTML = "";

    chats.forEach(chat => {

        // 📅 FORMAT DATE TIME
        const dateObj = new Date(chat.created_at);

        const formattedDate =
            dateObj.toLocaleDateString() + " " +
            dateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

        const div = document.createElement("div");

        div.className = "p-2 hover:bg-gray-100 cursor-pointer border-b";

        div.onclick = () => openChat(chat.id);

        div.innerHTML = `
            <div class="flex justify-between">
                <div>
                    <div class="text-sm font-medium">${chat.title}</div>
                    <div class="text-xs text-gray-400">${formattedDate}</div>
                </div>

                <div class="text-red-500"
                    onclick="deleteChat('${chat.id}', event)">✖</div>
            </div>
        `;

        chatList.appendChild(div);
    });
}

/* ---------------- CLEAR CHAT ---------------- */
function clearChatWindow() {
    chatBox.innerHTML = "";
}

/* ---------------- CREATE NEW CHAT ---------------- */
async function createNewChat() {
    const res = await fetch("/chat/new", {
        method: "POST"
    });

    const chat = await res.json();

    currentChatId = chat.id;
    chatBox.innerHTML = "";

    loadChats();
}

/* ---------------- OPEN CHAT ---------------- */
async function openChat(chatId) {

    currentChatId = chatId;

    chatBox.innerHTML = "";

    const res = await fetch(`/chat/${chatId}`);
    const messages = await res.json();

    messages.forEach(msg => {
        if (msg.sender === "user") addUserMsg(msg.content);
        if (msg.sender === "bot") addAiMsg(msg.content);
    });
}

/* ---------------- SEND MESSAGE ---------------- */
async function sendMessage() {

    if (!currentChatId) {
        alert("Please create a new chat first");
        return;
    }

    const input = document.getElementById("user-input");
    const message = input.value.trim();

    if (!message) return;

    input.value = "";

    addUserMsg(message);
    addThinking();

    try {

        const res = await fetch("/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: currentChatId,
                message: message,
                type: "text"
            })
        });

        const data = await res.json();


        removeThinking();
        addAiMsg(data.reply || "No reply");
        
        if (data.audio) {
            const audio = new Audio(data.audio);
            audio.play().catch(err => console.log("Audio autoplay blocked:", err));
        }
        
        // 🔥 REAL TIME TITLE UPDATE
        await loadChats();

        scrollBottom();

    } catch (err) {
        console.error(err);
        removeThinking();
        addAiMsg("AI error occurred.");
        loadChats(); 
    }
}

/*------------------Voice---------------------*/ 

async function sendVoiceMessage(text) {

    if (!currentChatId) {
        alert("Create chat first");
        return;
    }

    addUserMsg(text);
    addThinking();

    const res = await fetch("/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: currentChatId,
            message: text,
            type: "voice"
        })
    });

    const data = await res.json();

    removeThinking();
    addAiMsg(data.reply);

    if (data.audio) {
        new Audio(data.audio).play();
    }
}

/* ---------------- ENTER KEY ---------------- */
function handleEnter(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
}

/* ---------------- UI HELPERS ---------------- */
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
            <div class="bg-gray-200 px-4 py-2 rounded-lg max-w-md">
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

/* ---------------- DELETE CHAT ---------------- */
async function deleteChat(chatId, event) {

    event.stopPropagation();

    if (!confirm("Delete this chat?")) return;

    const res = await fetch(`/chat/delete/${chatId}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (data.success) {
        loadChats();
        clearChatWindow();
    } else {
        alert("Delete failed");
    }
}

/* ================= MIC VOICE INPUT ================= */

function startMic() {

    const overlay = document.getElementById("micOverlay");
    overlay.classList.remove("hidden");

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Mic not supported in this browser");
        overlay.classList.add("hidden");
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";   // Hindi English mix works
    recognition.interimResults = false;

    recognition.start();

    recognition.onresult = (event) => {

        const transcript = event.results[0][0].transcript;

        overlay.classList.add("hidden");

        stopWaveAnimation();  
        // ⭐ DIRECT VOICE SEND
            sendVoiceMessage(transcript);
    };

    recognition.onerror = () => {
        stopWaveAnimation();  
        overlay.classList.add("hidden");
    };

    // 🔥 Auto stop after 10 sec
    setTimeout(() => {
        try { recognition.stop(); } catch {}
        stopWaveAnimation();  
        overlay.classList.add("hidden");
    }, 10000);
}

window.startMic = startMic;


/* ---------------- INIT ---------------- */
window.onload = loadChats;

/* 🔥 GLOBAL EXPORT (VERY IMPORTANT) */
window.sendMessage = sendMessage;
window.createNewChat = createNewChat;
window.openChat = openChat;
window.deleteChat = deleteChat;
window.handleEnter = handleEnter;
window.sendVoiceMessage = sendVoiceMessage;

// ------------------PDF-------------------

async function downloadPDF() {

    if (!currentChatId) {
        alert("Select chat first");
        return;
    }

    const res = await fetch(`/chat/export/pdf/${currentChatId}`);
    const data = await res.json();

    if (data.success) {
        window.open(data.pdf_url, "_blank");
    } else {
        alert("PDF failed");
    }
}

window.downloadPDF = downloadPDF;
function downloadPDF() {

    if (!currentChatId) {
        alert("No chat selected");
        return;
    }

    const link = document.createElement("a");
    link.href = `/chat/export/pdf/${currentChatId}`;
    link.download = `chat_${currentChatId}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/*------------------EXPORT PDF----------------- */

async function exportChatPDF() {

    if (!currentChatId) {
        alert("No chat selected");
        return;
    }

    showPdfLoader(); // loading UI

    try {

        const res = await fetch(`/chat/export/pdf/${currentChatId}`);

        if (!res.ok) throw new Error("PDF failed");

        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `PremAI_Chat_${currentChatId}.pdf`;

        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);

    } catch (err) {
        console.error(err);
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

function startWaveAnimation(){

    const core = document.querySelector(".mic-core");

    waveInterval = setInterval(()=>{

        analyser.getByteFrequencyData(dataArray);

        let volume = dataArray.reduce((a,b)=>a+b)/dataArray.length;

        let scale = 1 + volume / 200;

        core.style.transform = `scale(${scale})`;

    },60);

}

function stopWaveAnimation(){

    if(waveInterval) clearInterval(waveInterval);

    document.querySelector(".mic-core").style.transform = "scale(1)";

    if(micStream){
        micStream.getTracks().forEach(track=>track.stop());
    }

}