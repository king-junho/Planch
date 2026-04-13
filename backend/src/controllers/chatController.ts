import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  getMyChatRoomsService,
  getTripRoomChatMessagesService,
  sendTripRoomChatMessageService,
} from "../services/chatService";

export const getMyChatRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await getMyChatRoomsService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("getMyChatRooms error:", error);
    return res.status(500).json({ message: "채팅방 목록 조회 중 서버 오류가 발생했습니다." });
  }
};

export const getTripRoomChatMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await getTripRoomChatMessagesService(tripRoomId, userId);

    if (!result.found) {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (!result.authorized) {
      return res.status(403).json({ message: "해당 여행방 참여자만 채팅을 조회할 수 있습니다." });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getTripRoomChatMessages error:", error);
    return res.status(500).json({ message: "채팅 조회 중 서버 오류가 발생했습니다." });
  }
};

export const sendTripRoomChatMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;
    const { content } = req.body;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (typeof content !== "string") {
      return res.status(400).json({ message: "content는 문자열이어야 합니다." });
    }

    const result = await sendTripRoomChatMessageService(tripRoomId, userId, content);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Empty content") {
      return res.status(400).json({ message: "빈 메시지는 전송할 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Trip room not found") {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return res.status(403).json({ message: "해당 여행방 참여자만 메시지를 전송할 수 있습니다." });
    }

    console.error("sendTripRoomChatMessage error:", error);
    return res.status(500).json({ message: "메시지 전송 중 서버 오류가 발생했습니다." });
  }
};