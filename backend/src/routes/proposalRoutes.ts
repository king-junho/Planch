import { Router } from "express";
import {
  getProposalList,
  createProposal,
} from "../controllers/proposalController";

const router = Router();

router.get("/:tripRoomId/proposals", getProposalList);
router.post("/:tripRoomId/proposals", createProposal);

export default router;