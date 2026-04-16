import { MapPin, Clock, Trash2 } from 'lucide-react';

export default function BranchCreateTimeline({ draftRoute, onRemovePlace, onUpdateTime }) {
    return (
        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
            <div className="max-w-md mx-auto flex flex-col gap-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">1</div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">1일차 타임라인</h2>
                        <p className="text-xs text-gray-500">장소를 추가하고 순서를 확인하세요.</p>
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
                            <div key={item.id} className="relative flex gap-6 group">
                                {index !== draftRoute.length - 1 && <div className="absolute left-[17px] top-[34px] bottom-[-18px] w-0.5 bg-gray-100" />}
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-9 h-9 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center z-10">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    </div>
                                </div>
                                <div className="flex-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start group-hover:border-gray-300 transition-all">
                                    <div className="flex flex-col gap-1.5">

                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Clock size={12} />
                                            <input
                                                type="time"
                                                value={item.time}
                                                onChange={(e) => onUpdateTime(item.id, e.target.value)}
                                                className="text-xs font-bold text-blue-600 bg-blue-50/50 px-2 py-1 rounded-md border border-transparent hover:border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors cursor-pointer"
                                            />
                                        </div>

                                        <h4 className="text-base font-bold text-gray-900">{item.title}</h4>
                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                    </div>
                                    <button onClick={() => onRemovePlace(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
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