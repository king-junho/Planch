import { ArrowLeft, MapPin, Wallet } from 'lucide-react';
import { useBranchStore } from '../store/useBranchStore';

export default function BranchDetailSection({ branch, onBack }) {
    const { selectedDay, setSelectedDay } = useBranchStore();

    // 해당 브랜치의 일차(Day) 배열을 가져오고 최소/최대 일차 계산
    const availableDays = branch?.routes ? Object.keys(branch.routes).map(Number) : [1];
    const maxDay = Math.max(...availableDays);
    const minDay = Math.min(...availableDays);

    // 현재 일차의 경로 데이터 추출
    const currentRoute = branch?.routes?.[selectedDay] || [];

    const handlePrevDay = () => {
        if (selectedDay > minDay) setSelectedDay(selectedDay - 1);
    };

    const handleNextDay = () => {
        if (selectedDay < maxDay) setSelectedDay(selectedDay + 1);
    };

    return (
        <div className="w-[400px] h-full bg-white border-r border-gray-200 flex flex-col shrink-0 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)] relative z-10">

            <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4 shrink-0 bg-white">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors w-fit text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    목록으로 돌아가기
                </button>
                <div>
                    <h2 className="text-gray-900 text-xl font-bold">{branch?.title || '상세 일정'}</h2>
                    <p className="text-gray-500 text-sm mt-1">{branch?.description || '일정의 상세 동선입니다.'}</p>
                </div>
            </div>

            {/* 일차 이동 내비게이션 */}
            <div className="h-12 px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <button
                    onClick={handlePrevDay}
                    disabled={selectedDay === minDay}
                    className={`p-1 rounded transition-colors ${selectedDay === minDay ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                    <ArrowLeft size={16} />
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold text-sm">{selectedDay}일차</span>
                    <span className="text-gray-400 text-xs font-medium">상세 일정</span>
                </div>

                <button
                    onClick={handleNextDay}
                    disabled={selectedDay === maxDay}
                    className={`p-1 rounded transition-colors rotate-180 ${selectedDay === maxDay ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                    <ArrowLeft size={16} />
                </button>
            </div>

            {/* 타임라인 목록 렌더링 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 pl-8 bg-stone-50 custom-scrollbar">
                {currentRoute.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 mt-10">등록된 일정이 없습니다.</div>
                ) : (
                    <div className="border-l-2 border-gray-200 pl-6 flex flex-col gap-8 pb-10 relative">
                        {currentRoute.map((item, index) => (
                            <div key={item.id} className="relative group">
                                <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white transition-colors
                                    ${index === 0 ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]' : 'border-gray-300'}
                                `}>
                                    {index === 0 && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                </div>

                                <div className={`text-xs font-bold mb-2 ${index === 0 ? 'text-blue-500' : 'text-gray-500'}`}>
                                    {item.time}
                                </div>

                                <div className={`p-4 rounded-xl border transition-all ${index === 0 ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-gray-100'}`}>
                                    <h3 className="text-gray-900 font-bold text-sm">{item.title}</h3>
                                    <p className="text-gray-500 text-xs mt-1">{item.desc}</p>

                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        {item.place && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] text-gray-600">
                                                <MapPin size={10} />
                                                {item.place}
                                            </div>
                                        )}
                                        {item.cost && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] text-gray-600">
                                                <Wallet size={10} />
                                                {item.cost}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}