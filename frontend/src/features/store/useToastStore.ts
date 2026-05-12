import { create } from 'zustand';

interface ToastState {
    toast: { type: 'success' | 'error'; message: string } | null;
    showToast: (type: 'success' | 'error', message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toast: null,
    showToast: (type, message) => {
        set({ toast: { type, message } });
        setTimeout(() => {
            set({ toast: null });
        }, 2200);
    }
}));