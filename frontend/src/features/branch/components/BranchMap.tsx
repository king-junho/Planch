import { useEffect, useState } from 'react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { useBranchStore } from '../store/useBranchStore';
import { Clock, Navigation } from 'lucide-react';
import { Branch } from '../../../types/branch';

interface BranchMapProps {
    compareBranches?: Branch[]; // 비교 모드일 때 전달받는 브랜치 배열
    compareDay?: number;        // 비교 모드일 때 전달받는 일차
}

// 비교 모드에서 사용할 색상 배열
const PATH_COLORS = ['#2563eb', '#dc2626', '#16a34a'];

export default function BranchMap({ compareBranches, compareDay }: BranchMapProps) {
    const { selectedBranch, selectedDay, draftRoutes, currentDraftDay } = useBranchStore();
    const [map, setMap] = useState<any>(null);

    const isCreating = Object.values(draftRoutes).some(r => r.length > 0);
    const isCompareMode = compareBranches && compareBranches.length > 0;

    const defaultCenter = { lat: 37.5546, lng: 126.9706 };

    // 지도의 범위를 모든 마커가 보이도록 조정하는 함수
    const updateBounds = (paths: { lat: number, lng: number }[][]) => {
        if (!map || paths.length === 0) return;
        const bounds = new window.kakao.maps.LatLngBounds();
        let hasPoint = false;

        paths.forEach(path => {
            path.forEach(pos => {
                bounds.extend(new window.kakao.maps.LatLng(pos.lat, pos.lng));
                hasPoint = true;
            });
        });

        if (hasPoint) {
            map.setBounds(bounds);
        }
    };

    // 데이터 구조에 따른 경로 추출 로직
    const getPathFromRoute = (route: any[]) => {
        return route.map(item => ({
            lat: item.latitude ?? parseFloat(item.y || '0'),
            lng: item.longitude ?? parseFloat(item.x || '0')
        }));
    };

    // 비교 모드일 때와 일반 모드일 때의 데이터 구성
    const comparePaths = isCompareMode
        ? compareBranches.map(branch => getPathFromRoute(branch.routes?.[compareDay || 1] || []))
        : [];

    const singlePath = isCreating
        ? getPathFromRoute(draftRoutes[currentDraftDay] || [])
        : getPathFromRoute(selectedBranch?.routes?.[selectedDay] || []);

    useEffect(() => {
        if (isCompareMode) {
            updateBounds(comparePaths);
        } else {
            updateBounds([singlePath]);
        }
    }, [map, selectedBranch, selectedDay, draftRoutes, currentDraftDay, compareBranches, compareDay]);

    return (
        <Map
            center={defaultCenter}
            style={{ width: '100%', height: '100%' }}
            level={3}
            onCreate={setMap}
        >
            {isCompareMode ? (
                // 비교 모드: 여러 개의 선과 마커를 색상별로 렌더링
                compareBranches.map((branch, bIdx) => (
                    <div key={`compare-group-${branch.id}`}>
                        <Polyline
                            path={comparePaths[bIdx]}
                            strokeWeight={5}
                            strokeColor={PATH_COLORS[bIdx % PATH_COLORS.length]}
                            strokeOpacity={0.8}
                            strokeStyle="solid"
                        />
                        {comparePaths[bIdx].map((pos, pIdx) => (
                            <MapMarker
                                key={`marker-${branch.id}-${pIdx}`}
                                position={pos}
                                image={{
                                    src: `https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png`,
                                    size: { width: 36, height: 37 },
                                    options: {
                                        spriteSize: { width: 36, height: 691 },
                                        spriteOrigin: { x: 0, y: (bIdx * 3) * 46 }, // 브랜치마다 다른 마커 스타일 적용 가능
                                        offset: { x: 13, y: 37 }
                                    }
                                }}
                            />
                        ))}
                    </div>
                ))
            ) : (
                // 일반 모드: 단일 경로 렌더링
                <>
                    <Polyline
                        path={singlePath}
                        strokeWeight={5}
                        strokeColor="#2563eb"
                        strokeOpacity={0.7}
                        strokeStyle="solid"
                    />
                    {singlePath.map((pos, idx) => (
                        <MapMarker
                            key={`single-marker-${idx}`}
                            position={pos}
                            image={{
                                src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png",
                                size: { width: 36, height: 37 },
                                options: {
                                    spriteSize: { width: 36, height: 691 },
                                    spriteOrigin: { x: 0, y: idx * 46 },
                                    offset: { x: 13, y: 37 }
                                }
                            }}
                        />
                    ))}
                </>
            )}
        </Map>
    );
}