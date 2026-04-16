import { create } from 'zustand';

export const usePreferenceStore = create((set) => ({
    preferences: {
        budget: 300000,
        styles: ['맛집', '사진스팟'],
        mustGo: ['아르떼뮤지엄'],
        mustAvoid: ['웨이팅 긴 곳'],
        activeTimes: ['오후'],
        freeText: ''
    },

    // 단일 값 업데이트 (예산, 텍스트 등)
    updatePreference: (key, value) => set((state) => ({
        preferences: { ...state.preferences, [key]: value }
    })),

    // 배열 토글 (스타일, 시간대 등)
    toggleArrayItem: (key, item) => set((state) => {
        const array = state.preferences[key];
        return {
            preferences: {
                ...state.preferences,
                [key]: array.includes(item) ? array.filter(i => i !== item) : [...array, item]
            }
        };
    }),

    // 배열 항목 추가 (가고싶은 곳 등)
    addArrayItem: (key, item) => set((state) => ({
        preferences: {
            ...state.preferences,
            [key]: state.preferences[key].includes(item) ? state.preferences[key] : [...state.preferences[key], item]
        }
    })),

    // 배열 항목 제거
    removeArrayItem: (key, item) => set((state) => ({
        preferences: {
            ...state.preferences,
            [key]: state.preferences[key].filter(i => i !== item)
        }
    }))
}));