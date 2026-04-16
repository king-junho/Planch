import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, Search, Sparkles } from "lucide-react";
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";
import { useParams } from "react-router-dom";
import TripRoomHeader from "../components/layout/TripRoomHeader";

type PlaceOption = {
  id: number;
  name: string;
  category: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  recommendedNote: string;
};

type ProposalItem = PlaceOption & {
  proposer: string;
  note: string;
  isAiRecommended: boolean;
};

const defaultCenter = { lat: 33.3617, lng: 126.5292 };

const placeCatalog: PlaceOption[] = [
  {
    id: 1,
    name: "몽상드애월",
    category: "카페/디저트",
    address: "제주 제주시 애월읍 애월북서길 56-1",
    description: "애월 해안도로 예쁜 카페 가요!",
    latitude: 33.4624,
    longitude: 126.3098,
    recommendedNote: "애월 바다를 보며 쉬어가기 좋은 카페예요.",
  },
  {
    id: 2,
    name: "제주레포츠랜드",
    category: "액티비티",
    address: "제주 제주시 조천읍 와흘상서2길 47",
    description: "다같이 액티브하게 즐길 수 있는 카트 체험 명소예요.",
    latitude: 33.4772,
    longitude: 126.6665,
    recommendedNote: "카트 체험 같은 액티비티를 함께 넣기 좋아 보여요.",
  },
  {
    id: 3,
    name: "협재해수욕장",
    category: "자연/해변",
    address: "제주 제주시 한림읍 협재리 2497-1",
    description: "맑은 바다색으로 유명한 대표 해변이에요.",
    latitude: 33.3949,
    longitude: 126.2393,
    recommendedNote: "단체 사진 스팟으로도 좋아서 일정에 넣기 좋아요.",
  },
  {
    id: 4,
    name: "우도봉",
    category: "자연/전망",
    address: "제주 제주시 우도면 연평리 산24",
    description: "우도 전체 풍경을 한눈에 내려다볼 수 있어요.",
    latitude: 33.5065,
    longitude: 126.9557,
    recommendedNote: "제주다운 풍경을 원하면 우도 코스도 매력적이에요.",
  },
];

const initialProposals: ProposalItem[] = [
  {
    ...placeCatalog[0],
    proposer: "김준호",
    note: "애월 해안도로 예쁜 카페 가요!",
    isAiRecommended: false,
  },
  {
    ...placeCatalog[1],
    proposer: "AI 추천",
    note: "다같이 액티브하게 즐길 수 있는 카트 체험은 어떨까요?",
    isAiRecommended: true,
  },
];

function statusMessageClass(type: "success" | "error") {
  return type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-600";
}

export default function TripProposalPage() {
  const { tripRoomId = "3" } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceOption[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [proposalMemo, setProposalMemo] = useState("");
  const [proposals, setProposals] = useState<ProposalItem[]>(initialProposals);
  const [focusedProposalId, setFocusedProposalId] = useState<number>(
    initialProposals[0].id
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const kakaoAppKey =
    import.meta.env.VITE_KAKAO_MAP_APP_KEY ??
    import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY ??
    "";
  const [isMapLoading, mapError] = useKakaoLoader({
    appkey: kakaoAppKey,
  });

  const focusedProposal = useMemo(
    () => proposals.find((proposal) => proposal.id === focusedProposalId) ?? null,
    [focusedProposalId, proposals]
  );

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!focusedProposal) return;

    setMapCenter({
      lat: focusedProposal.latitude,
      lng: focusedProposal.longitude,
    });
  }, [focusedProposal]);

  function handleSearch() {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) {
      setToast({ type: "error", message: "검색할 장소를 입력해 주세요." });
      setSearchResults([]);
      return;
    }

    const matchedPlaces = placeCatalog.filter((place) =>
      [place.name, place.category, place.address]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );

    setSearchResults(matchedPlaces);

    if (matchedPlaces.length === 0) {
      setToast({ type: "error", message: "검색 결과가 없습니다." });
      return;
    }

    if (matchedPlaces.length === 1) {
      handleSelectPlace(matchedPlaces[0], false);
    }
  }

  function handleSelectPlace(place: PlaceOption, isAiRecommended: boolean) {
    setSelectedPlace(place);
    setProposalMemo(isAiRecommended ? place.recommendedNote : "");
    setSearchResults([]);
    setSearchQuery(place.name);
    setMapCenter({ lat: place.latitude, lng: place.longitude });
  }

  function handleRecommendByAi() {
    const nextRecommendedPlace = placeCatalog.find(
      (place) => !proposals.some((proposal) => proposal.id === place.id)
    );

    if (!nextRecommendedPlace) {
      setToast({
        type: "error",
        message: "추천할 새로운 장소가 더 이상 없습니다.",
      });
      return;
    }

    handleSelectPlace(nextRecommendedPlace, true);
    setToast({ type: "success", message: "AI 추천 장소를 불러왔습니다." });
  }

  function handleSubmitProposal() {
    if (!selectedPlace) {
      setToast({ type: "error", message: "먼저 제안할 장소를 선택해 주세요." });
      return;
    }

    if (!proposalMemo.trim()) {
      setToast({ type: "error", message: "장소 메모를 입력해 주세요." });
      return;
    }

    if (proposals.some((proposal) => proposal.id === selectedPlace.id)) {
      setToast({ type: "error", message: "이미 제안된 장소입니다." });
      return;
    }

    const isAiRecommended = proposalMemo === selectedPlace.recommendedNote;
    const nextProposal: ProposalItem = {
      ...selectedPlace,
      proposer: isAiRecommended ? "AI 추천" : "김준호",
      note: proposalMemo.trim(),
      isAiRecommended,
    };

    setProposals((current) => [nextProposal, ...current]);
    setFocusedProposalId(nextProposal.id);
    setSelectedPlace(null);
    setProposalMemo("");
    setSearchQuery("");
    setSearchResults([]);
    setToast({ type: "success", message: "장소가 제안 목록에 추가되었습니다." });
  }

  function handleFocusProposal(proposalId: number) {
    const targetProposal = proposals.find((proposal) => proposal.id === proposalId);
    if (!targetProposal) return;

    setFocusedProposalId(proposalId);
    setMapCenter({
      lat: targetProposal.latitude,
      lng: targetProposal.longitude,
    });
  }

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <TripRoomHeader activeItem="proposal" tripRoomId={tripRoomId} />

      <main className="grid h-[calc(100vh-76px)] grid-cols-[480px_minmax(0,1fr)] overflow-hidden">
        <section className="flex h-full flex-col bg-stone-50">
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <h1 className="text-[28px] font-bold leading-9 text-gray-900">
              장소 제안하기
            </h1>

            <div className="mt-6 rounded-md border border-gray-200 bg-white p-[21px] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
              <p className="text-xs leading-5 text-gray-500">
                장소를 검색하거나 자유롭게 제안해보세요.
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex gap-3">
                  <input
                    className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-stone-300"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="예) 몽상드애월, 아르떼뮤지엄"
                    type="text"
                    value={searchQuery}
                  />
                  <button
                    className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-900 text-white"
                    onClick={handleSearch}
                    type="button"
                  >
                    <Search size={18} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-700"
                    onClick={handleSearch}
                    type="button"
                  >
                    장소 검색
                  </button>
                  <button
                    className="flex-1 rounded-md border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-700"
                    onClick={handleRecommendByAi}
                    type="button"
                  >
                    AI 추천 받기
                  </button>
                </div>
              </div>

              {searchResults.length > 0 ? (
                <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs font-medium text-stone-500">검색 결과</p>
                  <div className="mt-2 space-y-2">
                    {searchResults.map((place) => (
                      <button
                        className="flex w-full items-center justify-between rounded-md border border-stone-200 bg-white px-3 py-2 text-left"
                        key={place.id}
                        onClick={() => handleSelectPlace(place, false)}
                        type="button"
                      >
                        <div>
                          <p className="text-sm font-semibold text-stone-900">
                            {place.name}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {place.category} · {place.address}
                          </p>
                        </div>
                        <ArrowRight className="text-stone-400" size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedPlace ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
                    <p className="text-sm font-semibold text-stone-900">
                      {selectedPlace.name}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {selectedPlace.category} · {selectedPlace.address}
                    </p>
                  </div>

                  <textarea
                    className="h-24 w-full rounded-md border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-gray-400 focus:border-stone-300"
                    onChange={(event) => setProposalMemo(event.target.value)}
                    placeholder="ex) 애월 해안도로 예쁜 카페 가요!"
                    value={proposalMemo}
                  />

                  <button
                    className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white"
                    onClick={handleSubmitProposal}
                    type="button"
                  >
                    이 장소 제안하기
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold leading-6 text-gray-900">
                  제안된 장소
                </h2>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 px-2 text-xs font-bold text-white">
                  {proposals.length}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {proposals.map((proposal) => {
                  const isFocused = proposal.id === focusedProposalId;

                  return (
                    <article
                      className={`rounded-md border bg-white p-[21px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] ${
                        isFocused ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200"
                      }`}
                      key={proposal.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-bold leading-6 text-gray-900">
                              {proposal.name}
                            </h3>
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                              {proposal.category}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            제안자 :{" "}
                            <span className="font-medium text-gray-700">
                              {proposal.proposer}
                            </span>
                          </p>
                        </div>

                        {proposal.isAiRecommended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                            <Sparkles size={12} />
                            AI 추천
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-5 rounded-md border border-gray-100 bg-gray-50">
                        <div className="w-1 rounded-l-md bg-gray-300" />
                        <div className="border-l-4 border-gray-300 px-5 py-3">
                          <p className="text-sm leading-5 text-slate-800">
                            {proposal.note}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          className="flex-1 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-700"
                          onClick={() => handleFocusProposal(proposal.id)}
                          type="button"
                        >
                          자세히 보기
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="relative h-full overflow-hidden bg-neutral-200">
          {!kakaoAppKey ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-200 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                <MapPin className="text-gray-400" size={28} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-700">지도 영역</p>
                <p className="mt-1 text-sm text-gray-500">
                  `VITE_KAKAO_MAP_APP_KEY`를 설정하면 카카오맵이 표시됩니다.
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
            <Map
              center={mapCenter}
              className="h-full w-full"
              level={9}
            >
              {proposals.map((proposal) => (
                <MapMarker
                  key={proposal.id}
                  onClick={() => handleFocusProposal(proposal.id)}
                  position={{
                    lat: proposal.latitude,
                    lng: proposal.longitude,
                  }}
                  title={proposal.name}
                />
              ))}
              {selectedPlace &&
              !proposals.some((proposal) => proposal.id === selectedPlace.id) ? (
                <MapMarker
                  position={{
                    lat: selectedPlace.latitude,
                    lng: selectedPlace.longitude,
                  }}
                  title={selectedPlace.name}
                />
              ) : null}
            </Map>
          )}

          {focusedProposal ? (
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-stone-900">
                    {focusedProposal.name}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {focusedProposal.address}
                  </p>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                  {focusedProposal.category}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                {focusedProposal.description}
              </p>
            </div>
          ) : null}
        </section>
      </main>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${statusMessageClass(
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
