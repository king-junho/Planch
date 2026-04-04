import { Request, Response } from "express";
import {
  getTripRoomDetailService,
  createTripRoomService,
  saveMyPreferenceService,
  getPreferenceListService,
} from "../services/tripRoomService";

export const getPreferenceList = async (req:Request, res:Response) => {
  try{
    const tripRoomId = Number(req.params.tripRoomId);

    if(Number.isNaN(tripRoomId)){
      return res.status(400).json({message:"유효하지 않은 tripRoomId입니다."});
    }
    const preferences = await getPreferenceListService(tripRoomId);
    return res.status(200).json(preferences);
  }catch(error){
    console.error("getPreferenceList error:",error);
    return res.status(500).json({message:"선호 목록 조회 중 서버 오류가 발생했습니다."});
  }
};

export const saveMyPreference = async (req: Request, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const {
      userId,
      budgetMin,
      budgetMax,
      styles,
      mustVisit,
      avoid,
      availableTime,
    } = req.body;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(400).json({ message: "userId는 필수입니다." });
    }

    const result = await saveMyPreferenceService({
      tripRoomId,
      userId: Number(userId),
      budgetMin,
      budgetMax,
      styles,
      mustVisit,
      avoid,
      availableTime,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("saveMyPreference error:", error);
    return res.status(500).json({ message: "선호 입력 저장 중 서버 오류가 발생했습니다." });
  }
};

export const getTripRoomDetail = async (req: Request, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    const tripRoom = await getTripRoomDetailService(tripRoomId);

    if (!tripRoom) {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    return res.status(200).json(tripRoom);
  } catch (error) {
    console.error("getTripRoomDetail error:", error);
    return res.status(500).json({ message: "여행방 조회 중 서버 오류가 발생했습니다." });
  }
};

export const createTripRoom = async (req: Request, res: Response) => {
  try {
    const { title, startDate, endDate, hostUserId } = req.body;

    if (!title || !hostUserId) {
      return res.status(400).json({ message: "title과 hostUserId는 필수입니다." });
    }

    const newTripRoom = await createTripRoomService({
      title,
      startDate,
      endDate,
      hostUserId:Number(hostUserId),
    });

    return res.status(201).json(newTripRoom);
  } catch (error) {
    console.error("createTripRoom error:",error);
    return res.status(500).json({ message: "여행방 생성 중 서버 오류가 발생했습니다." });
  }
};