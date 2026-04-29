import { useEffect, useState } from 'react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { useBranchStore } from '../store/useBranchStore';
import { Branch } from '../../../types/branch';

interface BranchMapProps {
    compareBranches?: Branch[]; // 비교 모드일 때 전달받는 브랜치 배열
    compareDay?: number;        // 비교 모드일 때 전달받는 일차
}

const PATH_COLORS = ['#2563eb', '#dc2626', '#16a34a'];

export default function BranchMap({ compareBranches, compareDay }: BranchMapProps) {
    const { selectedBranch, selectedDay, draftRoutes, currentDraftDay } = useBranchStore();
    const [map, setMap] = useState<any>(null);

    // 실제 도로 경로 데이터를 저장할 상태
    const [singleRoadPath, setSingleRoadPath] = useState<{ lat: number, lng: number }[]>([]);
    const [compareRoadPaths, setCompareRoadPaths] = useState<{ lat: number, lng: number }[][]>([]);

    const isCreating = Object.values(draftRoutes).some(r => r.length > 0);
    const isCompareMode = compareBranches && compareBranches.length > 0;

    const defaultCenter = { lat: 37.5546, lng: 126.9706 };

    // 지도의 범위를 마커 및 경로가 모두 보이도록 조정하는 함수
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

    // 장소 데이터에서 좌표만 추출하는 함수 (마커용)
    const getPathFromRoute = (route: any[]) => {
        return route.map(item => ({
            lat: item.latitude ?? parseFloat(item.y || '0'),
            lng: item.longitude ?? parseFloat(item.x || '0')
        }));
    };

    // 마커를 찍기 위한 원본 좌표 데이터
    const rawComparePaths = isCompareMode
        ? compareBranches.map(branch => getPathFromRoute(branch.routes?.[compareDay || 1] || []))
        : [];

    const rawSinglePath = isCreating
        ? getPathFromRoute(draftRoutes[currentDraftDay] || [])
        : getPathFromRoute(selectedBranch?.routes?.[selectedDay] || []);

    // 카카오 모빌리티 API를 호출하여 실제 도로 경로를 가져오는 함수
    const fetchRealRoadPath = async (points: { lat: number, lng: number }[]) => {
        if (points.length < 2) return points; // 장소가 1개 이하면 경로를 그릴 수 없으므로 원본 반환

        try {
            const origin = points[0];
            const dest = points[points.length - 1];
            // 출발지와 도착지를 제외한 나머지 장소들을 경유지(waypoints)로 묶음
            const waypoints = points.slice(1, -1).map(p => `${p.lng},${p.lat}`).join('|');

            const params = new URLSearchParams({
                origin: `${origin.lng},${origin.lat}`,
                destination: `${dest.lng},${dest.lat}`,
                priority: 'RECOMMEND',
                car_fuel: 'GASOLINE',
                car_hipass: 'false'
            });
            if (waypoints) params.append('waypoints', waypoints);

            // 환경변수에서 REST API 키 가져오기 (CRA 사용 시 process.env.REACT_APP_KAKAO_REST_API_KEY 로 변경)
            const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

            const response = await fetch(`https://apis-navi.kakaomobility.com/v1/directions?${params}`, {
                headers: {
                    Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            // 응답 데이터에서 수많은 세부 꺾임 좌표들을 하나의 배열로 합침
            if (data.routes && data.routes[0]) {
                const linePath: { lat: number, lng: number }[] = [];
                data.routes[0].sections.forEach((section: any) => {
                    section.roads.forEach((road: any) => {
                        road.vertexes.forEach((vertex: number, index: number) => {
                            if (index % 2 === 0) {
                                linePath.push({ lng: vertex, lat: road.vertexes[index + 1] });
                            }
                        });
                    });
                });
                return linePath;
            }
        } catch (error) {
            console.error("경로 조회 실패:", error);
        }
        // API 에러 발생 시 기존처럼 직선(원본 좌표)으로 폴백
        return points;
    };

    // 장소(rawPaths)가 바뀔 때마다 실제 경로 API를 호출
    useEffect(() => {
        let isMounted = true;
        const loadPaths = async () => {
            if (isCompareMode) {
                const results = await Promise.all(rawComparePaths.map(path => fetchRealRoadPath(path)));
                if (isMounted) setCompareRoadPaths(results);
            } else {
                const result = await fetchRealRoadPath(rawSinglePath);
                if (isMounted) setSingleRoadPath(result);
            }
        };
        loadPaths();
        return () => { isMounted = false; };
    }, [isCompareMode, compareBranches, compareDay, isCreating, draftRoutes, currentDraftDay, selectedBranch, selectedDay]);

    // 경로가 업데이트되면 지도 범위를 다시 맞춤 (마커 + 경로 모두 포함)
    useEffect(() => {
        if (isCompareMode) {
            updateBounds([...rawComparePaths, ...compareRoadPaths]);
        } else {
            updateBounds([rawSinglePath, singleRoadPath]);
        }
    }, [map, rawComparePaths, compareRoadPaths, rawSinglePath, singleRoadPath, isCompareMode]);

    return (
        <Map
            center={defaultCenter}
            style={{ width: '100%', height: '100%' }}
            level={3}
            onCreate={setMap}
        >
            {isCompareMode ? (
                // 비교 모드: 여러 개의 선과 마커를 색상별로 렌더링
                compareBranches!.map((branch, bIdx) => (
                    <div key={`compare-group-${branch.id}`}>
                        {/* 선은 실제 API로 가져온 도로 경로(compareRoadPaths) 사용 */}
                        <Polyline
                            path={compareRoadPaths[bIdx] || []}
                            strokeWeight={5}
                            strokeColor={PATH_COLORS[bIdx % PATH_COLORS.length]}
                            strokeOpacity={0.8}
                            strokeStyle="solid"
                        />
                        {/* 마커는 기존의 장소 원본 좌표(rawComparePaths) 사용 */}
                        {(rawComparePaths[bIdx] || []).map((pos, pIdx) => (
                            <MapMarker
                                key={`marker-${branch.id}-${pIdx}`}
                                position={pos}
                                image={{
                                    src: `https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png`,
                                    size: { width: 36, height: 37 },
                                    options: {
                                        spriteSize: { width: 36, height: 691 },
                                        spriteOrigin: { x: 0, y: (bIdx * 3) * 46 }, // 브랜치마다 다른 마커 스타일
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
                    {/* 선은 실제 API로 가져온 도로 경로(singleRoadPath) 사용 */}
                    <Polyline
                        path={singleRoadPath}
                        strokeWeight={5}
                        strokeColor="#2563eb"
                        strokeOpacity={0.7}
                        strokeStyle="solid"
                    />
                    {/* 💡 마커는 기존의 장소 원본 좌표(rawSinglePath) 사용 */}
                    {rawSinglePath.map((pos, idx) => (
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