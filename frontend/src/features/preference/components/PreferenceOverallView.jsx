import { CheckCircle2, XCircle, Sparkles, Plus } from 'lucide-react';

export default function PreferenceOverallView({ onOpenAiModal, onCreateManual }) {
    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-10 animate-in fade-in duration-300 pb-20">
            <div className="flex flex-col gap-2">
                <h2 className="text-gray-900 text-2xl font-bold">팀 종합 결과</h2>
                <p className="text-gray-500 text-sm">팀원 3명의 선호도를 AI가 분석하여 요약했습니다.</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 text-blue-800 p-6 rounded-2xl flex justify-between items-center gap-6 shadow-sm">
                <div className="text-sm font-medium leading-relaxed">
                    팀원들의 모든 선호도가 수집되었습니다.<br />
                    데이터 기반의 AI 추천을 받거나 직접 일정을 구성해 보세요.
                </div>
                <div className="flex gap-2 shrink-0">
                    <button onClick={onOpenAiModal} className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-bold shadow-sm">
                        <Sparkles size={16} /> AI 추천
                    </button>
                    <button onClick={onCreateManual} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200">
                        <Plus size={16} /> 직접 만들기
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <span className="text-gray-900 text-base font-bold">평균 예산 (1인 기준)</span>
                <div className="text-2xl font-bold text-blue-600">약 316,000원</div>
            </div>

            <div className="flex flex-col gap-4">
                <span className="text-gray-900 text-base font-bold">가장 많이 겹치는 여행 스타일</span>
                <div className="flex flex-wrap gap-2">
                    <span className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-full">맛집 (2명)</span>
                    <span className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200">사진스팟</span>
                    <span className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200">휴식</span>
                    <span className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200">액티비티</span>
                </div>
            </div>

            <div className="flex gap-6">
                <div className="flex-1 flex flex-col gap-4">
                    <span className="text-gray-900 text-base font-bold">통합 요구사항 (가고 싶은 곳)</span>
                    <div className="flex flex-col gap-3 p-5 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-gray-700">
                        <div className="flex items-start gap-2"><CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" /><span>아르떼뮤지엄, 오션뷰 카페, 흑돼지 전문점 방문 희망</span></div>
                        <div className="flex items-start gap-2"><CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" /><span>카트 체험 같은 액티비티도 포함 원함</span></div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                    <span className="text-gray-900 text-base font-bold">통합 요구사항 (피하고 싶은 곳)</span>
                    <div className="flex flex-col gap-3 p-5 bg-red-50/50 rounded-xl border border-red-100 text-sm text-gray-700">
                        <div className="flex items-start gap-2"><XCircle size={18} className="text-red-500 shrink-0 mt-0.5" /><span>웨이팅이 너무 긴 식당이나 비싼 식당 기피</span></div>
                        <div className="flex items-start gap-2"><XCircle size={18} className="text-red-500 shrink-0 mt-0.5" /><span>등산 등 체력 소모가 심한 일정 불호</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}