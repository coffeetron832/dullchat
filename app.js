const createRoomBtn = document.getElementById("createRoom");
const roomSection = document.getElementById("room");
const homeSection = document.getElementById("home");

// --- NUEVO ELEMENTO PARA CONTROLAR EL LOGO/ESLOGAN ---
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

const messageInput = document.getElementById("messageInput"); 
const sendBox = document.getElementById("sendBox"); 
const messagesContainer = document.getElementById("messages"); 

// --- VARIABLES GLOBALES DE PEERJS ---
let peer = null;
let connections = []; // Guardará las conexiones activas con otros peers
let isRoomActive = true; // Controla si la sala sigue vigente

// --- CONFIGURACIÓN CRIPTOGRÁFICA (E2EE) ---
const CRYPTO_SALT = new TextEncoder().encode("DullChatSalt2026");
let cryptoKey = null; // Guardará la clave simétrica generada en tiempo de ejecución

// --- SINTETIZADOR DE SONIDOS BITS (WEB AUDIO API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBitSound(type) {
    // Asegurar que el contexto de audio se active tras interacción del usuario
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Tipo de onda cuadrada le da ese toque "retro/8-bit"
    osc.type = "square"; 

    const now = audioCtx.currentTime;

    if (type === "join") {
        // Sonido ascendente de dos tonos para cuando alguien se une
        osc.frequency.setValueAtTime(523.25, now); // Nota C5
        osc.frequency.setValueAtTime(659.25, now + 0.08, now + 0.08); // Nota E5
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === "message") {
        // Sonido corto y agudo para cuando llega un mensaje
        osc.frequency.setValueAtTime(880.00, now); // Nota A5
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === "error") {
        // Sonido descendente y áspero para errores o salas no disponibles
        osc.frequency.setValueAtTime(293.66, now); // Nota D4
        osc.frequency.setValueAtTime(220.00, now + 0.1); // Nota A3
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    }
}

// Derivar una clave AES-GCM a partir del roomId usando PBKDF2
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

// Cifrar texto plano
async function encryptMessage(plainText) {
    if (!cryptoKey) return plainText;
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV único de 12 bytes para AES-GCM
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        encoder.encode(plainText)
    );

    // Unimos el IV y el buffer cifrado en un solo Array para transmitirlo empaquetado en Base64
    const combinedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combinedArray.set(iv, 0);
    combinedArray.set(new Uint8Array(encryptedBuffer), iv.length);

    return btoa(String.fromCharCode.apply(null, combinedArray));
}

// Descifrar texto codificado en Base64
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

// --- FUNCIÓN PARA GENERAR ID DE SALA UNIFORME ---
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

// --- FUNCIÓN PARA ACTUALIZAR LA LISTA DE PARTICIPANTES EN PANTALLA ---
function updateParticipantsUI() {
    participantsListEl.innerHTML = "";

    const myLi = document.createElement("li");
    
    // CORRECCIÓN XSS: El nombre se inyecta como texto seguro usando un nodo de texto plano
    const strongEl = document.createElement("strong");
    strongEl.textContent = userIdEl.textContent;
    myLi.appendChild(strongEl);
    myLi.appendChild(document.createTextNode(" (Tú)"));
    
    participantsListEl.appendChild(myLi);

    connections.forEach(conn => {
        const li = document.createElement("li");
        // CORRECCIÓN XSS: Cambiado innerHTML por textContent
        li.textContent = conn.peer;
        participantsListEl.appendChild(li);
    });

    connectedCountEl.textContent = connections.length + 1;
}

// --- FUNCIÓN PARA INICIALIZAR PEERJS (CON RECONEXIÓN AUTOMÁTICA COHERENTE) ---
function initPeer(userId, isHost, targetRoomId = null) {
    peer = new Peer(userId, {
        debug: 1 
    });

    peer.on('open', (id) => {
        console.log('Mi ID de PeerJS es: ' + id);
        
        if (!isHost && targetRoomId) {
            connectToPeer(targetRoomId);
        }
    });

    peer.on('connection', (conn) => {
        setupConnectionTrack(conn);
    });

    // Intentar reconectar si se pierde el enlace con el servidor de señalización
    peer.on('disconnected', () => {
        console.log('Conexión parpadeante con la señalización. Intentando recuperar la sesión...');
        if (isRoomActive && !peer.destroyed) {
            peer.reconnect();
        }
    });

    peer.on('error', (err) => {
        console.error('Error detectado en PeerJS:', err.type, err);
        
        // SALVAVIDAS CONTRA MICRO-CORTES: Si parpadea la red, damos margen de recuperación
        if (err.type === 'network' || err.type === 'disconnect') {
            console.log('Detectada inestabilidad de red. Esperando estabilización...');
            setTimeout(() => {
                if (peer && peer.disconnected && !peer.destroyed && isRoomActive) {
                    peer.reconnect();
                }
            }, 3000); // 3 segundos de tolerancia pasiva
            return; // Detiene la propagación para evitar la expulsión inmediata
        }
        
        // Si el error es insalvable, procedemos al cierre seguro de la sala
        isRoomActive = false;
        if (peer) peer.destroy();
        
        resetAppToHome();

        // Mapeo amigable de errores técnicos
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

// --- FUNCIÓN PARA CONECTARSE A OTRO PEER ---
function connectToPeer(targetId) {
    const conn = peer.connect(targetId);
    setupConnectionTrack(conn);
}

// --- CONFIGURAR CANALES DE COMUNICACIÓN ---
function setupConnectionTrack(conn) {
    conn.on('open', () => {
        console.log("Conectado con éxito a: " + conn.peer);
        connections.push(conn);
        
        // Revelamos la interfaz de la sala para el Invitado SÓLO si la conexión P2P se abrió con éxito
        if (roleEl.textContent === "Invitado" && roomSection.classList.contains("hidden")) {
            brandHeader.classList.add("hidden");
            homeSection.classList.add("hidden");
            roomSection.classList.remove("hidden");
        }
        
        updateParticipantsUI();
        appendMessage("Sistema", `Usuario ${conn.peer} se ha unido.`, "system");
        
        // SONIDO: Se unió alguien a la sala
        playBitSound("join");
    });

    // Escuchar datos recibidos (Procesamiento asíncrono para descifrar)
    conn.on('data', async (data) => {
        if (data.type === "ROOM_DESTROYED") {
            playBitSound("error");
            handleRoomDestructionByHost("El anfitrión ha cerrado esta sala. Redirigiendo al inicio...");
            return;
        }

        // E2EE: Descifrar el payload antes de inyectarlo en el DOM
        const decryptedText = await decryptMessage(data.text);
        appendMessage(data.sender, decryptedText, "received");
        
        // SONIDO: Mensaje entrante recibido
        playBitSound("message");
        
        if (roleEl.textContent === "Anfitrión") {
            // El host retransmite el mensaje tal y como llegó (ya cifrado) a los demás nodos
            broadcastMessage(data, conn.peer);
        }
    });

    conn.on('close', () => {
        console.log("Conexión cerrada con: " + conn.peer);
        connections = connections.filter(c => c.peer !== conn.peer);
        
        updateParticipantsUI();
        appendMessage("Sistema", `Usuario ${conn.peer} ha salido.`, "system");

        if (roleEl.textContent === "Invitado" && connections.length === 0) {
            playBitSound("error");
            handleRoomDestructionByHost("Se perdió la conexión con el anfitrión. La sala ya no está disponible.");
        }
    });
}

// --- FUNCIÓN PARA EXPULSAR A LOS INVITADOS CUANDO LA SALA SE ROMPE ---
function handleRoomDestructionByHost(alertMessage) {
    isRoomActive = false;
    alert(alertMessage);
    
    if (peer) {
        peer.destroy();
    }
    
    resetAppToHome();
}

// --- LIMPIAR INTERFAZ Y VOLVER A HOME ---
function resetAppToHome() {
    roomIdEl.textContent = "";
    userIdEl.textContent = "";
    roomCapacityEl.textContent = "";
    roleEl.textContent = "-";
    shareLinkEl.value = "";
    messagesContainer.innerHTML = ""; 
    participantsListEl.innerHTML = "<li>Cargando...</li>";
    cryptoKey = null; // Destrucción inmediata de la clave simétrica en memoria RAM

    roomSection.classList.add("hidden");
    homeSection.classList.remove("hidden");
    
    brandHeader.classList.remove("hidden");

    // Limpiar parámetros de la URL devolviendo la barra de direcciones al estado original
    window.history.pushState({}, document.title, window.location.pathname);
}

// --- ENVIAR MENSAJE A TODOS ---
function broadcastMessage(messageObj, skipPeerId = null) {
    connections.forEach(conn => {
        if (conn.peer !== skipPeerId) {
            conn.send(messageObj);
        }
    });
}

// --- MOSTRAR MENSAJE EN PANTALLA ---
function appendMessage(sender, text, type) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", type); 
    
    // CORRECCIÓN CRÍTICA XSS: Reemplazado innerHTML por manipulación nativa segura
    const senderStrong = document.createElement("strong");
    senderStrong.textContent = `${sender}:`; // Trata el nombre como texto plano
    
    const textSpan = document.createElement("span");
    textSpan.textContent = ` ${text}`; // Trata el mensaje estrictamente como texto plano

    msgDiv.appendChild(senderStrong);
    msgDiv.appendChild(textSpan);
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; 
}

// --- EVENTO: CREAR SALA (HOST) ---
createRoomBtn.addEventListener("click", async () => {
    const capacity = document.getElementById("capacity").value;
    const roomId = generateRoomId();
    const userId = `Host-${generateUserId()}`; 

    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

    roomIdEl.textContent = roomId;
    userIdEl.textContent = userId;
    roomCapacityEl.textContent = capacity;
    roleEl.textContent = "Anfitrión"; 
    shareLinkEl.value = link;
    
    destroyRoomBtn.textContent = "Destruir sala";
    destroyRoomBtn.classList.add("danger");

    // El host monta su propia sala instantáneamente
    brandHeader.classList.add("hidden");
    homeSection.classList.add("hidden");
    roomSection.classList.remove("hidden");

    isRoomActive = true;
    updateParticipantsUI();
    
    // E2EE: Derivar clave de forma asíncrona antes de levantar la infraestructura de red PeerJS
    await deriveKeyFromRoomId(roomId);
    initPeer(roomId, true);
});

// --- ENVIAR MENSAJE (CLICK) ---
sendBox.addEventListener("click", async () => {
    if (!isRoomActive) return;

    const text = messageInput.value.trim();
    if (!text) return;

    // E2EE: Cifrar el texto plano usando la clave simétrica derivada
    const encryptedText = await encryptMessage(text);

    const messageObj = {
        sender: userIdEl.textContent,
        text: encryptedText
    };

    appendMessage("Tú", text, "sent"); // Render local en texto plano seguro
    broadcastMessage(messageObj);
    messageInput.value = "";
});

// --- ENVIAR MENSAJE (SOPORTE PARA TECLA ENTER) ---
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendBox.click();
    }
});

// --- EVENTO: DETECTAR SI ENTRA POR LINK DE INVITACIÓN ---
window.addEventListener("DOMContentLoaded", () => {
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
        
        // E2EE: Derivar clave con el id extraído de la URL e inicializar la red
        deriveKeyFromRoomId(roomParam).then(() => {
            initPeer(myUserId, false, roomParam);
        });
    }
});

// --- COPIAR LINK ---
copyLinkBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(shareLinkEl.value);
        alert("Enlace copiado.");
    } catch {
        alert("No se pudo copiar.");
    }
});

// --- BOTÓN ACCIÓN: DESTRUIR (HOST) O ABANDONAR (INVITADO) ---
destroyRoomBtn.addEventListener("click", () => {
    if (roleEl.textContent === "Anfitrión") {
        const confirmDelete = confirm("Esta acción eliminará la sala permanentemente para todos.");
        if (!confirmDelete) return;

        broadcastMessage({ type: "ROOM_DESTROYED" });

        setTimeout(() => {
            if (peer) peer.destroy();
            resetAppToHome();
            alert("Sala destruida.");
        }, 100);

    } else {
        const confirmLeave = confirm("¿Seguro que deseas abandonar la sala?");
        if (!confirmLeave) return;

        if (peer) peer.destroy();
        resetAppToHome();
        alert("Has abandonado la sala.");
    }
});
