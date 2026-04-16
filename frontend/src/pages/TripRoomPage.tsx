import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TripRoomHeader from "../components/layout/TripRoomHeader";
import { getTripRoomDetail } from "../services/tripRoomApi";
import { TripRoomDetailResponse } from "../types/tripRoom";

const mockTripRoomDetails: Record<number, TripRoomDetailResponse> = {
  1: {
    tripRoomId: 1,
    title: "동아리 MT",
    startDate: "2026-07-15T00:00:00.000Z",
    endDate: "2026-07-16T00:00:00.000Z",
    status: "draft",
    thumbnailUrl: null,
    hostUser: {
      id: 5,
      name: "김준호",
      email: "junho2@test.com",
    },
    members: [
      { id: 5, name: "김준호", role: "host", hasSubmittedPreference: true },
      { id: 6, name: "복성준", role: "member", hasSubmittedPreference: true },
      { id: 7, name: "김호영", role: "member", hasSubmittedPreference: false },
      { id: 8, name: "최병욱", role: "member", hasSubmittedPreference: false },
    ],
    summary: {
      memberCount: 4,
      submittedPreferenceCount: 2,
      proposalCount: 3,
      branchCount: 2,
      selectedBranchId: null,
    },
    createdAt: "2026-04-10T07:20:58.994Z",
    updatedAt: "2026-04-10T07:20:58.994Z",
  },
  2: {
    tripRoomId: 2,
    title: "캡스톤 회의",
    startDate: "2026-08-02T00:00:00.000Z",
    endDate: "2026-08-03T00:00:00.000Z",
    status: "draft",
    thumbnailUrl: null,
    hostUser: {
      id: 5,
      name: "김준호",
      email: "junho2@test.com",
    },
    members: [
      { id: 5, name: "김준호", role: "host", hasSubmittedPreference: true },
      { id: 6, name: "복성준", role: "member", hasSubmittedPreference: true },
      { id: 7, name: "김호영", role: "member", hasSubmittedPreference: true },
      { id: 8, name: "최병욱", role: "member", hasSubmittedPreference: false },
    ],
    summary: {
      memberCount: 4,
      submittedPreferenceCount: 3,
      proposalCount: 4,
      branchCount: 1,
      selectedBranchId: null,
    },
    createdAt: "2026-04-11T09:00:00.000Z",
    updatedAt: "2026-04-11T09:00:00.000Z",
  },
  3: {
    tripRoomId: 3,
    title: "랩실 MT",
    startDate: "2026-06-12T00:00:00.000Z",
    endDate: "2026-06-14T00:00:00.000Z",
    status: "draft",
    thumbnailUrl: null,
    hostUser: {
      id: 5,
      name: "김준호",
      email: "junho2@test.com",
    },
    members: [
      { id: 5, name: "김준호", role: "host", hasSubmittedPreference: true },
      { id: 6, name: "복성준", role: "member", hasSubmittedPreference: true },
      { id: 7, name: "김호영", role: "member", hasSubmittedPreference: true },
      { id: 8, name: "최병욱", role: "member", hasSubmittedPreference: true },
    ],
    summary: {
      memberCount: 4,
      submittedPreferenceCount: 4,
      proposalCount: 5,
      branchCount: 3,
      selectedBranchId: 2,
    },
    createdAt: "2026-04-12T10:10:00.000Z",
    updatedAt: "2026-04-12T10:10:00.000Z",
  },
  4: {
    tripRoomId: 4,
    title: "중학교 동창 여행",
    startDate: null,
    endDate: null,
    status: "draft",
    thumbnailUrl: null,
    hostUser: {
      id: 5,
      name: "김준호",
      email: "junho2@test.com",
    },
    members: [
      { id: 5, name: "김준호", role: "host", hasSubmittedPreference: true },
      { id: 6, name: "복성준", role: "member", hasSubmittedPreference: false },
      { id: 7, name: "김호영", role: "member", hasSubmittedPreference: false },
      { id: 8, name: "최병욱", role: "member", hasSubmittedPreference: false },
      { id: 9, name: "이수민", role: "member", hasSubmittedPreference: false },
      { id: 10, name: "박도윤", role: "member", hasSubmittedPreference: false },
    ],
    summary: {
      memberCount: 6,
      submittedPreferenceCount: 1,
      proposalCount: 2,
      branchCount: 0,
      selectedBranchId: null,
    },
    createdAt: "2026-04-13T11:20:00.000Z",
    updatedAt: "2026-04-13T11:20:00.000Z",
  },
};

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "여행 날짜 미정";

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (startDate && endDate) {
    return `${formatter.format(new Date(startDate))} - ${formatter.format(
      new Date(endDate)
    )}`;
  }

  return formatter.format(new Date(startDate ?? endDate ?? ""));
}

function statusLabel(status: string) {
  if (status === "draft") return "준비중";
  if (status === "active") return "진행중";
  if (status === "completed") return "종료";
  return status;
}

function statusBadgeClass(status: string) {
  if (status === "active") {
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  }

  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  return "bg-stone-100 text-stone-600 ring-1 ring-stone-200";
}

export default function TripRoomPage() {
  const { tripRoomId = "3" } = useParams();
  const numericTripRoomId = Number(tripRoomId);
  const [tripRoomDetail, setTripRoomDetail] = useState<TripRoomDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!Number.isInteger(numericTripRoomId) || numericTripRoomId <= 0) {
      setError("유효하지 않은 tripRoomId입니다.");
      setTripRoomDetail(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadTripRoomDetail() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getTripRoomDetail(numericTripRoomId);
        if (isMounted) {
          setTripRoomDetail(response);
        }
      } catch (caughtError) {
        const fallback = mockTripRoomDetails[numericTripRoomId];

        if (!isMounted) return;

        if (fallback) {
          setTripRoomDetail(fallback);
        } else if (caughtError instanceof Error && caughtError.message.trim()) {
          setError(caughtError.message);
        } else {
          setError("여행방을 찾을 수 없습니다.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTripRoomDetail();

    return () => {
      isMounted = false;
    };
  }, [numericTripRoomId]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const participationRate = useMemo(() => {
    if (!tripRoomDetail || tripRoomDetail.summary.memberCount === 0) return 0;

    return Math.round(
      (tripRoomDetail.summary.submittedPreferenceCount /
        tripRoomDetail.summary.memberCount) *
        100
    );
  }, [tripRoomDetail]);

  function handlePendingNavigation(label: string) {
    setToast({ type: "error", message: `${label} 페이지는 준비 중입니다.` });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <div className="mx-auto flex min-h-screen max-w-[1200px] items-center justify-center px-8">
          <div className="rounded-3xl border border-stone-200 bg-white px-8 py-6 text-sm text-stone-500 shadow-sm">
            여행방 정보를 불러오는 중입니다.
          </div>
        </div>
      </div>
    );
  }

  if (!tripRoomDetail) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <div className="mx-auto flex min-h-screen max-w-[1200px] items-center justify-center px-8">
          <div className="rounded-3xl border border-red-100 bg-white px-8 py-6 text-sm text-red-600 shadow-sm">
            {error || "여행방을 불러오지 못했습니다."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <TripRoomHeader
        activeItem="main"
        onPendingClick={handlePendingNavigation}
        tripRoomId={tripRoomId}
      />

      <main className="mx-auto max-w-[1200px] px-8 pb-16 pt-10">
        <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <div className="relative h-52 overflow-hidden bg-stone-200">
            <img
              alt={tripRoomDetail.title}
              className="h-full w-full object-cover"
              src={tripRoomDetail.thumbnailUrl ?? "https://placehold.co/1200x260"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-8">
              <div className="space-y-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass(
                    tripRoomDetail.status
                  )}`}
                >
                  {statusLabel(tripRoomDetail.status)}
                </span>
                <div>
                  <h1 className="text-[32px] font-semibold leading-[42px] text-white">
                    {tripRoomDetail.title}
                  </h1>
                  <p className="mt-2 text-base text-white/85">
                    {formatDateRange(
                      tripRoomDetail.startDate,
                      tripRoomDetail.endDate
                    )}
                  </p>
                </div>
              </div>

              <div className="hidden rounded-2xl bg-white/90 px-5 py-4 text-sm text-stone-700 backdrop-blur md:block">
                <p className="font-semibold text-stone-900">
                  호스트 {tripRoomDetail.hostUser.name}
                </p>
                <p className="mt-1">{tripRoomDetail.hostUser.email}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "참여 멤버",
                    value: `${tripRoomDetail.summary.memberCount}명`,
                    hint: "현재 여행방 인원",
                  },
                  {
                    label: "선호 입력 완료",
                    value: `${tripRoomDetail.summary.submittedPreferenceCount}명`,
                    hint: `${participationRate}% 완료`,
                  },
                  {
                    label: "장소 제안",
                    value: `${tripRoomDetail.summary.proposalCount}개`,
                    hint: "모인 후보 수",
                  },
                  {
                    label: "브랜치",
                    value: `${tripRoomDetail.summary.branchCount}개`,
                    hint:
                      tripRoomDetail.summary.selectedBranchId === null
                        ? "선택된 일정 없음"
                        : `선택 브랜치 #${tripRoomDetail.summary.selectedBranchId}`,
                  },
                ].map((item) => (
                  <article
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-5"
                    key={item.label}
                  >
                    <p className="text-sm font-medium text-stone-500">{item.label}</p>
                    <p className="mt-3 text-[28px] font-semibold leading-8 text-stone-900">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm text-stone-500">{item.hint}</p>
                  </article>
                ))}
              </div>

              <article className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-900">
                      여행방 현황
                    </h2>
                    <p className="mt-2 text-sm text-stone-500">
                      여행 준비가 얼마나 진행됐는지 한눈에 볼 수 있어요.
                    </p>
                  </div>
                  <Link
                    className="rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
                    to={`/trip-rooms/${tripRoomId}/schedule`}
                  >
                    여행일정 보기
                  </Link>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-stone-700">
                        선호 입력 진행률
                      </span>
                      <span className="text-stone-500">{participationRate}%</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-stone-900 transition-all"
                        style={{ width: `${participationRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                        Created
                      </p>
                      <p className="mt-2 text-sm text-stone-700">
                        {new Intl.DateTimeFormat("ko-KR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(tripRoomDetail.createdAt))}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                        Updated
                      </p>
                      <p className="mt-2 text-sm text-stone-700">
                        {new Intl.DateTimeFormat("ko-KR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(tripRoomDetail.updatedAt))}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                        Selected
                      </p>
                      <p className="mt-2 text-sm text-stone-700">
                        {tripRoomDetail.summary.selectedBranchId === null
                          ? "아직 없음"
                          : `브랜치 #${tripRoomDetail.summary.selectedBranchId}`}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <aside className="space-y-6">
              <article className="rounded-3xl border border-stone-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-stone-900">멤버 현황</h2>
                <p className="mt-2 text-sm text-stone-500">
                  참여자와 선호 입력 완료 여부를 확인할 수 있어요.
                </p>

                <div className="mt-6 space-y-3">
                  {tripRoomDetail.members.map((member) => (
                    <div
                      className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4"
                      key={member.id}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-stone-900">{member.name}</p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-200">
                            {member.role === "host" ? "HOST" : "MEMBER"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-stone-500">
                          {member.hasSubmittedPreference
                            ? "선호 입력 완료"
                            : "선호 입력 대기 중"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          member.hasSubmittedPreference
                            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                            : "bg-stone-100 text-stone-600 ring-1 ring-stone-200"
                        }`}
                      >
                        {member.hasSubmittedPreference ? "완료" : "대기"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-stone-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-stone-900">빠른 액션</h2>
                <div className="mt-5 space-y-3">
                  <Link
                    className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm font-medium text-stone-700"
                    to={`/trip-rooms/${tripRoomId}/schedule`}
                  >
                    <span>여행일정 페이지로 이동</span>
                    <span>›</span>
                  </Link>
                </div>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {error}
                  </div>
                ) : null}
              </article>
            </aside>
          </div>
        </section>
      </main>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === "success"
                ? "bg-stone-900 text-white"
                : "border border-red-100 bg-red-50 text-red-600"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
