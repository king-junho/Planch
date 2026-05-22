import { useEffect, useState } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { useProposalStore, KakaoSearchResult } from '../store/useProposalStore';
import { MapPin, X, Phone, ExternalLink } from 'lucide-react';

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

    useEffect(() => {
        if (!map) return;

        if (selectedPlace) {
            map.panTo(new window.kakao.maps.LatLng(Number(selectedPlace.y), Number(selectedPlace.x)));
        } else if (focusedProposal) {
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

                {searchResults.map((place) => (
                    <MapMarker
                        key={`search-${place.id}`}
                        position={{ lat: Number(place.y), lng: Number(place.x) }}
                        onClick={() => setSelectedPlace(place)}
                    />
                ))}

                {proposals.map((proposal) => {
                    const lat = Number(proposal.latitude || proposal.place?.latitude);
                    const lng = Number(proposal.longitude || proposal.place?.longitude);
                    const proposalId = proposal.id || proposal.proposalId;

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

            {selectedPlace && (
                <div className="absolute bottom-8 left-8 right-8 z-30 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                                {selectedPlace.category_group_name || '카테고리 없음'}
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 mt-2">
                                {selectedPlace.place_name}
                            </h3>
                        </div>
                        <button onClick={() => setSelectedPlace(null)} className="p-2 hover:bg-gray-100 rounded-full shrink-0">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-700 border border-gray-100 flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                            <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{selectedPlace.road_address_name || selectedPlace.address_name}</span>
                                {selectedPlace.road_address_name && (
                                    <span className="text-[11px] text-gray-500 mt-0.5">(지번) {selectedPlace.address_name}</span>
                                )}
                            </div>
                        </div>

                        {selectedPlace.phone && (
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-400 shrink-0" />
                                <span className="font-medium">{selectedPlace.phone}</span>
                            </div>
                        )}

                        {selectedPlace.place_url && (
                            <div className="mt-1 pt-3 border-t border-gray-200">
                                <a
                                    href={selectedPlace.place_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold transition-colors"
                                >
                                    <ExternalLink size={14} />
                                    <span>카카오맵에서 장소 사진 및 상세 정보 보기</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}