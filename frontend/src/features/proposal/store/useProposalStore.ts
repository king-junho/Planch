import { create } from 'zustand';
import { ProposalResponse } from '../../../types/proposal';
import api from '../../../api/axiosInstance';

export interface ProposalPayload {
    placeName: string;
    address: string;
    latitude: string | number;
    longitude: string | number;
    category: string;
    memo: string;
}

export interface KakaoSearchResult {
    id?: string;
    place_name: string;
    category_group_name: string;
    address_name: string;
    x: string;
    y: string;
    phone?: string;
}

interface ProposalState {
    proposals: ProposalResponse[];
    focusedProposal: ProposalResponse | null;
    keyword: string;
    searchResults: KakaoSearchResult[];
    selectedPlace: KakaoSearchResult | null;
    isLoading: boolean;

    setKeyword: (keyword: string) => void;
    setSearchResults: (results: KakaoSearchResult[]) => void;
    setSelectedPlace: (place: KakaoSearchResult | null) => void;
    setFocusedProposal: (proposal: ProposalResponse | null) => void;

    // API 액션
    fetchProposals: (tripRoomId: number) => Promise<void>;
    addProposal: (tripRoomId: number, payload: ProposalPayload) => Promise<boolean>;
    generateAiProposals: (tripRoomId: number) => Promise<void>;
    deleteProposal: (tripRoomId: number, proposalId: number) => Promise<boolean>;
}

export const useProposalStore = create<ProposalState>((set, get) => ({
    proposals: [],
    focusedProposal: null,
    keyword: '',
    searchResults: [],
    selectedPlace: null,
    isLoading: false,

    setKeyword: (keyword) => set({ keyword }),
    setSearchResults: (results) => set({ searchResults: results }),
    setSelectedPlace: (place) => set({ selectedPlace: place }),
    setFocusedProposal: (proposal) => set({ focusedProposal: proposal }),

    // API: 장소 제안 목록 조회
    fetchProposals: async (tripRoomId) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/trip-rooms/${tripRoomId}/proposals`);
            set({ proposals: response.data });
        } catch (error) {
            console.error("제안 목록 로드 실패:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    // API: 장소 제안 추가
    addProposal: async (tripRoomId, payload: ProposalPayload) => {
        const { selectedPlace } = get();
        if (!selectedPlace) return false;

        set({ isLoading: true });
        try {
            await api.post(`/trip-rooms/${tripRoomId}/proposals`, {
                placeId: Number(selectedPlace.id),
                comment: payload.memo,
                placeName: payload.placeName,
                address: payload.address,
                latitude: Number(payload.latitude),
                longitude: Number(payload.longitude),
                category: payload.category
            });

            await get().fetchProposals(Number(tripRoomId));
            set({ selectedPlace: null, keyword: '' });
            return true;
        } catch (error) {
            console.error("장소 제안 실패:", error);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    // API: AI 장소 제안 생성
    generateAiProposals: async (tripRoomId) => {
        set({ isLoading: true });
        try {
            await api.post(`/trip-rooms/${tripRoomId}/proposals/generate-ai`, { count: 3 });
            await get().fetchProposals(tripRoomId);
        } catch (error) {
            alert("AI 제안 생성 중 오류가 발생했습니다.");
        } finally {
            set({ isLoading: false });
        }
    },

    // API: 장소 제안 삭제
    deleteProposal: async (tripRoomId: number, proposalId: number) => {
        set({ isLoading: true });
        try {
            await api.delete(`/trip-rooms/${tripRoomId}/proposals/${proposalId}`);

            // 삭제 성공 시 목록 새로고침
            await get().fetchProposals(tripRoomId);

            // 삭제한 항목이 현재 상세 보기 중인 항목이라면 상태 초기화
            const currentFocused = get().focusedProposal;
            if (currentFocused && (currentFocused.id === proposalId || currentFocused.proposalId === proposalId)) {
                set({ focusedProposal: null });
            }

            return true;
        } catch (error) {
            console.error("장소 제안 삭제 실패:", error);
            alert("삭제에 실패했습니다. 본인의 제안인지 확인해주세요.");
            return false;
        } finally {
            set({ isLoading: false });
        }
    }
}));