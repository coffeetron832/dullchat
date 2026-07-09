const createRoomBtn = document.getElementById("createRoom");
const roomSection = document.getElementById("room");
const homeSection = document.getElementById("home");

const roomIdEl = document.getElementById("roomId");
const userIdEl = document.getElementById("userId");
const roomCapacityEl = document.getElementById("roomCapacity");
const shareLinkEl = document.getElementById("shareLink");

const copyLinkBtn = document.getElementById("copyLink");
const destroyRoomBtn = document.getElementById("destroyRoom");

function generateUserId() {
    const number = Math.floor(
        1000 + Math.random() * 9000
    );

    return `d${number}`;
}

function generateRoomId() {
    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let first = "";
    let second = "";

    for (let i = 0; i < 4; i++) {
        first += chars[Math.floor(Math.random() * chars.length)];
        second += chars[Math.floor(Math.random() * chars.length)];
    }

    return `${first}-${second}`;
}

createRoomBtn.addEventListener("click", () => {

    const capacity =
        document.getElementById("capacity").value;

    const roomId = generateRoomId();
    const userId = generateUserId();

    const link =
        `${window.location.origin}?room=${roomId}`;

    roomIdEl.textContent = roomId;
    userIdEl.textContent = userId;
    roomCapacityEl.textContent = capacity;
    shareLinkEl.value = link;

    homeSection.classList.add("hidden");
    roomSection.classList.remove("hidden");
});

copyLinkBtn.addEventListener("click", async () => {

    try {

        await navigator.clipboard.writeText(
            shareLinkEl.value
        );

        alert("Enlace copiado.");

    } catch {

        alert("No se pudo copiar.");
    }
});

destroyRoomBtn.addEventListener("click", () => {

    const confirmDelete = confirm(
        "Esta acción eliminará la sala permanentemente."
    );

    if (!confirmDelete) return;

    roomIdEl.textContent = "";
    userIdEl.textContent = "";
    roomCapacityEl.textContent = "";
    shareLinkEl.value = "";

    roomSection.classList.add("hidden");
    homeSection.classList.remove("hidden");

    alert("Sala destruida.");
});
