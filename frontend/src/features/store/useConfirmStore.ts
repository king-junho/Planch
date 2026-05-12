import { create } from 'zustand';

interface ConfirmState {
    isOpen: boolean;
    message: string;
    resolve: ((value: boolean) => void) | null;
    confirm: (message: string) => Promise<boolean>;
    handleConfirm: () => void;
    handleCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
    isOpen: false,
    message: '',
    resolve: null,

    confirm: (message: string) => {
        return new Promise((resolve) => {
            set({ isOpen: true, message, resolve });
        });
    },

    handleConfirm: () => {
        const { resolve } = get();
        if (resolve) resolve(true);
        set({ isOpen: false, message: '', resolve: null });
    },

    handleCancel: () => {
        const { resolve } = get();
        if (resolve) resolve(false);
        set({ isOpen: false, message: '', resolve: null });
    }
}));