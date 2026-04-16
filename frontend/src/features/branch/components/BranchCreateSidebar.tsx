import { useState } from 'react';
import { Plus, Search, ListChecks, Heart } from 'lucide-react';
import { ProposalResponse } from '../../../types/proposal';

interface BranchCreateSidebarProps {
    proposals: ProposalResponse[];
    onAddPlace: (name: string, x: string, y: string, address: string) => void;
}

export default function BranchCreateSidebar({ proposals, onAddPlace }: BranchCreateSidebarProps) {
    const [activeSubTab, setActiveSubTab] = useState<'proposals' | 'search'>('proposals');

    return (
        <div className="w-[340px] border-r border-gray-100 flex flex-col bg-stone-50/50 shrink-0">
            <div className="flex border-b border-gray-100 bg-white">
                <button
                    onClick={() => setActiveSubTab('proposals')}
                    className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center gap-1 transition-colors ${activeSubTab === 'proposals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                >
                    <ListChecks size={16} /> 제안 목록
                </button>
                <button
                    onClick={() => setActiveSubTab('search')}
                    className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center gap-1 transition-colors ${activeSubTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                >
                    <Search size={16} /> 장소 검색
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                {activeSubTab === 'proposals' ? (
                    <div className="flex flex-col gap-3">
                        {proposals.map((prop) => (
                            <div key={prop.proposalId} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-gray-900 font-bold text-xs">{prop.placeName}</span>
                                        <span className="text-gray-400 text-[10px]">{prop.category}</span>
                                    </div>
                                    <button
                                        onClick={() => onAddPlace(prop.placeName, String(prop.longitude), String(prop.latitude), prop.address)}
                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-500 line-clamp-2">{prop.memo}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400 text-xs">
                        카카오 검색 기능은 지도 영역과 연동됩니다.
                    </div>
                )}
            </div>
        </div>
    );
}