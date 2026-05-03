import {Router} from "express";
import { authenticate } from "../middlewares/authMiddleware";
import {getMyChatRooms} from  "../controllers/chatController";

const router = Router();

router.get("/", authenticate, getMyChatRooms);

export default router;