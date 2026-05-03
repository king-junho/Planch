import api from './axiosInstance';

export const proposalApi = {
    // 1. 제안된 장소 목록 조회
    getProposals: async (tripRoomId: number) => {
        const response = await api.get(`/trip-rooms/${tripRoomId}/proposals`);
        return response.data;
    },

    // 2. 새로운 장소 수동 제안 등록
    createProposal: async (tripRoomId: number, data: {
        placeId: number; // DB에 있는 장소 고유 ID
        estimatedCost?: number;
        estimatedDuration?: number;
        comment?: string;
    }) => {
        const response = await api.post(`/trip-rooms/${tripRoomId}/proposals`, data);
        return response.data;
    },

    // 3. 장소 제안 삭제
    deleteProposal: async (tripRoomId: number, proposalId: number) => {
        const response = await api.delete(`/trip-rooms/${tripRoomId}/proposals/${proposalId}`);
        return response.data;
    }
};