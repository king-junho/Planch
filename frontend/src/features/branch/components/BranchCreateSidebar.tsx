import { useState } from 'react';
import { Plus, Search, ListChecks, MapPin, X, Loader2, Sparkles } from 'lucide-react';
import { ProposalResponse } from '../../../types/proposal';
import { useToastStore } from '../../store/useToastStore';

interface KakaoSearchResult {
    id: string;
    place_name: string;
    address_name: string;
    category_group_name: string;
    x: string;
    y: string;
}

interface BranchCreateSidebarProps {
    proposals: ProposalResponse[];
    onAddPlace: (name: string, x: string, y: string, address: string, placeId?: number, proposalId?: number) => void;
}

export default function BranchCreateSidebar({ proposals, onAddPlace }: BranchCreateSidebarProps) {
    const [activeSubTab, setActiveSubTab] = useState<'proposals' | 'search'>('proposals');
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<KakaoSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const { showToast } = useToastStore();

    const handleSearch = () => {
        if (!searchText.trim()) return;
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
            showToast('error', '지도 API가 아직 로드되지 않았습니다.');
            return;
        }

        setIsSearching(true);

        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(searchText, (data: KakaoSearchResult[], status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                setSearchResults(data);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                setSearchResults([]);
                showToast('error', '검색 결과가 존재하지 않습니다.');
            } else {
                showToast('error', '검색 중 오류가 발생했습니다.');
            }
            setIsSearching(false);
        });
    };

    const handleClearSearch = () => {
        setSearchText('');
        setSearchResults([]);
    };

    return (
        <div className="w-[340px] border-r border-gray-100 flex flex-col bg-stone-50/50 shrink-0 h-full relative">
            <div className="flex border-b border-gray-100 bg-white shrink-0">
                <button
                    onClick={() => setActiveSubTab('proposals')}
                    className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center gap-1 transition-colors ${activeSubTab === 'proposals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <ListChecks size={16} /> 제안 목록
                </button>
                <button
                    onClick={() => setActiveSubTab('search')}
                    className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center gap-1 transition-colors ${activeSubTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Search size={16} /> 장소 검색
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {activeSubTab === 'proposals' ? (
                    <div className="flex flex-col gap-3">
                        {proposals.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-xs">등록된 제안이 없습니다.</div>
                        ) : (
                            proposals.map((prop: any) => {
                                const isAI = prop.source === 'ai';

                                return (
                                    <div key={`prop-${prop.id}`} className={`bg-white p-4 rounded-xl border shadow-sm group transition-colors ${isAI ? 'border-blue-100 hover:border-blue-300' : 'border-gray-100 hover:border-blue-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col min-w-0 flex-1 mr-2">
                                                <span className="text-gray-900 font-bold text-xs truncate">
                                                    {prop.place?.name || '장소명 없음'}
                                                </span>
                                                <span className="text-gray-400 text-[10px] mt-0.5 truncate">
                                                    {prop.place?.address || '주소 정보 없음'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => onAddPlace(
                                                    prop.place?.name || '이름 없음',
                                                    String(prop.place?.longitude || 0),
                                                    String(prop.place?.latitude || 0),
                                                    prop.place?.address || '',
                                                    prop.place?.id || prop.placeId,
                                                    prop.id
                                                )}
                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white shrink-0 ml-1"
                                                title="일정에 추가"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-50 min-w-0">
                                            {isAI ? (
                                                <span className="flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-bold shrink-0 whitespace-nowrap mt-0.5">
                                                    <Sparkles size={10} /> AI 추천
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap max-w-[100px] truncate mt-0.5">
                                                    {prop.proposerUser?.name || '익명'}
                                                </span>
                                            )}

                                            {(prop.comment || prop.aiReason) && (
                                                <span className="text-[10px] text-gray-500 flex-1 break-words leading-relaxed whitespace-pre-wrap">
                                                    {isAI ? (prop.aiReason || prop.comment) : prop.comment}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 h-full">
                        <div className="relative shrink-0">
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="추가할 장소 검색"
                                className="w-full h-11 pl-10 pr-10 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none shadow-sm"
                            />
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            {searchText && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                            {isSearching ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 pb-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                                    <span className="text-xs text-center mt-2">장소를 검색하고 있습니다...</span>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 pb-10">
                                    <MapPin size={32} strokeWidth={1.5} className="text-gray-300" />
                                    <span className="text-xs text-center">원하는 장소를 검색해<br />일정에 바로 추가해 보세요.</span>
                                </div>
                            ) : (
                                searchResults.map((place) => (
                                    <div key={`search-${place.id}`} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-2">
                                            <span className="text-xs font-bold text-gray-900 truncate">{place.place_name}</span>
                                            <span className="text-[10px] text-gray-500 truncate">{place.address_name}</span>
                                        </div>
                                        <button
                                            onClick={() => onAddPlace(
                                                place.place_name,
                                                place.x,
                                                place.y,
                                                place.address_name,
                                                Number(place.id)
                                            )}
                                            className="p-1.5 bg-gray-50 text-gray-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shrink-0"
                                            title="일정에 추가"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}