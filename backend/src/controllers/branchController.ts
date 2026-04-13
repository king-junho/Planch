import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  getBranchDetailService,
  saveBranchVoteService,
} from "../services/branchService";

export const getBranchDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const branchId = Number(req.params.branchId);
    const userId = req.user?.id;

    if (Number.isNaN(branchId) || branchId <= 0) {
      return res.status(400).json({ message: "유효하지 않은 branchId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await getBranchDetailService(branchId, userId);

    if (!result.found) {
      return res.status(404).json({ message: "브랜치를 찾을 수 없습니다." });
    }

    if (!result.authorized) {
      return res.status(403).json({ message: "해당 여행방 참여자만 조회할 수 있습니다." });
    }

    return res.status(200).json({
      branchId: result.branch.id,
      name: result.branch.name,
      status: result.branch.status,
      createdBy: result.branch.createdBy,
      aiReason: result.branch.aiReason,
      metrics: {
        totalCost: result.branch.totalCost,
        totalTravelTime: result.branch.totalTravelTime,
        preferenceScore: result.branch.preferenceScore,
        densityScore: result.branch.densityScore,
      },
      places: result.branch.branchPlaces.map((branchPlace) => ({
        dayNo: branchPlace.dayNo,
        orderIndex: branchPlace.orderIndex,
        startTime: branchPlace.startTime,
        endTime: branchPlace.endTime,
        proposalId: branchPlace.proposalId,
        place: {
          id: branchPlace.place.id,
          name: branchPlace.place.name,
          address: branchPlace.place.address,
          category: branchPlace.place.category,
          latitude: Number(branchPlace.place.latitude),
          longitude: Number(branchPlace.place.longitude),
        },
      })),
    });
  } catch (error) {
    console.error("getBranchDetail error:", error);
    return res.status(500).json({ message: "브랜치 조회 실패" });
  }
};

export const saveBranchVote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const branchId = Number(req.params.branchId);
    const userId = req.user?.id;
    const normalizedVoteType = String(req.body.voteType).trim().toLowerCase();

    if (Number.isNaN(branchId) || branchId <= 0) {
      return res.status(400).json({ message: "유효하지 않은 branchId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!["agree", "hold", "disagree"].includes(normalizedVoteType)) {
      return res.status(400).json({ message: "유효하지 않은 voteType입니다." });
    }

    const result = await saveBranchVoteService(branchId, userId, normalizedVoteType as "agree" | "hold" | "disagree");

    if (!result.found) {
      return res.status(404).json({ message: "브랜치를 찾을 수 없습니다." });
    }

    if (!result.authorized) {
      return res.status(403).json({ message: "해당 여행방 참여자만 투표할 수 있습니다." });
    }

    if (result.locked) {
      return res.status(409).json({ message: "이미 확정된 일정은 투표할 수 없습니다." });
    }

    return res.status(200).json({
      branchId: result.vote.branchId,
      userId: result.vote.userId,
      voteType: result.vote.voteType,
      saved: true,
    });
  } catch (error) {
    console.error("saveBranchVote error:", error);
    return res.status(500).json({ message: "브랜치 투표 저장 실패" });
  }
};