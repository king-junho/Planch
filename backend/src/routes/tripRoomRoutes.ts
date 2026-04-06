import { Router } from "express";
import {
    getTripRoomDetail,
    createTripRoom,
    finalizeTripRoom,
    saveMyPreference,
    getPreferenceList,
} from "../controllers/tripRoomController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:tripRoomId", getTripRoomDetail);
router.get("/:tripRoomId/preferences", getPreferenceList);
router.post("/", createTripRoom);
router.put("/:tripRoomId/preferences/me", saveMyPreference);
router.post("/:tripRoomId/finalize", authenticate, finalizeTripRoom);

export default router;
