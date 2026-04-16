import { create } from 'zustand';

// 카카오맵이 인식할 수 있도록 x(경도), y(위도) 좌표를 포함한 더미 데이터로 수정
const dummyProposals = [
    {
        id: 1,
        tripRoomId: "1",
        place: {
            id: "1",
            place_name: '몽상드애월',
            category_group_name: '카페',
            address_name: '제주 제주시 애월읍 애월북서길 56-1',
            x: '126.309063', // 경도
            y: '33.462867',  // 위도
            phone: '064-799-8900'
        },
        proposerUser: { name: '김준호' },
        comment: '애월 해안도로 예쁜 카페 가요!'
    }
];

export const useProposalStore = create((set, get) => ({
    keyword: '',
    searchResults: [],
    selectedPlace: null,
    proposals: [],

    setKeyword: (keyword) => set({ keyword }),
    setSearchResults: (results) => set({ searchResults: results }),
    setSelectedPlace: (place) => set({ selectedPlace: place }),

    addProposal: (tripRoomId, newProposalData) => {
        console.log(`[API MOCK - POST] /trip-rooms/${tripRoomId}/proposals 호출됨`, newProposalData);

        const newProposal = {
            id: Date.now(),
            tripRoomId: String(tripRoomId),
            ...newProposalData
        };

        set((state) => ({
            proposals: [newProposal, ...state.proposals]
        }));
    },

    fetchProposals: (tripRoomId) => {
        console.log(`[API MOCK - GET] /trip-rooms/${tripRoomId}/proposals 호출됨`);
        const roomProposals = dummyProposals.filter(p => p.tripRoomId === String(tripRoomId));
        set({ proposals: roomProposals });
    }
}));