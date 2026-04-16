import { useEffect, useState } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { useProposalStore, KakaoSearchResult } from '../store/useProposalStore';
import { MapPin, X } from 'lucide-react';

export default function ProposalMap() {
    const {
        proposals,
        focusedProposal,
        setFocusedProposal,
        keyword,
        searchResults,
        setSearchResults,
        selectedPlace,
        setSelectedPlace
    } = useProposalStore();

    const [map, setMap] = useState<any>(null);
    const defaultCenter = { lat: 33.4890, lng: 126.4983 };

    // 키워드 검색 및 검색 결과 마커 범위 조정
    useEffect(() => {
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services || !map || !keyword) return;

        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(keyword, (data: KakaoSearchResult[], status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                setSearchResults(data);
                const bounds = new window.kakao.maps.LatLngBounds();
                data.forEach(place => bounds.extend(new window.kakao.maps.LatLng(Number(place.y), Number(place.x))));
                map.setBounds(bounds);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                setSearchResults([]);
            }
        });
    }, [keyword, map, setSearchResults]);

    // 선택된 장소 또는 제안 클릭 시 중심 이동
    useEffect(() => {
        if (!map) return;
        if (selectedPlace) {
            map.panTo(new window.kakao.maps.LatLng(Number(selectedPlace.y), Number(selectedPlace.x)));
        } else if (focusedProposal) {
            map.panTo(new window.kakao.maps.LatLng(focusedProposal.latitude, focusedProposal.longitude));
        }
    }, [selectedPlace, focusedProposal, map]);

    return (
        <div className="relative w-full h-full">
            <Map center={defaultCenter} className="w-full h-full" level={3} onCreate={setMap}>
                {/* 검색 결과 마커 (기본) */}
                {searchResults.map((place) => (
                    <MapMarker
                        key={`search-${place.id}`}
                        position={{ lat: Number(place.y), lng: Number(place.x) }}
                        onClick={() => setSelectedPlace({ ...place, isViewing: true })}
                    />
                ))}

                {/* 이미 등록된 제안 마커 (별 모양) */}
                {proposals.map((proposal) => (
                    <MapMarker
                        key={`proposal-${proposal.proposalId}`}
                        position={{ lat: proposal.latitude, lng: proposal.longitude }}
                        onClick={() => setFocusedProposal(proposal)}
                        image={{
                            src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                            size: { width: 24, height: 35 }
                        }}
                    />
                ))}
            </Map>

            {/* 제안 상세 정보 카드 (따옴표 제거 버전) */}
            {focusedProposal && (
                <div className="absolute bottom-8 left-8 right-8 z-30 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                                {focusedProposal.category}
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 mt-2">{focusedProposal.placeName}</h3>
                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                <MapPin size={12} />
                                <span>{focusedProposal.address}</span>
                            </div>
                        </div>
                        <button onClick={() => setFocusedProposal(null)} className="p-2 hover:bg-gray-100 rounded-full">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-700 leading-relaxed border border-gray-100">
                        {focusedProposal.memo}
                    </div>
                </div>
            )}
        </div>
    );
}