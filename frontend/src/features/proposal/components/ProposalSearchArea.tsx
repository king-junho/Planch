import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { useProposalStore } from '../store/useProposalStore';
import { useToastStore } from '../../store/useToastStore';
import { useConfirmStore } from '../../store/useConfirmStore';

interface ProposalSearchAreaProps {
    tripRoomId: string;
    isLocked?: boolean;
}

export default function ProposalSearchArea({ tripRoomId, isLocked = false }: ProposalSearchAreaProps) {
    const {
        setKeyword,
        searchResults,
        setSearchResults,
        selectedPlace,
        setSelectedPlace,
        addProposal,
        generateAiProposals,
        isLoading,
        resetSearchState
    } = useProposalStore();

    const [searchText, setSearchText] = useState('');
    const [memoText, setMemoText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { showToast } = useToastStore();
    const { confirm } = useConfirmStore();

    useEffect(() => {
        return () => {
            resetSearchState();
            setSearchText('');
            setMemoText('');
        };
    }, [resetSearchState]);

    if (isLocked) {
        return (
            <div className="flex items-center justify-center h-24 mb-8 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-sm font-bold text-gray-500">여행 일정이 최종 확정되어 새로운 장소를 제안할 수 없습니다.</span>
            </div>
        );
    }

    const handleSearch = () => {
        if (!searchText.trim()) return;

        setSelectedPlace(null);
        setMemoText('');
        setKeyword(searchText);
    };

    const handleSelectPlace = (place: any) => {
        setSelectedPlace({ ...place, isViewing: true });
        setSearchText(place.place_name);
    };

    const handleSubmit = async () => {
        if (isSaving || isLoading) return;
        if (!selectedPlace) return;

        if (!memoText.trim()) {
            showToast('error', '추천 이유나 메모를 반드시 입력해주세요.');
            return;
        }

        setIsSaving(true);

        const payload = {
            placeId: Number(selectedPlace.id),
            placeName: selectedPlace.place_name,
            address: selectedPlace.address_name,
            latitude: selectedPlace.y,
            longitude: selectedPlace.x,
            category: selectedPlace.category_group_name,
            memo: memoText
        };

        const success = await addProposal(Number(tripRoomId), payload);
        if (success) {
            setSearchText('');
            setMemoText('');
            setSearchResults([]);
            setSelectedPlace(null);

            showToast('success', '장소 제안이 등록되었습니다.');
        }

        setIsSaving(false);
    };

    const handleGenerateAI = async () => {
        if (isSaving || isLoading) return;

        const isConfirmed = await confirm("팀원들의 취향을 분석하여\nAI가 3곳의 맞춤 장소를 추천합니다.\n진행하시겠습니까?");
        if (isConfirmed) {
            setIsSaving(true);
            const success = await generateAiProposals(Number(tripRoomId));
            if (success) {
                showToast('success', 'AI가 맞춤 장소를 추천했습니다!');
            }
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 mb-8 relative">
            <div className="relative">
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === 'Enter') handleSearch();
                    }}
                    placeholder="어디로 가고 싶으신가요?"
                    className="w-full h-12 pl-12 pr-12 bg-white rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                {searchText && (
                    <button
                        onClick={() => { setSearchText(''); setSearchResults([]); setSelectedPlace(null); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {!selectedPlace && searchResults.length === 0 && (
                <button
                    onClick={handleGenerateAI}
                    disabled={isSaving || isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-50/50 hover:bg-blue-50 text-blue-600 rounded-xl border border-blue-100 transition-colors font-bold text-sm shadow-sm disabled:opacity-50"
                >
                    <Sparkles size={16} /> AI 맞춤 장소 추천받기
                </button>
            )}

            {searchResults.length > 0 && !selectedPlace && (
                <div className="flex flex-col max-h-60 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg custom-scrollbar">
                    {searchResults.map((place) => (
                        <button
                            key={place.id}
                            onClick={() => handleSelectPlace(place)}
                            className="flex flex-col p-4 text-left border-b border-gray-50 hover:bg-blue-50 transition-colors last:border-none"
                        >
                            <span className="text-sm font-bold text-gray-900">{place.place_name}</span>
                            <span className="text-[11px] text-gray-500 mt-1">{place.address_name}</span>
                        </button>
                    ))}
                </div>
            )}

            {selectedPlace && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-blue-700">{selectedPlace.place_name}</span>
                            <span className="text-[10px] text-blue-500 mt-0.5">{selectedPlace.address_name}</span>
                        </div>
                        <button onClick={() => setSelectedPlace(null)} className="text-blue-400 hover:text-blue-600">
                            <X size={14} />
                        </button>
                    </div>
                    <textarea
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        placeholder="이 장소를 추천하는 이유를 적어주세요."
                        className="w-full h-28 p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-gray-200 text-sm resize-none outline-none"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || isLoading}
                        className={`w-full h-12 text-white rounded-xl font-bold text-sm transition-all shadow-md ${isSaving || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800'}`}
                    >
                        {isSaving ? '등록 중...' : '장소 제안 등록하기'}
                    </button>
                </div>
            )}
        </div>
    );
}