import { useEffect, useState } from 'react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { useBranchStore } from '../store/useBranchStore';
import { Clock, Navigation } from 'lucide-react';

export default function BranchMap() {
    const { selectedBranch, selectedDay } = useBranchStore();
    const [map, setMap] = useState<any>(null);
    const defaultCenter = { lat: 33.4890, lng: 126.4983 };

    // 현재 선택된 일차의 경로 데이터 가공
    const currentRoute = selectedBranch?.routes?.[selectedDay] || [];
    const linePath = currentRoute
        .filter(item => (item.latitude !== undefined && item.longitude !== undefined) || (item.y !== undefined && item.x !== undefined))
        .map(item => ({
            lat: item.latitude ?? parseFloat(item.y || '0'),
            lng: item.longitude ?? parseFloat(item.x || '0')
        }));

    // 경로가 바뀔 때 지도가 모든 마커를 포함하도록 범위 조정
    useEffect(() => {
        if (!map || linePath.length === 0) return;
        const bounds = new window.kakao.maps.LatLngBounds();
        linePath.forEach(pos => bounds.extend(new window.kakao.maps.LatLng(pos.lat, pos.lng)));
        map.setBounds(bounds);
    }, [linePath, map]);

    return (
        <div className="relative w-full h-full">
            <Map center={defaultCenter} className="w-full h-full" level={3} onCreate={setMap}>
                {linePath.length > 0 && (
                    <>
                        <Polyline
                            path={linePath}
                            strokeWeight={4}
                            strokeColor="#3B82F6"
                            strokeOpacity={0.8}
                        />
                        {linePath.map((pos, idx) => (
                            <MapMarker
                                key={`branch-marker-${idx}`}
                                position={pos}
                                image={{
                                    src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                                    size: { width: 24, height: 35 }
                                }}
                            />
                        ))}
                    </>
                )}
            </Map>

            {/* 우측 상단 정보 요약 카드 */}
            {selectedBranch && (
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100 flex gap-6 z-10 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase">Time</span>
                        </div>
                        <span className="text-gray-900 text-sm font-bold">{selectedBranch.time}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200 self-center" />
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Navigation size={14} />
                            <span className="text-[10px] font-bold uppercase">Distance</span>
                        </div>
                        <span className="text-gray-900 text-sm font-bold">계산 중</span>
                    </div>
                </div>
            )}
        </div>
    );
}