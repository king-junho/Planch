import { useState } from 'react';
import { ArrowLeft, Clock, Wallet, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Branch } from '../../../types/branch';
import BranchMap from './BranchMap';
import { useBranchStore } from '../store/useBranchStore';

interface BranchCompareCanvasProps {
    compareBranches: Branch[];
    onBack: () => void;
}

const THEME_COLORS = ['text-blue-600 bg-blue-50 border-blue-200', 'text-red-600 bg-red-50 border-red-200', 'text-green-600 bg-green-50 border-green-200'];
const DOT_COLORS = ['bg-blue-500', 'bg-red-500', 'bg-green-500'];

export default function BranchCompareCanvas({ compareBranches, onBack }: BranchCompareCanvasProps) {
    const [compareDay, setCompareDay] = useState(1);

    const { tripDuration, tripStartDate } = useBranchStore();

    const getDateTabLabel = (dayIndex: number) => {
        if (!tripStartDate) return `${dayIndex}일차`;
        const date = new Date(tripStartDate);
        date.setDate(date.getDate() + (dayIndex - 1));
        return `${date.getMonth() + 1}/${date.getDate()} (${dayIndex}일차)`;
    };

    return (
        <div className="flex w-full h-full bg-white relative z-50 animate-in fade-in">
            <div className="w-[40%] min-w-[500px] max-w-[600px] flex flex-col h-full border-r border-gray-200 bg-gray-50/50 shadow-xl z-10 shrink-0">
                <div className="flex items-center gap-4 p-5 border-b border-gray-200 bg-white shrink-0">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">브랜치 상세 비교</h2>
                        <p className="text-xs text-gray-500 mt-1">지도의 동선과 상세 일정을 비교해 보세요.</p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 py-3 bg-white border-b border-gray-200 shrink-0">
                    <button
                        disabled={compareDay <= 1}
                        onClick={() => setCompareDay(compareDay - 1)}
                        className="p-1 disabled:opacity-20 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-2">
                        {Array.from({ length: tripDuration }).map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCompareDay(i + 1)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${compareDay === i + 1 ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'}`}
                            >
                                {getDateTabLabel(i + 1)}
                            </button>
                        ))}
                    </div>
                    <button
                        disabled={compareDay >= tripDuration}
                        onClick={() => setCompareDay(compareDay + 1)}
                        className="p-1 disabled:opacity-20 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden p-4 gap-4">
                    {compareBranches.map((branch, index) => {
                        const theme = THEME_COLORS[index % THEME_COLORS.length];
                        const dotColor = DOT_COLORS[index % DOT_COLORS.length];

                        const placesForDay = branch?.routes?.[compareDay] || [];

                        return (
                            <div key={`compare-${branch.id}`} className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative min-w-[150px]">
                                <div className={`h-1.5 w-full ${dotColor}`} />

                                <div className="p-4 border-b border-gray-100 bg-white shrink-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${theme} whitespace-nowrap`}>
                                            플랜 {index + 1}
                                        </span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            제안: {branch.proposer || '익명'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-tight h-10">
                                        {branch.title || branch.name}
                                    </h3>
                                    <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
                                            <Wallet size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{branch.cost || '비용 미정'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
                                            <Clock size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{branch.time || '시간 미정'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {placesForDay.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-xs text-gray-400 text-center">
                                            해당 일차의 일정이 없습니다.
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-gray-100 ml-3 pl-5 py-2 flex flex-col gap-6">
                                            {placesForDay.map((place: any, pIndex: number) => (
                                                <div key={`place-${pIndex}`} className="relative group">
                                                    <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${dotColor}`} />
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-bold text-blue-500">
                                                            {place.time || '시간 미정'}
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-800 line-clamp-2">
                                                            {place.place || place.title || '장소명 없음'}
                                                        </span>
                                                        {place.desc && (
                                                            <span className="text-[10px] text-gray-400 line-clamp-1">{place.desc}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 min-w-[500px] h-full relative z-0 bg-gray-100 shrink-0">
                <BranchMap
                    compareBranches={compareBranches}
                    compareDay={compareDay}
                />

                <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-md border border-gray-100">
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600" />
                        {getDateTabLabel(compareDay)} 동선 비교
                    </p>
                </div>
            </div>
        </div>
    );
}