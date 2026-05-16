import { ArrowLeft, Save, Loader2, Users } from 'lucide-react';

interface BranchCreateHeaderProps {
    title: string;
    setTitle: (title: string) => void;
    onSave: () => void;
    onBack: () => void;
    isSaving?: boolean;
    isPartnerSaving?: boolean;
}

export default function BranchCreateHeader({ title, setTitle, onSave, onBack, isSaving = false, isPartnerSaving = false }: BranchCreateHeaderProps) {
    const isDisabled = isSaving || isPartnerSaving;

    return (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-4">
                <button onClick={onBack} disabled={isDisabled} className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="새 브랜치 이름 입력"
                    disabled={isDisabled}
                    className="text-lg font-bold text-gray-900 border-none focus:ring-0 placeholder:text-gray-300 w-64 outline-none disabled:bg-transparent"
                />
            </div>
            <button
                onClick={onSave}
                disabled={isDisabled}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSaving ? (
                    <>
                        <Loader2 size={16} className="animate-spin" /> 내보내는 중...
                    </>
                ) : isPartnerSaving ? (
                    <>
                        <Users size={16} className="animate-pulse" /> 동기화 중...
                    </>
                ) : (
                    <>
                        <Save size={16} /> 저장하기
                    </>
                )}
            </button>
        </div>
    );
}