import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  createInviteLinkService,
  joinTripRoomByInviteLinkService,
} from "../services/inviteLinkService";

export const createInviteLink = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await createInviteLinkService(tripRoomId, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("createInviteLink error:", error);

    if (error instanceof Error && error.message === "Trip room not found") {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Host only") {
      return res
        .status(403)
        .json({ message: "호스트만 초대 링크를 생성할 수 있습니다." });
    }

    return res
      .status(500)
      .json({ message: "초대 링크 생성 중 서버 오류가 발생했습니다." });
  }
};

export const joinTripRoomByInviteLink = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const rawToken = req.params.token;
    const token = typeof rawToken === "string" ? rawToken.trim() : "";
    const userId = req.user?.id;

    if (!token) {
      return res.status(400).json({ message: "유효하지 않은 token입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await joinTripRoomByInviteLinkService(token, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("joinTripRoomByInviteLink error:", error);

    if (error instanceof Error && error.message === "Invite link not found") {
      return res
        .status(404)
        .json({ message: "유효하지 않거나 만료된 초대 링크입니다." });
    }

    if (error instanceof Error && error.message === "Invite link expired") {
      return res
        .status(410)
        .json({ message: "유효하지 않거나 만료된 초대 링크입니다." });
    }

    if (error instanceof Error && error.message === "Trip room not found") {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    return res
      .status(500)
      .json({ message: "여행방 참여 처리 중 서버 오류가 발생했습니다." });
  }
};
