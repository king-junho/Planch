import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type TripRoomHeaderProps = {
  activeItem: "main" | "plan" | "proposal" | "branch";
  tripRoomId: string;
  onMenuClick?: () => void;
  onPendingClick?: (label: string) => void;
};

const navItems = [
  { key: "main", label: "메인" },
  { key: "plan", label: "여행계획" },
  { key: "proposal", label: "장소제안" },
  { key: "branch", label: "브랜치" },
] as const;

export default function TripRoomHeader({
  activeItem,
  tripRoomId,
  onMenuClick,
  onPendingClick,
}: TripRoomHeaderProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite?tripRoomId=${tripRoomId}`
      : `http://localhost:5173/invite?tripRoomId=${tripRoomId}`;

  useEffect(() => {
    if (!copyMessage) return;

    const timeout = window.setTimeout(() => setCopyMessage(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyMessage]);

  async function handleCopyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyMessage("복사되었습니다.");
    } catch {
      setCopyMessage("복사에 실패했습니다.");
    }
  }

  return (
    <header className="border-b border-stone-300 bg-white">
      <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between gap-4 px-8">
        <div className="flex w-[220px] items-center gap-3">
          <button
            className="flex h-11 w-11 flex-col items-center justify-center rounded-full border border-stone-300 bg-stone-100"
            onClick={onMenuClick}
            type="button"
          >
            <span className="h-0.5 w-4 rounded-full bg-stone-900" />
            <span className="mt-1 h-0.5 w-4 rounded-full bg-stone-900" />
            <span className="mt-1 h-0.5 w-4 rounded-full bg-stone-900" />
          </button>
          <Link
            className="text-[28px] font-semibold leading-none text-stone-900"
            to="/trip-rooms"
          >
            Planch
          </Link>
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

            if (item.key === "plan") {
              return (
                <Link
                  className={sharedClassName}
                  key={item.key}
                  to={`/trip-rooms/${tripRoomId}/schedule`}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                className={sharedClassName}
                key={item.key}
                onClick={() => onPendingClick?.(item.label)}
                type="button"
              >
                {item.label}
              </button>
            );
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
                  {inviteUrl}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-stone-500">
                    {copyMessage || "복사 버튼으로 링크를 공유할 수 있어요."}
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
                      className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
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
        </div>
      </div>
    </header>
  );
}
