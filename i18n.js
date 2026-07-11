// i18n.js

export const translations = {
    es: {
        // Nuevas claves añadidas para resolver el problema de strings sin procesar
        appSubtitle: "Un espacio minimalista, seguro y sin rastro.",
        roomCapacityLabel: "Capacidad de la sala:",

        createRoom: "Crear Sala",
        destroyRoom: "Destruir sala",
        leaveRoom: "Abandonar sala",
        copyLink: "Copiar",
        send: "Enviar",
        role: "Rol",
        host: "Anfitrión",
        guest: "Invitado",
        connected: "Conectados",
        statusOnline: "Conectado",
        statusConnecting: "Reconectando...",
        statusOffline: "Sin conexión",
        connectionStatusOnline: "Conectado",
        connectionStatusConnecting: "Reconectando...",
        connectionStatusOffline: "Sin conexión",
        placeholderMessage: "Escribe un mensaje cifrado...",
        you: "Tú",
        system: "Sistema",
        loading: "Cargando...",
        connectingGuest: "Conectando...",
        hostVerifying: "Anfitrión (Verificando...)",
        alertCopied: "Enlace copiado.",
        alertNotCopied: "No se pudo copiar.",
        alertConfirmDestroy: "Esta acción eliminará la sala permanentemente para todos.",
        alertConfirmLeave: "¿Seguro que deseas abandonar la sala?",
        alertRoomDestroyed: "Sala destruida.",
        alertLeftRoom: "Has abandonado la sala.",
        alertMutedByHost: "Has sido silenciado por el anfitrión de la sala.",
        alertUnmutedByHost: "El anfitrión ha reactivado tu micrófono.",
        alertKicked: "Has sido expulsado de la sala por el anfitrión.",
        btnMute: "Silenciar",
        btnUnmute: "Reactivar",
        btnKick: "Expulsar",
        systemUserJoined: "Usuario {userId} se ha unido.",
        systemUserLeft: "Usuario {userId} ha salido.",
        systemJoinedToHost: "Te has unido a la sala del usuario {userId}.",
        alertHostLeft: "El anfitrión ha cerrado esta sala. Redirigiendo al inicio...",
        alertLostHost: "Se perdió la conexión con el anfitrión. La sala ya no está disponible.",
        alertErrorRoom: "La sala a la que intentas acceder ya no existe, está llena o el enlace es inválido.",
        alertErrorSignal: "Te has desconectado del servidor de emparejamiento de forma permanente.",
        alertErrorIncompatible: "Tu navegador no es compatible con la tecnología P2P de esta aplicación.",
        alertErrorInfrastructure: "No se pudo mantener la infraestructura de conexión estable con la sala.",
        legalTitle: "Descargo de Responsabilidad y Privacidad",
        legalBody: `
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
        `
    },
    en: {
        // Nuevas claves añadidas para resolver el problema de strings sin procesar
        appSubtitle: "A minimalist, secure, and traceless space.",
        roomCapacityLabel: "Room capacity:",

        createRoom: "Create Room",
        destroyRoom: "Destroy room",
        leaveRoom: "Leave room",
        copyLink: "Copy",
        send: "Send",
        role: "Role",
        host: "Host",
        guest: "Guest",
        connected: "Connected",
        statusOnline: "Connected",
        statusConnecting: "Reconnecting...",
        statusOffline: "No connection",
        connectionStatusOnline: "Connected",
        connectionStatusConnecting: "Reconnecting...",
        connectionStatusOffline: "No connection",
        placeholderMessage: "Type an encrypted message...",
        you: "You",
        system: "System",
        loading: "Loading...",
        connectingGuest: "Connecting...",
        hostVerifying: "Host (Verifying...)",
        alertCopied: "Link copied.",
        alertNotCopied: "Could not copy link.",
        alertConfirmDestroy: "This action will permanently delete the room for everyone.",
        alertConfirmLeave: "Are you sure you want to leave the room?",
        alertRoomDestroyed: "Room destroyed.",
        alertLeftRoom: "You have left the room.",
        alertMutedByHost: "You have been muted by the room host.",
        alertUnmutedByHost: "The host has unmuted your microphone.",
        alertKicked: "You have been kicked from the room by the host.",
        btnMute: "Mute",
        btnUnmute: "Unmute",
        btnKick: "Kick",
        systemUserJoined: "User {userId} has joined.",
        systemUserLeft: "User {userId} has left.",
        systemJoinedToHost: "You have joined user {userId}'s room.",
        alertHostLeft: "The host has closed this room. Redirecting to home...",
        alertLostHost: "Connection lost with the host. The room is no longer available.",
        alertErrorRoom: "The room you are trying to access no longer exists, is full, or the link is invalid.",
        alertErrorSignal: "You have been permanently disconnected from the signaling server.",
        alertErrorIncompatible: "Your browser is not compatible with this application's P2P technology.",
        alertErrorInfrastructure: "Could not maintain a stable connection infrastructure with the room.",
        legalTitle: "Privacy & Disclaimer",
        legalBody: `
            <p><strong>dullchat</strong> is an experimental, serverless, distributed instant messaging platform built with absolute privacy principles.</p>
            <h3>1. Nature of Service and Encryption</h3>
            <p>All communication between devices is protected using end-to-end encryption (E2EE).</p>
            <ul>
                <li><strong>No central storage:</strong> Messages, files, credentials, and metadata are processed strictly locally in your browser and transmitted peer-to-peer (P2P).</li>
                <li>We do not maintain database servers or backups. Once the room or tab is closed, data is permanently and irretrievably deleted.</li>
            </ul>
            <h3>2. Content Disclaimer</h3>
            <p>Due to the decentralized architecture of the application, developers cannot intercept, audit, moderate, or block content in any room.</p>
            <ul>
                <li>The user is solely and exclusively responsible for any information shared during sessions.</li>
                <li> We assume no legal liability for improper, unlawful, defamatory, or fraudulent uses of the service.</li>
            </ul>
        `
    }
};

// Variable global interna para rastrear el idioma activo
let currentLang = localStorage.getItem("dullchat_lang") || "es";

export function getLang() {
    return currentLang;
}

export function setLang(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem("dullchat_lang", lang);
        applyTranslations();
    }
}

// Devuelve una cadena traducida resolviendo placeholders dinámicos como {userId}
export function t(key, variables = {}) {
    let text = translations[currentLang]?.[key] || translations["es"]?.[key] || key;
    Object.keys(variables).forEach(v => {
        text = text.replace(`{${v}}`, variables[v]);
    });
    return text;
}

// Escanea el DOM buscando elementos con el atributo data-i18n o data-i18n-placeholder
export function applyTranslations() {
    // Traducir contenido de texto normal
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = t(key);
    });

    // Traducir placeholders específicos de inputs y textareas
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.placeholder = t(key);
    });
}
