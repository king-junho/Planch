import { create } from 'zustand';
import { Branch, RouteItem } from '../../../types/branch';
import api from '../../../api/axiosInstance';

// 문자열에서 숫자만 파싱하는 유틸 함수
const parseNumber = (value: string | number | null | undefined): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
};

interface BranchState {
    branches: Branch[];
    selectedBranch: Branch | null;
    selectedDay: number;
    isLoading: boolean;

    draftRoutes: Record<number, RouteItem[]>;
    currentDraftDay: number;

    setSelectedBranch: (branch: Branch | null) => void;
    setSelectedDay: (day: number) => void;

    setCurrentDraftDay: (day: number) => void;
    setDraftRoutes: (routes: Record<number, RouteItem[]>) => void;
    addPlaceToDraft: (day: number, item: RouteItem) => void;
    removePlaceFromDraft: (day: number, itemId: number) => void;
    updateDraftPlace: (day: number, itemId: number, updates: Partial<RouteItem>) => void;

    reorderDraftPlace: (day: number, startIndex: number, endIndex: number) => void;
    sortDraftByTime: (day: number) => void;
    resetDraft: () => void;

    fetchBranches: (tripRoomId: number) => Promise<void>;
    createBranch: (tripRoomId: number, title: string) => Promise<boolean>;
    updateBranch: (branchId: number, tripRoomId: number, title: string) => Promise<boolean>;
    voteBranch: (tripRoomId: number, branchId: number, voteType: 'agree' | 'hold' | 'disagree') => Promise<boolean>;
    finalizeBranch: (tripRoomId: number, branchId: number) => Promise<boolean>;
}

export const useBranchStore = create<BranchState>((set, get) => ({
    branches: [],
    selectedBranch: null,
    selectedDay: 1,
    isLoading: false,

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

    updateDraftPlace: (day, itemId, updates) => set((state) => ({
        draftRoutes: {
            ...state.draftRoutes,
            [day]: (state.draftRoutes[day] || []).map(i =>
                i.id === itemId ? { ...i, ...updates } : i
            )
        }
    })),

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

    resetDraft: () => set({ draftRoutes: { 1: [] }, currentDraftDay: 1 }),

    // 상세 조회 데이터를 병합하여 목록을 불러오도록 수정된 fetchBranches
    fetchBranches: async (tripRoomId) => {
        set({ isLoading: true });
        try {
            // 1. 브랜치 목록 요약 데이터 가져오기
            const listResponse = await api.get(`/trip-rooms/${tripRoomId}/branches`);
            const basicBranches = listResponse.data;

            // 2. 타임라인(장소) 데이터를 그리기 위해 각 브랜치의 상세 정보를 병렬로 가져와서 합치기
            const formattedBranches = await Promise.all(
                basicBranches.map(async (b: any) => {
                    try {
                        const detailResponse = await api.get(`/branches/${b.branchId}`);
                        const detail = detailResponse.data;

                        // 백엔드의 places 1차원 배열을 프론트엔드 타임라인용 routes 객체로 변환
                        const routesObj: Record<number, RouteItem[]> = {};
                        if (detail.places && Array.isArray(detail.places)) {
                            detail.places.forEach((p: any) => {
                                if (!routesObj[p.dayNo]) routesObj[p.dayNo] = [];
                                routesObj[p.dayNo].push({
                                    id: p.place.id,
                                    placeId: p.place.id,
                                    proposalId: p.proposalId,
                                    time: p.startTime || '',
                                    title: p.place.name,
                                    desc: p.place.address || '',
                                    place: p.place.name,
                                    latitude: p.place.latitude,
                                    longitude: p.place.longitude,
                                    cost: p.estimatedCost ? String(p.estimatedCost) : '',
                                });
                            });
                        }

                        // 프론트엔드 Branch 인터페이스 규격에 맞춰 이름표(Key) 매핑
                        return {
                            id: b.branchId,      // branchId -> id 매핑 (Key 에러 해결)
                            title: b.name,       // name -> title 매핑 (제목 증발 해결)
                            name: b.name,
                            description: b.aiReason || "팀원이 구성한 일정입니다.",
                            proposer: b.createdBy,
                            isAI: b.createdBy === 'ai',
                            status: b.status,
                            cost: String(b.totalCost || 0),
                            time: String(b.totalTravelTime || 0),
                            matchRate: b.preferenceScore || 100,
                            routes: routesObj,   // 상세 정보에서 뽑아낸 장소들 매핑 (타임라인 증발 해결)
                            agreeCount: b.voteSummary?.agreeCount || 0,
                            holdCount: b.voteSummary?.holdCount || 0,
                            disagreeCount: b.voteSummary?.disagreeCount || 0,
                        };
                    } catch (detailError) {
                        console.error(`브랜치 ${b.branchId} 상세 로드 실패:`, detailError);
                        // 에러가 나더라도 화면 렌더링이 깨지지 않도록 기본값 반환
                        return {
                            id: b.branchId,
                            title: b.name,
                            name: b.name,
                            description: "",
                            proposer: b.createdBy,
                            isAI: b.createdBy === 'ai',
                            status: b.status,
                            cost: "0",
                            time: "0",
                            matchRate: 100,
                            routes: { 1: [] },
                            agreeCount: b.voteSummary?.agreeCount || 0,
                            holdCount: b.voteSummary?.holdCount || 0,
                            disagreeCount: b.voteSummary?.disagreeCount || 0,
                        };
                    }
                })
            );

            set({ branches: formattedBranches });

            // 상세 페이지 등에서 현재 선택된 브랜치가 있다면 최신 데이터로 동기화
            const { selectedBranch } = get();
            if (selectedBranch) {
                const updatedSelected = formattedBranches.find(b => b.id === selectedBranch.id);
                if (updatedSelected) {
                    set({ selectedBranch: updatedSelected });
                }
            }

        } catch (error) {
            console.error("브랜치 목록 로드 실패:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    createBranch: async (tripRoomId, title) => {
        if (get().isLoading) return false;

        const { draftRoutes } = get();

        // 백엔드 규격에 맞게 places 배열로 변환
        const formattedPlaces = Object.entries(draftRoutes).flatMap(([dayStr, routes]) => {
            const dayNo = Number(dayStr);
            return routes.map((route, index) => ({
                placeId: route.placeId,
                proposalId: route.proposalId || null,
                dayNo: dayNo,
                orderIndex: index + 1,
                startTime: route.time,
                estimatedCost: parseNumber(route.cost),
            }));
        });

        if (formattedPlaces.length === 0) {
            alert("일정에 최소 1개 이상의 장소를 추가해주세요.");
            return false;
        }

        set({ isLoading: true });
        try {
            await api.post(`/trip-rooms/${tripRoomId}/branches`, {
                name: title,
                places: formattedPlaces
            });

            await get().fetchBranches(tripRoomId);
            get().resetDraft();
            return true;
        } catch (error) {
            console.error("브랜치 생성 실패:", error);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    updateBranch: async (branchId, tripRoomId, title) => {
        if (get().isLoading) return false;

        const { draftRoutes } = get();

        // 생성과 동일한 방식으로 places 포맷팅
        const formattedPlaces = Object.entries(draftRoutes).flatMap(([dayStr, routes]) => {
            const dayNo = Number(dayStr);
            return routes.map((route, index) => ({
                placeId: route.placeId,
                proposalId: route.proposalId || null,
                dayNo: dayNo,
                orderIndex: index + 1,
                startTime: route.time,
                estimatedCost: parseNumber(route.cost),
            }));
        });

        if (formattedPlaces.length === 0) {
            alert("일정에 최소 1개 이상의 장소를 추가해주세요.");
            return false;
        }

        set({ isLoading: true });
        try {
            await api.put(`/branches/${branchId}`, {
                name: title,
                places: formattedPlaces
            });

            await get().fetchBranches(tripRoomId);
            return true;
        } catch (error: any) {
            console.error("브랜치 수정 실패:", error);
            if (error.response?.status === 409) {
                alert("이미 확정된 여행방이나 브랜치는 수정할 수 없습니다.");
            }
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    voteBranch: async (tripRoomId, branchId, voteType) => {
        set({ isLoading: true });
        try {
            await api.put(`/branches/${branchId}/vote`, { voteType });
            await get().fetchBranches(tripRoomId);

            const { selectedBranch } = get();
            if (selectedBranch && selectedBranch.id === branchId) {
                const updatedBranch = get().branches.find(b => b.id === branchId);
                if (updatedBranch) {
                    set({ selectedBranch: updatedBranch });
                }
            }

            return true;
        } catch (error) {
            console.error("투표 처리 실패:", error);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    finalizeBranch: async (tripRoomId, branchId) => {
        if (get().isLoading) return false;

        set({ isLoading: true });
        try {
            await api.post(`/trip-rooms/${tripRoomId}/finalize`, {
                branchId: branchId
            });

            set((state) => ({
                branches: state.branches.map(b =>
                    b.id === branchId ? { ...b, status: 'confirmed' } : b
                ),
                selectedBranch: state.selectedBranch?.id === branchId
                    ? { ...state.selectedBranch, status: 'confirmed' }
                    : state.selectedBranch
            }));

            return true;
        } catch (error) {
            console.error("일정 확정 처리 실패:", error);
            return false;
        } finally {
            set({ isLoading: false });
        }
    }
}));