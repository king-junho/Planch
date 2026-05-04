import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Menu,
  Sparkles,
  UserRoundPen,
  X,
} from "lucide-react";
import { clearAuthSession, getAccessToken } from "../../services/authStorage";
import { createInviteLink } from "../../services/tripRoomApi";

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

type TripRoomStatus = "active" | "completed";

type ActivityLogItem = {
  id: number;
  actor: string;
  action: string;
  detail: string;
  timeAgo: string;
  tone: "blue" | "emerald" | "amber" | "stone";
};

const statusOptions: { key: TripRoomStatus; label: string }[] = [
  { key: "active", label: "진행중" },
  { key: "completed", label: "완료" },
];

const dummyActivityLogs: ActivityLogItem[] = [
  {
    id: 1,
    actor: "병욱",
    action: "장소 제안 추가",
    detail: "성수동 카페거리와 서울숲 산책 코스를 후보에 넣었어요.",
    timeAgo: "방금 전",
    tone: "blue",
  },
  {
    id: 2,
    actor: "준호",
    action: "선호 입력 수정",
    detail: "숙소 예산을 1박 12만원 이하로 낮추고 야경 선호를 추가했어요.",
    timeAgo: "12분 전",
    tone: "emerald",
  },
  {
    id: 3,
    actor: "Planch AI",
    action: "브랜치 초안 생성",
    detail: "느긋한 맛집 중심 일정 2개와 액티비티 중심 일정 1개를 만들었어요.",
    timeAgo: "34분 전",
    tone: "amber",
  },
  {
    id: 4,
    actor: "성준",
    action: "여행 정보 수정",
    detail: "여행 기간을 6월 14일 - 6월 16일로 조정했어요.",
    timeAgo: "1시간 전",
    tone: "stone",
  },
  {
    id: 5,
    actor: "호영",
    action: "멤버 초대",
    detail: "초대 링크로 새 멤버 1명을 여행방에 추가했어요.",
    timeAgo: "어제",
    tone: "stone",
  },
];

function statusLabel(status: TripRoomStatus) {
  return statusOptions.find((option) => option.key === status)?.label ?? status;
}

function activityToneClass(tone: ActivityLogItem["tone"]) {
  if (tone === "blue") return "bg-blue-500";
  if (tone === "emerald") return "bg-emerald-500";
  if (tone === "amber") return "bg-amber-500";
  return "bg-stone-400";
}

export default function TripRoomHeader({
  activeItem,
  tripRoomId,
  onMenuClick,
}: TripRoomHeaderProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [roomStatus, setRoomStatus] = useState<TripRoomStatus>("active");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const isLoggedIn = Boolean(getAccessToken());

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
                  <p className="mt-1 text-lg font-semibold text-stone-950">
                    {statusLabel(roomStatus)}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    {statusOptions.map((option) => {
                      const isActive = roomStatus === option.key;

                      return (
                        <button
                          className={`h-9 flex-1 rounded-lg border px-3 text-sm font-semibold transition ${
                            isActive
                              ? "border-stone-900 bg-stone-950 text-white"
                              : "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50"
                          }`}
                          key={option.key}
                          onClick={() => setRoomStatus(option.key)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      );
                    })}
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
                    <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-600">
                      <CalendarClock size={14} />
                      더미
                    </div>
                  </div>

                  <ol className="relative border-l border-stone-200 pl-5">
                    {dummyActivityLogs.map((log) => (
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
                </section>
              </div>
            </div>
          ) : null}
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
          {navItems.map((item) => {
            const isActive = activeItem === item.key;
            const sharedClassName = isActive
              ? "rounded-lg bg-stone-100 px-4 py-2 text-base font-normal text-stone-900"
              : "rounded-lg px-4 py-2 text-base font-normal text-stone-900";

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
              className="rounded-lg px-4 py-2 text-base font-normal text-stone-900"
              onClick={() => setIsInviteOpen((current) => !current)}
              type="button"
            >
              초대링크
            </button>

            {isInviteOpen ? (
              <div className="absolute right-0 top-12 z-30 w-[360px] rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
                <p className="text-sm font-semibold text-stone-900">현재 여행방 초대링크</p>
                <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-600">
                  {isInviteLoading
                    ? "초대 링크를 생성하는 중입니다."
                    : inviteError
                    ? inviteError
                    : inviteUrl || "초대 링크가 없습니다."}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-stone-500">
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

        <div className="hidden w-[220px] items-center justify-end gap-3 lg:flex">
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
