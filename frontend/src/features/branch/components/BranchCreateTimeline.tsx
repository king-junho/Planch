import { MapPin, Clock, Trash2, GripVertical } from 'lucide-react';
import { RouteItem } from '../../../types/branch';

interface BranchCreateTimelineProps {
    draftRoute: RouteItem[];
    onRemovePlace: (id: number) => void;
    onUpdateTime: (id: number, newTime: string) => void;
}

export default function BranchCreateTimeline({ draftRoute, onRemovePlace, onUpdateTime }: BranchCreateTimelineProps) {
    return (
        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
            <div className="max-w-md mx-auto flex flex-col gap-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">1</div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">1일차 일정 구성</h2>
                        <p className="text-xs text-gray-500">장소를 추가하고 방문 시간을 설정하세요.</p>
                    </div>
                </div>

                {draftRoute.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-300 gap-4">
                        <MapPin size={40} strokeWidth={1.5} />
                        <span className="text-sm font-medium">왼쪽에서 장소를 추가해 주세요.</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {draftRoute.map((item, index) => (
                            <div key={item.id} className="relative flex gap-4 items-start group">
                                <div className="flex flex-col items-center h-full">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-6 z-10" />
                                    {index !== draftRoute.length - 1 && (
                                        <div className="w-0.5 h-full bg-blue-100 -mt-2" />
                                    )}
                                </div>

                                <div className="flex-1 bg-gray-50 rounded-2xl p-5 border border-transparent hover:border-gray-200 transition-all flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-gray-400" />
                                            <input
                                                type="time"
                                                value={item.time}
                                                onChange={(e) => onUpdateTime(item.id, e.target.value)}
                                                className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border-none outline-none cursor-pointer"
                                            />
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                                        <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => onRemovePlace(item.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}