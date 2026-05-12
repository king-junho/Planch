import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getAccessToken,
  getAuthUser,
} from "../services/authStorage";
import { createTripRoom, getMyTripRooms, updateTripRoomImage } from "../services/tripRoomApi";
import { TripRoomListItem } from "../types/tripRoom";
import { resolveImageUrl } from "../utils/image";

function TripRoomCard({
  tripRoomId,
  status,
  title,
  thumbnailUrl,
  memberCount,
  memberNamesPreview,
  remainingMemberCount,
}: {
  tripRoomId: number;
  status: string;
  title: string;
  thumbnailUrl: string | null;
  memberCount: number;
  memberNamesPreview: string[];
  remainingMemberCount: number;
}) {
  const participantsLabel =
    remainingMemberCount > 0
      ? `${memberNamesPreview.join(", ")} +${remainingMemberCount}명`
      : memberNamesPreview.join(", ");

  const statusClassName =
    status === "voting"
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      : status === "draft"
      ? "bg-stone-100 text-stone-600 ring-1 ring-stone-200"
      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

  const statusLabel =
    status === "voting" ? "진행중" : status === "draft" ? "준비중" : "확정";

  return (
    <Link
      className="block overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
      to={`/trip-rooms/${tripRoomId}`}
    >
      <div className="relative h-[193.5px] bg-stone-100">
        <img
        alt={title}
        className="h-full w-full object-cover"
        src={resolveImageUrl(thumbnailUrl, "https://placehold.co/258x194")}
        />
        <div className="absolute inset-0 bg-black/5" />
      </div>

      <div className="space-y-4 px-6 pb-6 pt-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold leading-[30px] text-stone-900">
            {title}
          </h3>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-medium leading-[21px] text-stone-700">
            <span>현재 참여 인원 : {memberCount}명</span>
          </div>
          <p className="text-sm leading-[21px] text-stone-500">
            참가자 : {participantsLabel}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function TripRoomListPage() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getAccessToken());
  const authUser = getAuthUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tripRooms, setTripRooms] = useState<TripRoomListItem[]>([]);
  const [tripTitle, setTripTitle] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [listError, setListError] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTripRooms() {
      setIsListLoading(true);
      setListError("");

      try {
        const response = await getMyTripRooms();

        if (isMounted) {
          setTripRooms(response);
        }
      } catch (caughtError) {
        if (!isMounted) return;

        const message =
          caughtError instanceof Error && caughtError.message.trim()
            ? caughtError.message
            : "여행 목록을 불러오지 못했습니다.";

        if (message.includes("로그인") || message.includes("인증")) {
          navigate("/login", {
            replace: true,
            state: {
              loginMessage: "로그인 후 여행 목록을 확인할 수 있습니다.",
              redirectTo: "/trip-rooms",
            },
          });
          return;
        }

        setListError(message);
      } finally {
        if (isMounted) {
          setIsListLoading(false);
        }
      }
    }

    loadTripRooms();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

function resetCreateModal() {
  setIsCreateModalOpen(false);
  setTripTitle("");
  setTripStartDate("");
  setTripEndDate("");
  setThumbnailFile(null);
  setThumbnailPreviewUrl("");
  setCreateError("");
}

function handleThumbnailFileChange(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0] ?? null;

  setThumbnailFile(file);

  if (!file) {
    setThumbnailPreviewUrl("");
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  setThumbnailPreviewUrl(previewUrl);
}

  async function handleCreateTripRoom() {
  const trimmedTitle = tripTitle.trim();

  if (!trimmedTitle) {
    setCreateError("여행 모임 이름을 입력해 주세요.");
    return;
  }

  setCreateError("");
  setIsCreating(true);

  try {
    const createdTripRoom = await createTripRoom({
      title: trimmedTitle,
      startDate: tripStartDate || undefined,
      endDate: tripEndDate || undefined,
      thumbnailUrl: null,
    });

    if (thumbnailFile) {
      await updateTripRoomImage(createdTripRoom.tripRoomId, thumbnailFile);
    }

    const refreshedTripRooms = await getMyTripRooms();
    setTripRooms(refreshedTripRooms);

    resetCreateModal();

    navigate(`/trip-rooms/${createdTripRoom.tripRoomId}`, {
      replace: true,
    });
  } catch (caughtError) {
    if (caughtError instanceof Error && caughtError.message.trim()) {
      setCreateError(caughtError.message);
    } else {
      setCreateError("여행방 생성에 실패했습니다. 다시 시도해 주세요.");
    }
  } finally {
    setIsCreating(false);
  }
}

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex min-w-0 items-center">
            <Link
              className="truncate text-[28px] font-semibold leading-none text-stone-900"
              to="/trip-rooms"
            >
              Planch
            </Link>
          </div>

          <div className="min-w-0 flex-1" />

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            {isLoggedIn ? (
              <>
                {authUser ? (
                  <div className="min-w-0 max-w-[220px] text-right">
                    <p className="truncate text-sm font-semibold leading-5 text-stone-900">
                      {authUser.name}
                    </p>
                    <p className="truncate text-xs leading-4 text-stone-500">
                      {authUser.email}
                    </p>
                  </div>
                ) : null}
                <button
                  className="h-10 shrink-0 rounded-lg border border-[#767676] bg-[#E3E3E3] px-5 py-2 text-base font-normal text-stone-900"
                  onClick={handleLogout}
                  type="button"
                >
                  로그아웃
                </button>
              </>
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

      <main className="mx-auto flex max-w-[1440px] justify-center bg-white px-[109px] pr-[120px]">
        <section className="flex w-full max-w-[1391px] flex-col items-center pt-16">
          <div className="flex w-full max-w-[1200px] flex-col gap-12 pl-8">
            <div className="flex items-end justify-between">
              <div className="space-y-3">
                <h1 className="text-[32px] font-semibold leading-[48px] text-stone-900">
                  여행 목록
                </h1>
                <p className="text-lg leading-[27px] text-stone-500">
                  참여 중인 여행 그룹을 확인하고 관리하세요
                </p>
              </div>

              <button
                className="flex h-14 items-center gap-2 rounded-xl bg-stone-900 px-6 text-base font-semibold text-white shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)]"
                onClick={() => setIsCreateModalOpen(true)}
                type="button"
              >
                <span className="text-lg leading-none">+</span>
                <span>새로운 여행 추가</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
              {isListLoading ? (
                <div className="col-span-full rounded-2xl border border-stone-200 bg-stone-50 px-6 py-10 text-center text-sm text-stone-500">
                  여행 목록을 불러오는 중입니다.
                </div>
              ) : listError ? (
                <div className="col-span-full rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-600">
                  {listError}
                </div>
              ) : tripRooms.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-stone-200 bg-stone-50 px-6 py-10 text-center text-sm text-stone-500">
                  아직 참여 중인 여행방이 없습니다.
                </div>
              ) : (
                tripRooms.map((tripRoom) => (
                  <TripRoomCard
                    key={tripRoom.tripRoomId}
                    tripRoomId={tripRoom.tripRoomId}
                    status={tripRoom.status}
                    title={tripRoom.title}
                    thumbnailUrl={tripRoom.thumbnailUrl}
                    memberCount={tripRoom.memberCount}
                    memberNamesPreview={tripRoom.memberNamesPreview}
                    remainingMemberCount={tripRoom.remainingMemberCount}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            aria-modal="true"
            className="relative w-full max-w-[480px] rounded-[20px] bg-white p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
            role="dialog"
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold leading-9 text-stone-900">
                새로운 여행 추가
              </h2>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-2xl leading-none text-stone-400"
                onClick={resetCreateModal}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-[15px] font-semibold leading-[22.5px] text-stone-900">
                  여행 모임 이름
                </span>
                <input
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-300"
                  onChange={(event) => setTripTitle(event.target.value)}
                  placeholder="예: 2024 여름 제주도 휴가, 캡스톤 MT"
                  type="text"
                  value={tripTitle}
                />
              </label>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[15px] font-semibold leading-[22.5px] text-stone-900">
                    시작 날짜
                  </span>
                  <input
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none focus:border-stone-300"
                    onChange={(event) => setTripStartDate(event.target.value)}
                    type="date"
                    value={tripStartDate}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[15px] font-semibold leading-[22.5px] text-stone-900">
                    종료 날짜
                  </span>
                  <input
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none focus:border-stone-300"
                    onChange={(event) => setTripEndDate(event.target.value)}
                    type="date"
                    value={tripEndDate}
                  />
                </label>
              </div>

              <div>
                <p className="mb-2 block text-[15px] font-semibold leading-[22.5px] text-stone-900">
                  대표 사진
                  </p>
                  <input
                  accept="image/*"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-white"
                  onChange={handleThumbnailFileChange}
                  type="file"
                  />
                  <div className="mt-3 h-40 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                    {thumbnailPreviewUrl ? (
                      <img
                      alt="대표 사진 미리보기"
                      className="h-full w-full object-cover"
                      src={thumbnailPreviewUrl}
                      />
                    ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-[13px] font-medium leading-[19.5px] text-stone-400">
                      로컬 이미지를 선택하면 미리보기가 표시됩니다.
                      </div>
                    )}
                    </div>
                  </div>

              {createError ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {createError}
                </p>
              ) : null}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="rounded-xl border border-stone-200 bg-white px-5 py-[14px] text-[15px] font-medium leading-[22.5px] text-stone-600"
                onClick={resetCreateModal}
                type="button"
              >
                취소
              </button>
              <button
                className="rounded-xl bg-stone-900 px-6 py-[14px] text-[15px] font-semibold leading-[22.5px] text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:bg-stone-400"
                disabled={isCreating}
                onClick={handleCreateTripRoom}
                type="button"
              >
                {isCreating ? "생성 중..." : "+ 여행 만들기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
