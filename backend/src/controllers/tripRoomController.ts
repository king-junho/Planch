import { Response } from "express";
import {
  getMyTripRoomsService,
  getTripRoomDetailService,
  createTripRoomService,
  deleteTripRoomService,
  updateTripRoomService,
  finalizeTripRoomService,
  saveMyPreferenceService,
  getPreferenceListService,
  unlockTripRoomService,
  getDecisionService,
  updateTripRoomImageService,
  updateTripRoomDeadlineService,
} from "../services/tripRoomService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const getDecisionLogs = async(req: AuthenticatedRequest, res: Response) => {
  try{
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;

    if(Number.isNaN(tripRoomId)){
      return res.status(400).json({message : "유효하지 않은 tripRoomId입니다."});
    }
    if(!userId){
      return res.status(401).json({message: "인증이 필요합니다."});
    }

    const result = await getDecisionService(tripRoomId, userId);
    return res.status(200).json(result);
  }catch(error){
    if(error instanceof Error && error.message === "Trip room not found"){
      return res.status(404).json({message: "여행방을 찾을 수 없습니다."});
    }
    if(error instanceof Error && error.message === "Forbidden"){
      return res.status(403).json({message: "해당 여행방 참여자만 조회할 수 있습니다."});
    }
    console.error("getDecisionLogs error:", error);
    return res.status(500).json({message: "결정 로그 조회 실패"});
  }
};


export const updateTripRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;
    const { title, startDate, endDate } = req.body;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (title !== undefined && typeof title !== "string") {
      return res.status(400).json({ message: "title은 문자열이어야 합니다." });
    }

    if (typeof title === "string" && !title.trim()) {
      return res.status(400).json({ message: "title은 빈 문자열일 수 없습니다." });
    }

    if (startDate !== undefined && startDate !== null && typeof startDate !== "string") {
      return res.status(400).json({ message: "startDate는 문자열 또는 null이어야 합니다." });
    }

    if (endDate !== undefined && endDate !== null && typeof endDate !== "string") {
      return res.status(400).json({ message: "endDate는 문자열 또는 null이어야 합니다." });
    }

    const result = await updateTripRoomService({
      tripRoomId,
      userId,
      title,
      startDate,
      endDate,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Trip room not found") {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return res.status(403).json({ message: "호스트만 여행 정보를 수정할 수 있습니다." });
    }

    if (error instanceof Error && error.message === "Trip room is locked") {
      return res.status(409).json({ message: "확정된 여행방은 여행 정보를 수정할 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Invalid startDate") {
      return res.status(400).json({ message: "유효하지 않은 startDate입니다." });
    }

    if (error instanceof Error && error.message === "Invalid endDate") {
      return res.status(400).json({ message: "유효하지 않은 endDate입니다." });
    }

    if (error instanceof Error && error.message === "End date before start date") {
      return res.status(400).json({ message: "endDate는 startDate보다 빠를 수 없습니다." });
    }

    console.error("updateTripRoom error:", error);
    return res.status(500).json({ message: "여행 정보 저장 중 서버 오류가 발생했습니다." });
  }
};

export const deleteTripRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await deleteTripRoomService(tripRoomId, userId);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Trip room not found") {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Host only") {
      return res.status(403).json({ message: "호스트만 여행방을 삭제할 수 있습니다." });
    }

    console.error("deleteTripRoom error:", error);
    return res.status(500).json({ message: "여행방 삭제 실패" });
  }
};

export const unlockTripRoom = async(req:AuthenticatedRequest, res:Response) => {
  try{
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;

    if(Number.isNaN(tripRoomId)){
      return res.status(400).json({message : "유효하지 않은 tripRoomId입니다."});
    }

    if(!userId){
      return res.status(401).json({message: "인증이 필요합니다."});
    }

    const result = await unlockTripRoomService(tripRoomId, userId);
    return res.status(200).json(result);

  }catch (error) {
    if (error instanceof Error && error.message === "Trip room not found") {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Host only") {
      return res.status(403).json({ message: "호스트만 확정 해제할 수 있습니다." });
    }

    if (error instanceof Error && error.message === "Trip room is not locked") {
      return res.status(409).json({ message: "확정되지 않은 여행방은 해제할 수 없습니다." });
    }

    console.error("unlockTripRoom error:", error);
    return res.status(500).json({ message: "여행방 확정 해제 실패" });
  }
};

export const getMyTripRooms = async (req: AuthenticatedRequest, res: Response) => {
  try{
    const userId = req.user?.id;

    if(!userId){
      return res.status(401).json({message: "인증이 필요합니다."});
    }
    
    const tripRooms = await getMyTripRoomsService(userId);

    return res.status(200).json(tripRooms);
  }catch(error){
    console.error("getMyTripRooms error:", error);
    return res.status(500).json({message: "여행방 목록 조회 중 서버 오류가 발생했습니다."});
  }
}
export const getPreferenceList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await getPreferenceListService(tripRoomId, req.user.id);

    if (!result.found) {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if(!result.authorized){
      return res.status(403).json({ message: "해당 여행방 참여자만 조회할 수 있습니다." });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getPreferenceList error:", error);
    return res.status(500).json({ message: "선호 목록 조회 중 서버 오류가 발생했습니다." });
  }
};

export const saveMyPreference = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const {
      budgetMin,
      budgetMax,
      styles,
      mustVisit,
      avoid,
      availableTime,
      freeTextNote,
    } = req.body;

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    } 

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await saveMyPreferenceService({
      tripRoomId,
      userId: req.user.id,
      budgetMin,
      budgetMax,
      styles,
      mustVisit,
      avoid,
      availableTime,
      freeTextNote,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message ==="Trip room is locked"){
      return res.status(409).json({message: "여행방이 확정되어 선호 입력이 불가능합니다."});
    }

    if (error instanceof Error && error.message === "Forbidden"){
      return res.status(403).json({message: "해당 여행방 참여자만 선호 입력이 가능합니다."});
    }
    if(error instanceof Error && error.message === "Trip room not found"){
      return res.status(404).json({message:"여행방을 찾을 수 없습니다."});
    }
    console.error("saveMyPreference error:", error);
    return res.status(500).json({ message: "선호 입력 저장 중 서버 오류가 발생했습니다." });
  }
};

export const getTripRoomDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;
    
    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await getTripRoomDetailService(tripRoomId, userId);

    if(!result.found){
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if(!result.authorized){
      return res.status(403).json({ message: "해당 여행방 참여자만 조회할 수 있습니다."});
    }

    return res.status(200).json(result.data);
  }catch (error) {
    console.error("getTripRoomDetail error:", error);
    return res.status(500).json({ message: "여행방 조회 중 서버 오류가 발생했습니다." });
  }
};

export const createTripRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, startDate, endDate, thumbnailUrl, decisionDeadline } = req.body;

    if (!title) {
      return res.status(400).json({ message: "title은 필수입니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const newTripRoom = await createTripRoomService({
      title,
      startDate,
      endDate,
      hostUserId: req.user.id,
      thumbnailUrl: thumbnailUrl,
      decisionDeadline: decisionDeadline,
    });

    return res.status(201).json(newTripRoom);
  } catch (error) {
    console.error("createTripRoom error:", error);
    return res.status(500).json({ message: "여행방 생성 중 서버 오류가 발생했습니다." });
  }
};

export const finalizeTripRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;
    const { branchId } = req.body;
    const normalizedBranchId = Number(branchId);

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (Number.isNaN(normalizedBranchId)) {
      return res.status(400).json({ message: "유효하지 않은 branchId입니다." });
    }

    const result = await finalizeTripRoomService(tripRoomId, normalizedBranchId, userId);

    if (result === null) {
      return res.status(403).json({ message: "호스트만 최종 확정할 수 있습니다." });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("finalizeTripRoom error:", error);

    if (error instanceof Error && error.message === "Trip room not found") {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Branch not found") {
      return res.status(404).json({ message: "브랜치를 찾을 수 없습니다." });
    }

    return res.status(500).json({ message: "최종 확정 실패" });
  }
};
export const updateTripRoomDeadline = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;
    const { decisionDeadline } = req.body as {
      decisionDeadline?: string | null;
    };

    if (Number.isNaN(tripRoomId)) {
      return res.status(400).json({ message: "유효하지 않은 tripRoomId입니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const result = await updateTripRoomDeadlineService(
      tripRoomId,
      userId,
      decisionDeadline
    );

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Trip room not found") {
      return res.status(404).json({ message: "여행방을 찾을 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Host only") {
      return res.status(403).json({ message: "호스트만 결정 마감기한을 수정할 수 있습니다." });
    }

    if (error instanceof Error && error.message === "Trip room is locked") {
      return res.status(409).json({ message: "확정된 여행방은 마감기한을 수정할 수 없습니다." });
    }

    if (error instanceof Error && error.message === "Invalid decision deadline") {
      return res.status(400).json({ message: "유효하지 않은 마감기한입니다." });
    }

    if (
      error instanceof Error &&
      error.message === "Decision deadline must be in the future"
    ) {
      return res.status(400).json({ message: "마감기한은 현재 시각 이후여야 합니다." });
    }

    if (
      error instanceof Error &&
      error.message === "Decision deadline must be before trip start date"
    ) {
      return res.status(400).json({ message: "마감기한은 여행 시작일 이전이어야 합니다." });
    }

    console.error("updateTripRoomDeadline error:", error);
    return res.status(500).json({ message: "결정 마감기한 수정 실패" });
  }
};
export const updateTripRoomImage = async(req: AuthenticatedRequest, res: Response) => {
  try{
    const tripRoomId = Number(req.params.tripRoomId);
    const userId = req.user?.id;
    const file = req.file;

    if(Number.isNaN(tripRoomId)){
      return res.status(400).json({message : "유효하지 않은 tripRoomId입니다."});
    }

    if(!userId){
      return res.status(401).json({message: "인증이 필요합니다."});
    }

    if(!file){
      return res.status(400).json({message: "업로드된 파일이 없습니다."});
    }

    const result = await updateTripRoomImageService(tripRoomId, userId, file.filename);

    return res.status(200).json(result);
  }catch(error){
    if(error instanceof Error && error.message === "Trip room not found"){
      return res.status(404).json({message: "여행방을 찾을 수 없습니다."});
    }

    console.error("updateTripRoomImage error:", error);
    return res.status(500).json({message: "여행방 이미지 업데이트 실패"});
  }
}
