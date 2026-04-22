import { create } from 'zustand';
import api from '../../../api/axiosInstance';

interface PreferenceData {
    budgetMin: number;
    budgetMax: number;
    styles: string[];
    mustGo: string[];
    mustAvoid: string[];
    activeTimes: string[];
    freeText: string;
}

interface PreferenceState {
    formData: PreferenceData;
    teamPreferences: any[];
    isLoading: boolean;

    updatePreference: (field: keyof PreferenceData, value: any) => void;
    toggleArrayItem: (field: 'styles' | 'activeTimes', item: string) => void;
    addArrayItem: (field: 'mustGo' | 'mustAvoid', value: string) => void;
    removeArrayItem: (field: 'mustGo' | 'mustAvoid', index: number) => void;

    fetchPreferences: (tripRoomId: number) => Promise<void>;
    saveMyPreference: (tripRoomId: number) => Promise<boolean>;
    resetForm: () => void;
    // 새로 추가된 함수 타입 선언
    initializeFormWithExisting: (myUserId: number) => void;
}

const initialForm: PreferenceData = {
    budgetMin: 0,
    budgetMax: 500000,
    styles: [],
    mustGo: [],
    mustAvoid: [],
    activeTimes: [],
    freeText: ''
};

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
    formData: initialForm,
    teamPreferences: [],
    isLoading: false,

    updatePreference: (field, value) =>
        set((state) => ({ formData: { ...state.formData, [field]: value } })),

    toggleArrayItem: (field, item) =>
        set((state) => {
            const list = state.formData[field];
            const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
            return { formData: { ...state.formData, [field]: newList } };
        }),

    addArrayItem: (field, value) =>
        set((state) => ({ formData: { ...state.formData, [field]: [...state.formData[field], value] } })),

    removeArrayItem: (field, index) =>
        set((state) => ({
            formData: { ...state.formData, [field]: state.formData[field].filter((_, i) => i !== index) }
        })),

    resetForm: () => set({ formData: initialForm }),

    // 추가된 함수: 내 데이터를 찾아서 폼에 채워넣기
    initializeFormWithExisting: (myUserId) => {
        const { teamPreferences } = get();
        const safePreferences = Array.isArray(teamPreferences) ? teamPreferences : [];

        // 전체 팀원 선호도 중에서 내 ID와 일치하는 데이터를 찾습니다.
        const myPref = safePreferences.find((p: any) => (p.user?.id || p.userId) === myUserId);

        if (myPref) {
            set({
                formData: {
                    budgetMin: myPref.budgetMin || 0,
                    budgetMax: myPref.budgetMax || 500000,
                    styles: myPref.styles || [],
                    mustGo: myPref.mustVisit || [],
                    mustAvoid: myPref.avoid || [],
                    activeTimes: myPref.availableTime || [],
                    freeText: myPref.memo || ''
                }
            });
        } else {
            set({ formData: initialForm });
        }
    },

    // [GET] 팀 선호도 목록 가져오기
    fetchPreferences: async (tripRoomId) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/trip-rooms/${tripRoomId}/preferences`);

            const responseData = response.data;
            const preferencesArray = Array.isArray(responseData)
                ? responseData
                : (responseData.preferences || responseData.data || []);

            set({ teamPreferences: preferencesArray });
        } catch (error) {
            console.error("선호도 조회 실패:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    // [PUT] 내 선호도 저장하기
    saveMyPreference: async (tripRoomId) => {
        const { formData } = get();
        set({ isLoading: true });
        try {
            await api.put(`/trip-rooms/${tripRoomId}/preferences/me`, {
                budgetMin: formData.budgetMin,
                budgetMax: formData.budgetMax,
                styles: formData.styles,
                mustVisit: formData.mustGo,
                avoid: formData.mustAvoid,
                availableTime: formData.activeTimes,
                memo: formData.freeText
            });
            await get().fetchPreferences(tripRoomId); // 저장 후 목록 갱신
            return true;
        } catch (error) {
            console.error("선호도 저장 실패:", error);
            return false;
        } finally {
            set({ isLoading: false });
        }
    }
}));