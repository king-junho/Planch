import { Router } from "express";
import {
  generateAiBranches,
  getBranchCompare,
  getBranchList,
} from "../controllers/tripRoomBranchController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:tripRoomId/branches", authenticate, getBranchList);
router.get("/:tripRoomId/branches/compare", authenticate, getBranchCompare);
router.post("/:tripRoomId/branches/generate-ai", authenticate, generateAiBranches);

export default router;
