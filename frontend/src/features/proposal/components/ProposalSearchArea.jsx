import { useState, useEffect } from 'react';
import { Search, Sparkles, Send, X } from 'lucide-react';
import { useProposalStore } from '../store/useProposalStore';

export default function ProposalSearchArea({ tripRoomId }) {
    const { keyword, setKeyword, selectedPlace, setSelectedPlace, addProposal } = useProposalStore();

    const [searchText, setSearchText] = useState('');
    const [memoText, setMemoText] = useState('');
    const [isSearched, setIsSearched] = useState(false);
    const [lastSearchedPlace, setLastSearchedPlace] = useState(null);

    // 지도에서 장소 선택 시 검색창 동기화
    useEffect(() => {
        if (selectedPlace && !selectedPlace.isViewing) {
            setSearchText(selectedPlace.place_name);
            setLastSearchedPlace(selectedPlace);
            setIsSearched(true);
        }
    }, [selectedPlace]);

    const handleSearch = () => {
        if (!searchText.trim()) {
            alert('검색할 장소를 입력해주세요.');
            return;
        }

        if (selectedPlace && selectedPlace.isViewing) setSelectedPlace(null);

        // 검색어 재입력 시 지도 강제 새로고침 트릭
        if (keyword === searchText) {
            setKeyword('');
            setTimeout(() => setKeyword(searchText), 10);
        } else {
            setKeyword(searchText);
        }

        setIsSearched(true);
    };

    const handleCancelSearch = () => {
        setIsSearched(false);
        setSearchText('');
        setMemoText('');
        setKeyword('');
        setSelectedPlace(null);
        setLastSearchedPlace(null);
    };

    const handleSubmitProposal = () => {
        if (!lastSearchedPlace || !searchText.trim()) return alert('제안할 장소가 선택되지 않았습니다.');
        if (!memoText.trim()) return alert('이 장소를 추천하는 이유나 메모를 필수로 적어주세요.');

        const newProposalData = {
            place: lastSearchedPlace,
            proposerUser: { name: '나' },
            comment: memoText
        };

        addProposal(tripRoomId || "1", newProposalData);
        alert('장소가 성공적으로 제안되었습니다.');
        handleCancelSearch();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-5 mb-8 shrink-0 transition-all duration-300">
            <p className="text-gray-500 text-xs font-normal mb-3">장소를 검색하고 메모를 남겨 제안해보세요.</p>

            <div className="relative mb-3">
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => { setSearchText(e.target.value); if (isSearched) setIsSearched(false); }}
                    onKeyDown={handleKeyDown}
                    placeholder="ex) 몽상드애월, 아르떼뮤지엄"
                    className="w-full h-12 p-4 pr-12 rounded-md border text-sm focus:outline-none focus:ring-1 transition-colors bg-gray-50 border-gray-100 focus:ring-gray-300 placeholder:text-gray-400"
                />

                {!isSearched ? (
                    <button onClick={handleSearch} className="absolute right-2 top-2 w-8 h-8 bg-gray-900 rounded-md flex justify-center items-center hover:bg-gray-800 transition-colors">
                        <Search size={14} className="text-white" />
                    </button>
                ) : (
                    <button onClick={handleCancelSearch} className="absolute right-2 top-2 w-8 h-8 bg-gray-200 rounded-md flex justify-center items-center hover:bg-gray-300 transition-colors">
                        <X size={14} className="text-gray-600" />
                    </button>
                )}
            </div>

            {!isSearched && (
                <div className="flex gap-2">
                    <button className="flex-1 h-10 bg-blue-50 border border-blue-100 rounded-md flex justify-center items-center gap-2 hover:bg-blue-100 transition-colors">
                        <Sparkles size={14} className="text-blue-700" />
                        <span className="text-blue-700 text-xs font-medium">AI 추천 받기</span>
                    </button>
                </div>
            )}

            {isSearched && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        placeholder="이 장소를 추천하는 이유나 메모를 적어주세요."
                        className="w-full h-24 p-4 bg-gray-50 rounded-md border border-gray-100 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-400"
                    />
                    <button onClick={handleSubmitProposal} className="w-full h-10 bg-gray-900 text-white rounded-md flex justify-center items-center gap-2 hover:bg-gray-800 transition-colors font-medium text-xs">
                        <Send size={14} /> 이 장소 제안하기
                    </button>
                </div>
            )}
        </div>
    );
}