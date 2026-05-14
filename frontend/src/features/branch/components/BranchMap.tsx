import { useEffect, useState } from 'react';
import { Map as KakaoMap, Polyline, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { useBranchStore } from '../store/useBranchStore';
import { Branch } from '../../../types/branch';

interface BranchMapProps {
    compareBranches?: Branch[];
    compareDay?: number;
    visibleBranchIds?: number[];
}

const PATH_COLORS = ['#2563eb', '#dc2626', '#16a34a'];
const MARKER_COLORS = ['bg-blue-600', 'bg-red-600', 'bg-green-600'];

export default function BranchMap({ compareBranches, compareDay, visibleBranchIds }: BranchMapProps) {
    const { selectedBranch, selectedDay, draftRoutes, currentDraftDay } = useBranchStore();
    const [map, setMap] = useState<any>(null);

    const [singleRoadPath, setSingleRoadPath] = useState<{ lat: number, lng: number }[]>([]);
    const [compareRoadPaths, setCompareRoadPaths] = useState<{ lat: number, lng: number }[][]>([]);

    const isCreating = Object.values(draftRoutes).some(r => r.length > 0);
    const isCompareMode = compareBranches && compareBranches.length > 0;

    const defaultCenter = { lat: 37.5546, lng: 126.9706 };

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

    const getPathFromRoute = (route: any[]) => {
        return route.map(item => ({
            lat: item.latitude ?? parseFloat(item.y || '0'),
            lng: item.longitude ?? parseFloat(item.x || '0'),
            title: item.place || item.title || '장소명 없음',
            placeId: item.placeId || item.id
        }));
    };

    const rawComparePaths = isCompareMode
        ? compareBranches.map(branch => getPathFromRoute(branch.routes?.[compareDay || 1] || []))
        : [];

    const rawSinglePath = isCreating
        ? getPathFromRoute(draftRoutes[currentDraftDay] || [])
        : getPathFromRoute(selectedBranch?.routes?.[selectedDay] || []);

    const getOffsetComparePaths = () => {
        const coordMap = new Map<string, number>();
        const locationCount = new Map<string, number>();

        const getKey = (pos: any) => pos.placeId ? `place_${pos.placeId}` : `${pos.lat.toFixed(4)},${pos.lng.toFixed(4)}`;

        rawComparePaths.forEach((branchPath, idx) => {
            if (visibleBranchIds && compareBranches && !visibleBranchIds.includes(compareBranches[idx].id)) return;

            branchPath.forEach(pos => {
                const key = getKey(pos);
                locationCount.set(key, (locationCount.get(key) || 0) + 1);
            });
        });

        return rawComparePaths.map((branchPath, idx) => {
            return branchPath.map(pos => {
                if (visibleBranchIds && compareBranches && !visibleBranchIds.includes(compareBranches[idx].id)) {
                    return { ...pos, offsetX: 0, offsetY: 0 };
                }

                const key = getKey(pos);
                const total = locationCount.get(key) || 1;

                if (total === 1) return { ...pos, offsetX: 0, offsetY: 0 };

                const currentIdx = coordMap.get(key) || 0;
                coordMap.set(key, currentIdx + 1);

                const offsetX = (currentIdx - (total - 1) / 2) * 32;
                const offsetY = (currentIdx - (total - 1) / 2) * -12;

                return { ...pos, offsetX, offsetY };
            });
        });
    };

    const offsetComparePaths = isCompareMode ? getOffsetComparePaths() : [];

    const fetchRealRoadPath = async (points: { lat: number, lng: number }[]) => {
        if (points.length < 2) return points;

        try {
            const origin = points[0];
            const dest = points[points.length - 1];
            const waypoints = points.slice(1, -1).map(p => `${p.lng},${p.lat}`).join('|');

            const params = new URLSearchParams({
                origin: `${origin.lng},${origin.lat}`,
                destination: `${dest.lng},${dest.lat}`,
                priority: 'RECOMMEND',
                car_fuel: 'GASOLINE',
                car_hipass: 'false'
            });
            if (waypoints) params.append('waypoints', waypoints);

            const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

            const response = await fetch(`https://apis-navi.kakaomobility.com/v1/directions?${params}`, {
                headers: {
                    Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

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
        return points;
    };

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

    useEffect(() => {
        if (isCompareMode && compareBranches) {
            const visibleRawPaths = rawComparePaths.filter((_, i) => visibleBranchIds?.includes(compareBranches[i].id));
            const visibleRoadPaths = compareRoadPaths.filter((_, i) => visibleBranchIds?.includes(compareBranches[i].id));
            updateBounds([...visibleRawPaths, ...visibleRoadPaths]);
        } else {
            updateBounds([rawSinglePath, singleRoadPath]);
        }
    }, [map, rawComparePaths, compareRoadPaths, rawSinglePath, singleRoadPath, isCompareMode, visibleBranchIds, compareBranches]);

    return (
        <KakaoMap
            center={defaultCenter}
            style={{ width: '100%', height: '100%' }}
            level={3}
            onCreate={setMap}
        >
            {isCompareMode ? (
                compareBranches!.map((branch, bIdx) => {
                    if (visibleBranchIds && !visibleBranchIds.includes(branch.id)) return null;

                    return (
                        <div key={`compare-group-${branch.id}`}>
                            <Polyline
                                path={compareRoadPaths[bIdx] || []}
                                strokeWeight={5}
                                strokeColor={PATH_COLORS[bIdx % PATH_COLORS.length]}
                                strokeOpacity={0.8}
                                strokeStyle="solid"
                            />
                            {(offsetComparePaths[bIdx] || []).map((pos, pIdx) => (
                                <CustomOverlayMap
                                    key={`compare-marker-${branch.id}-${pIdx}`}
                                    position={pos}
                                    yAnchor={1}
                                    zIndex={10 + pIdx}
                                >
                                    <div
                                        className="relative group cursor-pointer transition-transform z-10 hover:z-50 hover:scale-110"
                                        style={{ transform: `translate(${pos.offsetX}px, ${pos.offsetY}px)` }}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
                                            플랜 {bIdx + 1} - {pIdx + 1}번째: {pos.title}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                        </div>

                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 shadow-md ${MARKER_COLORS[bIdx % MARKER_COLORS.length]} border-white`}>
                                            {pIdx + 1}
                                        </div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/30 rounded-full blur-[1px] -z-10" />
                                    </div>
                                </CustomOverlayMap>
                            ))}
                        </div>
                    );
                })
            ) : (
                <>
                    <Polyline
                        path={singleRoadPath}
                        strokeWeight={5}
                        strokeColor="#2563eb"
                        strokeOpacity={0.7}
                        strokeStyle="solid"
                    />
                    {rawSinglePath.map((pos, idx) => (
                        <CustomOverlayMap
                            key={`single-marker-${idx}`}
                            position={pos}
                            yAnchor={1}
                        >
                            <div className="relative group cursor-pointer transform hover:scale-110 transition-transform z-10 hover:z-50">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
                                    {idx + 1}번째: {pos.title}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                </div>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 shadow-md bg-blue-600 border-white">
                                    {idx + 1}
                                </div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/30 rounded-full blur-[1px] -z-10" />
                            </div>
                        </CustomOverlayMap>
                    ))}
                </>
            )}
        </KakaoMap>
    );
}