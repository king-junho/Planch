import { CheckSquare } from 'lucide-react';
import { MemberPreference } from '../../../types/preference';

interface PreferenceMemberViewProps {
    currentData: MemberPreference;
}

export default function PreferenceMemberView({ currentData }: PreferenceMemberViewProps) {
    if (!currentData) return null;

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-10 w-full animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
            <div className="flex flex-col gap-2">
                <h2 className="text-gray-900 text-2xl font-bold">{currentData.name}님의 선호도</h2>
                <p className="text-gray-500 text-sm">입력하신 여행 취향 상세 내역입니다.</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-900 text-base font-bold whitespace-nowrap">예산 범위 (1인 기준)</span>
                    <span className="text-blue-600 text-base font-bold whitespace-nowrap">
                        {currentData.budget >= 1000000 ? '100만원+' : `${(currentData.budget / 10000).toLocaleString()}만원 이하`}
                    </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-lg overflow-hidden mt-2 relative">
                    <div
                        className="h-full bg-blue-500 rounded-lg absolute left-0 top-0 transition-all duration-500"
                        style={{ width: `${Math.min((currentData.budget / 1000000) * 100, 100)}%` }}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <span className="text-gray-900 text-base font-bold whitespace-nowrap">여행 스타일</span>
                <div className="flex flex-wrap gap-2">
                    {currentData.styles.map(style => (
                        <div key={style} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold whitespace-nowrap">
                            {style}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                    <span className="text-gray-900 text-base font-bold whitespace-nowrap">꼭 가고 싶은 곳</span>
                    <div className="flex flex-wrap gap-2 min-h-[48px] p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {currentData.mustGo.map(item => (
                            <div key={item} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-xs font-bold whitespace-nowrap">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <span className="text-gray-900 text-base font-bold whitespace-nowrap">피하고 싶은 곳</span>
                    <div className="flex flex-wrap gap-2 min-h-[48px] p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {currentData.mustAvoid.map(item => (
                            <div key={item} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs font-bold whitespace-nowrap">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <span className="text-gray-900 text-base font-bold whitespace-nowrap">주요 활동 시간대</span>
                <div className="flex flex-wrap gap-8">
                    {currentData.activeTimes.map(time => (
                        <div key={time} className="flex items-center gap-2 shrink-0">
                            <CheckSquare size={20} className="text-blue-600" />
                            <span className="text-gray-700 text-base font-bold whitespace-nowrap">{time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {currentData.freeText && (
                <div className="flex flex-col gap-4">
                    <span className="text-gray-900 text-base font-bold whitespace-nowrap">추가 코멘트</span>
                    <div className="w-full p-6 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                        {currentData.freeText}
                    </div>
                </div>
            )}
        </div>
    );
}