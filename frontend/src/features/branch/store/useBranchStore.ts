import { create } from 'zustand';
import { Branch, RouteItem } from '../../../types/branch';
import api from '../../../api/axiosInstance';

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

    fetchBranches: async (tripRoomId) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/trip-rooms/${tripRoomId}/branches`);
            set({ branches: response.data });
        } catch (error) {
            console.error("브랜치 목록 로드 실패:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    createBranch: async (tripRoomId, title) => {
        if (get().isLoading) return false;

        const { draftRoutes } = get();

        const mockBranch: Branch = {
            id: Date.now(),
            title: title,
            name: title,
            description: "팀원이 구성한 일정입니다. (임시 데이터)",
            proposer: "테스트 유저",
            isAI: false,
            status: "voting",
            cost: "계산 중",
            time: "계산 중",
            matchRate: 100,
            routes: JSON.parse(JSON.stringify(draftRoutes))
        };

        set({ isLoading: true });
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            set((state) => ({ branches: [mockBranch, ...state.branches] }));

            get().resetDraft();
            return true;
        } catch (error) {
            console.error("브랜치 생성 실패:", error);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    voteBranch: async (tripRoomId, branchId, voteType) => {
        set({ isLoading: true });
        try {
            // 백엔드 라우터(branchRoutes.ts)에 맞춰 PUT 메서드와 올바른 URL로 변경
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
            // 백엔드 라우터(tripRoomRoutes.ts)에 맞춰 POST 메서드와 올바른 URL로 변경
            await api.post(`/trip-rooms/${tripRoomId}/finalize`, {
                branchId: branchId
            });

            // 확정 성공 시 화면 상태 즉시 업데이트
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