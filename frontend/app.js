const healthStatus = document.getElementById("healthStatus");
const createRoomForm = document.getElementById("createRoomForm");
const createRoomResult = document.getElementById("createRoomResult");
const loadRoomForm = document.getElementById("loadRoomForm");
const roomSummary = document.getElementById("roomSummary");
const roomDetail = document.getElementById("roomDetail");
const healthButton = document.getElementById("healthButton");

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const rawText = await response.text();
  const data = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
    throw new Error(data?.message ?? "요청에 실패했습니다.");
  }

  return data;
}

function formatJson(data) {
  return JSON.stringify(data, null, 2);
}

async function loadHealth() {
  healthStatus.textContent = "서버 상태를 확인하는 중입니다...";

  try {
    const data = await request("/api/health");
    healthStatus.textContent = `정상 연결됨: ${data.status}`;
  } catch (error) {
    healthStatus.textContent = `연결 실패: ${error.message}`;
  }
}

function renderRoomSummary(room) {
  if (!room) {
    roomSummary.innerHTML = "<p>조회된 여행방이 없습니다.</p>";
    return;
  }

  roomSummary.innerHTML = `
    <p><strong>${room.title}</strong></p>
    <p>상태: ${room.status}</p>
    <p>호스트: ${room.hostUser?.name ?? `User #${room.hostUserId}`}</p>
    <p>멤버 수: ${room.members?.length ?? 0}</p>
    <p>제안 수: ${room.proposals?.length ?? 0}</p>
  `;
}

createRoomForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(createRoomForm);
  const payload = {
    title: formData.get("title"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    hostUserId: Number(formData.get("hostUserId")),
  };

  createRoomResult.textContent = "여행방을 생성하는 중입니다...";

  try {
    const room = await request("/trip-rooms", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    createRoomResult.textContent = formatJson(room);
    document.getElementById("tripRoomId").value = String(room.id);
    renderRoomSummary(room);
  } catch (error) {
    createRoomResult.textContent = error.message;
  }
});

loadRoomForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const tripRoomId = document.getElementById("tripRoomId").value;
  roomDetail.textContent = "여행방 정보를 불러오는 중입니다...";

  try {
    const room = await request(`/trip-rooms/${tripRoomId}`);
    renderRoomSummary(room);
    roomDetail.textContent = formatJson(room);
  } catch (error) {
    roomSummary.innerHTML = "<p>불러오기에 실패했습니다.</p>";
    roomDetail.textContent = error.message;
  }
});

healthButton.addEventListener("click", loadHealth);

loadHealth();
