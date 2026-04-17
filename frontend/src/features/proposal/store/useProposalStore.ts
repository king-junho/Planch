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
    // 초기 상태에 가짜 데이터를 주입합니다.
    proposals: [
        {
            proposalId: 1001,
            tripRoomId: 1,
            proposer: { userId: 1, nickname: '나' },
            placeName: '몽상드애월',
            address: '제주특별자치도 제주시 애월읍 애월북서길 56-1',
            latitude: 33.4628,
            longitude: 126.3093,
            category: '카페',
            memo: '바다 뷰가 예쁜 카페입니다. 노을 질 때 가면 사진이 잘 나와요.',
            createdAt: '2026-04-17T10:00:00Z'
        },
        {
            proposalId: 1002,
            tripRoomId: 1,
            proposer: { userId: 2, nickname: '복성준' },
            placeName: '성산일출봉',
            address: '제주특별자치도 서귀포시 성산읍 일출로 284-12',
            latitude: 33.4586,
            longitude: 126.9422,
            category: '관광명소',
            memo: '아침 일찍 일어나서 일출 보는 것을 추천합니다. 왕복 1시간 정도 소요됩니다.',
            createdAt: '2026-04-17T10:30:00Z'
        },
        {
            proposalId: 1003,
            tripRoomId: 1,
            proposer: { userId: 3, nickname: '최병욱' },
            placeName: '숙성도 노형본관',
            address: '제주특별자치도 제주시 원노형로 41',
            latitude: 33.4848,
            longitude: 126.4816,
            category: '음식점',
            memo: '제주도 흑돼지 맛집입니다. 웨이팅이 길 수 있으니 캐치테이블 예약 필수.',
            createdAt: '2026-04-17T11:15:00Z'
        }
    ],
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
        // API 연동 전까지는 기존 mock 데이터를 유지합니다.
        set({ isLoading: false });
    },

    addProposal: async (tripRoomId, payload) => {
        set({ isLoading: true });

        const newProposal: ProposalResponse = {
            proposalId: Date.now(),
            tripRoomId: Number(tripRoomId),
            proposer: { userId: 99, nickname: '나' },
            placeName: payload.placeName,
            address: payload.address,
            latitude: Number(payload.latitude),
            longitude: Number(payload.longitude),
            category: payload.category,
            memo: payload.memo,
            createdAt: new Date().toISOString()
        };

        set((state) => ({
            proposals: [newProposal, ...state.proposals],
            isLoading: false,
            selectedPlace: null,
            keyword: ''
        }));

        return true;
    }
}));