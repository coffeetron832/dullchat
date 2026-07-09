const createRoomBtn = document.getElementById("createRoom");
const roomSection = document.getElementById("room");
const homeSection = document.getElementById("home");

const roomIdEl = document.getElementById("roomId");
const userIdEl = document.getElementById("userId");
const roomCapacityEl = document.getElementById("roomCapacity");
const shareLinkEl = document.getElementById("shareLink");

const copyLinkBtn = document.getElementById("copyLink");
const destroyRoomBtn = document.getElementById("destroyRoom");

// --- NUEVOS ELEMENTOS PARA MENSAJES (Asegúrate de tenerlos en tu HTML) ---
const messageInput = document.getElementById("messageInput"); // <input> o <textarea>
const sendBox = document.getElementById("sendBox"); // <button> para enviar
const messagesContainer = document.getElementById("messages"); // <div> para mostrar chats

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

// --- FUNCIÓN PARA INICIALIZAR PEERJS ---
function initPeer(userId, isHost, targetRoomId = null) {
    // Creamos el objeto Peer usando el servidor gratuito de PeerJS
    peer = new Peer(userId, {
        debug: 1 // Cambia a 3 si necesitas ver logs detallados en consola
    });

    peer.on('open', (id) => {
        console.log('Mi ID de PeerJS es: ' + id);
        
        // Si NO eres el host, debes intentar conectarte al creador de la sala
        if (!isHost && targetRoomId) {
            // Nota: En un P2P puro sin servidor de señalización complejo, 
            // asumiremos que el Host usa el 'roomId' como su propio ID de Peer para simplificar.
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
        appendMessage("Sistema", `Usuario ${conn.peer} se ha unido.`, "system");
    });

    // Escuchar mensajes de texto recibidos
    conn.on('data', (data) => {
        // Asumimos que data viene como objeto: { sender: 'd123', text: 'hola' }
        appendMessage(data.sender, data.text, "received");
        
        // Si eres el Host, reenvías este mensaje al resto para que todos lo lean
        if (roomIdEl.textContent === peer.id) {
            broadcastMessage(data, conn.peer);
        }
    });

    conn.on('close', () => {
        console.log("Conexión cerrada con: " + conn.peer);
        connections = connections.filter(c => c.peer !== conn.peer);
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
    msgDiv.classList.add("message", type); // Puedes usar CSS para dar estilos (ej. Izquierda/Derecha)
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll al final
}

// --- EVENTO: CREAR SALA (HOST) ---
createRoomBtn.addEventListener("click", () => {
    const capacity = document.getElementById("capacity").value;
    const roomId = generateRoomId();
    
    // Para simplificar la arquitectura Mesh (P2P), el Host usará el roomId como su ID de Peer.
    // Así, los invitados solo necesitan saber el roomId para conectarse directamente a él.
    const userId = `Host-${generateUserId()}`; 

    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

    roomIdEl.textContent = roomId;
    userIdEl.textContent = userId;
    roomCapacityEl.textContent = capacity;
    shareLinkEl.value = link;

    homeSection.classList.add("hidden");
    roomSection.classList.remove("hidden");

    // Inicializar PeerJS como Host (el ID de su peer será el roomId)
    initPeer(roomId, true);
});

// --- ENVIAR MENSAJE (CLICK O ENTER) ---
sendBox.addEventListener("click", () => {
    const text = messageInput.value.trim();
    if (!text) return;

    const messageObj = {
        sender: userIdEl.textContent,
        text: text
    };

    // Mostrar en mi propia pantalla
    appendMessage("Tú", text, "sent");

    // Enviar a todos los conectados
    broadcastMessage(messageObj);

    messageInput.value = "";
});

// --- EVENTO: DETECTAR SI ENTRA POR LINK DE INVITACIÓN ---
window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');

    if (roomParam) {
        // Estamos entrando a una sala existente como invitados
        const myUserId = generateUserId();
        
        roomIdEl.textContent = roomParam;
        userIdEl.textContent = myUserId;
        roomCapacityEl.textContent = "N/A"; // El host maneja esto, o puedes omitirlo
        shareLinkEl.value = window.location.href;

        homeSection.classList.add("hidden");
        roomSection.classList.remove("hidden");

        // Inicializar PeerJS como invitado. Su ID será su userId, y buscará conectar con roomParam (el Host)
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

// --- DESTRUIR SALA ---
destroyRoomBtn.addEventListener("click", () => {
    const confirmDelete = confirm("Esta acción te desconectará de la sala.");
    if (!confirmDelete) return;

    if (peer) {
        peer.destroy(); // Cierra todas las conexiones y destruye el nodo peer
    }

    roomIdEl.textContent = "";
    userIdEl.textContent = "";
    roomCapacityEl.textContent = "";
    shareLinkEl.value = "";
    messagesContainer.innerHTML = ""; // Limpiar chat

    roomSection.classList.add("hidden");
    homeSection.classList.remove("hidden");

    // Limpiar la URL de la barra de direcciones para quitar el ?room=...
    window.history.pushState({}, document.title, window.location.pathname);

    alert("Te has desconectado.");
});
