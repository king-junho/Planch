import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TripRoomHeader from "../components/layout/TripRoomHeader";

const timelineItems = [
  {
    time: "10:00 AM",
    title: "서울역 출발",
    description: "KTX 탑승 (약 2시간 30분 소요)",
    tags: ["50,000원"],
    active: true,
  },
  {
    time: "12:30 PM",
    title: "부산역 도착 및 점심식사",
    description: "역 근처 돼지국밥 맛집 방문",
    tags: ["본전돼지국밥", "10,000원"],
  },
];

const preferredItems = ["아르떼뮤지엄"];
const avoidedItems = ["웨이팅 긴 곳"];
const travelStyles = ["맛집", "사진스팟"];

function toastClass(type: "success" | "error") {
  return type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-600";
}

export default function TripBranchCreatePage() {
  const { tripRoomId = "3" } = useParams();
  const navigate = useNavigate();
  const [branchTitle, setBranchTitle] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function handleCreateBranch() {
    if (!branchTitle.trim()) {
      setToast({ type: "error", message: "브랜치 제목을 입력해 주세요." });
      return;
    }

    setToast({ type: "success", message: "브랜치가 생성되었습니다." });
    window.setTimeout(() => {
      navigate(`/trip-rooms/${tripRoomId}/branch`);
    }, 500);
  }

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <TripRoomHeader activeItem="branch" tripRoomId={tripRoomId} />

      <main className="mx-auto grid max-w-[1200px] grid-cols-[742px_1fr] gap-5 px-8 pb-16 pt-10">
        <section className="relative rounded-md border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <div className="px-[18px] pt-12">
            <h1 className="text-center text-2xl font-bold leading-9 text-gray-900">
              브랜치 생성
            </h1>

            <div className="mt-8 w-64">
              <label className="block text-base font-bold leading-6 text-gray-900">
                브랜치 제목
              </label>
              <input
                className="mt-4 h-14 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-300"
                onChange={(event) => setBranchTitle(event.target.value)}
                placeholder="예: 휴양 일정"
                type="text"
                value={branchTitle}
              />
            </div>

            <div className="mt-12 grid grid-cols-[396px_1fr] gap-0">
              <div>
                <h2 className="text-base font-bold leading-6 text-gray-900">
                  타임라인
                </h2>

                <div className="mt-4 flex h-10 items-center justify-between border-b border-gray-100 bg-white px-4">
                  <button className="h-8 w-8 rounded-lg text-gray-500" type="button">
                    {"<"}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold leading-6 text-slate-800">
                      1일차
                    </span>
                    <span className="text-sm font-medium text-gray-400">
                      10.24 (목)
                    </span>
                  </div>
                  <button className="h-8 w-8 rounded-lg text-gray-500" type="button">
                    {">"}
                  </button>
                </div>

                <div className="px-6 pb-6 pl-9 pt-6">
                  <div className="border-l-2 border-gray-100 pl-0.5">
                    <div className="space-y-8">
                      {timelineItems.map((item) => (
                        <div className="relative pl-6" key={`${item.time}-${item.title}`}>
                          <div
                            className={`absolute -left-[11px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm ${
                              item.active ? "outline outline-2 outline-blue-500" : "border-2 border-gray-300"
                            }`}
                          >
                            {item.active ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            ) : null}
                          </div>

                          <p
                            className={`text-xs font-bold leading-4 ${
                              item.active ? "text-blue-500" : "text-gray-500"
                            }`}
                          >
                            {item.time}
                          </p>

                          <div className="mt-2 rounded-md border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                            <p className="text-sm font-bold leading-5 text-gray-900">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs leading-4 text-gray-500">
                              {item.description}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {item.tags.map((tag) => (
                                <span
                                  className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] text-gray-500"
                                  key={tag}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-neutral-200">
                <div className="absolute inset-0 opacity-10 [background:radial-gradient(ellipse_70.71%_70.71%_at_50%_50%,black_0%,rgba(0,0,0,0)_0%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                      <span className="text-2xl text-gray-400">+</span>
                    </div>
                    <p className="mt-4 text-lg font-bold text-gray-700">지도 영역</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-[18px] flex items-center gap-3">
              <button
                className="rounded-lg bg-gray-900 px-36 py-3 text-sm font-bold leading-5 text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                onClick={handleCreateBranch}
                type="button"
              >
                브랜치 생성
              </button>
              <button
                className="rounded-lg border border-gray-300 bg-white px-28 py-3 text-sm font-bold leading-5 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                onClick={() => navigate(`/trip-rooms/${tripRoomId}/preference`)}
                type="button"
              >
                선호 입력으로 돌아가기
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-md border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <div className="px-10 pt-10">
            <h2 className="text-center text-2xl font-bold leading-9 text-gray-900">
              선호 입력 사항
            </h2>

            <div className="mt-10 flex items-center justify-between">
              <span className="text-base font-bold leading-6 text-gray-900">
                예산 범위 (1인 기준)
              </span>
              <span className="text-base font-bold leading-6 text-blue-600">
                30만원 이하
              </span>
            </div>

            <div className="mt-24 grid grid-cols-2 gap-10">
              <div>
                <h3 className="text-base font-bold leading-6 text-gray-900">
                  꼭 가고 싶은 장소/요소
                </h3>
                <div className="mt-4 space-y-3">
                  {preferredItems.map((item) => (
                    <span
                      className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold leading-6 text-gray-900">
                  피하고 싶은 장소/요소
                </h3>
                <div className="mt-4 space-y-3">
                  {avoidedItems.map((item) => (
                    <span
                      className="inline-flex items-center rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-16">
              <h3 className="text-base font-bold leading-6 text-gray-900">
                주요 활동 시간대
              </h3>
              <div className="mt-4 flex gap-6">
                {["오전", "오후", "저녁"].map((label) => {
                  const checked = label === "오후";
                  return (
                    <label className="flex items-center gap-2" key={label}>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                          checked
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="text-base font-medium leading-6 text-gray-700">
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-base font-bold leading-6 text-gray-900">
                추가 사항
              </h3>
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm leading-5 text-gray-900">
                뚜벅이 여행이라 이동 동선이 짧았으면 좋겠어요. 숙소는 꼭 바다가
                보이는 곳으로!
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-base font-bold leading-6 text-gray-900">
                여행 스타일
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {travelStyles.map((style) => (
                  <span
                    className="rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white"
                    key={style}
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
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
