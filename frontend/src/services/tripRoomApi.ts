import { getAccessToken } from "./authStorage";
import { ApiErrorResponse } from "../types/auth";
import {
  CreateTripRoomRequest,
  TripRoomDetailResponse,
  TripRoomSummary,
} from "../types/tripRoom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export async function createTripRoom(
  request: CreateTripRoomRequest
): Promise<TripRoomSummary> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("로그인 후 여행방을 생성할 수 있습니다.");
  }

  const response = await fetch(`${API_BASE_URL}/trip-rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = "여행방 생성에 실패했습니다. 다시 시도해 주세요.";

    try {
      const errorBody = (await response.json()) as Partial<ApiErrorResponse>;
      if (typeof errorBody.message === "string" && errorBody.message.trim()) {
        message = errorBody.message;
      }
    } catch {
      // Fall back to the default message when the server response is not JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as TripRoomSummary;
}

export async function getTripRoomDetail(
  tripRoomId: number
): Promise<TripRoomDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("인증이 필요합니다.");
  }

  const response = await fetch(`${API_BASE_URL}/trip-rooms/${tripRoomId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let message = "여행방 조회 중 서버 오류가 발생했습니다.";

    try {
      const errorBody = (await response.json()) as Partial<ApiErrorResponse>;
      if (typeof errorBody.message === "string" && errorBody.message.trim()) {
        message = errorBody.message;
      }
    } catch {
      // Fall back to the default message when the server response is not JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as TripRoomDetailResponse;
}
