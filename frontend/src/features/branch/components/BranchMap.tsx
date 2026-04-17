import { useEffect, useState } from 'react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { useBranchStore } from '../store/useBranchStore';
import { Clock, Navigation } from 'lucide-react';

export default function BranchMap() {
    const { selectedBranch, selectedDay, draftRoutes, currentDraftDay } = useBranchStore();
    const [map, setMap] = useState<any>(null);

    // 생성 모드 여부 판단: draftRoutes에 데이터가 하나라도 있으면 생성 모드
    const isCreating = Object.values(draftRoutes).some(r => r.length > 0);

    const defaultCenter = { lat: 37.5546, lng: 126.9706 };

    // 현재 그려야 할 경로 결정
    const currentRoute = isCreating
        ? (draftRoutes[currentDraftDay] || [])
        : (selectedBranch?.routes?.[selectedDay] || []);

    const linePath = currentRoute.map(item => ({
        lat: item.latitude ?? parseFloat(item.y || '0'),
        lng: item.longitude ?? parseFloat(item.x || '0')
    }));

    // 3. 경로가 변경될 때마다 지도가 모든 마커를 포함하도록 범위 자동 조정
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

            {/* 브랜치 생성 중일 때와 상세 보기일 때의 정보 UI 노출 */}
            {(selectedBranch || isCreating) && (
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100 flex gap-6 z-10 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase">Time</span>
                        </div>
                        <span className="text-gray-900 text-sm font-bold">
                            {isCreating ? "실시간 계산 중" : selectedBranch?.time}
                        </span>
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