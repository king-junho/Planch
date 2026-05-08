import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useProposalStore } from '../store/useProposalStore';

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
        addProposal
    } = useProposalStore();

    const [searchText, setSearchText] = useState('');
    const [memoText, setMemoText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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
        if (isSaving) return;
        if (!selectedPlace) return;

        if (!memoText.trim()) {
            alert('추천 이유나 메모를 반드시 입력해주세요.');
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
        }

        setIsSaving(false);
    };

    return (
        <div className="flex flex-col gap-4 mb-8">
            {/* 검색창 */}
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

            {/* 1. 검색 결과 리스트 (장소를 선택하기 전) */}
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

            {/* 2. 메모 입력 및 등록 (장소를 선택한 후) */}
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
                        disabled={isSaving}
                        className={`w-full h-12 text-white rounded-xl font-bold text-sm transition-all shadow-md ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800'}`}
                    >
                        {isSaving ? '등록 중...' : '장소 제안 등록하기'}
                    </button>
                </div>
            )}
        </div>
    );
}