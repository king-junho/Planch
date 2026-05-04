import { AxiosError } from "axios";
import api from "./axiosInstance";
import { ApiErrorResponse } from "../types/auth";
import {
  ChatMessage,
  ChatMessagesResponse,
  ChatRoomListItem,
} from "../types/chat";

export async function getChatRooms(): Promise<ChatRoomListItem[]> {
  try {
    const response = await api.get<ChatRoomListItem[]>("/chat-rooms");
    return response.data;
  } catch (caughtError) {
    const error = caughtError as AxiosError<Partial<ApiErrorResponse>>;
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      throw new Error(message);
    }

    if (error.response?.status === 401) {
      throw new Error("인증이 필요합니다.");
    }

    throw new Error("채팅 목록을 불러오지 못했습니다.");
  }
}

export async function getChatMessages(
  tripRoomId: number
): Promise<ChatMessagesResponse> {
  try {
    const response = await api.get<ChatMessagesResponse>(
      `/trip-rooms/${tripRoomId}/chat`  
    );
    return response.data;
  } catch (caughtError) {
    const error = caughtError as AxiosError<Partial<ApiErrorResponse>>;
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      throw new Error(message);
    }

    if (error.response?.status === 400) {
      throw new Error("유효하지 않은 tripRoomId입니다.");
    }

    if (error.response?.status === 401) {
      throw new Error("인증이 필요합니다.");
    }

    if (error.response?.status === 403) {
      throw new Error("해당 여행방 참여자만 채팅을 조회할 수 있습니다.");
    }

    if (error.response?.status === 404) {
      throw new Error("여행방을 찾을 수 없습니다.");
    }

    throw new Error("채팅 조회 중 서버 오류가 발생했습니다.");
  }
}

export async function sendChatMessage(
  tripRoomId: number,
  content: string
): Promise<ChatMessage> {
  try {
    const response = await api.post<ChatMessage>(
      `/trip-rooms/${tripRoomId}/chat`,
      { content }
    );
    return response.data;
  } catch (caughtError) {
    const error = caughtError as AxiosError<Partial<ApiErrorResponse>>;
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      throw new Error(message);
    }

    if (error.response?.status === 400) {
      throw new Error("빈 메시지는 전송할 수 없습니다.");
    }

    if (error.response?.status === 401) {
      throw new Error("인증이 필요합니다.");
    }

    if (error.response?.status === 403) {
      throw new Error("해당 여행방 참여자만 메시지를 전송할 수 있습니다.");
    }

    if (error.response?.status === 404) {
      throw new Error("여행방을 찾을 수 없습니다.");
    }

    throw new Error("메시지 전송 중 서버 오류가 발생했습니다.");
  }
}
