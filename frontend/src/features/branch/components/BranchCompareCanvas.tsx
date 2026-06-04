import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Clock, Wallet, MapPin, ChevronLeft, ChevronRight, Eye, EyeOff, Heart, ThumbsUp, Activity } from 'lucide-react';
import { Branch } from '../../../types/branch';
import BranchMap from './BranchMap';
import { useBranchStore } from '../store/useBranchStore';

interface BranchCompareCanvasProps {
    compareBranches: Branch[];
    onBack: () => void;
}

const THEME_COLORS = ['text-blue-600 bg-blue-50 border-blue-200', 'text-red-600 bg-red-50 border-red-200', 'text-green-600 bg-green-50 border-green-200'];
const DOT_COLORS = ['bg-blue-500', 'bg-red-500', 'bg-green-500'];
const PROGRESS_COLORS = ['bg-blue-500', 'bg-red-500', 'bg-green-500'];

export default function BranchCompareCanvas({ compareBranches, onBack }: BranchCompareCanvasProps) {
    const [compareDay, setCompareDay] = useState(1);
    const [visibleBranchIds, setVisibleBranchIds] = useState<number[]>([]);

    const [hoveredPlaceId, setHoveredPlaceId] = useState<number | null>(null);
    const placeRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const { tripDuration, tripStartDate } = useBranchStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setVisibleBranchIds(compareBranches.map(b => b.id));
    }, [compareBranches]);

    const toggleVisibility = (id: number) => {
        setVisibleBranchIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    const scrollByAmount = (amount: number) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    const getDateTabLabel = (dayIndex: number) => {
        if (!tripStartDate) return `${dayIndex}일차`;
        const date = new Date(tripStartDate);
        date.setDate(date.getDate() + (dayIndex - 1));
        return `${date.getMonth() + 1}/${date.getDate()} (${dayIndex}일차)`;
    };

    const formatCost = (cost: string | number | undefined) => {
        if (!cost || cost === '0') return '비용 미정';
        return `${Number(cost).toLocaleString()}원`;
    };

    const formatTime = (time: string | number | undefined) => {
        if (!time || time === '0') return '시간 미정';

        const totalMinutes = Number(time);
        if (isNaN(totalMinutes)) return `${time}분`;

        if (totalMinutes < 60) {
            return `${totalMinutes}분`;
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (minutes === 0) {
            return `${hours}시간`;
        }
        return `${hours}시간 ${minutes}분`;
    };

    const handleMarkerClick = (branchId: number, placeId: number) => {
        compareBranches.forEach(branch => {
            const element = placeRefs.current[`${branch.id}-${placeId}`];
            if (element) {
                const container = element.closest('.overflow-y-auto');
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();

                    const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
                    const targetScrollTop = relativeTop - (containerRect.height / 2) + (elementRect.height / 2);

                    container.scrollTo({
                        top: targetScrollTop,
                        behavior: 'smooth'
                    });
                }
            }
        });

        setHoveredPlaceId(placeId);
        setTimeout(() => setHoveredPlaceId(null), 2000);
    };

    return (
        <div className="flex w-full h-full bg-white relative z-50 animate-in fade-in">
            <div className="w-[45%] min-w-[500px] max-w-[750px] flex flex-col h-full border-r border-gray-200 bg-gray-50/50 shadow-xl z-10 shrink-0">
                <div className="flex items-center gap-4 p-5 border-b border-gray-200 bg-white shrink-0">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">브랜치 상세 비교</h2>
                        <p className="text-xs text-gray-500 mt-1">핵심 지표와 세부 동선을 한눈에 비교해 보세요.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
                    <button
                        onClick={() => scrollByAmount(-150)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-all shrink-0 text-gray-500"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div
                        ref={scrollContainerRef}
                        className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hide scroll-smooth px-1"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {Array.from({ length: tripDuration }).map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCompareDay(i + 1)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${compareDay === i + 1
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {getDateTabLabel(i + 1)}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => scrollByAmount(150)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-all shrink-0 text-gray-500"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-x-auto overflow-y-hidden p-4 gap-4 custom-scrollbar">
                    {compareBranches.map((branch, index) => {
                        const isConfirmed = branch.status === 'confirmed';
                        const isVisible = visibleBranchIds.includes(branch.id);

                        const theme = isConfirmed
                            ? 'text-green-700 bg-green-100 border-green-400'
                            : THEME_COLORS[index % THEME_COLORS.length];
                        const dotColor = isConfirmed
                            ? 'bg-green-500'
                            : DOT_COLORS[index % DOT_COLORS.length];
                        const progressColor = isConfirmed
                            ? 'bg-green-500'
                            : PROGRESS_COLORS[index % PROGRESS_COLORS.length];
                        const cardBorder = isConfirmed
                            ? 'border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-green-500'
                            : 'border border-gray-200 shadow-sm';

                        const placesForDay = branch?.routes?.[compareDay] || [];
                        const matchRate = branch.matchRate || 0;

                        return (
                            <div key={`compare-${branch.id}`} className={`flex-1 flex flex-col bg-white rounded-2xl h-full relative min-w-[260px] shrink-0 transition-opacity duration-300 ${cardBorder} ${!isVisible ? 'opacity-40 grayscale-[20%]' : ''}`}>
                                <div className={`h-1.5 w-full ${dotColor} shrink-0 rounded-t-2xl`} />

                                <div className="p-4 border-b border-gray-100 bg-white shrink-0 flex flex-col relative z-10 shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${theme} whitespace-nowrap self-start`}>
                                                {isConfirmed ? '최종 확정 브랜치' : `브랜치 ${index + 1}`}
                                            </span>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                제안: {branch.proposer || '익명'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => toggleVisibility(branch.id)}
                                            className={`p-1.5 rounded-lg transition-colors ${isVisible ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}`}
                                            title={isVisible ? "지도에서 숨기기" : "지도에 표시하기"}
                                        >
                                            {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>

                                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-tight min-h-[40px] mt-1 mb-4">
                                        {branch.title || branch.name}
                                    </h3>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1">
                                                <Wallet size={12} /> 총 비용
                                            </span>
                                            <span className="text-xs font-bold text-gray-800 truncate">
                                                {formatCost(branch.cost)}
                                            </span>
                                        </div>

                                        <div className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1">
                                                <Clock size={12} /> 이동 시간
                                            </span>
                                            <span className="text-xs font-bold text-gray-800 truncate">
                                                {formatTime(branch.time)}
                                            </span>
                                        </div>

                                        <div className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100 col-span-2">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Heart size={12} className="text-red-400" /> 멤버 선호도 일치율
                                                </span>
                                                <span className="text-xs font-bold text-gray-900">{matchRate}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-1.5 rounded-full ${progressColor} transition-all duration-500`} style={{ width: `${matchRate}%` }} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100 col-span-2">
                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1.5">
                                                <ThumbsUp size={12} /> 팀원 투표 현황
                                            </span>
                                            <div className="flex items-center gap-3 text-[11px] font-bold">
                                                <span className="text-blue-600">찬성 {branch.agreeCount || 0}</span>
                                                <span className="text-gray-500">보류 {branch.holdCount || 0}</span>
                                                <span className="text-red-500">반대 {branch.disagreeCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/30 rounded-b-2xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity size={14} className="text-gray-400" />
                                        <span className="text-xs font-bold text-gray-600">상세 동선</span>
                                    </div>

                                    {placesForDay.length === 0 ? (
                                        <div className="flex items-center justify-center h-32 text-xs text-gray-400 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
                                            해당 일차의 일정이 없습니다.
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-gray-200 ml-3 pl-5 py-2 flex flex-col gap-6">
                                            {placesForDay.map((place: any, pIndex: number) => {
                                                const isHovered = hoveredPlaceId === place.id;

                                                return (
                                                    <div
                                                        key={`place-${pIndex}`}
                                                        ref={(el) => { placeRefs.current[`${branch.id}-${place.id}`] = el; }}
                                                        onMouseEnter={() => setHoveredPlaceId(place.id)}
                                                        onMouseLeave={() => setHoveredPlaceId(null)}
                                                        onClick={() => {
                                                            setHoveredPlaceId(place.id);
                                                            setTimeout(() => setHoveredPlaceId(null), 3000);
                                                        }}
                                                        className={`relative group cursor-pointer transition-all duration-300 ${hoveredPlaceId && !isHovered ? 'opacity-30' : 'opacity-100'}`}
                                                    >
                                                        <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform duration-300 ${dotColor} ${isHovered ? 'scale-150 ring-4 ring-blue-50' : ''}`} />
                                                        <div className={`flex flex-col gap-1.5 transition-transform duration-300 origin-left ${isHovered ? 'scale-[1.02] translate-x-1' : ''}`}>
                                                            <span className="text-[10px] font-bold text-blue-500">
                                                                {place.time || '시간 미정'}
                                                            </span>
                                                            <span className="text-sm font-bold text-gray-800 line-clamp-2">
                                                                {place.place || place.title || '장소명 없음'}
                                                            </span>
                                                            {place.desc && (
                                                                <span className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{place.desc}</span>
                                                            )}
                                                            {place.cost && place.cost !== '0' && (
                                                                <span className="text-[10px] font-bold text-stone-500 bg-white border border-stone-100 px-2 py-1 rounded-md flex items-center gap-1 w-fit mt-0.5">
                                                                    <Wallet size={10} /> {Number(place.cost).toLocaleString()}원
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 min-w-[400px] h-full relative z-0 bg-gray-100 shrink-0">
                <BranchMap
                    compareBranches={compareBranches}
                    compareDay={compareDay}
                    visibleBranchIds={visibleBranchIds}
                    hoveredPlaceId={hoveredPlaceId}
                    onMarkerClick={handleMarkerClick}
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