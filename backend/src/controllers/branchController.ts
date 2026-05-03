import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  deleteBranchService,
  getBranchDetailService,
  saveBranchVoteService,
  updateBranchService,
} from "../services/branchService";

export const deleteBranch = async(req: AuthenticatedRequest, res: Response) => {
  try{
    const branchId = Number(req.params.branchId);
    const userId = req.user?.id;

    if(Number.isNaN(branchId) || branchId <= 0){
      return res.status(400).json({ message: "유효하지 않은 branchId입니다." });
    }

    if(!userId){
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await deleteBranchService(branchId, userId);
    return res.status(200).json(result);
  }catch(error){
    if (error instanceof Error && error.message === "Branch not found") {
      return res.status(404).json({ message: "브랜치를 찾을 수 없습니다." });
    }

    if(error instanceof Error && error.message === "Forbidden"){
      return res.status(403).json({ message: "해당 여행방 참여자만 브랜치를 삭제할 수 있습니다." });
    }

    if (error instanceof Error && error.message === "Delete forbidden") {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    if (error instanceof Error && error.message === "Trip room is locked") {
      return res.status(409).json({ message: "여행방이 확정되어 브랜치를 삭제할 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Branch is locked") {
      return res.status(409).json({ message: "확정된 브랜치는 삭제할 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Selected branch cannot be deleted") {
      return res.status(409).json({ message: "최종 선택된 브랜치는 삭제할 수 없습니다." });
    }

    console.error("deleteBranch error:", error); 
    return res.status(500).json({ message: "브랜치 삭제 실패" });
  }
};

export const updateBranch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const branchId = Number(req.params.branchId);
    const userId = req.user?.id;
    const { name, places } = req.body;

    if (Number.isNaN(branchId)) {
      return res.status(400).json({ message: "유효하지 않은 branchId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await updateBranchService({
      branchId,
      userId,
      name,
      places,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Branch not found") {
      return res.status(404).json({ message: "브랜치를 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return res.status(403).json({ message: "해당 여행방 참여자만 브랜치를 수정할 수 있습니다." });
    }

    if (error instanceof Error && error.message === "Trip room is locked") {
      return res.status(409).json({ message: "여행방이 확정되어 브랜치를 수정할 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Branch is locked") {
      return res.status(409).json({ message: "확정된 브랜치는 수정할 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Branch name is required") {
      return res.status(400).json({ message: "브랜치 이름은 필수입니다." });
    }

    if (error instanceof Error && error.message === "Places are required") {
      return res.status(400).json({ message: "places는 1개 이상이어야 합니다." });
    }

    console.error("updateBranch error:", error);
    return res.status(500).json({ message: "브랜치 수정 실패" });
  }
};

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

    return res.status(200).json(result.data);
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