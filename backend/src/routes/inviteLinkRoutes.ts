import { Router } from "express";
import { joinTripRoomByInviteLink } from "../controllers/inviteLinkController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.post("/:token/join", authenticate, joinTripRoomByInviteLink);

export default router;
