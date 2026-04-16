import { Sparkles, Plus, X } from 'lucide-react';

export default function CreateBranchModal({ isOpen, onClose, onCreateManual }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* 모달 헤더 */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h3 className="text-lg font-bold text-gray-900">새 일정(브랜치) 만들기</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* 모달 컨텐츠 (2가지 선택 버튼) */}
                <div className="p-6 flex flex-col gap-4">

                    {/* 옵션 1. AI 추천 */}
                    <button
                        onClick={() => {
                            alert('추후 AI 생성 API가 연결될 자리입니다.');
                        }}
                        className="flex items-start gap-4 p-5 rounded-xl border-2 border-blue-100 bg-blue-50 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-blue-900 mb-1">AI 맞춤 추천받기</h4>
                            <p className="text-xs text-blue-700/80 leading-relaxed">
                                팀원들이 입력한 선호도와 장소 데이터를 바탕으로 AI가 최적의 동선을 알아서 짜줍니다.
                            </p>
                        </div>
                    </button>

                    {/* 옵션 2. 직접 만들기 */}
                    <button
                        onClick={onCreateManual}
                        className="flex items-start gap-4 p-5 rounded-xl border-2 border-gray-100 bg-white hover:border-gray-900 hover:bg-gray-50 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 group-hover:bg-gray-900 group-hover:text-white flex items-center justify-center shrink-0 transition-all">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-gray-900 mb-1">빈 캔버스에서 직접 만들기</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                AI의 도움 없이, 팀원들이 제안한 장소들을 확인하며 내 마음대로 일정을 직접 구성합니다.
                            </p>
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
}