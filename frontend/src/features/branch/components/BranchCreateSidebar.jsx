import { useState } from 'react';
import { Plus, Search, BarChart3, ListChecks } from 'lucide-react';

export default function BranchCreateSidebar({ proposals, preferences, onAddPlace }) {
    const [activeSubTab, setActiveSubTab] = useState('proposals');

    return (
        <div className="w-[340px] border-r border-gray-100 flex flex-col bg-stone-50/50 shrink-0">
            {/* 탭 버튼 영역 */}
            <div className="flex border-b border-gray-100">
                <button onClick={() => setActiveSubTab('proposals')} className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center gap-1 transition-colors ${activeSubTab === 'proposals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                    <ListChecks size={16} /> 제안 목록
                </button>
                <button onClick={() => setActiveSubTab('search')} className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center gap-1 transition-colors ${activeSubTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                    <Search size={16} /> 장소 검색
                </button>
                <button onClick={() => setActiveSubTab('preference')} className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center gap-1 transition-colors ${activeSubTab === 'preference' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                    <BarChart3 size={16} /> 팀 선호도
                </button>
            </div>

            {/* 탭 컨텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeSubTab === 'proposals' && (
                    <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                        {proposals.map(prop => (
                            <button key={prop.id} onClick={() => onAddPlace(prop.place.place_name, prop.place.x, prop.place.y, prop.place.address_name)} className="bg-white p-4 rounded-xl border border-gray-200 text-left hover:border-blue-400 transition-all shadow-sm group">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-900">{prop.place.place_name}</span>
                                    <Plus size={14} className="text-gray-300 group-hover:text-blue-500" />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">{prop.place.address_name}</p>
                            </button>
                        ))}
                    </div>
                )}

                {activeSubTab === 'search' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input type="text" placeholder="지도로 장소 검색하기..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="text-center py-10 text-gray-400 text-xs">검색 기능은 지도와 연동됩니다.</div>
                    </div>
                )}

                {activeSubTab === 'preference' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">평균 예산</span>
                                <div className="text-lg font-bold text-gray-900 mt-0.5">{preferences.budget.toLocaleString()}원</div>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">희망 스타일</span>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {preferences.styles.map(s => <span key={s} className="px-2 py-1 bg-gray-50 text-gray-600 text-[10px] rounded-md border border-gray-100">{s}</span>)}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">필수 포함</span>
                                <div className="flex flex-col gap-1.5 mt-2">
                                    {preferences.mustGo.map(m => <div key={m} className="flex items-center gap-2 text-[11px] text-gray-700"><div className="w-1 h-1 rounded-full bg-blue-400" />{m}</div>)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}