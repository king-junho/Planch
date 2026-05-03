const { io } = require("socket.io-client");

const SERVER_URL = "http://127.0.0.1:4000";
const TRIP_ROOM_ID = 8;

const HOST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIxLCJlbWFpbCI6Imp1bmhvMkB0ZXN0LmNvbSIsImlhdCI6MTc3NzQ3ODMzNywiZXhwIjoxNzc4MDgzMTM3fQ.M13HAXzzNoRv7MVvquMZuSSsZwM_DxEsJAtIabOa3BY";
const MEMBER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIyLCJlbWFpbCI6Imp1bmhvM0B0ZXN0LmNvbSIsImlhdCI6MTc3NzQ3ODI2MCwiZXhwIjoxNzc4MDgzMDYwfQ.WrDEkP4aONG0yJ62y8nSmP8aGX9ReUnJsXe0OWHo2SM";

function createClient(name, token) {
  const socket = io(SERVER_URL, {
    auth: {
      token,
    },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log(`[${name}] connected:`, socket.id);

    socket.emit("chat:join", { tripRoomId: TRIP_ROOM_ID }, (ack) => {
      console.log(`[${name}] join ack:`, ack);
    });
  });

  socket.on("chat:message", (message) => {
    console.log(`[${name}] received chat:message ->`, message);
  });

  socket.on("disconnect", () => {
    console.log(`[${name}] disconnected`);
  });

  socket.on("connect_error", (err) => {
    console.log(`[${name}] connect_error:`, err.message);
  });

  return socket;
}

const host = createClient("HOST", HOST_TOKEN);
const member = createClient("MEMBER", MEMBER_TOKEN);

// 3초 뒤 호스트가 메시지 전송
setTimeout(() => {
  host.emit(
    "chat:send",
    {
      tripRoomId: TRIP_ROOM_ID,
      content: "안녕하세요, 실시간 테스트입니다.",
    },
    (ack) => {
      console.log("[HOST] send ack:", ack);
    }
  );
}, 3000);

// 8초 뒤 종료
setTimeout(() => {
  host.disconnect();
  member.disconnect();
  process.exit(0);
}, 8000);