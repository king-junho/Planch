import { Router } from "express";
import {
  deleteBranch,
  getBranchDetail,
  saveBranchVote,
  updateBranch,
} from "../controllers/branchController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:branchId", authenticate, getBranchDetail);
router.put("/:branchId/vote", authenticate, saveBranchVote);
router.put("/:branchId", authenticate, updateBranch);
router.delete("/:branchId", authenticate, deleteBranch);

export default router;
