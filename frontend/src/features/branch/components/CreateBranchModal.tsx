import { Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useBranchStore } from '../store/useBranchStore';

interface CreateBranchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateManual: () => void;
}

export default function CreateBranchModal({ isOpen, onClose, onCreateManual }: CreateBranchModalProps) {
    const { tripRoomId } = useParams();
    const { generateAiBranches, isLoading } = useBranchStore();

    if (!isOpen) return null;

    const handleGenerateAI = async () => {
        if (!tripRoomId || isLoading) return;

        if (window.confirm("팀원들의 선호도와 제안된 장소를 바탕으로 AI가 최적의 코스 3개를 생성합니다.\n(약 10~20초 정도 소요될 수 있습니다.)\n진행하시겠습니까?")) {
            const success = await generateAiBranches(Number(tripRoomId), 3);
            if (success) {
                alert("AI가 성공적으로 일정을 생성했습니다!");
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">새 브랜치 만들기</h3>
                    <button onClick={onClose} disabled={isLoading} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 flex flex-col gap-5">
                    <button
                        onClick={handleGenerateAI}
                        disabled={isLoading}
                        className={`flex items-start gap-5 p-6 rounded-2xl border-2 transition-all text-left group ${isLoading
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-blue-50 bg-blue-50/30 hover:border-blue-500 hover:bg-white'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${isLoading
                                ? 'bg-gray-200 text-gray-400'
                                : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                            }`}>
                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                        </div>
                        <div>
                            <h4 className={`text-lg font-bold mb-1 ${isLoading ? 'text-gray-500' : 'text-blue-900'}`}>
                                {isLoading ? 'AI가 고민 중입니다...' : 'AI 맞춤 추천'}
                            </h4>
                            <p className={`text-sm leading-relaxed ${isLoading ? 'text-gray-400' : 'text-blue-700/70'}`}>
                                팀원들의 선호도를 분석하여 최적의 경로를 생성합니다.
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={onCreateManual}
                        disabled={isLoading}
                        className="flex items-start gap-5 p-6 rounded-2xl border-2 border-gray-100 bg-white hover:border-gray-900 hover:bg-gray-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 group-hover:bg-gray-900 group-hover:text-white flex items-center justify-center shrink-0 transition-all">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">직접 구성하기</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                장소들을 직접 선택하여 나만의 일정을 만듭니다.
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}