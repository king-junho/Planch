import { create } from 'zustand';
import { ProposalResponse } from '../../../types/proposal';
import api from '../../../api/axiosInstance';
import { useToastStore } from '../../store/useToastStore';

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

    fetchProposals: (tripRoomId: number) => Promise<void>;
    addProposal: (tripRoomId: number, payload: ProposalPayload) => Promise<boolean>;
    generateAiProposals: (tripRoomId: number) => Promise<boolean>;
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

    fetchProposals: async (tripRoomId) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/trip-rooms/${tripRoomId}/proposals`);
            set({ proposals: response.data });
        } catch (error) {
            console.error(error);
        } finally {
            set({ isLoading: false });
        }
    },

    addProposal: async (tripRoomId, payload: ProposalPayload) => {
        if (get().isLoading) return false;

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
            console.error(error);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    generateAiProposals: async (tripRoomId) => {
        if (get().isLoading) return false;

        set({ isLoading: true });
        try {
            await api.post(`/trip-rooms/${tripRoomId}/proposals/generate-ai`, { count: 3 });
            await get().fetchProposals(tripRoomId);
            return true;
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || "AI 제안 생성 중 오류가 발생했습니다.";
            useToastStore.getState().showToast('error', errorMessage);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteProposal: async (tripRoomId: number, proposalId: number) => {
        set({ isLoading: true });
        try {
            await api.delete(`/trip-rooms/${tripRoomId}/proposals/${proposalId}`);

            await get().fetchProposals(tripRoomId);

            const currentFocused = get().focusedProposal;
            if (currentFocused && (currentFocused.id === proposalId || currentFocused.proposalId === proposalId)) {
                set({ focusedProposal: null });
            }

            return true;
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || "삭제에 실패했습니다. 본인의 제안인지 확인해주세요.";
            useToastStore.getState().showToast('error', errorMessage);
            return false;
        } finally {
            set({ isLoading: false });
        }
    }
}));