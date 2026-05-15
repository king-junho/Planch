import { create } from 'zustand';
import { Branch, RouteItem } from '../../../types/branch';
import api from '../../../api/axiosInstance';
import { useToastStore } from '../../store/useToastStore';

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

    tripDuration: number;
    tripStartDate: Date | null;
    setTripDuration: (days: number) => void;
    fetchTripDuration: (tripRoomId: number) => Promise<void>;

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
    deleteBranch: (tripRoomId: number, branchId: number) => Promise<boolean>;
    generateAiBranches: (tripRoomId: number, branchCount?: number) => Promise<boolean>;
}

export const useBranchStore = create<BranchState>((set, get) => ({
    branches: [],
    selectedBranch: null,
    selectedDay: 1,
    isLoading: false,

    tripDuration: 3,
    tripStartDate: null,
    setTripDuration: (days) => set({ tripDuration: days }),

    fetchTripDuration: async (tripRoomId) => {
        try {
            const response = await api.get(`/trip-rooms/${tripRoomId}`);
            const { startDate, endDate } = response.data;
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                const diffTime = end.getTime() - start.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                set({ tripDuration: diffDays > 0 ? diffDays : 1, tripStartDate: start });
            } else {
                set({ tripDuration: 3, tripStartDate: null });
            }
        } catch (error) {
            console.error("여행 정보 조회 실패:", error);
        }
    },

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
            const listResponse = await api.get(`/trip-rooms/${tripRoomId}/branches`);
            const basicBranches = listResponse.data;

            const formattedBranches = await Promise.all(
                basicBranches.map(async (b: any) => {
                    try {
                        const detailResponse = await api.get(`/branches/${b.branchId || b.id}`);
                        const detail = detailResponse.data?.data || detailResponse.data;

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

                        const finalCreatedBy = (detail.createdBy && detail.createdBy !== 'user')
                            ? detail.createdBy
                            : ((b.createdBy && b.createdBy !== 'user') ? b.createdBy : '팀원');

                        const finalCreatedUserId = detail.createdUserId || detail.userId || b.createdUserId || b.userId || null;
                        const finalIsAi = String(detail.createdBy).toLowerCase() === 'ai' || String(b.createdBy).toLowerCase() === 'ai' || b.source === 'ai';

                        return {
                            id: b.branchId || b.id,
                            title: b.name || detail.name,
                            name: b.name || detail.name,
                            description: detail.aiReason || "팀원이 구성한 일정입니다.",
                            proposer: finalCreatedBy,
                            isAI: finalIsAi,
                            status: detail.status || b.status,
                            cost: String(detail.metrics?.totalCost || detail.totalCost || b.totalCost || 0),
                            time: String(detail.metrics?.totalTravelTime || detail.totalTravelTime || b.totalTravelTime || 0),
                            matchRate: detail.metrics?.preferenceScore || detail.preferenceScore || b.preferenceScore || 100,
                            routes: routesObj,
                            agreeCount: detail.voteSummary?.agreeCount || b.voteSummary?.agreeCount || 0,
                            holdCount: detail.voteSummary?.holdCount || b.voteSummary?.holdCount || 0,
                            disagreeCount: detail.voteSummary?.disagreeCount || b.voteSummary?.disagreeCount || 0,

                            createdBy: finalCreatedBy,
                            createdUserId: finalCreatedUserId,
                        };
                    } catch (detailError) {
                        console.error(`브랜치 상세 로드 실패:`, detailError);
                        const fallbackIsAi = String(b.createdBy).toLowerCase() === 'ai' || b.source === 'ai';
                        const fallbackProposer = (b.createdBy && b.createdBy !== 'user') ? b.createdBy : '팀원';

                        return {
                            id: b.branchId || b.id,
                            title: b.name,
                            name: b.name,
                            description: b.aiReason || "팀원이 구성한 일정입니다.",
                            proposer: fallbackProposer,
                            isAI: fallbackIsAi,
                            status: b.status,
                            cost: String(b.totalCost || 0),
                            time: String(b.totalTravelTime || 0),
                            matchRate: b.preferenceScore || 100,
                            routes: { 1: [] },
                            agreeCount: b.voteSummary?.agreeCount || 0,
                            holdCount: b.voteSummary?.holdCount || 0,
                            disagreeCount: b.voteSummary?.disagreeCount || 0,
                            createdBy: fallbackProposer,
                            createdUserId: b.createdUserId || b.userId || null,
                        };
                    }
                })
            );

            set({ branches: formattedBranches });

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

        const formattedPlaces = Object.entries(draftRoutes).flatMap(([dayStr, routes]) => {
            const dayNo = Number(dayStr);
            return routes.map((route, index) => ({
                placeId: route.placeId,
                proposalId: route.proposalId || null,
                dayNo: dayNo,
                orderIndex: index + 1,
                startTime: route.time,
                estimatedCost: parseNumber(route.cost),
                placeName: route.title || route.place,
                address: route.desc,
                latitude: route.latitude,
                longitude: route.longitude,
            }));
        });

        if (formattedPlaces.length === 0) {
            useToastStore.getState().showToast('error', "일정에 최소 1개 이상의 장소를 추가해주세요.");
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

        const formattedPlaces = Object.entries(draftRoutes).flatMap(([dayStr, routes]) => {
            const dayNo = Number(dayStr);
            return routes.map((route, index) => ({
                placeId: route.placeId,
                proposalId: route.proposalId || null,
                dayNo: dayNo,
                orderIndex: index + 1,
                startTime: route.time,
                estimatedCost: parseNumber(route.cost),
                placeName: route.title || route.place,
                address: route.desc,
                latitude: route.latitude,
                longitude: route.longitude,
            }));
        });

        if (formattedPlaces.length === 0) {
            useToastStore.getState().showToast('error', "일정에 최소 1개 이상의 장소를 추가해주세요.");
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
                useToastStore.getState().showToast('error', "이미 확정된 여행방이나 브랜치는 수정할 수 없습니다.");
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
    },

    deleteBranch: async (tripRoomId, branchId) => {
        if (get().isLoading) return false;

        set({ isLoading: true });
        try {
            await api.delete(`/branches/${branchId}`);

            await get().fetchBranches(tripRoomId);
            set({ selectedBranch: null });

            return true;
        } catch (error: any) {
            console.error("브랜치 삭제 실패:", error);
            if (error.response?.status === 403) {
                useToastStore.getState().showToast('error', "방장이나 작성자만 일정을 삭제할 수 있습니다.");
            } else if (error.response?.status === 409) {
                useToastStore.getState().showToast('error', "확정된 여행방이나 브랜치는 삭제할 수 없습니다.");
            } else {
                useToastStore.getState().showToast('error', "삭제 처리 중 오류가 발생했습니다.");
            }
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    generateAiBranches: async (tripRoomId, branchCount = 1) => {
        if (get().isLoading) return false;

        set({ isLoading: true });
        try {
            await api.post(`/trip-rooms/${tripRoomId}/branches/generate-ai`, {
                branchCount
            });

            await get().fetchBranches(tripRoomId);
            return true;
        } catch (error: any) {
            console.error("AI 브랜치 생성 실패:", error);
            if (error.response?.status === 403) {
                useToastStore.getState().showToast('error', "방장만 AI 추천 일정을 생성할 수 있습니다.");
            } else if (error.response?.status === 400) {
                useToastStore.getState().showToast('error', error.response?.data?.message || "AI가 일정을 구성하기 위해서는 먼저 장소를 제안해 주세요.");
            } else {
                useToastStore.getState().showToast('error', "AI 추천 일정 생성 중 오류가 발생했습니다.");
            }
            return false;
        } finally {
            set({ isLoading: false });
        }
    }
}));
