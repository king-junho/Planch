import { CheckCircle2, XCircle, Sparkles, Plus, Wallet, Clock, Star, Loader2 } from 'lucide-react';
import { usePreferenceStore } from '../store/usePreferenceStore';
import { useBranchStore } from '../../branch/store/useBranchStore';

interface PreferenceOverallViewProps {
    onOpenAiModal: () => void;
    onCreateManual: () => void;
    isLocked?: boolean;
}

export default function PreferenceOverallView({ onOpenAiModal, onCreateManual, isLocked = false }: PreferenceOverallViewProps) {
    const { teamPreferences } = usePreferenceStore();
    const { isLoading } = useBranchStore();

    const safePreferences = Array.isArray(teamPreferences) ? teamPreferences : [];

    const budgets = safePreferences.map(p => p.budgetMax || 0).filter(b => b > 0);
    const minBudget = budgets.length > 0 ? Math.min(...budgets) : 0;

    const styleCounts: Record<string, number> = {};
    safePreferences.forEach(p => {
        (p.styles || []).forEach((style: string) => {
            styleCounts[style] = (styleCounts[style] || 0) + 1;
        });
    });
    const topStyles = Object.entries(styleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    let commonTimes: string[] = [];
    if (safePreferences.length > 0) {
        commonTimes = safePreferences[0].availableTime || [];
        safePreferences.slice(1).forEach(p => {
            const currentTimes = p.availableTime || [];
            commonTimes = commonTimes.filter(time => currentTimes.includes(time));
        });
    }

    const allMustGo = Array.from(new Set(safePreferences.flatMap(p => p.mustVisit || []))).filter(Boolean);
    const allAvoid = Array.from(new Set(safePreferences.flatMap(p => p.avoid || []))).filter(Boolean);

    const isButtonDisabled = isLocked || isLoading;

    return (
        <div className="flex flex-col gap-10 w-full animate-in fade-in duration-300 pb-20">
            <div className="flex flex-col gap-2">
                <h2 className="text-gray-900 text-2xl font-bold">팀 종합 결과</h2>
                <p className="text-gray-500 text-sm">팀원들이 입력한 선호도 데이터를 분석한 결과입니다.</p>
            </div>

            <div className={`border p-8 rounded-3xl flex justify-between items-center gap-8 shadow-sm transition-colors ${isLocked ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-blue-50 border-blue-100 text-blue-800'
                }`}>
                <div className="text-base font-medium leading-relaxed break-keep">
                    {isLocked ? (
                        <>여행 일정이 최종 확정되었습니다.<br className="hidden lg:block" />팀 종합 결과를 참고하여 즐거운 여행을 다녀오세요!</>
                    ) : (
                        <>팀원들의 주요 취향이 파악되었습니다.<br className="hidden lg:block" />데이터 기반의 AI 추천을 받거나 직접 일정을 구성해 보세요.</>
                    )}
                </div>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={onOpenAiModal}
                        disabled={isButtonDisabled}
                        className={`flex justify-center items-center gap-2 px-6 py-3.5 border rounded-xl font-bold shadow-sm transition-all whitespace-nowrap shrink-0 ${isButtonDisabled
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                                : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
                            }`}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        AI 맞춤 추천
                    </button>
                    <button
                        onClick={onCreateManual}
                        disabled={isButtonDisabled}
                        className={`flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-sm transition-all whitespace-nowrap shrink-0 ${isButtonDisabled
                                ? 'bg-gray-300 text-gray-50 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        <Plus size={18} /> 직접 만들기
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Wallet size={16} className="shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">공통 예산 (1인)</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 break-keep">
                        {minBudget > 0 ? `${(minBudget / 10000).toLocaleString()}만원 이하` : '데이터 없음'}
                    </span>
                </div>

                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Star size={16} className="shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">인기 스타일 Top 3</span>
                    </div>
                    <span className="text-base font-bold text-gray-900 leading-tight break-keep">
                        {topStyles.length > 0 ? topStyles.join(', ') : '데이터 없음'}
                    </span>
                </div>

                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={16} className="shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">겹치는 시간대</span>
                    </div>
                    <span className="text-base font-bold text-gray-900 leading-tight break-keep">
                        {commonTimes.length > 0 ? commonTimes.join(', ') : '모두 맞는 시간이 없음'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <span className="text-gray-900 text-lg font-bold">통합 요구사항 (꼭 가고 싶은 곳)</span>
                    <div className="flex flex-col gap-4 p-6 bg-blue-50/30 rounded-2xl border border-blue-100 text-sm text-gray-700">
                        {allMustGo.length > 0 ? (
                            allMustGo.map((place, index) => (
                                <div key={`go-${index}`} className="flex items-start gap-3">
                                    <CheckCircle2 size={20} className="text-blue-500 shrink-0 mt-0.5" />
                                    <span className="font-medium text-gray-900 break-keep">{place}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-gray-400 break-keep">등록된 장소가 없습니다.</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <span className="text-gray-900 text-lg font-bold">통합 요구사항 (피하고 싶은 곳)</span>
                    <div className="flex flex-col gap-4 p-6 bg-red-50/30 rounded-2xl border border-red-100 text-sm text-gray-700">
                        {allAvoid.length > 0 ? (
                            allAvoid.map((place, index) => (
                                <div key={`avoid-${index}`} className="flex items-start gap-3">
                                    <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                    <span className="font-medium text-gray-900 break-keep">{place}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-gray-400 break-keep">등록된 조건이 없습니다.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}