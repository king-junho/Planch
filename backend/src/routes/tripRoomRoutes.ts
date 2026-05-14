import { Router } from "express";
import {
    getMyTripRooms,
    getTripRoomDetail,
    createTripRoom,
    deleteTripRoom,
    updateTripRoom,
    finalizeTripRoom,
    saveMyPreference,
    getPreferenceList,
    unlockTripRoom,
    getDecisionLogs,
    updateTripRoomImage,
    updateTripRoomDeadline,
} from "../controllers/tripRoomController";
import {getTripRoomChatMessages, sendTripRoomChatMessage,} from "../controllers/chatController";
import { createInviteLink } from "../controllers/inviteLinkController";
import { authenticate } from "../middlewares/authMiddleware";
import { tripRoomImageUpload } from "../middlewares/uploadMiddleware";

const router = Router();

router.get("/", authenticate, getMyTripRooms);
router.post("/",authenticate, createTripRoom);

router.get("/:tripRoomId", authenticate,getTripRoomDetail);
router.put("/:tripRoomId", authenticate, updateTripRoom);
router.delete("/:tripRoomId", authenticate, deleteTripRoom);

router.put("/:tripRoomId/preferences/me",authenticate ,saveMyPreference);
router.get("/:tripRoomId/preferences",authenticate ,getPreferenceList);

router.post("/:tripRoomId/finalize", authenticate, finalizeTripRoom);

router.post("/:tripRoomId/invite-links", authenticate, createInviteLink);

router.get("/:tripRoomId/chat", authenticate,getTripRoomChatMessages);
router.post("/:tripRoomId/chat", authenticate, sendTripRoomChatMessage);
router.post("/:tripRoomId/unlock", authenticate, unlockTripRoom);

router.get("/:tripRoomId/logs", authenticate, getDecisionLogs);

router.patch(
    "/:tripRoomId/image",
    authenticate,
    tripRoomImageUpload.single("image"),
    updateTripRoomImage,
);

router.patch("/:tripRoomId/deadline", authenticate, updateTripRoomDeadline);

export default router;
