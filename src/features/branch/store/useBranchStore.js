import { create } from 'zustand';

export const useBranchStore = create((set) => ({
    branches: [
        {
            id: 1,
            title: "메인 일정 (A안)",
            description: "팀원들이 가장 많이 선호한 핫플 위주의 동선",
            proposer: "복성준",
            isAI: true,
            status: "confirmed",
            cost: "약 35만원",
            time: "2시간 30분",
            matchRate: 92,
            routes: {
                1: [
                    { id: 101, time: '10:00 AM', title: '서울역 출발', desc: 'KTX 탑승 (약 2시간 30분 소요)', cost: '50,000원', place: '서울역', x: '126.9706', y: '37.5546' },
                    { id: 102, time: '12:30 PM', title: '부산역 도착 및 점심식사', desc: '역 근처 돼지국밥 맛집 방문', cost: '10,000원', place: '본전돼지국밥', x: '129.0401', y: '35.1152' },
                    { id: 103, time: '02:00 PM', title: '해운대 숙소 체크인', desc: '오션뷰 호텔 체크인 및 짐 보관', cost: null, place: '파라다이스 호텔', x: '129.1636', y: '35.1600' },
                    { id: 104, time: '03:30 PM', title: '블루라인파크 해변열차', desc: '미포 - 청사포 구간 탑승 및 산책', cost: '12,000원', place: '핫플레이스', x: '129.1732', y: '35.1623' }
                ],
                2: [
                    { id: 105, time: '10:00 AM', title: '해운대 암소갈비', desc: '오픈런 아침 식사', cost: '50,000원', place: '해운대암소갈비집', x: '129.1666', y: '35.1632' },
                    { id: 106, time: '01:00 PM', title: '광안리 해수욕장', desc: '오션뷰 카페 및 산책', cost: '15,000원', place: '광안리해수욕장', x: '129.1187', y: '35.1531' }
                ]
            }
        },
        {
            id: 2,
            title: "휴양 힐링 B안",
            description: "웨이팅 없이 여유롭게 바다를 보며 쉴 수 있는 일정",
            proposer: "팀원",
            isAI: false,
            status: "voting",
            cost: "약 28만원",
            time: "1시간 40분",
            matchRate: 78,
            routes: {
                1: [
                    { id: 201, time: '11:00 AM', title: '기장 힐튼 호텔', desc: '얼리 체크인 및 워터하우스', cost: null, place: '아난티 코브', x: '129.2285', y: '35.1977' },
                    { id: 202, time: '05:00 PM', title: '해동용궁사', desc: '일몰 산책', cost: null, place: '해동용궁사', x: '129.2232', y: '35.1884' }
                ]
            }
        },
        {
            id: 3,
            title: "액티비티 체험 C안",
            description: "카트와 서핑 등 다이나믹한 활동이 포함된 스케줄",
            proposer: "AI 추천",
            isAI: true,
            status: "pending",
            cost: "약 55만원",
            time: "3시간 10분",
            matchRate: 65,
            routes: {
                1: []
            }
        }
    ],

    selectedBranch: null,
    selectedDay: 1,

    draftRoute: [],
    setDraftRoute: (route) => set({ draftRoute: route }),

    setSelectedBranch: (branch) => set({ selectedBranch: branch, selectedDay: 1 }),
    setSelectedDay: (day) => set({ selectedDay: day }),
    setBranches: (newBranches) => set({ branches: newBranches }),

    addBranch: (newBranch) => set((state) => ({
        branches: [{ ...newBranch, id: Date.now() }, ...state.branches],
        draftRoute: [] // 생성 완료 후 초기화
    })),
}));