import { create } from 'zustand';
import { Branch, RouteItem } from '../../../types/branch';

interface BranchState {
    branches: Branch[];
    selectedBranch: Branch | null;
    selectedDay: number;
    draftRoute: RouteItem[];

    setSelectedBranch: (branch: Branch | null) => void;
    setSelectedDay: (day: number) => void;
    setDraftRoute: (route: RouteItem[]) => void;
    addBranch: (newBranch: Branch) => void;
}

export const useBranchStore = create<BranchState>((set) => ({
    branches: [
        {
            id: 1,
            title: "메인 일정 (A안)",
            description: "1일차 부산, 2일차 경주를 방문하는 알찬 일정",
            proposer: "복성준",
            isAI: true,
            status: "confirmed",
            cost: "약 45만원",
            time: "전체 5시간",
            matchRate: 92,
            routes: {
                // 1일차 데이터
                1: [
                    { id: 101, time: '10:00', title: '서울역 출발', desc: 'KTX 탑승', latitude: 37.5546, longitude: 126.9706 },
                    { id: 102, time: '12:30', title: '부산역 도착', desc: '돼지국밥 점심', latitude: 35.1152, longitude: 129.0401 }
                ],
                // 2일차 데이터 추가 (이게 있어야 버튼이 활성화됩니다)
                2: [
                    { id: 201, time: '09:00', title: '해운대 산책', desc: '아침 바다 구경', latitude: 35.1587, longitude: 129.1603 },
                    { id: 202, time: '13:00', title: '경주 이동', desc: '황리단길 구경', latitude: 35.8392, longitude: 129.2091 }
                ]
            }
        }
    ],
    selectedBranch: null,
    selectedDay: 1,
    draftRoute: [],

    setSelectedBranch: (branch) => set({ selectedBranch: branch, selectedDay: 1 }), // 선택 시 1일차로 초기화
    setSelectedDay: (day) => set({ selectedDay: day }),
    setDraftRoute: (route) => set({ draftRoute: route }),
    addBranch: (newBranch) => set((state) => ({
        branches: [newBranch, ...state.branches]
    }))
}));