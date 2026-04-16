import { CheckCircle2, XCircle, Sparkles, Plus } from 'lucide-react';

interface PreferenceOverallViewProps {
    onOpenAiModal: () => void;
    onCreateManual: () => void;
}

export default function PreferenceOverallView({ onOpenAiModal, onCreateManual }: PreferenceOverallViewProps) {
    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-10 animate-in fade-in duration-300 pb-20">
            <div className="flex flex-col gap-2">
                <h2 className="text-gray-900 text-2xl font-bold">팀 종합 결과</h2>
                <p className="text-gray-500 text-sm">팀원들의 모든 선호도를 AI가 분석하여 요약했습니다.</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 text-blue-800 p-8 rounded-3xl flex justify-between items-center gap-8 shadow-sm">
                <div className="text-base font-medium leading-relaxed">
                    팀원들의 모든 선호도가 수집되었습니다.<br />
                    데이터 기반의 AI 추천을 받거나 직접 일정을 구성해 보세요.
                </div>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={onOpenAiModal}
                        className="flex items-center gap-2 px-6 py-3.5 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-bold shadow-sm"
                    >
                        <Sparkles size={18} /> AI 추천
                    </button>
                    <button
                        onClick={onCreateManual}
                        className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-100"
                    >
                        <Plus size={18} /> 직접 만들기
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <span className="text-gray-900 text-lg font-bold">통합 요구사항 (가고 싶은 곳)</span>
                    <div className="flex flex-col gap-4 p-6 bg-blue-50/30 rounded-2xl border border-blue-100 text-sm text-gray-700">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 size={20} className="text-blue-500 shrink-0 mt-0.5" />
                            <span>아르떼뮤지엄, 오션뷰 카페, 흑돼지 전문점 방문 희망</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 size={20} className="text-blue-500 shrink-0 mt-0.5" />
                            <span>카트 체험 같은 액티비티도 포함 원함</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <span className="text-gray-900 text-lg font-bold">통합 요구사항 (피하고 싶은 곳)</span>
                    <div className="flex flex-col gap-4 p-6 bg-red-50/30 rounded-2xl border border-red-100 text-sm text-gray-700">
                        <div className="flex items-start gap-3">
                            <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <span>웨이팅이 너무 길거나 사람이 붐비는 곳은 지양</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <span>등산이나 무리한 도보 이동 일정 제외</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}