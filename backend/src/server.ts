import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { socketAuthMiddleware } from "./socket/authSocketMiddleware";
import { registerChatSocket } from "./socket/chatSocket";
import { registerCollaborationSocket } from "./socket/collaborationSocket";

const PORT = Number(process.env.PORT) || 4000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

io.use(socketAuthMiddleware);
registerChatSocket(io);
registerCollaborationSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})