import { Router } from "express";
import {
  getInviteLinkPreview,
  joinTripRoomByInviteLink,
} from "../controllers/inviteLinkController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:token", getInviteLinkPreview);
router.post("/:token/join", authenticate, joinTripRoomByInviteLink);

export default router;
