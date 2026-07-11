// ==========================================
// DICCIONARIO DE IDIOMAS Y TRADUCCIÓN
// ==========================================

const translations = {
    es: {
        meta_title: "dullchat - Salas de chat privadas",
        brand_subtitle: "Crea salas privadas en un clic. Comunicación directa entre usuarios, lo que se habla aquí, se queda aquí.",
        label_capacity: "Capacidad de integrantes en la sala",
        btn_create_room: "Crear sala",
        title_participants: "Ver participantes",
        title_room_info: "Información de la sala",
        title_emoji: "Insertar emoji",
        title_mic: "Activar/Silenciar Micrófono",
        placeholder_input: "Escribe un mensaje...",
        btn_send: "Enviar",
        sidebar_participants: "Participantes",
        status_loading: "Cargando...",
        meta_room: "Sala:",
        meta_user_id: "Tu ID:",
        meta_role: "Rol:",
        meta_capacity: "Capacidad:",
        meta_connected: "Conectados:",
        placeholder_share_link: "Enlace de la sala",
        btn_copy: "Copiar enlace",
        status_connected: "Conectado",
        btn_destroy: "Destruir sala",
        footer_rights: "Todos los derechos reservados.",
        footer_legal: "Términos y Privacidad",
        modal_title: "Aviso de Privacidad y Responsabilidad",
        modal_btn_accept: "Entendido",
        // Textos dinámicos del sistema (para usar en tus logs de chat)
        sys_welcome: "Bienvenido a dullchat. Esperando conexiones directas peer-to-peer...",
        sys_copied: "¡Enlace copiado al portapapeles!",
        sys_role_host: "Anfitrión",
        sys_role_guest: "Invitado"
    },
    en: {
        meta_title: "dullchat - Private chat rooms",
        brand_subtitle: "Create private rooms in one click. Direct communication between users, what is said here, stays here.",
        label_capacity: "Room capacity",
        btn_create_room: "Create room",
        title_participants: "View participants",
        title_room_info: "Room information",
        title_emoji: "Insert emoji",
        title_mic: "Toggle Microphone",
        placeholder_input: "Type a message...",
        btn_send: "Send",
        sidebar_participants: "Participants",
        status_loading: "Loading...",
        meta_room: "Room:",
        meta_user_id: "Your ID:",
        meta_role: "Role:",
        meta_capacity: "Capacity:",
        meta_connected: "Connected:",
        placeholder_share_link: "Room link",
        btn_copy: "Copy link",
        status_connected: "Connected",
        btn_destroy: "Destroy room",
        footer_rights: "All rights reserved.",
        footer_legal: "Terms & Privacy",
        modal_title: "Privacy & Liability Notice",
        modal_btn_accept: "Understood",
        sys_welcome: "Welcome to dullchat. Waiting for direct peer-to-peer connections...",
        sys_copied: "Link copied to clipboard!",
        sys_role_host: "Host",
        sys_role_guest: "Guest"
    }
};

// Texto legal dinámico (por comodidad debido a su extensión)
const legalTexts = {
    es: `<h3>Cifrado P2P (Peer-to-Peer)</h3>
         <p>Esta aplicación funciona de navegador a navegador mediante WebRTC. Los mensajes y el audio no pasan por ningún servidor centralizado, lo que garantiza una comunicación directa.</p>
         <h3>Sin Registros</h3>
         <p>No guardamos datos personales, cookies de rastreo, ni logs de tus conversaciones. Cuando cierras o destruyes la sala, la información desaparece para siempre.</p>
         <h3>Responsabilidad</h3>
         <p>El uso de esta herramienta es bajo tu propia responsabilidad. Asegúrate de compartir el enlace de acceso únicamente con personas de confianza.</p>`,
    en: `<h3>P2P Encryption (Peer-to-Peer)</h3>
         <p>This application works browser-to-browser via WebRTC. Messages and audio do not pass through any centralized server, ensuring direct communication.</p>
         <h3>No Logs</h3>
         <p>We do not store personal data, tracking cookies, or history of your conversations. When you close or destroy the room, the data is gone forever.</p>
         <h3>Liability</h3>
         <p>The use of this tool is at your own risk. Make sure to share the access link only with trusted people.</p>`
};

// Guardar idioma preferido por el usuario en localStorage
let currentLang = localStorage.getItem('dullchat_lang') || 'es';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('dullchat_lang', lang);
    
    // Cambiar atributo lang en la raíz del documento
    document.getElementById('html-root').setAttribute('lang', lang);
    
    // Asegurar que el select refleje el idioma actual
    document.getElementById('langSelect').value = lang;

    // 1. Traducir textos estándar (innerText)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    // 2. Traducir placeholders de inputs
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.setAttribute('placeholder', translations[lang][key]);
        }
    });

    // 3. Traducir títulos/tooltips de los botones de control
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (translations[lang][key]) {
            el.setAttribute('title', translations[lang][key]);
        }
    });

    // 4. Inyectar texto legal en el modal
    const modalBody = document.getElementById('legalModalContent');
    if (modalBody) {
        modalBody.innerHTML = legalTexts[lang];
    }
}

// Escuchar cambios en el selector de idioma
document.getElementById('langSelect').addEventListener('change', (e) => {
    setLanguage(e.target.value);
});

// Inicializar el idioma al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
});

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
const legalText = `
    <p><strong>dullchat</strong> es una plataforma experimental de mensajería instantánea distribuida y serverless diseñada bajo principios de privacidad absoluta.</p>
    
    <h3>1. Naturaleza del Servicio y Cifrado</h3>
    <p>Toda la comunicación entre dispositivos se realiza mediante cifrado de extremo a extremo (E2EE).</p>
    <ul>
        <li><strong>Sin almacenamiento central:</strong> Los mensajes, archivos, credenciales y metadatos se procesan estrictamente de manera local en tu navegador y se transmiten directamente de par a par (P2P).</li>
        <li>No mantenemos servidores de bases de datos ni respaldos. Una vez cerrada la sala o la pestaña, los datos se eliminan de forma permanente e irrecuperable.</li>
    </ul>

    <h3>2. Exclusión de Responsabilidad por Contenido</h3>
    <p>Debido a la arquitectura técnica descentralizada de la aplicación, los desarrolladores no tienen la capacidad de interceptar, auditar, moderar ni bloquear el contenido de ninguna sala.</p>
    <ul>
        <li>El usuario es el único y exclusivo responsable de la información compartida durante las sesiones.</li>
        <li>No asumimos responsabilidad legal alguna por usos inapropiados, ilícitos, difamatorios o fraudulentos del servicio.</li>
    </ul>

    <h3>3. Gestión de Enlaces y Claves de Acceso</h3>
    <p>Los identificadores de las salas de chat actúan como llaves criptográficas generadas localmente.</p>
    <ul>
        <li>Es tu estricta responsabilidad custodiar estos enlaces y compartirlos únicamente con destinatarios autorizados.</li>
        <li>Si un tercero accede a tu enlace, podrá unirse a la sala. El sistema no provee herramientas centralizadas para la revocación remota de accesos ni recuperación de salas perdidas.</li>
    </ul>

    <h3>4. Exclusión de Garantías Técnicas</h3>
    <p>El software se entrega "tal cual" (As Is), sin garantías de disponibilidad permanente o inmunidad ante fallas de red asociadas a los navegadores o proxies de conexión WebRTC/STUN de terceros.</p>
`;

function initPrivacyModal() {
    const disclaimerBtn = document.querySelector('.disclaimer');
    const modal = document.getElementById('legalModal');
    const modalContent = document.getElementById('legalModalContent');
    const closeX = document.getElementById('closeModalBtn');
    const acceptBtn = document.getElementById('acceptModalBtn');

    if (disclaimerBtn && modal) {
        disclaimerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modalContent.innerHTML = legalText;
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
        return "[Error: No se pudo descifrar este mensaje. Clave inválida o corrupta]";
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
// INTERFAZ DE USUARIO Y SEÑALIZACIÓN P2P (DIBUJO ASIMÉTRICO ALINEADO)
// ==========================================================================
function updateParticipantsUI() {
    participantsListEl.innerHTML = "";

    // Nodo del usuario propio
    const myLi = document.createElement("li");
    const strongEl = document.createElement("strong");
    strongEl.textContent = userIdEl.textContent;
    myLi.appendChild(strongEl);
    myLi.appendChild(document.createTextNode(" (Tú)"));
    participantsListEl.appendChild(myLi);

    const isHost = (roleEl.textContent === "Anfitrión");

    connections.forEach(conn => {
        const li = document.createElement("li");
        const readableId = conn.customUserId || "Conectando...";
        
        if (isHost && conn.customUserId) {
            const nameSpan = document.createElement("span");
            nameSpan.textContent = readableId;
            li.appendChild(nameSpan);

            // Contenedor para agrupar los botones alineados a la derecha
            const btnGroup = document.createElement("div");

            const isPeerMuted = mutedPeersByHost.has(conn.peer);
            const muteBtn = document.createElement("button");
            muteBtn.textContent = isPeerMuted ? "Reactivar" : "Silenciar";
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
            kickBtn.textContent = "Expulsar";
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
        connectionStatusEl.textContent = "Conectado";
    } else if (status === 'connecting') {
        signalIconEl.classList.add('signal-connecting');
        connectionStatusEl.textContent = "Reconectando...";
    } else if (status === 'offline') {
        signalIconEl.classList.add('signal-offline');
        connectionStatusEl.textContent = "Sin conexión";
    }
}

// ==========================================================================
// INICIALIZACIÓN Y CONTROL DE PEERJS
// ==========================================================================
function initPeer(peerId, isHost, targetRoomId = null) {
    peer = new Peer(peerId, {
        debug: 1 
    });

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
        console.log('Conexión parpadeante con la señalización. Intentando recuperar la sesión...');
        updateConnectionStatusUI('connecting'); 
        
        if (isRoomActive && !peer.destroyed) {
            peer.reconnect();
        }
    });

    peer.on('error', (err) => {
        console.error('Error detectado en PeerJS:', err.type, err);
        
        if (err.type === 'network' || err.type === 'disconnect') {
            console.log('Detectada inestabilidad de red. Esperando estabilización...');
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
                alert("La sala a la que intentas acceder ya no existe, está llena o el enlace es inválido.");
                break;
            case 'disconnected':
                playBitSound("error");
                alert("Te has desconectado del servidor de emparejamiento de forma permanente.");
                break;
            case 'browser-incompatible':
                playBitSound("error");
                alert("Tu navegador no es compatible con la tecnología P2P de esta aplicación.");
                break;
            default:
                playBitSound("error");
                alert("No se pudo mantener la infraestructura de conexión estable con la sala.");
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
        if (roleEl.textContent === "Anfitrión") {
            conn.customUserId = (conn.metadata && conn.metadata.userId) ? conn.metadata.userId : conn.peer;
            console.log("Conectado con éxito al invitado: " + conn.customUserId);
            
            setTimeout(() => {
                conn.send({ type: "HOST_IDENTITY", userId: userIdEl.textContent });
            }, 400);

            appendMessage("Sistema", `Usuario ${conn.customUserId} se ha unido.`, "system");
            playBitSound("join");
        } else {
            conn.customUserId = "Anfitrión (Verificando...)";
            console.log("Canal abierto con el nodo central de la sala. Esperando identidad...");
            
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
        // --- INTERCEPCIÓN DE PAQUETES DE CONTROL INTERNO ---
        if (data.type === "HOST_IDENTITY") {
            conn.customUserId = data.userId; 
            updateParticipantsUI();
            appendMessage("Sistema", `Te has unido a la sala del usuario ${conn.customUserId}.`, "system");
            playBitSound("join");
            return;
        }

        if (data.type === "ROOM_DESTROYED") {
            playBitSound("error");
            handleRoomDestructionByHost("El anfitrión ha cerrado esta sala. Redirigiendo al inicio...");
            return;
        }

        // Lógica de moderación forzada remota (El Invitado intercepta)
        if (data.type === "FORCE_MUTE") {
            isMuted = true;
            if (localStream) {
                localStream.getAudioTracks().forEach(track => track.enabled = false);
            }
            updateMicUI();
            alert("Has sido silenciado por el anfitrión de la sala.");
            return;
        }

        if (data.type === "FORCE_UNMUTE") {
            isMuted = false;
            if (localStream) {
                localStream.getAudioTracks().forEach(track => track.enabled = true);
            }
            updateMicUI();
            alert("El anfitrión ha reactivado tu micrófono.");
            return;
        }

        if (data.type === "FORCE_KICK") {
            isRoomActive = false;
            updateConnectionStatusUI('offline');
            alert("Has sido expulsado de la sala por el anfitrión.");
            if (peer) {
                peer.destroy(); 
            }
            resetAppToHome();
            return;
        }

        // --- MANEJO DE MENSAJES DE TEXTO STANDARDS ---
        const decryptedText = await decryptMessage(data.text);
        appendMessage(data.sender, decryptedText, "received");
        playBitSound("message");
        
        if (roleEl.textContent === "Anfitrión") {
            broadcastMessage(data, conn.peer);
        }
    });

    conn.on('close', () => {
        const remoteUserId = conn.customUserId || conn.peer;
        console.log("Conexión cerrada con: " + remoteUserId);
        connections = connections.filter(c => c.peer !== conn.peer);
        mutedPeersByHost.delete(conn.peer);
        
        updateParticipantsUI();
        appendMessage("Sistema", `Usuario ${remoteUserId} ha salido.`, "system");

        if (roleEl.textContent === "Invitado" && connections.length === 0 && isRoomActive) {
            playBitSound("error");
            handleRoomDestructionByHost("Se perdió la conexión con el anfitrión. La sala ya no está disponible.");
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

// ==========================================================================
// CAPTURA MULTIMEDIA Y VU METER
// ==========================================================================
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

// ==========================================================================
// INTERFAZ DE MICRÓFONO REUTILIZABLE
// ==========================================================================
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
    
    if (peer) {
        peer.destroy();
    }
    
    resetAppToHome();
}

function resetAppToHome() {
    roomIdEl.textContent = "";
    userIdEl.textContent = "";
    roomCapacityEl.textContent = "";
    roleEl.textContent = "-";
    shareLinkEl.value = "";
    messagesContainer.innerHTML = ""; 
    participantsListEl.innerHTML = "<li>Cargando...</li>";
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
    roleEl.textContent = "Anfitrión"; 
    shareLinkEl.value = link;
    
    destroyRoomBtn.textContent = "Destruir sala";
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

    appendMessage("Tú", text, "sent"); 
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
        alert("Enlace copiado.");
    } catch {
        alert("No se pudo copiar.");
    }
});

destroyRoomBtn.addEventListener("click", () => {
    if (roleEl.textContent === "Anfitrión") {
        const confirmDelete = confirm("Esta acción eliminará la sala permanentemente para todos.");
        if (!confirmDelete) return;

        broadcastMessage({ type: "ROOM_DESTROYED" });

        setTimeout(() => {
            if (peer) peer.destroy();
            updateConnectionStatusUI('offline');
            resetAppToHome();
            alert("Sala destruida.");
        }, 100);

    } else {
        const confirmLeave = confirm("¿Seguro que deseas abandonar la sala?");
        if (!confirmLeave) return; 

        if (peer) peer.destroy();
        updateConnectionStatusUI('offline');
        resetAppToHome();
        alert("Has abandonado la sala.");
    }
});

// ==========================================================================
// INICIALIZACIÓN POR CICLO DE VIDA (DOM CONTENT LOADED)
// ==========================================================================
window.addEventListener("DOMContentLoaded", () => {
    initPrivacyModal();

    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');

    if (roomParam) {
        const myUserId = generateUserId();
        
        roomIdEl.textContent = roomParam;
        userIdEl.textContent = myUserId;
        roomCapacityEl.textContent = "N/A"; 
        roleEl.textContent = "Invitado";      
        shareLinkEl.value = window.location.href;

        destroyRoomBtn.textContent = "Abandonar sala";
        destroyRoomBtn.classList.remove("danger"); 

        isRoomActive = true;
        updateParticipantsUI();
        
        deriveKeyFromRoomId(roomParam).then(() => {
            initPeer(myUserId, false, roomParam);
        });
    }
});
