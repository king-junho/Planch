import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { branchApi } from "../api/branchApi";
import TripRoomHeader from "../components/layout/TripRoomHeader";
import { 
  getTripRoomDetail,
  updateTripRoom,
  updateTripRoomImage,
  updateTripRoomDeadline,
} from "../services/tripRoomApi";
import { getAccessToken, getAuthUser } from "../services/authStorage";
import { TripRoomDetailResponse } from "../types/tripRoom";
import { resolveImageUrl } from "../utils/image";
import {getDeadlineStatus} from "../utils/deadline";
import {ImagePlus} from "lucide-react";

type BranchListItem = {
  branchId: number;
  name: string;
};

function toDateTimeLocalValue(dateString?: string | null) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function toDateInputText(date: string | null) {
  return date ? date.slice(0, 10) : "";
}

function statusLabel(status: string) {
  if (status === "locked") return "확정";
  return "진행중";
}

export default function TripRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripRoomId = "3" } = useParams();
  const numericTripRoomId = Number(tripRoomId);
  const [tripRoomDetail, setTripRoomDetail] = useState<TripRoomDetailResponse | null>(
    null
  );
  const [tripInfo, setTripInfo] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    decisionDeadline: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tripInfoMessage, setTripInfoMessage] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [branchNameById, setBranchNameById] = useState<Record<number, string>>({});
  const [deadlineNow, setDeadlineNow] = useState(Date.now());
  const authUser = getAuthUser();
  const effectiveDecisionDeadline = tripInfo.decisionDeadline ? new Date(tripInfo.decisionDeadline).toISOString() : tripRoomDetail?.decisionDeadline ?? null;
  const deadlineStatus = getDeadlineStatus(effectiveDecisionDeadline, deadlineNow);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDeadlineNow(Date.now());
    },1000);

    return () => window.clearInterval(timer);
  },[]);

  useEffect(() => {
    if (!Number.isInteger(numericTripRoomId) || numericTripRoomId <= 0) {
      setError("유효하지 않은 tripRoomId입니다.");
      setTripRoomDetail(null);
      setIsLoading(false);
      return;
    }

    if (!getAccessToken()) {
      navigate("/login", {
        replace: true,
        state: {
          loginMessage: "로그인 후 여행방을 확인할 수 있습니다.",
          redirectTo: `${location.pathname}${location.search}`,
        },
      });
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
          setTripInfo({
            destination: response.title,
            startDate: toDateInputText(response.startDate),
            endDate: toDateInputText(response.endDate),
            decisionDeadline: toDateTimeLocalValue(response.decisionDeadline),
          });
        }
      } catch (caughtError) {
        if (!isMounted) return;

        if (caughtError instanceof Error && caughtError.message.trim()) {
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
  }, [location.pathname, location.search, navigate, numericTripRoomId]);

  useEffect(() => {
    if (!Number.isInteger(numericTripRoomId) || numericTripRoomId <= 0) {
      setBranchNameById({});
      return;
    }

    let isMounted = true;

    async function loadBranchNames() {
      try {
        const response = await branchApi.getBranches(numericTripRoomId);
        if (!isMounted) return;

        const branches = response.data as BranchListItem[];
        setBranchNameById(
          branches.reduce<Record<number, string>>((nameMap, branch) => {
            nameMap[branch.branchId] = branch.name;
            return nameMap;
          }, {})
        );
      } catch {
        if (isMounted) {
          setBranchNameById({});
        }
      }
    }

    loadBranchNames();

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

  const isHost = useMemo(() => {
    if(!tripRoomDetail || !authUser) return false;
    return tripRoomDetail.hostUser.id === authUser.id;
  },[tripRoomDetail,authUser]);

  const selectedBranchName = tripRoomDetail?.summary.selectedBranchId
    ? branchNameById[tripRoomDetail.summary.selectedBranchId] ?? null
    : null;
  const selectedBranchLabel = tripRoomDetail?.summary.selectedBranchId
    ? selectedBranchName ?? "이름 확인 중"
    : null;

  function handleTripInfoChange(
    field: "destination" | "startDate" | "endDate" | "decisionDeadline",
    value: string
  ) {
    setTripInfo((current) => ({ ...current, [field]: value }));
    setTripInfoMessage("");
  }

  function handleTripInfoSave() {
    setTripInfoMessage("여행 정보가 저장되었습니다.");
    setToast({ type: "success", message: "여행 정보가 저장되었습니다." });
  }

  async function handleTripInfoSaveRequest() {
    setTripInfoMessage("");

    try {
      await updateTripRoom(numericTripRoomId, {
        title: tripInfo.destination,
        startDate: tripInfo.startDate || null,
        endDate: tripInfo.endDate || null,
      });
    
    let savedDecisionDeadline: string | null = tripRoomDetail?.decisionDeadline ?? null;
    let savedUpdatedAt: string | null = tripRoomDetail?.updatedAt ?? null;

    if(isHost){
      const deadlineResult = await updateTripRoomDeadline(
        numericTripRoomId,
        tripInfo.decisionDeadline ? new Date(tripInfo.decisionDeadline).toISOString() : null
      );

      savedDecisionDeadline = deadlineResult.decisionDeadline;
      savedUpdatedAt = deadlineResult.updatedAt;
    }

      setTripRoomDetail((current) =>
        current ? {
          ...current,
          title: tripInfo.destination,
          startDate: tripInfo.startDate || null,
          endDate: tripInfo.endDate || null,
          decisionDeadline: savedDecisionDeadline,
          updatedAt: savedUpdatedAt ?? current.updatedAt,
        }
        :current
      );

      handleTripInfoSave();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "여행 정보 저장에 실패했습니다.";

      setTripInfoMessage(message);
      setToast({ type: "error", message });
    }
  }

  async function handleTripRoomImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ){
    const file = event.target.files?.[0];
    if(!file || !tripRoomDetail) return;

    try{
      setIsImageUploading(true);
      setImageUploadError("");

      const result = await updateTripRoomImage(tripRoomDetail.tripRoomId,file);

      setTripRoomDetail((current)=>
      current ? {
        ...current,
        thumbnailUrl: result.thumbnailUrl,
        updatedAt : result.updatedAt,
      } : current
    );
    setToast({type:"success", message:"여행방 이미지가 업데이트되었습니다."});
    }catch(caughtError){
      const message = caughtError instanceof Error && caughtError.message.trim()?caughtError.message:"여행방 이미지 업데이트에 실패했습니다.";

      setImageUploadError(message);
      setToast({type:"error", message});
    }finally{
      setIsImageUploading(false);
      event.target.value = "";
    }
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
    const isPermissionError =
      Boolean(authUser) &&
      (error.includes("권한") || error.includes("참여자만"));

    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <div className="mx-auto flex min-h-screen max-w-[1200px] items-center justify-center px-8">
          <div className="w-full max-w-[420px] rounded-3xl border border-red-100 bg-white px-8 py-7 text-center shadow-sm">
            <p className="text-base font-semibold text-red-600">
              {isPermissionError
                ? "이 여행방에 접근할 권한이 없습니다."
                : error || "여행방을 불러오지 못했습니다."}
            </p>
            <button
              className="mt-5 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              onClick={() => navigate("/trip-rooms", { replace: true })}
              type="button"
            >
              여행방 목록으로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <TripRoomHeader
        activeItem="main"
        tripRoomId={tripRoomId}
      />

      <main className="mx-auto max-w-[1200px] px-8 pb-16 pt-10">
        <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <div className="relative overflow-hidden rounded-[32px] border border-stone-200 bg-stone-100">
            <input
              accept="image/*"
              className="hidden"
              onChange={handleTripRoomImageChange}
              ref={fileInputRef}
              type="file"
            />

            <div className="relative h-[320px] w-full group">
              <img
                alt={tripRoomDetail.title}
                className="h-full w-full object-cover"
                src={resolveImageUrl(
                  tripRoomDetail.thumbnailUrl,
                  "https://placehold.co/1200x320"
                )}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

              {isHost ? (
                <div className="absolute right-4 top-4 z-20">
                  <button
                    className="
                      inline-flex items-center rounded-xl border border-white/60
                      bg-white/90 px-4 py-2 text-sm font-medium text-stone-800
                      shadow-sm backdrop-blur transition
                      opacity-100 md:opacity-0
                      md:group-hover:opacity-100
                      md:pointer-events-none
                      md:group-hover:pointer-events-auto
                      translate-y-1
                      group-hover:translate-y-0
                      duration-200
                      hover:bg-white
                      disabled:cursor-not-allowed disabled:opacity-70
                    "
                    disabled={isImageUploading}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {isImageUploading ? "업로드 중..." : "이미지 변경하기"}
                  </button>
                </div>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-6 px-8 pb-8">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-stone-700 backdrop-blur">
                    {tripRoomDetail.status === "locked" ? "확정됨" : "진행중"}
                  </span>

                  <h1 className="mt-4 truncate text-5xl font-bold tracking-tight text-white">
                    {tripRoomDetail.title}
                  </h1>

                  <p className="mt-3 text-lg text-white/85">
                    {toDateInputText(tripRoomDetail.startDate)} ~ {toDateInputText(tripRoomDetail.endDate)}
                  </p>
                </div>

                <div className="hidden rounded-2xl bg-white/90 px-5 py-4 text-sm text-stone-700 backdrop-blur md:block">
                  <p className="font-semibold text-stone-900">
                    호스트 {tripRoomDetail.hostUser.name}
                  </p>
                  <p className="mt-1">{tripRoomDetail.hostUser.email}</p>
                </div>
              </div>
            </div>
          </div>
          {imageUploadError ? (
            <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {imageUploadError}
            </p>
          ) : null}

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
                        : `선택 브랜치 ${selectedBranchLabel}`,
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
                    <h2 className="text-xl font-semibold text-stone-900">여행 정보</h2>
                    <p className="mt-2 text-sm text-stone-500">
                      여행지와 여행 일정을 메인페이지에서 바로 정리할 수 있어요.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-3">
                  {[
                    {
                      field: "destination" as const,
                      label: "여행지",
                      placeholder: "예: 부산 해운대",
                      type: "text",
                      disabled: false,
                    },
                    {
                      field: "startDate" as const,
                      label: "여행 시작일",
                      placeholder: "",
                      type: "date",
                      disabled: false,
                    },
                    {
                      field: "endDate" as const,
                      label: "여행 종료일",
                      placeholder: "",
                      type: "date",
                      disabled: false,
                    },
                  ].map((item) => (
                    <label
                      className="block"
                      key={item.label}
                    >
                      <span className="mb-2 block text-[15px] font-semibold leading-[22.5px] text-stone-900">
                        {item.label}
                      </span>
                      <input
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none 
                        placeholder:text-stone-400 focus:border-stone-300"
                        disabled={item.disabled}
                        onChange={(event) =>
                          handleTripInfoChange(item.field, event.target.value)
                        }
                        placeholder={item.placeholder}
                        type={item.type}
                        value={tripInfo[item.field]}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-5 grid items-end gap-5 lg:grid-cols-2">
                  <label className="block min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="block text-[15px] font-semibold leading-[22.5px] text-stone-900">
                        결정 마감기한
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          deadlineStatus.passed
                            ? "bg-red-50 text-red-600"
                            : deadlineStatus.hasDeadline
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {deadlineStatus.badgeText}
                      </span>
                    </div>

                    <input
                      className="w-full min-w-0 rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-300 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                      disabled={!isHost}
                      onChange={(event) =>
                        handleTripInfoChange("decisionDeadline", event.target.value)
                      }
                      type="datetime-local"
                      value={tripInfo.decisionDeadline}
                    />
                  </label>

                  <div className="block min-w-0">
                    <span className="mb-2 block text-[15px] font-semibold leading-[22.5px] text-stone-900">
                        마감까지 남은 시간
                    </span>
                    <div
                      className={`flex w-full min-w-0 items-center rounded-xl border px-4 py-[14px] text-[15px] leading-[22.5px] ${deadlineStatus.passed ? "border-red-200 bg-red-50 text-red-600": "border-stone-200 bg-stone-50 text-stone-900"}`}
                    >
                      {deadlineStatus.countdownText}
                      </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-medium text-emerald-700">
                    {tripInfoMessage || ""}
                  </div>
                  <button
                    className="rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
                    onClick={handleTripInfoSaveRequest}
                    type="button"
                  >
                    여행 정보 저장하기
                  </button>
                </div>
              </article>

              <article className="rounded-3xl border border-stone-200 bg-white p-6">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">
                    여행방 현황
                  </h2>
                  <p className="mt-2 text-sm text-stone-500">
                    여행 준비가 얼마나 진행됐는지 한눈에 볼 수 있어요.
                  </p>
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
                          : selectedBranchLabel}
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
