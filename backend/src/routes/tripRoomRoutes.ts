import {Router} from "express";
import {
    getTripRoomDetail,
    createTripRoom,
    saveMyPreference,
}from "../controllers/tripRoomController";

const router = Router();

router.get("/:tripRoomId", getTripRoomDetail);
router.post("/", createTripRoom);
router.put("/:tripRoomId/preferences/me",saveMyPreference);

export default router;