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

// --- FUNCIÓN PARA ACTUALIZAR LA LISTA DE PARTICIPANTES EN PANTALLA ---
function updateParticipantsUI() {
    participantsListEl.innerHTML = "";

    const myLi = document.createElement("li");
    myLi.innerHTML = `<strong>${userIdEl.textContent}</strong> (Tú)`;
    participantsListEl.appendChild(myLi);

    connections.forEach(conn => {
        const li = document.createElement("li");
        li.textContent = conn.peer;
        participantsListEl.appendChild(li);
    });

    connectedCountEl.textContent = connections.length + 1;
}

// --- FUNCIÓN PARA INICIALIZAR PEERJS ---
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

    peer.on('error', (err) => {
        console.error('Error en PeerJS:', err);
        
        isRoomActive = false;
        if (peer) peer.destroy();
        
        // Retornar a la página de inicio limpiando rastros visuales
        resetAppToHome();

        // Traducción de errores técnicos a lenguaje amigable
        switch (err.type) {
            case 'peer-not-found':
            case 'peer-unavailable':
                alert("La sala a la que intentas acceder ya no existe, está llena o el enlace es inválido.");
                break;
            case 'network':
                alert("Hubo un problema con tu conexión a internet. Por favor, verifica tu red.");
                break;
            case 'disconnected':
                alert("Te has desconectado del servidor de emparejamiento. Volviendo al menú principal.");
                break;
            case 'browser-incompatible':
                alert("Tu navegador no es compatible con la tecnología P2P de esta aplicación.");
                break;
            default:
                alert("No se pudo establecer la conexión con la sala en este momento.");
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
    });

    // Escuchar datos recibidos
    conn.on('data', (data) => {
        if (data.type === "ROOM_DESTROYED") {
            handleRoomDestructionByHost("El anfitrión ha cerrado esta sala. Redirigiendo al inicio...");
            return;
        }

        appendMessage(data.sender, data.text, "received");
        
        if (roleEl.textContent === "Anfitrión") {
            broadcastMessage(data, conn.peer);
        }
    });

    conn.on('close', () => {
        console.log("Conexión cerrada con: " + conn.peer);
        connections = connections.filter(c => c.peer !== conn.peer);
        
        updateParticipantsUI();
        appendMessage("Sistema", `Usuario ${conn.peer} ha salido.`, "system");

        if (roleEl.textContent === "Invitado" && connections.length === 0) {
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
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; 
}

// --- EVENTO: CREAR SALA (HOST) ---
createRoomBtn.addEventListener("click", () => {
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
    initPeer(roomId, true);
});

// --- ENVIAR MENSAJE (CLICK) ---
sendBox.addEventListener("click", () => {
    if (!isRoomActive) return;

    const text = messageInput.value.trim();
    if (!text) return;

    const messageObj = {
        sender: userIdEl.textContent,
        text: text
    };

    appendMessage("Tú", text, "sent");
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
        initPeer(myUserId, false, roomParam);
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
