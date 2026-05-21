import { ArrowLeft, Save, Loader2, Users } from 'lucide-react';

interface BranchCreateHeaderProps {
    title: string;
    setTitle: (title: string) => void;
    description: string;
    setDescription: (desc: string) => void;
    onSave: () => void;
    onBack: () => void;
    isSaving?: boolean;
    isPartnerSaving?: boolean;
}

export default function BranchCreateHeader({
    title,
    setTitle,
    description,
    setDescription,
    onSave,
    onBack,
    isSaving = false,
    isPartnerSaving = false
}: BranchCreateHeaderProps) {
    const isDisabled = isSaving || isPartnerSaving;

    return (
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 shrink-0 bg-white">
            <div className="flex items-center justify-between">
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
                        spellCheck={false}
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
                            <Loader2 size={16} className="animate-spin" /> 저장 중...
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

            <div className="pl-[3.25rem]">
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="이 일정의 컨셉이나 설명을 적어주세요 (예: 뚜벅이를 위한 여유로운 코스)"
                    disabled={isDisabled}
                    spellCheck={false}
                    className="w-full text-sm font-medium text-gray-600 border-none focus:ring-0 placeholder:text-gray-300 outline-none disabled:bg-transparent bg-transparent"
                />
            </div>
        </div>
    );
}