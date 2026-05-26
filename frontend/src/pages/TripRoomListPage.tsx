import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Trash2 } from "lucide-react";
import GlobalConfirmModal from "../components/common/GlobalConfirmModal";
import TripDeadlinePicker from "../components/common/TripDeadlinePicker";
import TripDateRangePicker from "../components/common/TripDateRangePicker";
import AppHeader from "../components/layout/AppHeader";
import {
  createTripRoom,
  deleteTripRoom,
  getMyTripRooms,
  leaveTripRoom,
  updateTripRoomImage,
} from "../services/tripRoomApi";
import { getAccessToken, getAuthUser } from "../services/authStorage";
import { TripRoomListItem } from "../types/tripRoom";
import { useConfirmStore } from "../features/store/useConfirmStore";
import { resolveImageUrl } from "../utils/image";

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

function TripRoomCard({
  tripRoomId,
  status,
  title,
  thumbnailUrl,
  memberCount,
  memberNamesPreview,
  remainingMemberCount,
  isHost,
  isActionLoading,
  onDelete,
  onLeave,
}: {
  tripRoomId: number;
  status: string;
  title: string;
  thumbnailUrl: string | null;
  memberCount: number;
  memberNamesPreview: string[];
  remainingMemberCount: number;
  isHost: boolean;
  isActionLoading: boolean;
  onDelete: (tripRoomId: number) => void;
  onLeave: (tripRoomId: number) => void;
}) {
  const participantsLabel =
    remainingMemberCount > 0
      ? `${memberNamesPreview.join(", ")} +${remainingMemberCount}명`
      : memberNamesPreview.join(", ");

  const statusClassName =
  status === "locked" 
  ? "bg-stone-900 text-white"
  : "bg-emerald-50 text-emerald-700";

  const statusLabel =
    status === "locked" ? "확정" : "진행중";

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link className="block" to={`/trip-rooms/${tripRoomId}`}>
        <div className="relative h-[193.5px] bg-stone-100">
          <img
            alt={title}
            className="h-full w-full object-cover"
            src={resolveImageUrl(thumbnailUrl, "https://placehold.co/258x194")}
          />
          <div className="absolute inset-0 bg-black/5" />
        </div>

        <div className="space-y-4 px-6 pt-6">
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

      <div className="flex justify-end px-6 pb-5 pt-4">
        <button
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isHost
              ? "border-red-100 bg-red-50 text-red-600 hover:border-red-200 hover:bg-red-100"
              : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300 hover:bg-stone-100"
          }`}
          disabled={isActionLoading}
          onClick={() => (isHost ? onDelete(tripRoomId) : onLeave(tripRoomId))}
          type="button"
        >
          {isHost ? (
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isActionLoading
            ? "처리 중..."
            : isHost
            ? "여행방 삭제"
            : "여행방 나가기"}
        </button>
      </div>
    </article>
  );
}

export default function TripRoomListPage() {
  const navigate = useNavigate();
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
  const [tripDecisionDeadline, setTripDecisionDeadline] = useState("");
  const [actionLoadingTripRoomId, setActionLoadingTripRoomId] = useState<number | null>(null);
  const authUser = getAuthUser();
  const currentUserId = readCurrentUserId() ?? authUser?.id ?? null;
  const { confirm } = useConfirmStore();

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

function resetCreateModal() {
  if(thumbnailPreviewUrl){
    URL.revokeObjectURL(thumbnailPreviewUrl);
  }
  
  setIsCreateModalOpen(false);
  setTripTitle("");
  setTripStartDate("");
  setTripEndDate("");
  setThumbnailFile(null);
  setThumbnailPreviewUrl("");
  setTripDecisionDeadline("");
  setCreateError("");
}

function handleThumbnailFileChange(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0] ?? null;

  if (thumbnailPreviewUrl) {
    URL.revokeObjectURL(thumbnailPreviewUrl);
  }

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
      decisionDeadline : tripDecisionDeadline ? new Date(tripDecisionDeadline).toISOString() : null,
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

  async function handleDeleteTripRoom(tripRoomId: number) {
    const confirmed = await confirm("여행방을 삭제하시겠습니까?");

    if (!confirmed) return;

    try {
      setActionLoadingTripRoomId(tripRoomId);
      await deleteTripRoom(tripRoomId);
      setTripRooms((current) =>
        current.filter((tripRoom) => tripRoom.tripRoomId !== tripRoomId)
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "여행방 삭제에 실패했습니다.";
      setListError(message);
    } finally {
      setActionLoadingTripRoomId(null);
    }
  }

  async function handleLeaveTripRoom(tripRoomId: number) {
    const confirmed = await confirm("여행방에서 나가시겠습니까?");

    if (!confirmed) return;

    try {
      setActionLoadingTripRoomId(tripRoomId);
      await leaveTripRoom(tripRoomId);
      setTripRooms((current) =>
        current.filter((tripRoom) => tripRoom.tripRoomId !== tripRoomId)
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "여행방 나가기에 실패했습니다.";
      setListError(message);
    } finally {
      setActionLoadingTripRoomId(null);
    }
  }
  return (
    <div className="min-h-screen bg-white text-stone-900">
      <AppHeader />

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
                    isHost={tripRoom.hostUser.id === currentUserId}
                    isActionLoading={actionLoadingTripRoomId === tripRoom.tripRoomId}
                    onDelete={handleDeleteTripRoom}
                    onLeave={handleLeaveTripRoom}
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

              <TripDateRangePicker
                endDate={tripEndDate}
                onChange={(startDate, endDate) => {
                  setTripStartDate(startDate);
                  setTripEndDate(endDate);
                }}
                startDate={tripStartDate}
              />
              <div className="hidden">
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
              <div className="hidden">
                <p className="mb-2 block text-[15px] font-semibold leading-[22.5px] text-stone-900">
                  결정 마감기한
                </p>
                <input
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none"
                  onChange={(event) => setTripDecisionDeadline(event.target.value)}
                  type="datetime-local"
                  value={tripDecisionDeadline}
                />
                <p className="mt-2 text-xs text-stone-400">
                  이 시각 이후에는 투표 및 주요 일정 변경이 제한됩니다.
                </p>
              </div>
              <div>
                <TripDeadlinePicker
                  onChange={setTripDecisionDeadline}
                  value={tripDecisionDeadline}
                />
                <p className="mt-2 text-xs text-stone-400">
                  마감 시각 이후에는 투표 및 주요 일정 변경이 제한됩니다.
                </p>
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
      <GlobalConfirmModal />
    </div>
  );
}
