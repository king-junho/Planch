import { useEffect, useState, useMemo } from 'react';
import { Map as KakaoMap, Polyline, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { useBranchStore } from '../store/useBranchStore';
import { Branch } from '../../../types/branch';

interface BranchMapProps {
    compareBranches?: Branch[];
    compareDay?: number;
    visibleBranchIds?: number[];
    hoveredPlaceId?: number | null;
    onMarkerClick?: (branchId: number, placeId: number) => void;
}

const PATH_COLORS = ['#2563eb', '#dc2626', '#16a34a'];
const MARKER_COLORS = ['bg-blue-600', 'bg-red-600', 'bg-green-600'];

export default function BranchMap({
    compareBranches,
    compareDay,
    visibleBranchIds,
    hoveredPlaceId,
    onMarkerClick
}: BranchMapProps) {
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
            map.setBounds(bounds, 50, 50, 50, 50);
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

    const rawComparePaths = useMemo(() => {
        return isCompareMode && compareBranches
            ? compareBranches.map(branch => getPathFromRoute(branch.routes?.[compareDay || 1] || []))
            : [];
    }, [isCompareMode, compareBranches, compareDay]);

    const rawSinglePath = useMemo(() => {
        return isCreating
            ? getPathFromRoute(draftRoutes[currentDraftDay] || [])
            : getPathFromRoute(selectedBranch?.routes?.[selectedDay || 1] || []);
    }, [isCreating, draftRoutes, currentDraftDay, selectedBranch, selectedDay]);

    const processedComparePaths = useMemo(() => {
        if (!isCompareMode) return [];

        const locationCount = new Map<string, number>();
        const coordMap = new Map<string, number>();

        const getKey = (pos: any) => pos.placeId ? `place_${pos.placeId}` : `${pos.lat.toFixed(4)},${pos.lng.toFixed(4)}`;

        rawComparePaths.forEach((branchPath, idx) => {
            if (visibleBranchIds && compareBranches && !visibleBranchIds.includes(compareBranches[idx].id)) return;

            const uniqueKeys = new Set(branchPath.map(getKey));
            uniqueKeys.forEach(key => {
                locationCount.set(key, (locationCount.get(key) || 0) + 1);
            });
        });

        const visibleCount = visibleBranchIds ? visibleBranchIds.length : 0;
        const firstVisibleIdx = compareBranches ? compareBranches.findIndex(b => visibleBranchIds?.includes(b.id)) : 0;

        return rawComparePaths.map((branchPath, idx) => {
            const isVisible = visibleBranchIds && compareBranches && visibleBranchIds.includes(compareBranches[idx].id);

            return branchPath.map(pos => {
                if (!isVisible) {
                    return { ...pos, offsetX: 0, offsetY: 0, isCommon: false, hideMarker: true };
                }

                const key = getKey(pos);
                const totalSharing = locationCount.get(key) || 1;

                const isCommon = visibleCount > 1 && totalSharing === visibleCount;
                const isShared = totalSharing > 1;

                let offsetX = 0;
                let offsetY = 0;
                let hideMarker = false;

                if (isCommon) {
                    if (idx !== firstVisibleIdx) {
                        hideMarker = true;
                    }
                }
                else if (isShared) {
                    const currentIdx = coordMap.get(key) || 0;
                    coordMap.set(key, currentIdx + 1);

                    offsetX = (currentIdx - (totalSharing - 1) / 2) * 32;
                    offsetY = (currentIdx - (totalSharing - 1) / 2) * -12;
                }

                return { ...pos, offsetX, offsetY, isCommon, hideMarker };
            });
        });
    }, [isCompareMode, rawComparePaths, visibleBranchIds, compareBranches]);

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

            if (data.routes && data.routes[0] && data.routes[0].sections) {
                const linePath: { lat: number, lng: number }[] = [];
                data.routes[0].sections.forEach((section: any) => {
                    if (!section.roads) return;
                    section.roads.forEach((road: any) => {
                        if (!road.vertexes) return;
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
    }, [isCompareMode, rawComparePaths, rawSinglePath]);

    useEffect(() => {
        if (!map) return;

        if (isCompareMode && compareBranches) {
            const visibleRawPaths = rawComparePaths.filter((_, i) => visibleBranchIds?.includes(compareBranches[i].id));
            const visibleRoadPaths = compareRoadPaths.filter((_, i) => visibleBranchIds?.includes(compareBranches[i].id));
            updateBounds([...visibleRawPaths, ...visibleRoadPaths]);
        } else {
            if (isCreating && rawSinglePath.length >= 2) {
                const lastTwoPlaces = rawSinglePath.slice(-2);
                updateBounds([lastTwoPlaces]);
            } else {
                updateBounds([rawSinglePath, singleRoadPath]);
            }
        }
    }, [map, rawComparePaths, compareRoadPaths, rawSinglePath, singleRoadPath, isCompareMode, visibleBranchIds, compareBranches, isCreating]);

    useEffect(() => {
        if (!map || !hoveredPlaceId) return;

        let targetLat: number | null = null;
        let targetLng: number | null = null;

        if (isCompareMode) {
            for (const path of rawComparePaths) {
                const place = path.find((p: any) => p.placeId === hoveredPlaceId);
                if (place) {
                    targetLat = place.lat;
                    targetLng = place.lng;
                    break;
                }
            }
        } else {
            const place = rawSinglePath.find((p: any) => p.placeId === hoveredPlaceId);
            if (place) {
                targetLat = place.lat;
                targetLng = place.lng;
            }
        }

        if (targetLat !== null && targetLng !== null) {
            const moveLatLon = new window.kakao.maps.LatLng(targetLat, targetLng);

            map.setLevel(4);
            map.panTo(moveLatLon);
        }
    }, [map, hoveredPlaceId, rawComparePaths, rawSinglePath, isCompareMode]);

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
                            {(processedComparePaths[bIdx] || []).map((pos, pIdx) => {
                                if (pos.hideMarker) return null;

                                const isHovered = pos.placeId === hoveredPlaceId;
                                const markerClass = pos.isCommon
                                    ? 'bg-gray-500 border-gray-200'
                                    : `${MARKER_COLORS[bIdx % MARKER_COLORS.length]} border-white`;

                                const labelText = pos.isCommon
                                    ? `공통 장소: ${pos.title}`
                                    : `플랜 ${bIdx + 1} - ${pIdx + 1}번째: ${pos.title}`;

                                return (
                                    <CustomOverlayMap
                                        key={`compare-marker-${branch.id}-${pIdx}`}
                                        position={pos}
                                        yAnchor={1}
                                        zIndex={isHovered ? 50 : (pos.isCommon ? 5 : 10 + pIdx)}
                                    >
                                        <div
                                            onClick={() => onMarkerClick?.(branch.id, pos.placeId)}
                                            className={`relative group cursor-pointer transition-all duration-300 ${isHovered ? 'scale-[1.3] -translate-y-2' : 'hover:scale-110 hover:-translate-y-1'}`}
                                            style={{ transform: `translate(${pos.offsetX || 0}px, ${pos.offsetY || 0}px)` }}
                                        >
                                            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg whitespace-nowrap transition-opacity shadow-lg pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                {labelText}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                            </div>

                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 shadow-md ${markerClass} ${isHovered ? 'ring-4 ring-blue-400/40' : ''}`}>
                                                {pos.isCommon ? '공통' : pIdx + 1}
                                            </div>
                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/30 rounded-full blur-[1px] -z-10 transition-transform ${isHovered ? 'scale-[2.0]' : ''}`} />
                                        </div>
                                    </CustomOverlayMap>
                                );
                            })}
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
                    {rawSinglePath.map((pos, idx) => {
                        const isHovered = pos.placeId === hoveredPlaceId;

                        return (
                            <CustomOverlayMap
                                key={`single-marker-${idx}`}
                                position={pos}
                                yAnchor={1}
                                zIndex={isHovered ? 50 : 10}
                            >
                                <div
                                    onClick={() => onMarkerClick?.(0, pos.placeId)}
                                    className={`relative group cursor-pointer transition-all duration-300 ${isHovered ? 'scale-[1.3] -translate-y-2' : 'hover:scale-110 hover:-translate-y-1'}`}
                                >
                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg whitespace-nowrap transition-opacity shadow-lg pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {idx + 1}번째: {pos.title}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                    </div>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 shadow-md bg-blue-600 border-white ${isHovered ? 'ring-4 ring-blue-400/40' : ''}`}>
                                        {idx + 1}
                                    </div>
                                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/30 rounded-full blur-[1px] -z-10 transition-transform ${isHovered ? 'scale-[2.0]' : ''}`} />
                                </div>
                            </CustomOverlayMap>
                        );
                    })}
                </>
            )}
        </KakaoMap>
    );
}