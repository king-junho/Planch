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
    const defaultCenter = { lat: 37.5546, lng: 126.9706 };

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
            // 값이 문자열일 수 있으므로 Number로 안전하게 변환합니다.
            const lat = Number(focusedProposal.latitude || focusedProposal.place?.latitude);
            const lng = Number(focusedProposal.longitude || focusedProposal.place?.longitude);

            if (lat && lng) {
                map.panTo(new window.kakao.maps.LatLng(lat, lng));
            }
        }
    }, [selectedPlace, focusedProposal, map]);

    return (
        <div className="relative w-full h-full">
            <Map center={defaultCenter} className="w-full h-full" level={3} onCreate={setMap}>
                {/* 검색 결과 마커 */}
                {searchResults.map((place) => (
                    <MapMarker
                        key={`search-${place.id}`}
                        position={{ lat: Number(place.y), lng: Number(place.x) }}
                        // 타입 에러를 일으키던 isViewing을 제거했습니다.
                        onClick={() => setSelectedPlace(place)}
                    />
                ))}

                {/* 이미 등록된 제안 마커 */}
                {proposals.map((proposal) => {
                    // 데이터가 누락되어 에러가 나지 않도록 방어 코드를 작성합니다.
                    const lat = Number(proposal.latitude || proposal.place?.latitude);
                    const lng = Number(proposal.longitude || proposal.place?.longitude);
                    const proposalId = proposal.id || proposal.proposalId;

                    // 좌표가 없으면 마커를 그리지 않고 건너뜁니다.
                    if (!lat || !lng) return null;

                    return (
                        <MapMarker
                            key={`proposal-${proposalId}`}
                            position={{ lat, lng }}
                            onClick={() => setFocusedProposal(proposal)}
                            image={{
                                src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                                size: { width: 24, height: 35 }
                            }}
                        />
                    );
                })}
            </Map>

            {/* 하단 상세 정보 카드 (백엔드 데이터 형식에 맞춰 안전하게 출력합니다) */}
            {focusedProposal && (
                <div className="absolute bottom-8 left-8 right-8 z-30 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                                {focusedProposal.category || focusedProposal.place?.category || '카테고리 없음'}
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 mt-2">
                                {focusedProposal.placeName || focusedProposal.place?.name || '알 수 없는 장소'}
                            </h3>
                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                <MapPin size={12} />
                                <span>{focusedProposal.address || focusedProposal.place?.address || '주소 정보 없음'}</span>
                            </div>
                        </div>
                        <button onClick={() => setFocusedProposal(null)} className="p-2 hover:bg-gray-100 rounded-full">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-700 leading-relaxed border border-gray-100">
                        {focusedProposal.memo || focusedProposal.comment || '메모가 없습니다.'}
                    </div>
                </div>
            )}
        </div>
    );
}