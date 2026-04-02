import {Router} from "express";
import {
    getTripRoomDetail,
    createTripRoom,
}from "../controllers/tripRoomController";

const router = Router();

router.get("/:tripRoomId", getTripRoomDetail);
router.post("/", createTripRoom);

export default router;