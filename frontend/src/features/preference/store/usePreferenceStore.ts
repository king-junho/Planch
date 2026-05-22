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
    originalData: PreferenceData;
    teamPreferences: any[];
    isLoading: boolean;

    updatePreference: (field: keyof PreferenceData, value: any) => void;
    toggleArrayItem: (field: 'styles' | 'activeTimes', item: string) => void;
    addArrayItem: (field: 'mustGo' | 'mustAvoid', value: string) => void;
    removeArrayItem: (field: 'mustGo' | 'mustAvoid', index: number) => void;

    fetchPreferences: (tripRoomId: number) => Promise<void>;
    saveMyPreference: (tripRoomId: number) => Promise<boolean>;
    resetForm: () => void;
    resetPreferenceState: () => void;
    initializeFormWithExisting: (myUserId: string | number) => void;
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
    originalData: initialForm,
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

    resetForm: () => set({ formData: initialForm, originalData: initialForm }),

    resetPreferenceState: () => set({
        formData: initialForm,
        originalData: initialForm,
        teamPreferences: [],
        isLoading: false
    }),

    initializeFormWithExisting: (myUserId) => {
        const { teamPreferences } = get();
        const safePreferences = Array.isArray(teamPreferences) ? teamPreferences : [];

        if (safePreferences.length === 0) {
            set({ formData: initialForm, originalData: initialForm });
            return;
        }

        const myPref = safePreferences.find((p: any) =>
            String(p.user?.id || p.userId) === String(myUserId) ||
            String(p.user?.email) === String(myUserId)
        );

        if (myPref) {
            const loadedData = {
                budgetMin: myPref.budgetMin || 0,
                budgetMax: myPref.budgetMax || 500000,
                styles: Array.isArray(myPref.styles) ? myPref.styles : [],
                mustGo: Array.isArray(myPref.mustVisit) ? myPref.mustVisit : [],
                mustAvoid: Array.isArray(myPref.avoid) ? myPref.avoid : [],
                activeTimes: Array.isArray(myPref.availableTime) ? myPref.availableTime : [],
                freeText: myPref.freeTextNote || myPref.memo || ''
            };
            set({
                formData: loadedData,
                originalData: loadedData
            });
        } else {
            set({
                formData: initialForm,
                originalData: initialForm
            });
        }
    },

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

    saveMyPreference: async (tripRoomId) => {
        if (get().isLoading) return false;

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
                freeTextNote: formData.freeText,
                memo: formData.freeText
            });
            await get().fetchPreferences(tripRoomId);

            set({ originalData: get().formData });

            return true;
        } catch (error) {
            console.error("선호도 저장 실패:", error);
            return false;
        } finally {
            set({ isLoading: false });
        }
    }
}));