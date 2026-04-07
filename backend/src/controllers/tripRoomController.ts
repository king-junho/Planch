import { Response } from "express";
import {
  getTripRoomDetailService,
  createTripRoomService,
  finalizeTripRoomService,
  saveMyPreferenceService,
  getPreferenceListService,
} from "../services/tripRoomService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const getPreferenceList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const preferences = await getPreferenceListService(tripRoomId);
    return res.status(200).json(preferences);
  } catch (error) {
    console.error("getPreferenceList error:", error);
    return res.status(500).json({ message: "선호 목록 조회 중 서버 오류가 발생했습니다." });
  }
};

export const saveMyPreference = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const {
      budgetMin,
      budgetMax,
      styles,
      mustVisit,
      avoid,
      availableTime,
    } = req.body;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await saveMyPreferenceService({
      tripRoomId,
      userId: req.user.id,
      budgetMin,
      budgetMax,
      styles,
      mustVisit,
      avoid,
      availableTime,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message ==="Trip roomm is locked"){
      return res.status(409).json({message: "여행방이 확정되어 선호 입력이 불가능합니다."});
    }
    console.error("saveMyPreference error:", error);
    return res.status(500).json({ message: "선호 입력 저장 중 서버 오류가 발생했습니다." });
  }
};

export const getTripRoomDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const tripRoom = await getTripRoomDetailService(tripRoomId);

    if (!tripRoom) {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    return res.status(200).json(tripRoom);
  } catch (error) {
    console.error("getTripRoomDetail error:", error);
    return res.status(500).json({ message: "여행방 조회 중 서버 오류가 발생했습니다." });
  }
};

export const createTripRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, startDate, endDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "title은 필수입니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const newTripRoom = await createTripRoomService({
      title,
      startDate,
      endDate,
      hostUserId: req.user.id,
    });

    return res.status(201).json(newTripRoom);
  } catch (error) {
    console.error("createTripRoom error:", error);
    return res.status(500).json({ message: "여행방 생성 중 서버 오류가 발생했습니다." });
  }
};

export const finalizeTripRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;
    const { branchId } = req.body;
    const normalizedBranchId = Number(branchId);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (Number.isNaN(normalizedBranchId)) {
      return res.status(400).json({ message: "유효하지 않은 branchId입니다." });
    }

    const result = await finalizeTripRoomService(tripRoomId, normalizedBranchId, userId);

    if (result === null) {
      return res.status(403).json({ message: "호스트만 최종 확정할 수 있습니다." });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("finalizeTripRoom error:", error);

    if (error instanceof Error && error.message === "Trip room not found") {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Branch not found") {
      return res.status(404).json({ message: "브랜치를 찾을 수 없습니다." });
    }

    return res.status(500).json({ message: "최종 확정 실패" });
  }
};