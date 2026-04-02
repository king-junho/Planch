import { Request, Response } from "express";
import {
  getProposalListService,
  createProposalService,
} from "../services/proposalService";

export const getProposalList = async (req: Request, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    const proposals = await getProposalListService(tripRoomId);
    return res.status(200).json(proposals);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "장소 제안 목록 조회 중 서버 오류가 발생했습니다." });
  }
};

export const createProposal = async (req: Request, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const { proposerUserId, placeId, estimatedCost, estimatedDuration, comment } = req.body;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!proposerUserId || !placeId) {
      return res.status(400).json({ message: "proposerUserId와 placeId는 필수입니다." });
    }

    const proposal = await createProposalService({
      tripRoomId,
      proposerUserId,
      placeId,
      estimatedCost,
      estimatedDuration,
      comment,
    });

    return res.status(201).json(proposal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "장소 제안 생성 중 서버 오류가 발생했습니다." });
  }
};