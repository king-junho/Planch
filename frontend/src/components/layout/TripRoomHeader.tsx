import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  Menu,
  Sparkles,
  Unlock,
  UserRoundPen,
  X,
} from "lucide-react";
import { clearAuthSession, getAccessToken } from "../../services/authStorage";
import {
  createInviteLink,
  getTripRoomDetail,
  getTripRoomDecisionLogs,
  unlockTripRoom,
} from "../../services/tripRoomApi";
import { DecisionLogData, DecisionLogItem } from "../../types/tripRoom";

type TripRoomHeaderProps = {
  activeItem: "main" | "preference" | "proposal" | "branch";
  tripRoomId: string;
  onMenuClick?: () => void;
};

const navItems = [
  { key: "main", label: "메인" },
  { key: "preference", label: "선호입력" },
  { key: "proposal", label: "장소제안" },
  { key: "branch", label: "브랜치" },
] as const;

type TripRoomStatus = "draft" | "voting" | "locked" | string;

type ActivityLogItem = {
  id: number;
  actor: string;
  action: string;
  detail: string;
  timeAgo: string;
  tone: "blue" | "emerald" | "amber" | "stone";
};

function statusLabel(status: TripRoomStatus) {
  if (status === "draft") return "준비중";
  if (status === "voting") return "진행중";
  if (status === "locked") return "확정";
  return status;
}

function statusDescription(status: TripRoomStatus) {
  if (status === "locked") {
    return "최종 일정이 확정되어 브랜치 수정과 투표가 잠겨 있습니다.";
  }

  if (status === "voting") {
    return "브랜치 수정, 생성, 투표를 진행할 수 있습니다.";
  }

  return "여행방 준비가 진행 중입니다.";
}

function statusPillClass(status: TripRoomStatus) {
  if (status === "locked") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "voting") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-stone-200 bg-stone-50 text-stone-600";
}

function readCurrentUserId() {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1] ?? ""));
    const id = payload.sub ?? payload.userId ?? payload.id;
    const numericId = Number(id);
    return Number.isFinite(numericId) ? numericId : null;
  } catch {
    return null;
  }
}

function activityToneClass(tone: ActivityLogItem["tone"]) {
  if (tone === "blue") return "bg-blue-500";
  if (tone === "emerald") return "bg-emerald-500";
  if (tone === "amber") return "bg-amber-500";
  return "bg-stone-400";
}

function readLogDataValue(data: DecisionLogData, key: string) {
  if (!data || typeof data !== "object") return null;

  const value = data[key];
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return null;
}

function formatRelativeTime(value: string) {
  const createdAt = new Date(value);
  const createdTime = createdAt.getTime();

  if (Number.isNaN(createdTime)) return "";

  const diffMs = Date.now() - createdTime;
  if (diffMs < 60 * 1000) return "방금 전";

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return createdAt.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

function toActivityLogItem(log: DecisionLogItem): ActivityLogItem {
  const beforeName = readLogDataValue(log.beforeData, "name");
  const afterName = readLogDataValue(log.afterData, "name");
  const placeName =
    readLogDataValue(log.afterData, "placeName") ??
    readLogDataValue(log.afterData, "name") ??
    readLogDataValue(log.beforeData, "placeName") ??
    readLogDataValue(log.beforeData, "name");
  const selectedBranchId =
    readLogDataValue(log.afterData, "selectedBranchId") ??
    readLogDataValue(log.beforeData, "selectedBranchId");
  const timeAgo = formatRelativeTime(log.createdAt);

  switch (log.actionType) {
    case "room_created":
      return {
        id: log.logId,
        actor: log.actor.name,
        action: "여행방 생성",
        detail: "새 여행방을 만들었어요.",
        timeAgo,
        tone: "blue",
      };
    case "place_proposed":
      return {
        id: log.logId,
        actor: log.actor.name,
        action: "장소 제안 추가",
        detail: placeName
          ? `${placeName}을 후보 장소로 제안했어요.`
          : "새 후보 장소를 제안했어요.",
        timeAgo,
        tone: "blue",
      };
    case "ai_branch_generated":
      return {
        id: log.logId,
        actor: "Planch AI",
        action: "브랜치 초안 생성",
        detail: "AI가 여행 일정 브랜치 초안을 만들었어요.",
        timeAgo,
        tone: "amber",
      };
    case "branch_create":
      return {
        id: log.logId,
        actor: log.actor.name,
        action: "브랜치 생성",
        detail: afterName
          ? `${afterName} 브랜치를 만들었어요.`
          : "새 브랜치를 만들었어요.",
        timeAgo,
        tone: "emerald",
      };
    case "branch_update":
      return {
        id: log.logId,
        actor: log.actor.name,
        action: "브랜치 수정",
        detail:
          beforeName && afterName && beforeName !== afterName
            ? `${beforeName}에서 ${afterName}로 브랜치 이름을 바꿨어요.`
            : "브랜치 정보를 수정했어요.",
        timeAgo,
        tone: "emerald",
      };
    case "branch_delete":
      return {
        id: log.logId,
        actor: log.actor.name,
        action: "브랜치 삭제",
        detail: beforeName
          ? `${beforeName} 브랜치를 삭제했어요.`
          : "브랜치를 삭제했어요.",
        timeAgo,
        tone: "stone",
      };
    case "proposal_delete":
      return {
        id: log.logId,
        actor: log.actor.name,
        action: "장소 제안 삭제",
        detail: placeName
          ? `${placeName} 장소 제안을 삭제했어요.`
          : "장소 제안을 삭제했어요.",
        timeAgo,
        tone: "stone",
      };
    case "trip_room_finalize":
      return {
        id: log.logId,
        actor: log.actor.name,
        action: "여행방 확정",
        detail: selectedBranchId
          ? `${selectedBranchId}번 브랜치로 여행방을 확정했어요.`
          : "여행방을 확정했어요.",
        timeAgo,
        tone: "amber",
      };
    case "trip_room_unlock":
      return {
        id: log.logId,
        actor: log.actor.name,
        action: "여행방 확정 해제",
        detail: "확정된 여행방을 다시 투표 상태로 열었어요.",
        timeAgo,
        tone: "amber",
      };
    default:
      return {
        id: log.logId,
        actor: log.actor.name,
        action: "활동 기록",
        detail: `${log.targetType} 항목이 변경되었어요.`,
        timeAgo,
        tone: "stone",
      };
  }
}

export default function TripRoomHeader({
  activeItem,
  tripRoomId,
  onMenuClick,
}: TripRoomHeaderProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [roomStatus, setRoomStatus] = useState<TripRoomStatus>("draft");
  const [hostUserId, setHostUserId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [roomStatusError, setRoomStatusError] = useState("");
  const [isRoomStatusLoading, setIsRoomStatusLoading] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [activityLogError, setActivityLogError] = useState("");
  const [isActivityLogLoading, setIsActivityLogLoading] = useState(false);
  const isLoggedIn = Boolean(getAccessToken());
  const currentUserId = readCurrentUserId();
  const isHost = Boolean(currentUserId && hostUserId && currentUserId === hostUserId);

  const loadTripRoomSnapshot = useCallback(async () => {
    const numericTripRoomId = Number(tripRoomId);
    if (!Number.isInteger(numericTripRoomId) || numericTripRoomId <= 0) {
      setRoomStatusError("유효하지 않은 tripRoomId입니다.");
      return;
    }

    setIsRoomStatusLoading(true);
    setRoomStatusError("");

    try {
      const detail = await getTripRoomDetail(numericTripRoomId);
      setRoomStatus(detail.status);
      setHostUserId(detail.hostUser.id);
      setSelectedBranchId(detail.summary.selectedBranchId);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "여행방 상태를 불러오지 못했습니다.";

      setRoomStatusError(message);
    } finally {
      setIsRoomStatusLoading(false);
    }
  }, [tripRoomId]);

  useEffect(() => {
    loadTripRoomSnapshot();
  }, [loadTripRoomSnapshot]);

  useEffect(() => {
    if (!copyMessage) return;

    const timeout = window.setTimeout(() => setCopyMessage(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyMessage]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const numericTripRoomId = Number(tripRoomId);
    if (!Number.isInteger(numericTripRoomId) || numericTripRoomId <= 0) {
      setActivityLogError("유효하지 않은 tripRoomId입니다.");
      setActivityLogs([]);
      return;
    }

    let isMounted = true;

    async function loadActivityLogs() {
      setIsActivityLogLoading(true);
      setActivityLogError("");

      try {
        const logs = await getTripRoomDecisionLogs(numericTripRoomId);
        if (!isMounted) return;

        setActivityLogs(logs.map(toActivityLogItem));
      } catch (caughtError) {
        if (!isMounted) return;

        const message =
          caughtError instanceof Error && caughtError.message.trim()
            ? caughtError.message
            : "결정 로그를 불러오지 못했습니다.";

        setActivityLogError(message);
        setActivityLogs([]);
      } finally {
        if (isMounted) {
          setIsActivityLogLoading(false);
        }
      }
    }

    loadActivityLogs();

    return () => {
      isMounted = false;
    };
  }, [isMenuOpen, tripRoomId]);

  useEffect(() => {
    if (!isInviteOpen) return;

    const numericTripRoomId = Number(tripRoomId);
    if (!Number.isInteger(numericTripRoomId) || numericTripRoomId <= 0) {
      setInviteError("유효하지 않은 tripRoomId입니다.");
      setInviteUrl("");
      return;
    }

    let isMounted = true;

    async function loadInviteLink() {
      setIsInviteLoading(true);
      setInviteError("");
      setCopyMessage("");

      try {
        const response = await createInviteLink(numericTripRoomId);
        if (!isMounted) return;

        setInviteUrl(response.inviteUrl);
      } catch (caughtError) {
        if (!isMounted) return;

        const message =
          caughtError instanceof Error && caughtError.message.trim()
            ? caughtError.message
            : "초대 링크 생성에 실패했습니다.";

        setInviteError(message);
        setInviteUrl("");
      } finally {
        if (isMounted) {
          setIsInviteLoading(false);
        }
      }
    }

    loadInviteLink();

    return () => {
      isMounted = false;
    };
  }, [isInviteOpen, tripRoomId]);

  async function handleCopyInviteLink() {
    if (!inviteUrl) {
      setCopyMessage("복사할 초대 링크가 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyMessage("복사되었습니다.");
    } catch {
      setCopyMessage("복사에 실패했습니다.");
    }
  }

  function handleLogout() {
    clearAuthSession();
    setIsInviteOpen(false);
    setIsMenuOpen(false);
    navigate("/login", { replace: true });
  }

  function handleMenuClick() {
    setIsMenuOpen((current) => !current);
    onMenuClick?.();
  }

  async function handleUnlockTripRoom() {
    const numericTripRoomId = Number(tripRoomId);
    if (!Number.isInteger(numericTripRoomId) || numericTripRoomId <= 0) {
      setRoomStatusError("유효하지 않은 tripRoomId입니다.");
      return;
    }

    if (!window.confirm("최종 확정을 해제하고 다시 투표 상태로 전환하시겠습니까?")) {
      return;
    }

    setIsUnlocking(true);
    setRoomStatusError("");

    try {
      const result = await unlockTripRoom(numericTripRoomId);
      setRoomStatus(result.status);
      setSelectedBranchId(result.selectedBranchId);
      await loadTripRoomSnapshot();
      window.dispatchEvent(new CustomEvent("trip-room-unlocked", { detail: result }));
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "여행방 확정 해제 실패";

      setRoomStatusError(message);
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <header className="relative border-b border-stone-300 bg-white">
      <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between gap-4 px-8">
        <div className="relative flex w-[220px] items-center gap-3">
          <button
            aria-expanded={isMenuOpen}
            aria-label="여행방 메뉴"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-stone-900 transition hover:border-stone-400 hover:bg-stone-200"
            onClick={handleMenuClick}
            type="button"
            title="여행방 메뉴"
          >
            {isMenuOpen ? <X size={24} strokeWidth={2.4} /> : <Menu size={24} strokeWidth={2.4} />}
          </button>
          <Link
            className="text-[28px] font-semibold leading-none text-stone-900"
            to="/trip-rooms"
          >
            Planch
          </Link>

          {isMenuOpen ? (
            <div className="absolute left-0 top-[58px] z-40 w-[360px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
              <div className="max-h-[calc(100vh-112px)] overflow-y-auto px-4 py-4">
                <section>
                  <p className="text-xs font-semibold text-stone-500">여행방 상태</p>
                  <div className="mt-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusPillClass(
                          roomStatus
                        )}`}
                      >
                        {isRoomStatusLoading ? "확인 중" : statusLabel(roomStatus)}
                      </span>
                      {isRoomStatusLoading ? (
                        <Loader2 size={18} className="animate-spin text-stone-400" />
                      ) : roomStatus === "locked" && isHost ? (
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                          disabled={isUnlocking}
                          onClick={handleUnlockTripRoom}
                          type="button"
                        >
                          {isUnlocking ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Unlock size={14} />
                          )}
                          확정 해제
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-stone-500">
                      {statusDescription(roomStatus)}
                    </p>
                    {selectedBranchId ? (
                      <p className="mt-1 text-xs font-medium text-stone-600">
                        선택 브랜치 #{selectedBranchId}
                      </p>
                    ) : null}
                    {roomStatus === "locked" && !isHost ? (
                      <p className="mt-2 text-xs text-stone-500">
                        확정 해제는 호스트만 할 수 있습니다.
                      </p>
                    ) : null}
                    {roomStatusError ? (
                      <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                        {roomStatusError}
                      </p>
                    ) : null}
                  </div>
                </section>

                <section className="mt-5 border-t border-stone-200 pt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-stone-500">활동 로그</p>
                      <h2 className="mt-1 text-base font-semibold text-stone-950">
                        최근 변경 기록
                      </h2>
                    </div>
                  </div>

                  {isActivityLogLoading ? (
                    <p className="rounded-lg bg-stone-50 px-3 py-4 text-sm text-stone-500">
                      최근 변경 기록을 불러오는 중입니다.
                    </p>
                  ) : activityLogError ? (
                    <p className="rounded-lg bg-red-50 px-3 py-4 text-sm text-red-600">
                      {activityLogError}
                    </p>
                  ) : activityLogs.length === 0 ? (
                    <p className="rounded-lg bg-stone-50 px-3 py-4 text-sm text-stone-500">
                      아직 기록된 활동 로그가 없습니다.
                    </p>
                  ) : (
                    <ol className="relative border-l border-stone-200 pl-5">
                      {activityLogs.map((log) => (
                        <li className="relative pb-5 last:pb-1" key={log.id}>
                          <span
                            className={`absolute -left-[24px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${activityToneClass(
                              log.tone
                            )}`}
                          />
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-stone-950">
                              {log.actor === "Planch AI" ? (
                                <Sparkles size={14} className="text-amber-500" />
                              ) : (
                                <UserRoundPen size={14} className="text-stone-500" />
                              )}
                              {log.actor}
                            </span>
                            <span className="text-xs text-stone-400">{log.timeAgo}</span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-stone-700">
                            {log.action}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-stone-500">
                            {log.detail}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            </div>
          ) : null}
        </div>

        <nav className="flex flex-1 items-center justify-center gap-2">
          {navItems.map((item) => {
            const isActive = activeItem === item.key;
            const sharedClassName = isActive
              ? "whitespace-nowrap rounded-lg bg-stone-100 px-4 py-2 text-base font-normal text-stone-900"
              : "whitespace-nowrap rounded-lg px-4 py-2 text-base font-normal text-stone-900";

            if (item.key === "main") {
              return (
                <Link
                  className={sharedClassName}
                  key={item.key}
                  to={`/trip-rooms/${tripRoomId}`}
                >
                  {item.label}
                </Link>
              );
            }

            if (item.key === "preference") {
              return (
                <Link
                  className={sharedClassName}
                  key={item.key}
                  to={`/trip-rooms/${tripRoomId}/preference`}
                >
                  {item.label}
                </Link>
              );
            }

            if (item.key === "proposal") {
              return (
                <Link
                  className={sharedClassName}
                  key={item.key}
                  to={`/trip-rooms/${tripRoomId}/proposal`}
                >
                  {item.label}
                </Link>
              );
            }

            if (item.key === "branch") {
              return (
                <Link
                  className={sharedClassName}
                  key={item.key}
                  to={`/trip-rooms/${tripRoomId}/branch`}
                >
                  {item.label}
                </Link>
              );
            }

            return null;
          })}

          <div className="relative">
            <button
              className="whitespace-nowrap rounded-lg px-4 py-2 text-base font-normal text-stone-900"
              onClick={() => setIsInviteOpen((current) => !current)}
              type="button"
            >
              초대링크
            </button>

            {isInviteOpen ? (
              <div className="absolute right-0 top-12 z-30 w-[360px] rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
                <p className="text-sm font-semibold text-stone-900">현재 여행방 초대링크</p>
                <input
                  className="mt-3 w-full min-w-0 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-600 outline-none"
                  readOnly
                  type="text"
                  value={
                    isInviteLoading
                      ? "초대 링크를 생성하는 중입니다."
                      : inviteError
                      ? inviteError
                      : inviteUrl || "초대 링크가 없습니다."
                  }
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="min-w-0 text-xs text-stone-500">
                    {copyMessage ||
                      (inviteError
                        ? "호스트 권한과 인증 상태를 확인해 주세요."
                        : "복사 버튼으로 링크를 공유할 수 있어요.")}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600"
                      onClick={() => setIsInviteOpen(false)}
                      type="button"
                    >
                      닫기
                    </button>
                    <button
                      className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
                      disabled={isInviteLoading || Boolean(inviteError) || !inviteUrl}
                      onClick={handleCopyInviteLink}
                      type="button"
                    >
                      복사
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex w-[220px] items-center justify-end gap-3">
          {isLoggedIn ? (
            <button
              className="h-10 rounded-lg border border-[#767676] bg-[#E3E3E3] px-5 py-2 text-base font-normal text-stone-900"
              onClick={handleLogout}
              type="button"
            >
              로그아웃
            </button>
          ) : (
            <>
              <Link
                className="h-10 rounded-lg border border-[#767676] bg-[#E3E3E3] px-5 py-2 text-base font-normal text-stone-900"
                to="/login"
              >
                로그인
              </Link>
              <Link
                className="h-10 rounded-lg bg-[#2C2C2C] px-5 py-2 text-base font-normal text-stone-100"
                to="/register"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
