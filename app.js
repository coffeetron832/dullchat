const createRoomBtn = document.getElementById("createRoom");
const roomSection = document.getElementById("room");
const homeSection = document.getElementById("home");

const roomIdEl = document.getElementById("roomId");
const userIdEl = document.getElementById("userId");
const roomCapacityEl = document.getElementById("roomCapacity");
const shareLinkEl = document.getElementById("shareLink");

const copyLinkBtn = document.getElementById("copyLink");
const destroyRoomBtn = document.getElementById("destroyRoom");

// --- NUEVOS ELEMENTOS DEL DOM PARA CONTROL DE ESTADO ---
const roleEl = document.getElementById("role");
const connectedCountEl = document.getElementById("connectedCount");
const participantsListEl = document.getElementById("participantsList");

const messageInput = document.getElementById("messageInput"); 
const sendBox = document.getElementById("sendBox"); 
const messagesContainer = document.getElementById("messages"); 

// --- VARIABLES GLOBALES DE PEERJS ---
let peer = null;
let connections = []; // Guardará las conexiones activas con otros peers

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
    // Limpiamos la lista por completo
    participantsListEl.innerHTML = "";

    // Agregamos a nuestro propio usuario primero
    const myLi = document.createElement("li");
    myLi.innerHTML = `<strong>${userIdEl.textContent}</strong> (Tú)`;
    participantsListEl.appendChild(myLi);

    // Iteramos sobre las conexiones activas para añadir al resto
    connections.forEach(conn => {
        const li = document.createElement("li");
        li.textContent = conn.peer;
        participantsListEl.appendChild(li);
    });

    // Actualizamos el contador numérico de conectados (nosotros + el tamaño del array de conexiones)
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

    // Escuchar conexiones entrantes (importante para el Host)
    peer.on('connection', (conn) => {
        setupConnectionTrack(conn);
    });

    peer.on('error', (err) => {
        console.error('Error en PeerJS:', err);
        alert("Ocurrió un error en la conexión: " + err.type);
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
        
        // Refrescar la interfaz y notificar en el chat
        updateParticipantsUI();
        appendMessage("Sistema", `Usuario ${conn.peer} se ha unido.`, "system");
    });

    // Escuchar mensajes de texto recibidos
    conn.on('data', (data) => {
        appendMessage(data.sender, data.text, "received");
        
        // Si eres el Host, reenvías este mensaje al resto para que todos lo lean
        if (roomIdEl.textContent === peer.id) {
            broadcastMessage(data, conn.peer);
        }
    });

    conn.on('close', () => {
        console.log("Conexión cerrada con: " + conn.peer);
        connections = connections.filter(c => c.peer !== conn.peer);
        
        // Refrescar la interfaz tras la salida y notificar
        updateParticipantsUI();
        appendMessage("Sistema", `Usuario ${conn.peer} ha salido.`, "system");
    });
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

    // Actualizaciones de la interfaz de la sala
    roomIdEl.textContent = roomId;
    userIdEl.textContent = userId;
    roomCapacityEl.textContent = capacity;
    roleEl.textContent = "Anfitrión"; // Corregido: Muestra Rol Dinámico
    shareLinkEl.value = link;

    homeSection.classList.add("hidden");
    roomSection.classList.remove("hidden");

    // Dibujar lista inicial con solo el Host presente
    updateParticipantsUI();

    // Inicializar PeerJS como Host
    initPeer(roomId, true);
});

// --- ENVIAR MENSAJE (CLICK) ---
sendBox.addEventListener("click", () => {
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
        
        // Actualizaciones de la interfaz del invitado
        roomIdEl.textContent = roomParam;
        userIdEl.textContent = myUserId;
        roomCapacityEl.textContent = "N/A"; // Corregido: Capacidad N/A asignada explícitamente
        roleEl.textContent = "Invitado";    // Corregido: Muestra Rol Dinámico
        shareLinkEl.value = window.location.href;

        homeSection.classList.add("hidden");
        roomSection.classList.remove("hidden");

        // Dibujar lista inicial con solo el Invitado presente
        updateParticipantsUI();

        // Inicializar PeerJS como invitado
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

// --- DESTRUIR / SALIR DE SALA ---
destroyRoomBtn.addEventListener("click", () => {
    const confirmDelete = confirm("Esta acción te desconectará de la sala.");
    if (!confirmDelete) return;

    if (peer) {
        peer.destroy(); 
    }

    roomIdEl.textContent = "";
    userIdEl.textContent = "";
    roomCapacityEl.textContent = "";
    roleEl.textContent = "-";
    shareLinkEl.value = "";
    messagesContainer.innerHTML = ""; 
    participantsListEl.innerHTML = "<li>Cargando...</li>";

    roomSection.classList.add("hidden");
    homeSection.classList.remove("hidden");

    window.history.pushState({}, document.title, window.location.pathname);

    alert("Te has desconectado.");
});
