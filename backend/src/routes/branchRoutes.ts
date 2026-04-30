import { Router } from "express";
import {
  getBranchDetail,
  saveBranchVote,
  updateBranch,
} from "../controllers/branchController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:branchId", authenticate, getBranchDetail);
router.put("/:branchId/vote", authenticate, saveBranchVote);
router.put("/:branchId", authenticate, updateBranch);

export default router;
