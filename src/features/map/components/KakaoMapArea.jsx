import { useEffect, useState } from 'react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { useProposalStore } from '../../proposal/store/useProposalStore';
import { useBranchStore } from '../../branch/store/useBranchStore';
import { MapPin, Phone, ExternalLink, X, Clock, Navigation } from 'lucide-react';

export default function KakaoMapArea() {
    const { keyword, searchResults, setSearchResults, selectedPlace, setSelectedPlace } = useProposalStore();

    // selectedDay 상태 추가
    const { selectedBranch, selectedDay } = useBranchStore();

    const [map, setMap] = useState(null);
    const defaultCenter = { lat: 33.4890, lng: 126.4983 };

    // 현재 선택된 브랜치의 선택된 일차 데이터만 가져와서 좌표 변환
    const currentRoute = selectedBranch?.routes?.[selectedDay] || [];
    const validPlaces = currentRoute.filter(item => item.x && item.y);
    const linePath = validPlaces.map(item => ({ lat: parseFloat(item.y), lng: parseFloat(item.x) }));

    useEffect(() => {
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services || !map || !keyword) return;

        const ps = new window.kakao.maps.services.Places();

        ps.keywordSearch(keyword, (data, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                setSearchResults(data);
                setSelectedPlace(data[0]);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                alert('검색 결과가 존재하지 않습니다.');
                setSearchResults([]);
                setSelectedPlace(null);
            } else {
                alert('검색 중 오류가 발생했습니다.');
                setSearchResults([]);
                setSelectedPlace(null);
            }
        });
    }, [keyword, map, setSearchResults, setSelectedPlace]);

    useEffect(() => {
        if (!selectedBranch && map && selectedPlace && selectedPlace.y && selectedPlace.x) {
            const moveLatLon = new window.kakao.maps.LatLng(selectedPlace.y, selectedPlace.x);
            if (map.getLevel() > 5) {
                map.setLevel(4);
            }
            map.panTo(moveLatLon);
        }
    }, [selectedPlace, map, selectedBranch]);

    // 일차(selectedDay)가 변경될 때마다 지도 마커 범위 재조정
    useEffect(() => {
        if (map && window.kakao && selectedBranch && validPlaces.length > 0) {
            const bounds = new window.kakao.maps.LatLngBounds();

            validPlaces.forEach(place => {
                bounds.extend(new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x)));
            });

            map.setBounds(bounds, 50, 50, 50, 50);
        }
    }, [selectedBranch, selectedDay, map]);

    const safeResults = searchResults || [];

    return (
        <div className="w-full h-full relative overflow-hidden">
            <Map
                center={defaultCenter}
                style={{ width: "100%", height: "100%" }}
                level={9}
                onCreate={setMap}
            >
                {/* 장소 제안 마커 */}
                {!selectedBranch && safeResults.map((place) => (
                    <MapMarker
                        key={place.id}
                        position={{ lat: parseFloat(place.y), lng: parseFloat(place.x) }}
                        title={place.place_name}
                        onClick={() => setSelectedPlace(place)}
                    />
                ))}

                {!selectedBranch && selectedPlace && !safeResults.some(p => p.id === selectedPlace.id) && selectedPlace.y && selectedPlace.x && (
                    <MapMarker
                        position={{ lat: parseFloat(selectedPlace.y), lng: parseFloat(selectedPlace.x) }}
                        title={selectedPlace.place_name}
                    />
                )}

                {/* 브랜치 마커 및 경로 (현재 선택된 일차만 표시) */}
                {selectedBranch && validPlaces.map((place) => (
                    <MapMarker
                        key={place.id}
                        position={{ lat: parseFloat(place.y), lng: parseFloat(place.x) }}
                        title={place.title}
                    />
                ))}

                {selectedBranch && linePath.length > 1 && (
                    <Polyline
                        path={[linePath]}
                        strokeWeight={4}
                        strokeColor={"#3B82F6"}
                        strokeOpacity={0.8}
                        strokeStyle={"solid"}
                    />
                )}
            </Map>

            {!selectedBranch && selectedPlace && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-5 z-10 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <button
                        onClick={() => setSelectedPlace(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex flex-col gap-2 pr-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-gray-900 text-lg font-bold truncate">{selectedPlace.place_name}</h3>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full shrink-0">
                                {selectedPlace.category_group_name || '분류 없음'}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-1 text-sm text-gray-600">
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                                <span className="leading-tight">{selectedPlace.road_address_name || selectedPlace.address_name || '주소 없음'}</span>
                            </div>

                            {selectedPlace.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="shrink-0 text-gray-400" />
                                    <span>{selectedPlace.phone}</span>
                                </div>
                            )}
                        </div>

                        {selectedPlace.place_url && (
                            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                                <a
                                    href={selectedPlace.place_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <ExternalLink size={14} />
                                    카카오맵 상세보기
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedBranch && (
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100 flex gap-6 z-10 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold">총 예상 시간</span>
                        </div>
                        <span className="text-gray-900 text-sm font-bold">{selectedBranch.time}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200 self-center" />
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Navigation size={14} />
                            <span className="text-[10px] font-bold">이동 거리</span>
                        </div>
                        <span className="text-gray-900 text-sm font-bold">약 12km</span>
                    </div>
                </div>
            )}
        </div>
    );
}