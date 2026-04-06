import { Router } from "express";
import {
  getBranchDetail,
  saveBranchVote,
} from "../controllers/branchController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:branchId", authenticate, getBranchDetail);
router.put("/:branchId/vote", authenticate, saveBranchVote);

export default router;
