import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  generateAiBranchesService,
  getBranchCompareService,
  getBranchListService,
} from "../services/tripRoomBranchService";

export const getBranchList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await getBranchListService(tripRoomId, userId);

    if (!result.found){
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if(!result.authorized){
      return res.status(403).json({ message: "해당 여행방 참여자만 브랜치 목록을 조회할 수 있습니다." });
    }

    return res.status(200).json(
      result.branches.map((branch)=>({
        branchId: branch.id,
        name: branch.name,
        createdBy : branch.createdBy,
        status: branch.status,
        totalCost: branch.totalCost,
        totalTravelTime: branch.totalTravelTime,
        preferenceScore: branch.preferenceScore,
        densityScore: branch.densityScore,
        aiReason: branch.aiReason,
      })),
    );
  } catch (error) {
    console.error("getBranchList error:", error);
    return res.status(500).json({ message: "브랜치 목록 조회 실패" });
  }
};

export const getBranchCompare = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await getBranchCompareService(tripRoomId, userId);

    if (!result.found) {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (!result.authorized) {
      return res.status(403).json({ message: "해당 여행방 참여자만 브랜치 비교를 조회할 수 있습니다." });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getBranchCompare error:", error);
    return res.status(500).json({ message: "브랜치 비교 조회 실패" });
  }
};

export const generateAiBranches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;
    const { branchCount = 3 } = req.body;
    const normalizedBranchCount = Number(branchCount);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (Number.isNaN(normalizedBranchCount)) {
      return res.status(400).json({ message: "유효하지 않은 branchCount입니다." });
    }

    const result = await generateAiBranchesService(tripRoomId, userId, normalizedBranchCount);

    if (result === null) {
      return res.status(403).json({ message: "해당 여행방 참여자만 생성할 수 있습니다." });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("generateAiBranches error:", error);

    if (error instanceof Error && error.message === "Trip room is locked") {
      return res.status(409).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "No proposals available") {
      return res.status(400).json({ message: "브랜치 생성에 사용할 장소 제안이 없습니다." });
    }

    return res.status(500).json({ message: "브랜치 생성 실패" });
  }
};
