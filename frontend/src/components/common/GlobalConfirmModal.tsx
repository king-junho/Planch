import { useConfirmStore } from '../../features/store/useConfirmStore';

export default function GlobalConfirmModal() {
    const { isOpen, message, handleConfirm, handleCancel } = useConfirmStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-[320px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-7 text-center">
                    <p className="text-gray-800 text-[15px] font-medium leading-relaxed whitespace-pre-wrap break-keep">
                        {message}
                    </p>
                </div>
                <div className="flex border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={handleCancel}
                        className="flex-1 py-3.5 text-sm text-gray-500 font-bold hover:bg-gray-100 transition-colors"
                    >
                        취소
                    </button>
                    <div className="w-[1px] bg-gray-100" />
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3.5 text-sm text-blue-600 font-bold hover:bg-blue-50 transition-colors"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}