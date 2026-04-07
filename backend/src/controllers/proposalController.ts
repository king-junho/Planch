import { Response } from "express";
import {
  getProposalListService,
  createProposalService,
  generateAiProposalsService,
} from "../services/proposalService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const generateAiProposals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const normalizedCount = Number(req.body?.count ?? 2);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if(Number.isNaN(normalizedCount)||normalizedCount<=0){
      return res.status(400).json({message: "count는 1 이상의 숫자여야 합니다."});
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (Number.isNaN(normalizedCount) || normalizedCount <= 0) {
      return res.status(400).json({ message: "count는 1 이상의 숫자여야 합니다." });
    }

    const result = await generateAiProposalsService(tripRoomId, normalizedCount);

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message ==="Trip room is locked"){
      return res.status(409).json({message: "여행방이 확정되어 AI 제안 생성이 불가능합니다."});
    }
    console.error("generateAiProposals error:", error);
    return res.status(500).json({ message: "AI 제안 생성 중 서버 오류가 발생했습니다." });
  }
};

export const getProposalList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const proposals = await getProposalListService(tripRoomId);
    return res.status(200).json(proposals);
  } catch (error) {
    console.error("getProposalList error:", error);
    return res.status(500).json({ message: "장소 제안 목록 조회 중 서버 오류가 발생했습니다." });
  }
};

export const createProposal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const { placeId, estimatedCost, estimatedDuration, comment } = req.body;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!placeId) {
      return res.status(400).json({ message: "placeId는 필수입니다." });
    }

    const proposal = await createProposalService({
      tripRoomId,
      proposerUserId: req.user.id,
      placeId: Number(placeId),
      estimatedCost,
      estimatedDuration,
      comment,
    });

    return res.status(201).json(proposal);
  } catch (error) {
    if (error instanceof Error && error.message === "Trip room is locked"){
      return res.status(409).json({message: "여행방이 확정되어 장소 제안이 불가능합니다."});
    }
    console.error("createProposal error:", error);
    return res.status(500).json({ message: "장소 제안 생성 중 서버 오류가 발생했습니다." });
  }
};