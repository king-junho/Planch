import api from './axiosInstance';

export const preferenceApi = {
    // 1. 여행방 멤버들의 선호도 목록 조회
    getPreferences: async (tripRoomId: number) => {
        const response = await api.get(`/trip-rooms/${tripRoomId}/preferences`);
        return response.data;
    },

    // 2. 내 선호도 저장 및 수정
    saveMyPreference: async (tripRoomId: number, data: {
        budgetMin?: number;
        budgetMax?: number;
        styles?: string[];
        mustVisit?: string[];
        avoid?: string[];
        availableTime?: string[];
        freeTextNote?: string;
    }) => {
        const response = await api.put(`/trip-rooms/${tripRoomId}/preferences/me`, data);
        return response.data;
    }
};