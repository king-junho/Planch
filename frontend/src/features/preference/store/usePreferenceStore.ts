import { create } from 'zustand';
import { PreferenceData } from '../../../types/preference';

interface PreferenceState {
    preferences: PreferenceData;
    // Actions
    updatePreference: (key: keyof PreferenceData, value: any) => void;
    toggleArrayItem: (key: 'styles' | 'activeTimes', item: string) => void;
    addArrayItem: (key: 'mustGo' | 'mustAvoid', item: string) => void;
    removeArrayItem: (key: 'mustGo' | 'mustAvoid', index: number) => void;
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
    preferences: {
        budget: 300000,
        styles: ['맛집', '사진스팟'],
        mustGo: ['아르떼뮤지엄'],
        mustAvoid: ['웨이팅 긴 곳'],
        activeTimes: ['오후'],
        freeText: ''
    },

    updatePreference: (key, value) => set((state) => ({
        preferences: { ...state.preferences, [key]: value }
    })),

    toggleArrayItem: (key, item) => set((state) => {
        const array = state.preferences[key];
        return {
            preferences: {
                ...state.preferences,
                [key]: array.includes(item)
                    ? array.filter(i => i !== item)
                    : [...array, item]
            }
        };
    }),

    addArrayItem: (key, item) => set((state) => ({
        preferences: {
            ...state.preferences,
            [key]: state.preferences[key].includes(item)
                ? state.preferences[key]
                : [...state.preferences[key], item]
        }
    })),

    removeArrayItem: (key, index) => set((state) => ({
        preferences: {
            ...state.preferences,
            [key]: state.preferences[key].filter((_, i) => i !== index)
        }
    }))
}));