import type { Server, Socket } from "socket.io";
import prisma from "../lib/prisma";

const getCollabRoomName = (tripRoomId: number) => `collab:trip-room:${tripRoomId}`;

const USER_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#10b981",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
];

const activeSessions = new Map<number, Map<string, {
    branchId: number | null;
    isCreating: boolean;
    users: Map<number, { name: string; color: string }>;
}>>();

function formatSessions(tripRoomId: number) {
    const roomSessions = activeSessions.get(tripRoomId);
    if (!roomSessions) return [];

    return Array.from(roomSessions.entries()).map(([key, session]) => ({
        sessionKey: key,
        branchId: session.branchId,
        isCreating: session.isCreating,
        users: Array.from(session.users.entries()).map(([id, info]) => ({
            userId: id,
            ...info
        }))
    }));
}

function broadcastSessions(io: Server, tripRoomId: number) {
    io.to(getCollabRoomName(tripRoomId)).emit("collab:active_sessions", formatSessions(tripRoomId));
}

function handleUserLeaveEdit(socket: Socket, tripRoomId: number, io: Server) {
    const collabUser = socket.data.collabUser;
    const sessionKey = socket.data.currentSessionKey;

    if (!collabUser || !sessionKey || !tripRoomId) return;

    const roomSessions = activeSessions.get(tripRoomId);
    if (roomSessions) {
        const session = roomSessions.get(sessionKey);
        if (session) {
            session.users.delete(collabUser.userId);
            if (session.users.size === 0) {
                roomSessions.delete(sessionKey);
            }
            broadcastSessions(io, tripRoomId);
        }
    }
    socket.data.currentSessionKey = null;
}

export const registerCollaborationSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {

        socket.on("collab:join", async (payload, callback) => {
            try {
                const user = socket.data.user as { id: number; email: string } | undefined;
                if (!user) {
                    callback?.({ ok: false, message: "인증이 필요합니다." });
                    return;
                }

                const tripRoomId = Number(payload?.tripRoomId);
                if (Number.isNaN(tripRoomId)) return;

                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { name: true }
                });

                socket.data.collabUser = {
                    userId: user.id,
                    userName: dbUser?.name || `유저 ${user.id}`,
                    color: USER_COLORS[user.id % USER_COLORS.length]
                };
                socket.data.tripRoomId = tripRoomId;

                socket.join(getCollabRoomName(tripRoomId));
                callback?.({ ok: true });

                socket.emit("collab:active_sessions", formatSessions(tripRoomId));
            } catch (error) {
                console.error("collab:join error:", error);
            }
        });

        socket.on("collab:start_edit", (payload) => {
            const collabUser = socket.data.collabUser;
            const tripRoomId = socket.data.tripRoomId;
            if (!collabUser || !tripRoomId) return;

            const branchId = payload?.branchId ? Number(payload.branchId) : null;
            const isCreating = !branchId;
            const sessionKey = isCreating ? "create" : `edit_${branchId}`;

            if (!activeSessions.has(tripRoomId)) {
                activeSessions.set(tripRoomId, new Map());
            }

            const roomSessions = activeSessions.get(tripRoomId)!;
            if (!roomSessions.has(sessionKey)) {
                roomSessions.set(sessionKey, { branchId, isCreating, users: new Map() });
            }

            const session = roomSessions.get(sessionKey)!;
            session.users.set(collabUser.userId, { name: collabUser.userName, color: collabUser.color });

            socket.data.currentSessionKey = sessionKey;
            broadcastSessions(io, tripRoomId);
        });

        socket.on("collab:stop_edit", () => {
            if (socket.data.tripRoomId) {
                handleUserLeaveEdit(socket, socket.data.tripRoomId, io);
            }
        });

        socket.on("collab:cursor_move", (payload) => {
            const collabUser = socket.data.collabUser;
            const tripRoomId = socket.data.tripRoomId;
            const sessionKey = socket.data.currentSessionKey;

            if (!collabUser || !tripRoomId || !sessionKey) return;

            socket.to(getCollabRoomName(tripRoomId)).emit("collab:cursor_moved", {
                userId: collabUser.userId,
                userName: collabUser.userName,
                color: collabUser.color,
                sessionKey: sessionKey,
                x: payload.x,
                y: payload.y
            });
        });

        socket.on("collab:sync_action", (payload) => {
            const tripRoomId = socket.data.tripRoomId;
            const sessionKey = socket.data.currentSessionKey;

            if (!tripRoomId || !sessionKey) return;

            socket.to(getCollabRoomName(tripRoomId)).emit("collab:receive_action", {
                ...payload,
                sessionKey
            });
        });

        socket.on("collab:leave", () => {
            const tripRoomId = socket.data.tripRoomId;
            const collabUser = socket.data.collabUser;

            if (tripRoomId) {
                handleUserLeaveEdit(socket, tripRoomId, io);
                socket.leave(getCollabRoomName(tripRoomId));
                if (collabUser) {
                    socket.to(getCollabRoomName(tripRoomId)).emit("collab:user_left", collabUser.userId);
                }
            }
        });

        socket.on("disconnect", () => {
            const tripRoomId = socket.data.tripRoomId;
            const collabUser = socket.data.collabUser;

            if (tripRoomId) {
                handleUserLeaveEdit(socket, tripRoomId, io);
                if (collabUser) {
                    socket.broadcast.emit("collab:user_left", collabUser.userId);
                }
            }
        });
    });
};