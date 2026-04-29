import type { Server, Socket } from "socket.io";
import prisma from "../lib/prisma";
import { sendTripRoomChatMessageService } from "../services/chatService";

const getRoomName = (tripRoomId: number) => `trip-room:${tripRoomId}`;

export const registerChatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("socket connected:", socket.id);

    socket.on("chat:join", async (payload, callback) => {
      try {
        const user = socket.data.user as { id: number; email: string } | undefined;

        if (!user) {
          callback?.({ ok: false, message: "인증이 필요합니다." });
          return;
        }

        const tripRoomId = Number(payload?.tripRoomId);

        if (Number.isNaN(tripRoomId)) {
          callback?.({ ok: false, message: "유효하지 않은 tripRoomId입니다." });
          return;
        }

        const membership = await prisma.tripMember.findUnique({
          where: {
            tripRoomId_userId: {
              tripRoomId,
              userId: user.id,
            },
          },
          select: {
            id: true,
          },
        });

        if (!membership) {
          callback?.({ ok: false, message: "해당 여행방 참여자만 채팅에 참여할 수 있습니다." });
          return;
        }

        socket.join(getRoomName(tripRoomId));

        callback?.({
          ok: true,
          tripRoomId,
          room: getRoomName(tripRoomId),
        });
      } catch (error) {
        console.error("chat:join error:", error);
        callback?.({ ok: false, message: "채팅방 입장 중 서버 오류가 발생했습니다." });
      }
    });

    socket.on("chat:leave", async (payload, callback) => {
      try {
        const tripRoomId = Number(payload?.tripRoomId);

        if (Number.isNaN(tripRoomId)) {
          callback?.({ ok: false, message: "유효하지 않은 tripRoomId입니다." });
          return;
        }

        socket.leave(getRoomName(tripRoomId));

        callback?.({
          ok: true,
          tripRoomId,
        });
      } catch (error) {
        console.error("chat:leave error:", error);
        callback?.({ ok: false, message: "채팅방 퇴장 중 서버 오류가 발생했습니다." });
      }
    });

    socket.on("chat:send", async (payload, callback) => {
      try {
        const user = socket.data.user as { id: number; email: string } | undefined;

        if (!user) {
          callback?.({ ok: false, message: "인증이 필요합니다." });
          return;
        }

        const tripRoomId = Number(payload?.tripRoomId);
        const content = payload?.content;

        if (Number.isNaN(tripRoomId)) {
          callback?.({ ok: false, message: "유효하지 않은 tripRoomId입니다." });
          return;
        }

        if (typeof content !== "string") {
          callback?.({ ok: false, message: "content는 문자열이어야 합니다." });
          return;
        }

        const savedMessage = await sendTripRoomChatMessageService(
          tripRoomId,
          user.id,
          content,
        );

        io.to(getRoomName(tripRoomId)).emit("chat:message", savedMessage);

        callback?.({
          ok: true,
          message: savedMessage,
        });
      } catch (error) {
        console.error("chat:send error:", error);

        if (error instanceof Error && error.message === "Empty content") {
          callback?.({ ok: false, message: "빈 메시지는 전송할 수 없습니다." });
          return;
        }

        if (error instanceof Error && error.message === "Trip room not found") {
          callback?.({ ok: false, message: "여행방을 찾을 수 없습니다." });
          return;
        }

        if (error instanceof Error && error.message === "Forbidden") {
          callback?.({ ok: false, message: "해당 여행방 참여자만 메시지를 전송할 수 있습니다." });
          return;
        }

        callback?.({ ok: false, message: "메시지 전송 중 서버 오류가 발생했습니다." });
      }
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected:", socket.id);
    });
  });
};