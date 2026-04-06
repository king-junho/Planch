import { Router } from "express";
import {
  generateAiBranches,
  getBranchList,
} from "../controllers/tripRoomBranchController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:tripRoomId/branches", authenticate, getBranchList);
router.post("/:tripRoomId/branches/generate-ai", authenticate, generateAiBranches);

export default router;
