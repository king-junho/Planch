import { Router } from "express";
import {
  getProposalList,
  createProposal,
  generateAiProposals,
  deleteProposal,
} from "../controllers/proposalController";

import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:tripRoomId/proposals", authenticate, getProposalList);

router.post("/:tripRoomId/proposals", authenticate, createProposal);
router.post("/:tripRoomId/proposals/generate-ai", authenticate, generateAiProposals);
router.delete("/:tripRoomId/proposals/:proposalId", authenticate, deleteProposal);

export default router;