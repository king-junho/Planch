import api from './axiosInstance';

export const branchApi = {
    // 1. 특정 여행방의 브랜치 목록 조회 (GET /trip-rooms/:id/branches)
    getBranches: (tripRoomId: number) =>
        api.get(`/trip-rooms/${tripRoomId}/branches`),

    // 2. AI 브랜치 자동 생성 (POST /trip-rooms/:id/branches/generate-ai)
    generateAiBranches: (tripRoomId: number, branchCount: number = 1) =>
        api.post(`/trip-rooms/${tripRoomId}/branches/generate-ai`, { branchCount }),

    // 3. 브랜치 상세 조회 (GET /branches/:id)
    getBranchDetail: (branchId: number) =>
        api.get(`/branches/${branchId}`),

    // 4. 브랜치 투표 (PUT /branches/:id/vote)
    voteBranch: (branchId: number, voteType: 'agree' | 'hold' | 'disagree') =>
        api.put(`/branches/${branchId}/vote`, { voteType }),

    // 5. 브랜치 삭제 (DELETE /branches/:id)
    deleteBranch: (branchId: number) =>
        api.delete(`/branches/${branchId}`),
};
