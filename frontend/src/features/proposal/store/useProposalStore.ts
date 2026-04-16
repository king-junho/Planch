import { create } from 'zustand';
import { ProposalResponse } from '../../../types/proposal';

export interface KakaoSearchResult {
    id?: string;
    place_name: string;
    category_group_name: string;
    address_name: string;
    x: string;
    y: string;
    phone?: string;
    isViewing?: boolean;
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
    fetchProposals: (tripRoomId: string) => Promise<void>;
    addProposal: (tripRoomId: string, payload: any) => Promise<boolean>;
}

export const useProposalStore = create<ProposalState>((set) => ({
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
        console.log(`[GET] /trip-rooms/${tripRoomId}/proposals`);
        // 현재는 모킹 데이터이므로 기존 데이터를 유지하거나 초기화합니다.
        set({ isLoading: false });
    },

    addProposal: async (tripRoomId, payload) => {
        set({ isLoading: true });

        // 새로운 제안 객체 생성 (UI 규격에 맞게 필드명 통일)
        const newProposal: ProposalResponse = {
            proposalId: Date.now(),
            tripRoomId: Number(tripRoomId),
            proposer: { userId: 99, nickname: '나' },
            placeName: payload.placeName,
            address: payload.address,
            latitude: Number(payload.latitude), // 숫자형 보장
            longitude: Number(payload.longitude), // 숫자형 보장
            category: payload.category,
            memo: payload.memo,
            createdAt: new Date().toISOString()
        };

        // 상태 업데이트
        set((state) => ({
            proposals: [newProposal, ...state.proposals],
            isLoading: false,
            selectedPlace: null, // 등록 후 검색 선택 해제
            keyword: '' // 검색어 초기화
        }));

        console.log("새 장소가 등록되었습니다:", newProposal);
        return true;
    }
}));