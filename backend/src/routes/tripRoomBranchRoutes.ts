import { Router } from "express";
import {
  createBranch,
  generateAiBranches,
  getBranchCompare,
  getBranchList,
} from "../controllers/tripRoomBranchController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:tripRoomId/branches", authenticate, getBranchList);
router.get("/:tripRoomId/branches/compare", authenticate, getBranchCompare);
router.post("/:tripRoomId/branches/generate-ai", authenticate, generateAiBranches);
router.post("/:tripRoomId/branches", authenticate, createBranch);

export default router;
