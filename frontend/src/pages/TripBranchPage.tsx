import { Clock3, MapPin, ReceiptText, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";
import { useNavigate, useParams } from "react-router-dom";
import TripRoomHeader from "../components/layout/TripRoomHeader";

type BranchStatus = "confirmed" | "voting" | "selected";

type BranchItem = {
  id: number;
  title: string;
  description: string;
  estimatedCost: string;
  travelTime: string;
  preferenceRate: number;
  authorBadge: string;
  isAiRecommended: boolean;
  status: BranchStatus;
  points: Array<{ lat: number; lng: number; label: string }>;
};

const initialBranches: BranchItem[] = [
  {
    id: 1,
    title: "메인 일정 (A안)",
    description: "팀원들이 가장 많이 선호한 핫플 위주의 동선",
    estimatedCost: "약 35만원",
    travelTime: "2시간 30분",
    preferenceRate: 92,
    authorBadge: "AI 추천",
    isAiRecommended: true,
    status: "confirmed",
    points: [
      { lat: 33.4624, lng: 126.3098, label: "몽상드애월" },
      { lat: 33.3949, lng: 126.2393, label: "협재해수욕장" },
      { lat: 33.4772, lng: 126.6665, label: "제주레포츠랜드" },
    ],
  },
  {
    id: 2,
    title: "휴양 힐링 B안",
    description: "웨이팅 없이 여유롭게 바다를 보며 쉴 수 있는 일정",
    estimatedCost: "약 28만원",
    travelTime: "1시간 40분",
    preferenceRate: 78,
    authorBadge: "복성준",
    isAiRecommended: false,
    status: "voting",
    points: [
      { lat: 33.3949, lng: 126.2393, label: "협재해수욕장" },
      { lat: 33.3617, lng: 126.5292, label: "한라산 국립공원 인근" },
      { lat: 33.5065, lng: 126.9557, label: "우도봉" },
    ],
  },
  {
    id: 3,
    title: "액티비티 체험 C안",
    description: "카트와 서핑 등 다이나믹한 활동이 포함된 스케줄",
    estimatedCost: "약 55만원",
    travelTime: "3시간 10분",
    preferenceRate: 65,
    authorBadge: "AI 추천",
    isAiRecommended: true,
    status: "selected",
    points: [
      { lat: 33.4772, lng: 126.6665, label: "제주레포츠랜드" },
      { lat: 33.2446, lng: 126.5643, label: "중문색달해변" },
      { lat: 33.2496, lng: 126.4121, label: "산방산 인근" },
    ],
  },
];

function branchStatusChip(status: BranchStatus) {
  if (status === "confirmed") {
    return {
      label: "최종 확정",
      className:
        "bg-emerald-50 text-emerald-700 outline outline-1 outline-offset-[-1px] outline-emerald-200",
    };
  }

  if (status === "voting") {
    return {
      label: "투표 중",
      className:
        "bg-orange-50 text-orange-600 outline outline-1 outline-offset-[-1px] outline-orange-200",
    };
  }

  return {
    label: "선택 중",
    className:
      "bg-gray-100 text-gray-600 outline outline-1 outline-offset-[-1px] outline-gray-200",
  };
}

function toastClass(type: "success" | "error") {
  return type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-600";
}

export default function TripBranchPage() {
  const { tripRoomId = "3" } = useParams();
  const navigate = useNavigate();
  const [branches, setBranches] = useState(initialBranches);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranches[0].id);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const kakaoAppKey =
    import.meta.env.VITE_KAKAO_MAP_APP_KEY ??
    import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY ??
    "";
  const [isMapLoading, mapError] = useKakaoLoader({
    appkey: kakaoAppKey,
  });

  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) ?? branches[0];

  const mapCenter = useMemo(() => {
    const firstPoint = selectedBranch?.points[0];

    if (!firstPoint) {
      return { lat: 33.3617, lng: 126.5292 };
    }

    return { lat: firstPoint.lat, lng: firstPoint.lng };
  }, [selectedBranch]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function handleVote(branchId: number) {
    setSelectedBranchId(branchId);
    setBranches((currentBranches) =>
      currentBranches.map((branch) =>
        branch.id === branchId ? { ...branch, status: "selected" } : branch
      )
    );
    setToast({ type: "success", message: "브랜치 선택이 반영되었습니다." });
  }

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <TripRoomHeader activeItem="branch" tripRoomId={tripRoomId} />

      <main className="grid h-[calc(100vh-76px)] grid-cols-[500px_minmax(0,1fr)] overflow-hidden">
        <section className="flex h-full flex-col rounded-md border-r border-gray-200 bg-stone-50">
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-[28px] font-bold leading-8 text-gray-900">
                  브랜치 목록
                </h1>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  일정 브랜치들을 비교하고 투표해보세요.
                </p>
              </div>
              <button
                className="h-9 rounded-md bg-gray-900 px-5 text-xs font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                onClick={() => navigate(`/trip-rooms/${tripRoomId}/branch/create`)}
                type="button"
              >
                + 새 브랜치
              </button>
            </div>

            <div className="mt-8 space-y-4 pr-2">
              {branches.map((branch) => {
                const statusChip = branchStatusChip(branch.status);
                const isActive = branch.id === selectedBranchId;

                return (
                  <article
                    className={`overflow-hidden rounded-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] outline outline-1 outline-offset-[-1px] ${
                      isActive
                        ? "outline-blue-500 shadow-[0_0_0_1px_rgba(43,127,255,1)]"
                        : "outline-gray-200"
                    }`}
                    key={branch.id}
                  >
                    <div className="border-b border-gray-100 p-5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold leading-4 ${
                            branch.isAiRecommended
                              ? "bg-blue-50 text-blue-600 outline outline-1 outline-offset-[-1px] outline-blue-100"
                              : "bg-gray-100 text-gray-600 outline outline-1 outline-offset-[-1px] outline-gray-200"
                          }`}
                        >
                          {branch.isAiRecommended ? (
                            <Sparkles size={12} />
                          ) : (
                            <span className="inline-block h-2 w-2 rounded-full bg-gray-500" />
                          )}
                          {branch.authorBadge}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold leading-4 ${statusChip.className}`}
                        >
                          {statusChip.label}
                        </span>
                      </div>

                      <h2 className="mt-5 text-base font-bold leading-6 text-gray-900">
                        {branch.title}
                      </h2>
                      <p className="mt-1 text-xs leading-4 text-gray-500">
                        {branch.description}
                      </p>

                      <div className="mt-5 rounded-md border border-gray-100 bg-gray-50 p-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase leading-4 text-gray-500">
                              <ReceiptText size={12} />
                              예상 총비용
                            </div>
                            <p className="mt-1 text-xs font-bold leading-5 text-gray-900">
                              {branch.estimatedCost}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase leading-4 text-gray-500">
                              <Clock3 size={12} />
                              이동시간
                            </div>
                            <p className="mt-1 text-xs font-bold leading-5 text-gray-900">
                              {branch.travelTime}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-gray-200 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium uppercase leading-4 text-gray-500">
                              선호 반영도
                            </span>
                            <span className="text-xs font-bold leading-4 text-blue-600">
                              {branch.preferenceRate}%
                            </span>
                          </div>
                          <div className="mt-1 h-1 rounded-full bg-gray-200">
                            <div
                              className="h-1 rounded-full bg-blue-500"
                              style={{ width: `${branch.preferenceRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-gray-100 bg-gray-50">
                      <button
                        className="border-r border-gray-200 px-4 py-3 text-xs font-bold text-gray-700"
                        onClick={() => setSelectedBranchId(branch.id)}
                        type="button"
                      >
                        상세 보기
                      </button>
                      <button
                        className={`px-4 py-3 text-xs font-bold ${
                          branch.status === "voting"
                            ? "bg-gray-900 text-white"
                            : "text-gray-700"
                        }`}
                        onClick={() => handleVote(branch.id)}
                        type="button"
                      >
                        {branch.status === "confirmed" ? "확정된 일정" : "투표하기"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative h-full overflow-hidden rounded-md border border-gray-200 bg-neutral-200">
          {!kakaoAppKey ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                <MapPin className="text-blue-500" size={28} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-700">
                  {selectedBranch.title} 지도 영역
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  해당 브랜치에 포함된 장소들의 동선이 표시됩니다.
                </p>
              </div>
            </div>
          ) : isMapLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
              카카오맵을 불러오는 중입니다.
            </div>
          ) : mapError ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500">
              카카오맵을 불러오지 못했습니다.
            </div>
          ) : (
            <Map center={mapCenter} className="h-full w-full" level={10}>
              <Polyline
                path={selectedBranch.points.map((point) => ({
                  lat: point.lat,
                  lng: point.lng,
                }))}
                strokeColor="#3B82F6"
                strokeOpacity={0.9}
                strokeStyle="solid"
                strokeWeight={4}
              />
              {selectedBranch.points.map((point) => (
                <MapMarker
                  key={`${selectedBranch.id}-${point.label}`}
                  position={{ lat: point.lat, lng: point.lng }}
                  title={point.label}
                />
              ))}
            </Map>
          )}

          <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-stone-900">
                  {selectedBranch.title}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  해당 브랜치에 포함된 장소들의 동선이 표시됩니다.
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                {selectedBranch.points.length}개 장소
              </span>
            </div>
          </div>
        </section>
      </main>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${toastClass(
              toast.type
            )}`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
