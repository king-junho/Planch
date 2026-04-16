import { CheckSquare } from 'lucide-react';

export default function PreferenceMemberView({ currentData }) {
    if (!currentData) return null;

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-10 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
            <div className="flex flex-col gap-2">
                <h2 className="text-gray-900 text-2xl font-bold">{currentData.name}님의 선호도</h2>
                <p className="text-gray-500 text-sm">입력하신 여행 취향 상세 내역입니다.</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-900 text-base font-bold">예산 범위 (1인 기준)</span>
                    <span className="text-blue-600 text-base font-bold">
                        {currentData.budget >= 1000000 ? '100만원+' : `${(currentData.budget / 10000).toLocaleString()}만원 이하`}
                    </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-lg overflow-hidden mt-2 relative">
                    <div className="h-full bg-blue-500 rounded-lg absolute left-0 top-0" style={{ width: `${(currentData.budget / 1000000) * 100}%` }} />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <span className="text-gray-900 text-base font-bold">여행 스타일</span>
                <div className="flex flex-wrap gap-2">
                    {currentData.styles.map(style => <span key={style} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full">{style}</span>)}
                </div>
            </div>

            <div className="flex gap-6">
                <div className="flex-1 flex flex-col gap-4">
                    <span className="text-gray-900 text-base font-bold">꼭 가고 싶은 곳</span>
                    <div className="flex flex-wrap gap-2 min-h-[48px] p-4 bg-gray-50 rounded-md border border-gray-200">
                        {currentData.mustGo.map(item => <div key={item} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 text-sm font-medium">{item}</div>)}
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                    <span className="text-gray-900 text-base font-bold">피하고 싶은 곳</span>
                    <div className="flex flex-wrap gap-2 min-h-[48px] p-4 bg-gray-50 rounded-md border border-gray-200">
                        {currentData.mustAvoid.map(item => <div key={item} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md border border-red-100 text-sm font-medium">{item}</div>)}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <span className="text-gray-900 text-base font-bold">주요 활동 시간대</span>
                <div className="flex gap-6">
                    {currentData.activeTimes.map(time => (
                        <div key={time} className="flex items-center gap-2">
                            <CheckSquare size={20} className="text-blue-600" />
                            <span className="text-gray-700 text-base font-medium">{time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {currentData.freeText && (
                <div className="flex flex-col gap-4">
                    <span className="text-gray-900 text-base font-bold">추가 코멘트</span>
                    <div className="w-full p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 leading-relaxed">{currentData.freeText}</div>
                </div>
            )}
        </div>
    );
}