import { getAccessToken } from "./authStorage";
import { ApiErrorResponse } from "../types/auth";
import {
  CreateTripRoomRequest,
  CreateInviteLinkResponse,
  DecisionLogItem,
  JoinInviteLinkResponse,
  TripRoomDetailResponse,
  TripRoomListItem,
  TripRoomSummary,
  UnlockTripRoomResponse,
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

export async function getMyTripRooms(): Promise<TripRoomListItem[]> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("로그인 후 여행 목록을 확인할 수 있습니다.");
  }

  const response = await fetch(`${API_BASE_URL}/trip-rooms`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let message = "여행 목록을 불러오지 못했습니다.";

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

  return (await response.json()) as TripRoomListItem[];
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

export async function joinTripRoomByInviteLink(
  token: string
): Promise<JoinInviteLinkResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("로그인 후 초대를 수락할 수 있습니다.");
  }

  const response = await fetch(`${API_BASE_URL}/invite-links/${token}/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let message = "여행방 참여 처리 중 서버 오류가 발생했습니다.";

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

  return (await response.json()) as JoinInviteLinkResponse;
}

export async function createInviteLink(
  tripRoomId: number
): Promise<CreateInviteLinkResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("인증이 필요합니다.");
  }

  const response = await fetch(
    `${API_BASE_URL}/trip-rooms/${tripRoomId}/invite-links`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    let message = "초대 링크 생성에 실패했습니다.";

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

  return (await response.json()) as CreateInviteLinkResponse;
}

export async function getTripRoomDecisionLogs(
  tripRoomId: number
): Promise<DecisionLogItem[]> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("인증이 필요합니다.");
  }

  const response = await fetch(`${API_BASE_URL}/trip-rooms/${tripRoomId}/logs`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let message = "결정 로그 조회 실패";

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

  return (await response.json()) as DecisionLogItem[];
}

export async function unlockTripRoom(
  tripRoomId: number
): Promise<UnlockTripRoomResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("인증이 필요합니다.");
  }

  const response = await fetch(`${API_BASE_URL}/trip-rooms/${tripRoomId}/unlock`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let message = "여행방 확정 해제 실패";

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

  return (await response.json()) as UnlockTripRoomResponse;
}
