// ==========================================================================
// IMPORTACIONES E INICIALIZACIÓN DE IDIOMA
// ==========================================================================
import { t, getLang, setLang, applyTranslations } from './i18n.js';

// Configurar los botones del selector de idioma en el DOM con recarga de interfaz dinámica
document.getElementById("btnLangEs")?.addEventListener("click", () => { 
    setLang("es"); 
    applyTranslations(); 
    renderDynamicUI(); 
});
document.getElementById("btnLangEn")?.addEventListener("click", () => { 
    setLang("en"); 
    applyTranslations(); 
    renderDynamicUI(); 
});

// Función auxiliar para actualizar elementos dinámicos que no cubre applyTranslations automáticamente
function renderDynamicUI() {
    updateParticipantsUI();
    
    const isHost = roleEl.dataset.role === "host";
    const isGuest = roleEl.dataset.role === "guest";
    
    if (isHost || isGuest) {
        roleEl.textContent = isHost ? (t("hostRole") || "Anfitrión") : (t("guestRole") || "Invitado");
        destroyRoomBtn.textContent = isHost ? (t("destroyRoomBtn") || "Destruir sala") : (t("leaveRoomBtn") || "Abandonar sala");
    } else {
        roleEl.textContent = "-";
    }

    // Mantener la capacidad de la sala traducida de forma dinámica si no está activa en modo invitado
    if (isGuest && (roomCapacityEl.textContent === "N/A" || roomCapacityEl.textContent === "Not Available" || roomCapacityEl.dataset.i18n === "notAvailable")) {
        roomCapacityEl.textContent = t("notAvailable") || "N/A";
        roomCapacityEl.dataset.i18n = "notAvailable";
    }

    // Forzar actualización del estado de la señal
    if (signalIconEl.classList.contains('signal-online')) updateConnectionStatusUI('online');
    if (signalIconEl.classList.contains('signal-connecting')) updateConnectionStatusUI('connecting');
    if (signalIconEl.classList.contains('signal-offline')) updateConnectionStatusUI('offline');
}

// ==========================================================================
// SELECCIÓN DE ELEMENTOS DEL DOM
// ==========================================================================
const createRoomBtn = document.getElementById("createRoom");
const roomSection = document.getElementById("room");
const homeSection = document.getElementById("home");

// --- ELEMENTO PARA CONTROLAR EL LOGO/ESLOGAN ---
const brandHeader = document.getElementById("brand-header");

const roomIdEl = document.getElementById("roomId");
const userIdEl = document.getElementById("userId");
const roomCapacityEl = document.getElementById("roomCapacity");
const shareLinkEl = document.getElementById("shareLink");

const copyLinkBtn = document.getElementById("copyLink");
const destroyRoomBtn = document.getElementById("destroyRoom");

// --- ELEMENTOS DEL DOM PARA CONTROL DE ESTADO ---
const roleEl = document.getElementById("role");
const connectedCountEl = document.getElementById("connectedCount");
const participantsListEl = document.getElementById("participantsList");

// --- ELEMENTOS PARA EL INDICADOR DE SEÑAL P2P ---
const signalIconEl = document.getElementById("signalIcon");
const connectionStatusEl = document.getElementById("connectionStatus");

const messageInput = document.getElementById("messageInput"); 
const sendBox = document.getElementById("sendBox"); 
const messagesContainer = document.getElementById("messages"); 

// --- NUEVOS ELEMENTOS PARA AUDIO Y VU METER (ESTILO DISCORD) ---
const micBtnEl = document.getElementById("micBtn");
const micIconEl = document.getElementById("micIcon");
const remoteAudiosContainer = document.getElementById("remoteAudios");

const vuBars = [
    document.querySelector(".vu-green"),
    document.querySelector(".vu-yellow"),
    document.querySelector(".vu-red")
];

// ==========================================================================
// VARIABLES GLOBALES DE PEERJS Y ESTADO
// ==========================================================================
let peer = null;
let connections = []; // Guardará las conexiones activas con otros peers
let isRoomActive = true; // Controla si la sala sigue vigente
let mutedPeersByHost = new Set(); // Guarda los IDs de los invitados silenciados por el Host

// --- CONFIGURACIÓN CRIPTOGRÁFICA (E2EE) ---
const CRYPTO_SALT = new TextEncoder().encode("DullChatSalt2026");
let cryptoKey = null; // Guardará la clave simétrica generada en tiempo de ejecución

// --- VARIABLES DE AUDIO Y MONITOREO DE VOZ ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let localStream = null;     // Flujo local de hardware del micrófono
let isMuted = true;         // Iniciamos silenciados por estricta privacidad
let activeCalls = [];       // Registro de tracks multimedia abiertos (PeerJS .call)
let audioAnalyser = null;   // Procesador FFT para medir decibelios
let vuDataArray = null;     // Buffer numérico de espectro
let vuAnimationId = null;   // ID del loop nativo del VU Meter

// ==========================================================================
// INYECTAR ESTILOS PARA LOS BOTONES DE MODERACIÓN
// ==========================================================================
const style = document.createElement('style');
style.textContent = `
    #participantsList li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px;
        margin-bottom: 4px;
    }
    .btn-mod-small {
        font-size: 0.75rem !important;
        padding: 2px 6px !important;
        height: auto !important;
        line-height: 1.2 !important;
        margin-left: 4px;
        cursor: pointer;
    }
`;
document.head.appendChild(style);

// ==========================================================================
// MANEJO DEL MODAL DE DESCARGO DE RESPONSABILIDAD (PRIVACIDAD)
// ==========================================================================
function initPrivacyModal() {
    const disclaimerBtn = document.querySelector('.disclaimer');
    const modal = document.getElementById('legalModal');
    const modalContent = document.getElementById('legalModalContent');
    const closeX = document.getElementById('closeModalBtn');
    const acceptBtn = document.getElementById('acceptModalBtn');

    if (disclaimerBtn && modal) {
        disclaimerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (modalContent) {
                modalContent.innerHTML = t("legalTextHTML") || `<p><strong>dullchat</strong> es una plataforma experimental...</p>`;
            }
            modal.classList.remove('hidden');
        });
    }

    const closeModal = () => { if (modal) modal.classList.add('hidden'); };

    if (closeX) closeX.addEventListener('click', closeModal);
    if (acceptBtn) acceptBtn.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
}

// ==========================================================================
// SINTETIZADOR DE SONIDOS BITS (WEB AUDIO API)
// ==========================================================================
function playBitSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = "square"; 

    const now = audioCtx.currentTime;

    if (type === "join") {
        osc.frequency.setValueAtTime(523.25, now); 
        osc.frequency.setValueAtTime(659.25, now + 0.08); 
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === "message") {
        osc.frequency.setValueAtTime(880.00, now); 
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === "error") {
        osc.frequency.setValueAtTime(293.66, now); 
        osc.frequency.setValueAtTime(220.00, now + 0.1); 
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    }
}

// ==========================================================================
// SEGURIDAD CRIPTOGRÁFICA Y GENERADORES DE IDS
// ==========================================================================
async function deriveKeyFromRoomId(roomId) {
    const encoder = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(roomId),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    cryptoKey = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: CRYPTO_SALT,
            iterations: 100000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptMessage(plainText) {
    if (!cryptoKey) return plainText;
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        encoder.encode(plainText)
    );

    const combinedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combinedArray.set(iv, 0);
    combinedArray.set(new Uint8Array(encryptedBuffer), iv.length);

    return btoa(String.fromCharCode.apply(null, combinedArray));
}

async function decryptMessage(base64Data) {
    if (!cryptoKey) return base64Data;
    try {
        const binaryString = atob(base64Data);
        const combinedArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            combinedArray[i] = binaryString.charCodeAt(i);
        }

        const iv = combinedArray.slice(0, 12);
        const encryptedData = combinedArray.slice(12);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            encryptedData
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
        console.error("Error al descifrar el mensaje:", err);
        return t("decryptionError") || "[Error: No se pudo descifrar este mensaje. Clave inválida o corrupta]";
    }
}

function generateUserId() {
    const number = Math.floor(1000 + Math.random() * 9000);
    return `d${number}`;
}

function generateRoomId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let first = "";
    let second = "";
    for (let i = 0; i < 4; i++) {
        first += chars[Math.floor(Math.random() * chars.length)];
        second += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${first}-${second}`;
}

// ==========================================================================
// INTERFAZ DE USUARIO Y SEÑALIZACIÓN P2P
// ==========================================================================
function updateParticipantsUI() {
    participantsListEl.innerHTML = "";

    // Nodo del usuario propio
    if (userIdEl.textContent) {
        const myLi = document.createElement("li");
        const strongEl = document.createElement("strong");
        strongEl.textContent = userIdEl.textContent;
        myLi.appendChild(strongEl);
        myLi.appendChild(document.createTextNode(` ${t("youLabel") || "(Tú)"}`));
        participantsListEl.appendChild(myLi);
    } else {
        participantsListEl.innerHTML = `<li>${t("loadingText") || "Cargando..."}</li>`;
        return;
    }

    const isHost = roleEl.dataset.role === "host";

    connections.forEach(conn => {
        const li = document.createElement("li");
        const readableId = conn.customUserId || t("connectingStatus") || "Conectando...";
        
        if (isHost && conn.customUserId) {
            const nameSpan = document.createElement("span");
            nameSpan.textContent = readableId;
            li.appendChild(nameSpan);

            const btnGroup = document.createElement("div");

            const isPeerMuted = mutedPeersByHost.has(conn.peer);
            const muteBtn = document.createElement("button");
            muteBtn.textContent = isPeerMuted ? (t("unmuteBtn") || "Reactivar") : (t("muteBtn") || "Silenciar");
            muteBtn.classList.add("btn-mod-small");
            if (isPeerMuted) muteBtn.style.backgroundColor = "#4a4a4a";

            muteBtn.addEventListener("click", () => {
                if (mutedPeersByHost.has(conn.peer)) {
                    mutedPeersByHost.delete(conn.peer);
                    conn.send({ type: "FORCE_UNMUTE" });
                } else {
                    mutedPeersByHost.add(conn.peer);
                    conn.send({ type: "FORCE_MUTE" });
                }
                updateParticipantsUI();
            });

            const kickBtn = document.createElement("button");
            kickBtn.textContent = t("kickBtn") || "Expulsar";
            kickBtn.classList.add("btn-mod-small", "danger");
            kickBtn.addEventListener("click", () => {
                conn.send({ type: "FORCE_KICK" });
                conn.close(); 
            });

            btnGroup.appendChild(muteBtn);
            btnGroup.appendChild(kickBtn);
            li.appendChild(btnGroup);
        } else {
            li.textContent = readableId;
        }
        
        participantsListEl.appendChild(li);
    });

    connectedCountEl.textContent = connections.length + 1;
}

function updateConnectionStatusUI(status) {
    if (!signalIconEl || !connectionStatusEl) return;
    
    signalIconEl.classList.remove('signal-online', 'signal-connecting', 'signal-offline');
    
    if (status === 'online') {
        signalIconEl.classList.add('signal-online');
        connectionStatusEl.textContent = t("statusOnline") || "Conectado";
    } else if (status === 'connecting') {
        signalIconEl.classList.add('signal-connecting');
        connectionStatusEl.textContent = t("statusConnecting") || "Reconectando...";
    } else if (status === 'offline') {
        signalIconEl.classList.add('signal-offline');
        connectionStatusEl.textContent = t("statusOffline") || "Sin conexión";
    }
}

// ==========================================================================
// INICIALIZACIÓN Y CONTROL DE PEERJS
// ==========================================================================
function initPeer(peerId, isHost, targetRoomId = null) {
    peer = new Peer(peerId, { debug: 1 });

    peer.on('open', (id) => {
        console.log('Mi ID de red/señalización en PeerJS es: ' + id);
        updateConnectionStatusUI('online'); 
        
        if (!isHost && targetRoomId) {
            connectToPeer(targetRoomId);
        }
    });

    peer.on('connection', (conn) => {
        setupConnectionTrack(conn);
    });

    peer.on('call', (call) => {
        if (localStream) {
            call.answer(localStream);
            handleIncomingCall(call);
        } else {
            call.answer();
            handleIncomingCall(call);
        }
    });

    peer.on('disconnected', () => {
        updateConnectionStatusUI('connecting'); 
        if (isRoomActive && !peer.destroyed) {
            peer.reconnect();
        }
    });

    peer.on('error', (err) => {
        console.error('Error detectado en PeerJS:', err.type, err);
        
        if (err.type === 'network' || err.type === 'disconnect') {
            updateConnectionStatusUI('connecting'); 
            setTimeout(() => {
                if (peer && peer.disconnected && !peer.destroyed && isRoomActive) {
                    peer.reconnect();
                }
            }, 3000); 
            return; 
        }
        
        isRoomActive = false;
        updateConnectionStatusUI('offline'); 
        if (peer) peer.destroy();
        
        resetAppToHome();

        switch (err.type) {
            case 'peer-not-found':
            case 'peer-unavailable':
                playBitSound("error");
                alert(t("errorPeerNotFound") || "La sala a la que intentas acceder ya no existe, está llena o el enlace es inválido.");
                break;
            case 'disconnected':
                playBitSound("error");
                alert(t("errorDisconnected") || "Te has desconectado del servidor de emparejamiento de forma permanente.");
                break;
            case 'browser-incompatible':
                playBitSound("error");
                alert(t("errorIncompatible") || "Tu navegador no es compatible con la tecnología P2P de esta aplicación.");
                break;
            default:
                playBitSound("error");
                alert(t("errorDefault") || "No se pudo mantener la infraestructura de conexión estable con la sala.");
                break;
        }
    });
}

function connectToPeer(targetId) {
    const conn = peer.connect(targetId, {
        metadata: { userId: userIdEl.textContent }
    });
    setupConnectionTrack(conn);
}

function setupConnectionTrack(conn) {
    conn.on('open', () => {
        const isHost = roleEl.dataset.role === "host";
        if (isHost) {
            conn.customUserId = (conn.metadata && conn.metadata.userId) ? conn.metadata.userId : conn.peer;
            
            setTimeout(() => {
                conn.send({ type: "HOST_IDENTITY", userId: userIdEl.textContent });
            }, 400);

            const systemSender = t("systemSender") || "Sistema";
            const userJoinedMsg = `${t("userJoinedMessage") || "Usuario"} ${conn.customUserId} ${t("userJoinedSuffix") || "se ha unido."}`;
            appendMessage(systemSender, userJoinedMsg, "system");
            playBitSound("join");
        } else {
            conn.customUserId = t("verifyingHost") || "Anfitrión (Verificando...)";
            
            if (roomSection.classList.contains("hidden")) {
                brandHeader.classList.add("hidden");
                homeSection.classList.add("hidden");
                roomSection.classList.remove("hidden");
            }
        }

        connections.push(conn);
        updateParticipantsUI();

        if (localStream) {
            const call = peer.call(conn.peer, localStream);
            handleIncomingCall(call);
        }
    });

    conn.on('data', async (data) => {
        if (data.type === "HOST_IDENTITY") {
            conn.customUserId = data.userId; 
            updateParticipantsUI();
            
            const systemSender = t("systemSender") || "Sistema";
            const joinedMsg = `${t("joinedToRoomMessage") || "Te has unido a la sala del usuario"} ${conn.customUserId}.`;
            appendMessage(systemSender, joinedMsg, "system");
            playBitSound("join");
            return;
        }

        if (data.type === "ROOM_DESTROYED") {
            playBitSound("error");
            handleRoomDestructionByHost(t("alertRoomDestroyed") || "El anfitrión ha cerrado esta sala. Redirigiendo al inicio...");
            return;
        }

        if (data.type === "FORCE_MUTE") {
            isMuted = true;
            if (localStream) {
                localStream.getAudioTracks().forEach(track => track.enabled = false);
            }
            updateMicUI();
            alert(t("alertForceMute") || "Has sido silenciado por el anfitrión de la sala.");
            return;
        }

        if (data.type === "FORCE_UNMUTE") {
            isMuted = false;
            if (localStream) {
                localStream.getAudioTracks().forEach(track => track.enabled = true);
            }
            updateMicUI();
            alert(t("alertForceUnmute") || "El anfitrión ha reactivado tu micrófono.");
            return;
        }

        if (data.type === "FORCE_KICK") {
            isRoomActive = false;
            updateConnectionStatusUI('offline');
            alert(t("alertForceKick") || "Has sido expulsado de la sala por el anfitrión.");
            if (peer) peer.destroy(); 
            resetAppToHome();
            return;
        }

        const decryptedText = await decryptMessage(data.text);
        appendMessage(data.sender, decryptedText, "received");
        playBitSound("message");
        
        if (roleEl.dataset.role === "host") {
            broadcastMessage(data, conn.peer);
        }
    });

    conn.on('close', () => {
        const remoteUserId = conn.customUserId || conn.peer;
        connections = connections.filter(c => c.peer !== conn.peer);
        mutedPeersByHost.delete(conn.peer);
        
        updateParticipantsUI();
        
        const systemSender = t("systemSender") || "Sistema";
        const leftMsg = `${t("userLeftMessage") || "Usuario"} ${remoteUserId} ${t("userLeftSuffix") || "ha salido."}`;
        appendMessage(systemSender, leftMsg, "system");

        if (roleEl.dataset.role === "guest" && connections.length === 0 && isRoomActive) {
            playBitSound("error");
            handleRoomDestructionByHost(t("alertHostLost") || "Se perdió la conexión con el anfitrión. La sala ya no está disponible.");
        }
    });
}

function handleIncomingCall(call) {
    activeCalls.push(call);

    call.on('stream', (remoteStream) => {
        let audioEl = document.getElementById(`audio-${call.peer}`);
        if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = `audio-${call.peer}`;
            audioEl.autoplay = true;
            remoteAudiosContainer.appendChild(audioEl);
        }
        audioEl.srcObject = remoteStream;
    });

    call.on('close', () => {
        const audioEl = document.getElementById(`audio-${call.peer}`);
        if (audioEl) audioEl.remove();
        activeCalls = activeCalls.filter(c => c.peer !== call.peer);
    });
}

async function initLocalAudio() {
    try {
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const constraints = {
            audio: {
                echoCancellation: true,      
                noiseSuppression: true,      
                autoGainControl: false,      
                latency: { ideal: 0.02 }     
            },
            video: false
        };

        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const source = audioCtx.createMediaStreamSource(localStream);
        audioAnalyser = audioCtx.createAnalyser();
        audioAnalyser.fftSize = 32; 
        const bufferLength = audioAnalyser.frequencyBinCount;
        vuDataArray = new Uint8Array(bufferLength);
        
        source.connect(audioAnalyser);
        
        localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
        
        updateMicUI();
        renderVuMeter();

        connections.forEach(conn => {
            const call = peer.call(conn.peer, localStream);
            handleIncomingCall(call);
        });

    } catch (err) {
        console.warn("No se pudo acceder al micrófono:", err);
        if (micBtnEl) micBtnEl.style.display = 'none';
        const vuContainer = document.getElementById("vuMeter");
        if (vuContainer) vuContainer.style.display = 'none';
    }
}

function renderVuMeter() {
    if (isMuted || !audioAnalyser) {
        vuBars.forEach(bar => { if (bar) bar.classList.remove("lit"); });
        vuAnimationId = requestAnimationFrame(renderVuMeter);
        return;
    }

    audioAnalyser.getByteFrequencyData(vuDataArray);

    let total = 0;
    for (let i = 0; i < vuDataArray.length; i++) {
        total += vuDataArray[i];
    }
    const average = total / vuDataArray.length; 

    const greenThreshold = 15;
    const yellowThreshold = 55;
    const redThreshold = 105;

    if (average > greenThreshold) vuBars[0].classList.add("lit");
    else vuBars[0].classList.remove("lit");

    if (average > yellowThreshold) vuBars[1].classList.add("lit");
    else vuBars[1].classList.remove("lit");

    if (average > redThreshold) vuBars[2].classList.add("lit");
    else vuBars[2].classList.remove("lit");

    vuAnimationId = requestAnimationFrame(renderVuMeter);
}

function updateMicUI() {
    if (isMuted) {
        micBtnEl.classList.add("mic-muted");
        micBtnEl.classList.remove("mic-active");
        micIconEl.innerHTML = `
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" x2="12" y1="19" y2="22"></line>
            <line x1="2" x2="22" y1="2" y2="22" stroke="currentColor" stroke-width="2"></line>
        `;
    } else {
        micBtnEl.classList.remove("mic-muted");
        micBtnEl.classList.add("mic-active");
        micIconEl.innerHTML = `
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" x2="12" y1="19" y2="22"></line>
        `;
    }
}

micBtnEl.addEventListener("click", async () => {
    if (!localStream) {
        await initLocalAudio();
        if (!localStream) return;
    }

    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    updateMicUI();
});

// ==========================================================================
// FLUJOS DE SALIDA Y REINICIO DE LA APP
// ==========================================================================
function handleRoomDestructionByHost(alertMessage) {
    isRoomActive = false;
    updateConnectionStatusUI('offline');
    alert(alertMessage);
    if (peer) peer.destroy();
    resetAppToHome();
}

function resetAppToHome() {
    roomIdEl.textContent = "";
    userIdEl.textContent = "";
    roomCapacityEl.textContent = "";
    roomCapacityEl.removeAttribute('data-i18n');
    roleEl.textContent = "-";
    roleEl.removeAttribute('data-role');
    shareLinkEl.value = "";
    messagesContainer.innerHTML = ""; 
    cryptoKey = null; 
    mutedPeersByHost.clear();

    if (vuAnimationId) {
        cancelAnimationFrame(vuAnimationId);
        vuAnimationId = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    vuBars.forEach(bar => { if (bar) bar.classList.remove("lit"); });
    audioAnalyser = null;
    activeCalls = [];
    isMuted = true;
    updateMicUI();
    remoteAudiosContainer.innerHTML = "";

    roomSection.classList.add("hidden");
    homeSection.classList.remove("hidden");
    brandHeader.classList.remove("hidden");

    updateParticipantsUI();
    window.history.pushState({}, document.title, window.location.pathname);
}

function broadcastMessage(messageObj, skipPeerId = null) {
    connections.forEach(conn => {
        if (conn.peer !== skipPeerId) {
            conn.send(messageObj);
        }
    });
}

function appendMessage(sender, text, type) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", type); 
    
    const senderStrong = document.createElement("strong");
    senderStrong.textContent = `${sender}:`; 
    
    const textSpan = document.createElement("span");
    textSpan.textContent = ` ${text}`; 

    msgDiv.appendChild(senderStrong);
    msgDiv.appendChild(textSpan);
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; 
}

// ==========================================================================
// DISPARADORES DE EVENTOS DEL USUARIO
// ==========================================================================
createRoomBtn.addEventListener("click", async () => {
    const capacity = document.getElementById("capacity").value;
    const roomId = generateRoomId();
    const myCleanId = generateUserId(); 
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

    roomIdEl.textContent = roomId;
    userIdEl.textContent = myCleanId; 
    roomCapacityEl.textContent = capacity;
    
    // Guardamos estado invariante en el DOM
    roleEl.dataset.role = "host";
    roleEl.textContent = t("hostRole") || "Anfitrión"; 
    
    shareLinkEl.value = link;
    
    destroyRoomBtn.textContent = t("destroyRoomBtn") || "Destruir sala";
    destroyRoomBtn.classList.add("danger");

    brandHeader.classList.add("hidden");
    homeSection.classList.add("hidden");
    roomSection.classList.remove("hidden");

    isRoomActive = true;
    updateParticipantsUI();
    
    await deriveKeyFromRoomId(roomId);
    initPeer(roomId, true);
});

sendBox.addEventListener("click", async () => {
    if (!isRoomActive) return;

    const text = messageInput.value.trim();
    if (!text) return;

    const encryptedText = await encryptMessage(text);

    const messageObj = {
        sender: userIdEl.textContent,
        text: encryptedText
    };

    appendMessage(t("youSender") || "Tú", text, "sent"); 
    broadcastMessage(messageObj);
    messageInput.value = "";
});

messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendBox.click();
    }
});

copyLinkBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(shareLinkEl.value);
        alert(t("alertCopied") || "Enlace copiado.");
    } catch {
        alert(t("alertCopyError") || "No se pudo copiar.");
    }
});

destroyRoomBtn.addEventListener("click", () => {
    if (roleEl.dataset.role === "host") {
        const confirmDelete = confirm(t("confirmDestroyRoom") || "Esta acción eliminará la sala permanentemente para todos.");
        if (!confirmDelete) return;

        broadcastMessage({ type: "ROOM_DESTROYED" });

        setTimeout(() => {
            if (peer) peer.destroy();
            updateConnectionStatusUI('offline');
            resetAppToHome();
            alert(t("alertRoomDestroyedConfirmation") || "Sala destruida.");
        }, 100);

    } else {
        const confirmLeave = confirm(t("confirmLeaveRoom") || "¿Seguro que deseas abandonar la sala?");
        if (!confirmLeave) return; 

        if (peer) peer.destroy();
        updateConnectionStatusUI('offline');
        resetAppToHome();
        alert(t("alertLeaveConfirmation") || "Has abandonado la sala.");
    }
});

// ==========================================================================
// INICIALIZACIÓN POR CICLO DE VIDA (DOM CONTENT LOADED)
// ==========================================================================
window.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
    initPrivacyModal();

    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');

    if (roomParam) {
        const myUserId = generateUserId();
        
        roomIdEl.textContent = roomParam;
        userIdEl.textContent = myUserId;
        
        roomCapacityEl.textContent = t("notAvailable") || "N/A"; 
        roomCapacityEl.dataset.i18n = "notAvailable";
        
        roleEl.dataset.role = "guest";
        roleEl.textContent = t("guestRole") || "Invitado";      
        shareLinkEl.value = window.location.href;

        destroyRoomBtn.textContent = t("leaveRoomBtn") || "Abandonar sala";
        destroyRoomBtn.classList.remove("danger"); 

        isRoomActive = true;
        updateParticipantsUI();
        
        deriveKeyFromRoomId(roomParam).then(() => {
            initPeer(myUserId, false, roomParam);
        });
    } else {
        // Asegurar que la UI inicial muestre el estado de carga correcto traducido
        updateParticipantsUI();
    }
});
