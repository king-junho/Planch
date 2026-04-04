import { Router } from "express";
import {
  getProposalList,
  createProposal,
  generateAiProposals,
} from "../controllers/proposalController";

const router = Router();

router.get("/:tripRoomId/proposals", getProposalList);
router.post("/:tripRoomId/proposals", createProposal);
router.post("/:tripRoomId/proposals/generate-ai", generateAiProposals);
export default router;