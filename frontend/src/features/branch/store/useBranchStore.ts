import { create } from 'zustand';
import { Branch, RouteItem } from '../../../types/branch';

// 1. 가짜 데이터를 외부 상수로 빼고 Branch[] 타입을 명확히 지정하여 타입 추론 에러를 차단합니다.
const initialBranches: Branch[] = [
    {
        id: 1,
        title: "제주 2박 3일 힐링 코스",
        description: "서쪽 해안을 따라 여유롭게 이동하는 코스입니다.",
        proposer: "복성준",
        isAI: true,
        status: "confirmed",
        cost: "약 45만원",
        time: "전체 8시간",
        matchRate: 95,
        routes: {
            1: [
                { id: 101, time: '12:00', title: '제주국제공항 도착', desc: '렌터카 인수 및 출발', place: '제주공항', latitude: 33.5104, longitude: 126.4913, cost: null },
                { id: 102, time: '13:30', title: '우진해장국', desc: '고사리 육개장 점심식사', place: '우진해장국', latitude: 33.5115, longitude: 126.5200, cost: '10,000원' },
                { id: 103, time: '15:30', title: '몽상드애월', desc: '해안도로 드라이브 및 카페 휴식', place: '애월카페거리', latitude: 33.4628, longitude: 126.3093, cost: '8,000원' }
            ],
            2: [
                { id: 201, time: '10:00', title: '오설록 티 뮤지엄', desc: '녹차밭 구경 및 기념품 구매', place: '오설록', latitude: 33.3059, longitude: 126.2895, cost: '15,000원' },
                { id: 202, time: '13:00', title: '춘심이네 본점', desc: '통갈치구이 점심', place: '춘심이네', latitude: 33.2562, longitude: 126.3323, cost: '40,000원' },
                { id: 203, time: '16:00', title: '천지연폭포', desc: '가벼운 산책 코스', place: '천지연폭포', latitude: 33.2447, longitude: 126.5546, cost: '2,000원' }
            ]
        }
    },
    {
        id: 2,
        title: "동쪽 액티비티 위주 코스",
        description: "성산일출봉과 우도를 포함한 활동적인 코스",
        proposer: "최병욱",
        isAI: false,
        status: "voting",
        cost: "약 55만원",
        time: "전체 12시간",
        matchRate: 82,
        routes: {
            1: [
                { id: 301, time: '09:00', title: '성산일출봉', desc: '아침 등반', place: '성산일출봉', latitude: 33.4586, longitude: 126.9422, cost: '5,000원' },
                { id: 302, time: '11:30', title: '성산항', desc: '우도행 배 탑승', place: '성산포항종합여객터미널', latitude: 33.4733, longitude: 126.9328, cost: '10,500원' },
                { id: 303, time: '12:30', title: '우도 한바퀴', desc: '전기자전거 대여 및 땅콩아이스크림', place: '우도', latitude: 33.5042, longitude: 126.9535, cost: '35,000원' }
            ]
        }
    }
];

interface BranchState {
    branches: Branch[];
    selectedBranch: Branch | null;
    selectedDay: number;

    draftRoutes: Record<number, RouteItem[]>;
    currentDraftDay: number;

    setSelectedBranch: (branch: Branch | null) => void;
    setSelectedDay: (day: number) => void;

    setCurrentDraftDay: (day: number) => void;
    setDraftRoutes: (routes: Record<number, RouteItem[]>) => void;
    addPlaceToDraft: (day: number, item: RouteItem) => void;
    removePlaceFromDraft: (day: number, itemId: number) => void;

    // updateDraftTime: (day: number, itemId: number, time: string) => void; // updateDraftPlace로 대체됨
    addBranch: (newBranch: Branch) => void;

    updateBranch: (updatedBranch: Branch) => void;
    updateDraftPlace: (day: number, itemId: number, updates: Partial<RouteItem>) => void;

    // 새로 추가된 정렬 및 순서 변경 함수 타입 선언
    reorderDraftPlace: (day: number, startIndex: number, endIndex: number) => void;
    sortDraftByTime: (day: number) => void;

    resetDraft: () => void;
}

export const useBranchStore = create<BranchState>((set) => ({
    // 2. 위에서 정의한 타입이 완벽한 데이터를 넣어줍니다.
    branches: initialBranches,

    selectedBranch: null,
    selectedDay: 1,

    draftRoutes: { 1: [] },
    currentDraftDay: 1,

    setSelectedBranch: (branch) => set({ selectedBranch: branch, selectedDay: 1 }),
    setSelectedDay: (day) => set({ selectedDay: day }),

    setCurrentDraftDay: (day) => set({ currentDraftDay: day }),
    setDraftRoutes: (routes) => set({ draftRoutes: routes }),

    addPlaceToDraft: (day, item) => set((state) => ({
        draftRoutes: {
            ...state.draftRoutes,
            [day]: [...(state.draftRoutes[day] || []), item]
        }
    })),

    removePlaceFromDraft: (day, itemId) => set((state) => ({
        draftRoutes: {
            ...state.draftRoutes,
            [day]: (state.draftRoutes[day] || []).filter(i => i.id !== itemId)
        }
    })),

    /* updateDraftTime 함수는 updateDraftPlace로 완벽히 대체 가능합니다.
    updateDraftTime: (day, itemId, time) => set((state) => ({
        draftRoutes: {
            ...state.draftRoutes,
            [day]: (state.draftRoutes[day] || []).map(i =>
                i.id === itemId ? { ...i, time } : i
            )
        }
    })),
    */

    addBranch: (newBranch) => set((state) => ({
        branches: [newBranch, ...state.branches]
    })),

    // 수정된 브랜치 정보를 기존 배열에 덮어씌우는 로직
    updateBranch: (updatedBranch) => set((state) => ({
        branches: state.branches.map(b =>
            b.id === updatedBranch.id ? updatedBranch : b
        ),
        selectedBranch: state.selectedBranch?.id === updatedBranch.id
            ? updatedBranch
            : state.selectedBranch
    })),

    // 개별 항목의 정보를 부분적으로 업데이트하는 로직
    updateDraftPlace: (day, itemId, updates) => set((state) => ({
        draftRoutes: {
            ...state.draftRoutes,
            [day]: (state.draftRoutes[day] || []).map(i =>
                i.id === itemId ? { ...i, ...updates } : i
            )
        }
    })),

    // 배열 내에서 특정 요소의 인덱스를 수동으로 변경하는 로직
    reorderDraftPlace: (day, startIndex, endIndex) => set((state) => {
        const list = [...(state.draftRoutes[day] || [])];
        const [removed] = list.splice(startIndex, 1);
        list.splice(endIndex, 0, removed);

        return {
            draftRoutes: {
                ...state.draftRoutes,
                [day]: list
            }
        };
    }),

    // 설정된 시간을 기준으로 배열을 오름차순 재정렬하는 로직
    sortDraftByTime: (day) => set((state) => {
        const list = [...(state.draftRoutes[day] || [])];
        list.sort((a, b) => a.time.localeCompare(b.time));

        return {
            draftRoutes: {
                ...state.draftRoutes,
                [day]: list
            }
        };
    }),

    resetDraft: () => set({ draftRoutes: { 1: [] }, currentDraftDay: 1 })
}));