import {Router} from "express";
import {
    getTripRoomDetail,
    createTripRoom,
    saveMyPreference,
    getPreferenceList,
}from "../controllers/tripRoomController";

const router = Router();

router.get("/:tripRoomId", getTripRoomDetail);
router.get("/:tripRoomId/preferences",getPreferenceList);
router.post("/", createTripRoom);
router.put("/:tripRoomId/preferences/me",saveMyPreference);

export default router;