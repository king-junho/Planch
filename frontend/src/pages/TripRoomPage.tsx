import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { branchApi } from "../api/branchApi";
import GlobalConfirmModal from "../components/common/GlobalConfirmModal";
import TripDeadlinePicker from "../components/common/TripDeadlinePicker";
import TripDateRangePicker from "../components/common/TripDateRangePicker";
import TripRoomHeader from "../components/layout/TripRoomHeader";
import { 
  getTripRoomDetail,
  deleteTripRoom,
  leaveTripRoom,
  updateTripRoom,
  updateTripRoomImage,
  updateTripRoomDeadline,
} from "../services/tripRoomApi";
import { getAccessToken, getAuthUser } from "../services/authStorage";
import { TripRoomDetailResponse } from "../types/tripRoom";
import { useConfirmStore } from "../features/store/useConfirmStore";
import { resolveImageUrl } from "../utils/image";
import {getDeadlineStatus} from "../utils/deadline";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  ImagePlus,
  LogOut,
  MapPin,
  Route as RouteIcon,
  Trash2,
  Wallet,
} from "lucide-react";

type BranchListItem = {
  branchId: number;
  name: string;
};

type MainPanelView = "overview" | "confirmedSummary";

type ConfirmedBranchPlace = {
  dayNo: number;
  orderIndex: number;
  startTime: string | null;
  estimatedCost: number | null;
  estimatedDuration: number | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  memo: string | null;
  place: {
    id: number;
    name: string;
    address: string;
    category: string;
  };
};

type ConfirmedBranchDetail = {
  branchId: number;
  name: string;
  status: string;
  createdBy: string;
  aiReason: string | null;
  metrics: {
    totalCost: number | null;
    totalTravelTime: number | null;
    preferenceScore: number | null;
  };
  voteSummary: {
    agreeCount: number;
    holdCount: number;
    disagreeCount: number;
  };
  places: ConfirmedBranchPlace[];
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

function readCurrentUserId() {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const payloadPart = accessToken.split(".")[1] ?? "";
    const normalizedPayload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalizedPayload));
    const id = payload.sub ?? payload.userId ?? payload.id;
    const numericId = Number(id);
    return Number.isFinite(numericId) ? numericId : null;
  } catch {
    return null;
  }
}

function formatWon(value?: number | null) {
  if (!value) return "0원";
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatMinutes(value?: number | null) {
  if (!value) return "0분";

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (hours <= 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

function formatDistance(value?: number | null) {
  if (!value) return null;
  if (value < 1000) return `${value}m`;
  return `${(value / 1000).toFixed(1)}km`;
}

function TripRoomMainSidebar({
  activeView,
  canOpenSummary,
  onChange,
}: {
  activeView: MainPanelView;
  canOpenSummary: boolean;
  onChange: (view: MainPanelView) => void;
}) {
  return (
    <aside className="w-[280px] shrink-0 border-r border-stone-200 bg-white px-4 py-8 shadow-sm">
      <div className="px-4">
        <h2 className="text-xl font-bold text-stone-900">여행방</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Room Pages
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-1">
        <button
          className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
            activeView === "overview"
              ? "bg-stone-900 text-white shadow-sm"
              : "text-stone-600 hover:bg-stone-50"
          }`}
          onClick={() => onChange("overview")}
          type="button"
        >
          <FileText size={18} />
          메인 페이지
        </button>

        <button
          className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-bold transition-all ${
            activeView === "confirmedSummary"
              ? "bg-blue-50 text-blue-700"
              : canOpenSummary
              ? "text-stone-600 hover:bg-stone-50"
              : "cursor-not-allowed bg-stone-50 text-stone-300"
          }`}
          disabled={!canOpenSummary}
          onClick={() => onChange("confirmedSummary")}
          title={
            canOpenSummary
              ? "확정 브랜치 요약 보기"
              : "여행 일정이 확정되면 열 수 있습니다."
          }
          type="button"
        >
          <CheckCircle2 size={18} />
          확정 브랜치 요약
        </button>
      </div>

      {!canOpenSummary ? (
        <p className="mt-5 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-400">
          최종 브랜치가 확정되면 요약 페이지가 활성화됩니다.
        </p>
      ) : null}
    </aside>
  );
}

function ConfirmedBranchSummaryView({
  branch,
  isLoading,
  error,
  tripRoomTitle,
  startDate,
  endDate,
}: {
  branch: ConfirmedBranchDetail | null;
  isLoading: boolean;
  error: string;
  tripRoomTitle: string;
  startDate: string | null;
  endDate: string | null;
}) {
  const [selectedSummaryDay, setSelectedSummaryDay] = useState<number | null>(null);
  const [isSummaryDayMenuOpen, setIsSummaryDayMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-stone-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-stone-500">
          확정된 브랜치 요약을 불러오는 중입니다.
        </p>
      </section>
    );
  }

  if (error || !branch) {
    return (
      <section className="rounded-[28px] border border-red-100 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-600">
          {error || "확정된 브랜치 정보를 불러오지 못했습니다."}
        </p>
      </section>
    );
  }

  const placesByDay = branch.places.reduce<Record<number, ConfirmedBranchPlace[]>>(
    (result, place) => {
      if (!result[place.dayNo]) result[place.dayNo] = [];
      result[place.dayNo].push(place);
      return result;
    },
    {}
  );
  const dayEntries = Object.entries(placesByDay).sort(
    ([dayA], [dayB]) => Number(dayA) - Number(dayB)
  );
  const dayNumbers = dayEntries.map(([day]) => Number(day));
  const activeDay =
    selectedSummaryDay && dayNumbers.includes(selectedSummaryDay)
      ? selectedSummaryDay
      : dayNumbers[0] ?? 1;
  const activeDayPlaces = placesByDay[activeDay] ?? [];
  const totalVotes =
    branch.voteSummary.agreeCount +
    branch.voteSummary.holdCount +
    branch.voteSummary.disagreeCount;

  return (
    <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
      <div className="border-b border-blue-100 bg-blue-50 px-8 py-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
              <CheckCircle2 size={14} />
              최종 확정 브랜치
            </span>
            <h1 className="mt-4 text-3xl font-bold text-stone-950">
              {branch.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {branch.aiReason || `${tripRoomTitle} 여행을 위해 확정된 최종 일정입니다.`}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-5 py-4 text-sm text-stone-600 ring-1 ring-blue-100">
            <p className="font-semibold text-stone-900">{tripRoomTitle}</p>
            <p className="mt-1">
              {toDateInputText(startDate)} ~ {toDateInputText(endDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-8 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "방문 장소",
            value: `${branch.places.length}곳`,
            icon: MapPin,
          },
          {
            label: "예상 비용",
            value: formatWon(branch.metrics.totalCost),
            icon: Wallet,
          },
          {
            label: "예상 이동시간",
            value: formatMinutes(branch.metrics.totalTravelTime),
            icon: Clock,
          },
          {
            label: "선호 일치율",
            value: `${branch.metrics.preferenceScore ?? 0}%`,
            icon: CheckCircle2,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article
              className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
              key={item.label}
            >
              <div className="flex items-center gap-2 text-stone-500">
                <Icon size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
              <p className="mt-3 text-xl font-bold text-stone-950">{item.value}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 px-8 pb-8 lg:grid-cols-[0.75fr_1.25fr]">
        <article className="rounded-3xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">확정 근거</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                작성자
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-800">
                {branch.createdBy === "ai" ? "Planch AI" : branch.createdBy}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                투표 결과
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-800">
                찬성 {branch.voteSummary.agreeCount}명 · 보류{" "}
                {branch.voteSummary.holdCount}명 · 반대{" "}
                {branch.voteSummary.disagreeCount}명
              </p>
              <p className="mt-1 text-xs text-stone-500">
                총 {totalVotes}명이 의견을 남겼습니다.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-stone-900">일차별 코스</h2>
            </div>
            <div className="relative">
              <button
                className="inline-flex min-w-[112px] items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 shadow-sm transition hover:bg-stone-50"
                onClick={() => setIsSummaryDayMenuOpen((current) => !current)}
                type="button"
              >
                {activeDay}일차
                <ChevronDown
                  size={16}
                  className={`text-stone-400 transition-transform ${
                    isSummaryDayMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSummaryDayMenuOpen ? (
                <div className="absolute right-0 top-12 z-20 w-[140px] overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                  {dayNumbers.map((day) => (
                <button
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                    activeDay === day
                      ? "bg-blue-50 text-blue-700"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                  key={day}
                  onClick={() => {
                    setSelectedSummaryDay(day);
                    setIsSummaryDayMenuOpen(false);
                  }}
                  type="button"
                >
                  {day}일차
                  {activeDay === day ? <CheckCircle2 size={14} /> : null}
                </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {activeDayPlaces.map((place, index) => {
              const distance = formatDistance(place.distanceMeters);
              const duration = place.estimatedDuration
                ? formatMinutes(place.estimatedDuration)
                : place.durationSeconds
                ? formatMinutes(Math.round(place.durationSeconds / 60))
                : null;

              return (
                <div className="relative flex gap-4" key={`${activeDay}-${place.orderIndex}-${place.place.id}`}>
                  <div className="flex flex-col items-center">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    {index !== activeDayPlaces.length - 1 ? (
                      <div className="mt-1 h-full w-0.5 bg-blue-100" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {place.startTime ? (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                          {place.startTime}
                        </span>
                      ) : null}
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-500">
                        {place.place.category}
                      </span>
                      {duration || distance ? (
                        <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-500">
                          <RouteIcon size={11} />
                          {[duration, distance].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-bold text-stone-950">
                      {place.place.name}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      {place.place.address}
                    </p>
                    {place.memo ? (
                      <p className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-600">
                        {place.memo}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
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
  const [isDeletingTripRoom, setIsDeletingTripRoom] = useState(false);
  const [isLeavingTripRoom, setIsLeavingTripRoom] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [branchNameById, setBranchNameById] = useState<Record<number, string>>({});
  const [mainPanelView, setMainPanelView] = useState<MainPanelView>("overview");
  const [confirmedBranch, setConfirmedBranch] = useState<ConfirmedBranchDetail | null>(null);
  const [isConfirmedBranchLoading, setIsConfirmedBranchLoading] = useState(false);
  const [confirmedBranchError, setConfirmedBranchError] = useState("");
  const [deadlineNow, setDeadlineNow] = useState(Date.now());
  const authUser = getAuthUser();
  const currentUserId = readCurrentUserId() ?? authUser?.id ?? null;
  const { confirm } = useConfirmStore();
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

        const message = caughtError instanceof Error && caughtError.message.trim() ? caughtError.message : "여행방을 찾을 수 없습니다.";
        
        if (message.includes("인증이 필요합니다")){
          navigate("/login", {
            replace: true,
            state:{
              loginMessage: "로그인 후 여행방을 확인할 수 있습니다.",
              redirectTo: `${location.pathname}${location.search}`,
            },
          });
          return;
        }
        if(
          message.includes("해당 여행방 참여자만 조회할 수 있습니다.") ||
          message.includes("여행방을 찾을 수 없습니다")
        ){
          navigate("/trip-rooms", {replace:true});
          return;
        }
        setError(message);
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
    if(!tripRoomDetail || !currentUserId) return false;
    return tripRoomDetail.hostUser.id === currentUserId;
  },[tripRoomDetail,currentUserId]);
  const isTripRoomLocked = tripRoomDetail?.status === "locked";
  const isTripInfoDisabled = !isHost || isTripRoomLocked;
  const canOpenConfirmedSummary = Boolean(
    isTripRoomLocked && tripRoomDetail?.summary.selectedBranchId
  );

  const selectedBranchName = tripRoomDetail?.summary.selectedBranchId
    ? branchNameById[tripRoomDetail.summary.selectedBranchId] ?? null
    : null;
  const selectedBranchLabel = tripRoomDetail?.summary.selectedBranchId
    ? selectedBranchName ?? "이름 확인 중"
    : null;

  useEffect(() => {
    if (!canOpenConfirmedSummary && mainPanelView === "confirmedSummary") {
      setMainPanelView("overview");
    }
  }, [canOpenConfirmedSummary, mainPanelView]);

  useEffect(() => {
    const selectedBranchId = tripRoomDetail?.summary.selectedBranchId;

    if (!canOpenConfirmedSummary || !selectedBranchId) {
      setConfirmedBranch(null);
      setConfirmedBranchError("");
      setIsConfirmedBranchLoading(false);
      return;
    }

    let isMounted = true;

    async function loadConfirmedBranch() {
      setIsConfirmedBranchLoading(true);
      setConfirmedBranchError("");

      try {
        const response = await branchApi.getBranchDetail(selectedBranchId);
        if (!isMounted) return;

        setConfirmedBranch(response.data as ConfirmedBranchDetail);
      } catch (caughtError) {
        if (!isMounted) return;

        const message =
          caughtError instanceof Error && caughtError.message.trim()
            ? caughtError.message
            : "확정된 브랜치 정보를 불러오지 못했습니다.";

        setConfirmedBranch(null);
        setConfirmedBranchError(message);
      } finally {
        if (isMounted) {
          setIsConfirmedBranchLoading(false);
        }
      }
    }

    loadConfirmedBranch();

    return () => {
      isMounted = false;
    };
  }, [canOpenConfirmedSummary, tripRoomDetail?.summary.selectedBranchId]);

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

  async function handleTripRoomDeleteRequest() {
    const confirmed = await confirm("여행방을 삭제하시겠습니까?");

    if (!confirmed) return;

    try {
      setIsDeletingTripRoom(true);
      await deleteTripRoom(numericTripRoomId);
      navigate("/trip-rooms", { replace: true });
    } catch (caughtError) {
      setIsDeletingTripRoom(false);
      const message =
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "여행방 삭제에 실패했습니다.";

      setToast({ type: "error", message });
    }
  }

  async function handleTripRoomLeaveRequest() {
    const confirmed = await confirm("여행방에서 나가시겠습니까?");

    if (!confirmed) return;

    try {
      setIsLeavingTripRoom(true);
      await leaveTripRoom(numericTripRoomId);

      window.dispatchEvent(
        new CustomEvent("trip-room:left",{
          detail:{tripRoomId: numericTripRoomId},
        })
      );
      
      navigate("/trip-rooms", { replace: true });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "여행방 나가기에 실패했습니다.";

      setToast({ type: "error", message });
      setIsLeavingTripRoom(false);
    }
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

  if (isLoading || isDeletingTripRoom || isLeavingTripRoom) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <div className="mx-auto flex min-h-screen max-w-[1200px] items-center justify-center px-8">
          <div
            className={`loading-border ${
              isDeletingTripRoom || isLeavingTripRoom
                ? "loading-border--red"
                : "loading-border--green"
            }`}
          >
            <div className="relative rounded-[22px] border border-stone-200 bg-white px-8 py-6 text-sm text-stone-500">
              {isDeletingTripRoom
                ? "여행방 정보를 삭제하는 중입니다."
                : isLeavingTripRoom
                ? "여행방에서 나가는 중입니다."
                : "여행방 정보를 불러오는 중입니다."}
            </div>
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

      <main className="flex min-h-[calc(100vh-76px)] w-full bg-stone-50">
        <TripRoomMainSidebar
          activeView={mainPanelView}
          canOpenSummary={canOpenConfirmedSummary}
          onChange={setMainPanelView}
        />

        <div className="min-w-0 flex-1 px-8 pb-16 pt-10">
          <div className="mx-auto max-w-[1200px]">
          {mainPanelView === "overview" ? (
        <section className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
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
                    hint: "현재 인원",
                  },
                  {
                    label: "선호 입력",
                    value: `${tripRoomDetail.summary.submittedPreferenceCount}명`,
                    hint: `${participationRate}% 완료`,
                  },
                  {
                    label: "장소 제안",
                    value: `${tripRoomDetail.summary.proposalCount}개`,
                    hint: "후보 수",
                  },
                  {
                    label: "브랜치 생성",
                    value: `${tripRoomDetail.summary.branchCount}개`,
                    hint:
                      tripRoomDetail.summary.selectedBranchId === null
                        ? "일정 없음"
                        : "선택 완료",
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

                <div className="mt-6 grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                  <label className="block">
                    <span className="mb-2 block text-[15px] font-semibold leading-[22.5px] text-stone-900">
                      여행지
                    </span>
                    <input
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-300 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                      disabled={isTripInfoDisabled}
                      onChange={(event) =>
                        handleTripInfoChange("destination", event.target.value)
                      }
                      placeholder="예: 부산 해운대"
                      type="text"
                      value={tripInfo.destination}
                    />
                  </label>
                  <TripDateRangePicker
                    disabled={isTripInfoDisabled}
                    endDate={tripInfo.endDate}
                    onChange={(startDate, endDate) => {
                      setTripInfo((current) => ({
                        ...current,
                        startDate,
                        endDate,
                      }));
                      setTripInfoMessage("");
                    }}
                    startDate={tripInfo.startDate}
                  />
                </div>

                <div className="hidden">
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
                  <label className="hidden">
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
                  <TripDeadlinePicker
                    disabled={isTripInfoDisabled}
                    label={
                      <>
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
                      </>
                    }
                    onChange={(value) =>
                      handleTripInfoChange("decisionDeadline", value)
                    }
                    value={tripInfo.decisionDeadline}
                  />

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
                    className="rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300"
                    disabled={isTripInfoDisabled}
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

          {isHost ? (
            <button
              className="absolute bottom-6 right-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              disabled={isDeletingTripRoom}
              onClick={handleTripRoomDeleteRequest}
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              여행방 삭제
            </button>
          ) : (
            <button
              className="absolute bottom-6 right-8 inline-flex items-center gap-2 rounded-xl bg-stone-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
              disabled={isLeavingTripRoom}
              onClick={handleTripRoomLeaveRequest}
              type="button"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              여행방 나가기
            </button>
          )}
        </section>
          ) : (
            <ConfirmedBranchSummaryView
              branch={confirmedBranch}
              endDate={tripRoomDetail.endDate}
              error={confirmedBranchError}
              isLoading={isConfirmedBranchLoading}
              startDate={tripRoomDetail.startDate}
              tripRoomTitle={tripRoomDetail.title}
            />
          )}
          </div>
        </div>
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
      <GlobalConfirmModal />
    </div>
  );
}
