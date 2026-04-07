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

router.post("/",authenticate, createTripRoom);
router.get("/:tripRoomId", authenticate,getTripRoomDetail);

router.put("/:tripRoomId/preferences/me",authenticate ,saveMyPreference);
router.get("/:tripRoomId/preferences",authenticate ,getPreferenceList);

router.post("/:tripRoomId/finalize", authenticate, finalizeTripRoom);

export default router;
