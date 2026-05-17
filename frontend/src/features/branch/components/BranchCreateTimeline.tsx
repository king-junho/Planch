import { MapPin, Clock, Trash2, Wallet, AlignLeft, Type, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { RouteItem } from '../../../types/branch';

interface BranchCreateTimelineProps {
    draftRoute: RouteItem[];
    currentDay: number;
    onRemovePlace: (id: number) => void;
    onUpdatePlace: (id: number, updates: Partial<RouteItem>) => void;
    onReorderPlace: (startIndex: number, endIndex: number) => void;
    onSortByTime: () => void;
}

export default function BranchCreateTimeline({
    draftRoute, currentDay, onRemovePlace, onUpdatePlace, onReorderPlace, onSortByTime
}: BranchCreateTimelineProps) {
    return (
        <div className="flex-1 overflow-y-scroll p-10 bg-white custom-scrollbar">
            <div className="max-w-md w-full mx-auto flex flex-col gap-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold shrink-0">
                            {currentDay}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{currentDay}일차 일정</h2>
                            <p className="text-xs text-gray-500">시간에 구애받지 않고 자유롭게 배치하세요.</p>
                        </div>
                    </div>

                    {draftRoute.length > 1 && (
                        <button
                            onClick={onSortByTime}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 shrink-0 whitespace-nowrap"
                        >
                            <ArrowUpDown size={14} />
                            시간순 정렬
                        </button>
                    )}
                </div>

                {draftRoute.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-300 gap-4">
                        <MapPin size={40} strokeWidth={1.5} />
                        <span className="text-sm font-medium">왼쪽에서 장소를 추가해 주세요.</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {draftRoute.map((item, index) => (
                            <div key={item.id} className="relative flex gap-4 animate-in fade-in duration-300">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-2 z-10 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]" />
                                    {index !== draftRoute.length - 1 && (
                                        <div className="w-0.5 h-full bg-blue-100 -mt-1" />
                                    )}
                                </div>

                                <div className="flex-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 group hover:border-blue-200 transition-all">
                                    <div className="flex-1 flex flex-col gap-3 mr-2">
                                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-lg">
                                            <Clock size={12} />
                                            <input
                                                type="time"
                                                value={item.time}
                                                onChange={(e) => onUpdatePlace(item.id, { time: e.target.value })}
                                                className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                                            />
                                        </div>

                                        <div className="relative group/input">
                                            <Type size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => onUpdatePlace(item.id, { title: e.target.value })}
                                                placeholder="일정 제목을 입력하세요"
                                                spellCheck={false}
                                                className="w-full pl-6 text-base font-bold text-gray-900 border-b border-transparent focus:border-blue-200 outline-none transition-colors"
                                            />
                                        </div>

                                        {item.desc && (
                                            <div className="flex items-start gap-1.5 pl-1">
                                                <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                                <span className="text-xs text-gray-500 leading-tight">{item.desc}</span>
                                            </div>
                                        )}

                                        <div className="relative mt-1">
                                            <AlignLeft size={14} className="absolute left-2 top-2.5 text-gray-400" />
                                            <textarea
                                                value={item.memo || ''}
                                                onChange={(e) => onUpdatePlace(item.id, { memo: e.target.value })}
                                                placeholder="장소에 대한 메모나 팁을 남겨보세요"
                                                spellCheck={false}
                                                className="w-full pl-8 pr-3 py-2 text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg resize-none outline-none min-h-[52px] focus:border-blue-300 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100 w-full mt-1">
                                            <Wallet size={12} className="text-stone-400" />
                                            <input
                                                type="text"
                                                value={item.cost || ''}
                                                onChange={(e) => onUpdatePlace(item.id, { cost: e.target.value })}
                                                placeholder="예상 비용"
                                                spellCheck={false}
                                                className="bg-transparent text-[11px] text-stone-600 outline-none w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-between border-l border-gray-50 pl-3 shrink-0">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => onReorderPlace(index, index - 1)}
                                                disabled={index === 0}
                                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-20 transition-colors"
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                            <button
                                                onClick={() => onReorderPlace(index, index + 1)}
                                                disabled={index === draftRoute.length - 1}
                                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-20 transition-colors"
                                            >
                                                <ArrowDown size={16} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => onRemovePlace(item.id)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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