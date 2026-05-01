import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface BranchCreateHeaderProps {
    title: string;
    setTitle: (title: string) => void;
    onSave: () => void;
    onBack: () => void;
    isSaving?: boolean; // 저장 중 상태 추가
}

export default function BranchCreateHeader({ title, setTitle, onSave, onBack, isSaving = false }: BranchCreateHeaderProps) {
    return (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-4">
                <button onClick={onBack} disabled={isSaving} className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="새 브랜치 이름 입력"
                    disabled={isSaving}
                    className="text-lg font-bold text-gray-900 border-none focus:ring-0 placeholder:text-gray-300 w-64 outline-none disabled:bg-transparent"
                />
            </div>
            <button
                onClick={onSave}
                disabled={isSaving} // 저장 중일 때 클릭 방지
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSaving ? (
                    <>
                        <Loader2 size={16} className="animate-spin" /> 저장 중...
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