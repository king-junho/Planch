import { Router } from "express";
import {
    getMyTripRooms,
    getTripRoomDetail,
    createTripRoom,
    finalizeTripRoom,
    saveMyPreference,
    getPreferenceList,
} from "../controllers/tripRoomController";
import { createInviteLink } from "../controllers/inviteLinkController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticate, getMyTripRooms);
router.post("/",authenticate, createTripRoom);

router.get("/:tripRoomId", authenticate,getTripRoomDetail);

router.put("/:tripRoomId/preferences/me",authenticate ,saveMyPreference);
router.get("/:tripRoomId/preferences",authenticate ,getPreferenceList);

router.post("/:tripRoomId/finalize", authenticate, finalizeTripRoom);

router.post("/:tripRoomId/invite-links", authenticate, createInviteLink);

export default router;
