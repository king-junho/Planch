import { ChangeEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createTripRoom, getMyTripRooms } from "../services/tripRoomApi";
import { TripRoomListItem } from "../types/tripRoom";

type ChatMessage = {
  id: number;
  author: string;
  text: string;
  time: string;
  isMine?: boolean;
};

type ChatRoom = {
  id: number;
  title: string;
  previewParticipants: string;
  unreadCount: number;
  messages: ChatMessage[];
};

const initialChatRooms: ChatRoom[] = [
  {
    id: 1,
    title: "동아리 MT",
    previewParticipants: "김준호, 복성준, 김호영...",
    unreadCount: 3,
    messages: [
      {
        id: 1,
        author: "김준호",
        text: "다들 언제쯤 도착해? 로비에서 기다리는 중!",
        time: "오후 2:30",
      },
      {
        id: 2,
        author: "나",
        text: "나 지금 거의 다 왔어! 5분만 기다려줘",
        time: "오후 2:32",
        isMine: true,
      },
    ],
  },
  {
    id: 2,
    title: "캡스톤 MT",
    previewParticipants: "김준호, 복성준, 김호영...",
    unreadCount: 40,
    messages: [
      {
        id: 1,
        author: "복성준",
        text: "회의 자료는 내가 정리해서 올릴게",
        time: "오후 1:10",
      },
    ],
  },
  {
    id: 3,
    title: "중학교 동창 여행",
    previewParticipants: "김준호, 복성준, 김호영...",
    unreadCount: 10,
    messages: [
      {
        id: 1,
        author: "최병욱",
        text: "숙소 후보 세 군데 비교해보자",
        time: "오전 11:12",
      },
    ],
  },
];

function TripRoomCard({
  tripRoomId,
  status,
  title,
  memberCount,
  memberNamesPreview,
  remainingMemberCount,
}: {
  tripRoomId: number;
  status: string;
  title: string;
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
          src="https://placehold.co/258x194"
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
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-stone-500 text-[10px]">
              인
            </span>
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<number | null>(null);
  const [chatRooms, setChatRooms] = useState(initialChatRooms);
  const [messageDraft, setMessageDraft] = useState("");
  const [tripRooms, setTripRooms] = useState<TripRoomListItem[]>([]);
  const [tripTitle, setTripTitle] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [listError, setListError] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);

  const activeChatRoom =
    chatRooms.find((chatRoom) => chatRoom.id === activeChatRoomId) ?? null;

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

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setSelectedImageName(file?.name ?? "");
  }

  function handleChatRoomOpen(chatRoomId: number) {
    setIsChatListOpen(true);
    setActiveChatRoomId(chatRoomId);
  }

  function handleChatSend() {
    if (!messageDraft.trim() || !activeChatRoomId) {
      return;
    }

    setChatRooms((currentChatRooms) =>
      currentChatRooms.map((chatRoom) =>
        chatRoom.id === activeChatRoomId
          ? {
              ...chatRoom,
              messages: [
                ...chatRoom.messages,
                {
                  id: Date.now(),
                  author: "나",
                  text: messageDraft.trim(),
                  time: "방금",
                  isMine: true,
                },
              ],
            }
          : chatRoom
      )
    );
    setMessageDraft("");
  }

  async function handleCreateTripRoom() {
    if (!tripTitle.trim()) {
      setCreateError("title은 필수입니다.");
      return;
    }

    setCreateError("");
    setIsCreating(true);

    try {
      const createdTripRoom = await createTripRoom({
        title: tripTitle.trim(),
        startDate: tripStartDate || undefined,
        endDate: tripEndDate || undefined,
        thumbnailUrl: null,
      });

      setIsCreateModalOpen(false);
      setTripTitle("");
      setTripStartDate("");
      setTripEndDate("");
      setSelectedImageName("");

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
        <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between px-8">
          <div className="flex items-center">
            <Link
              className="text-[28px] font-semibold leading-none text-stone-900"
              to="/trip-rooms"
            >
              Planch
            </Link>
          </div>

          <div className="h-10 w-[720px]" />

          <div className="hidden items-center gap-3 sm:flex">
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
                onClick={() => setIsCreateModalOpen(false)}
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
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-6 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                    <span className="text-2xl text-stone-600">⌁</span>
                  </span>
                  <div>
                    <p className="text-[15px] font-medium leading-[22.5px] text-stone-700">
                      {selectedImageName || "클릭하여 사진 업로드"}
                    </p>
                    <p className="mt-1 text-[13px] font-medium leading-[19.5px] text-stone-400">
                      JPG, PNG 형식 지원 (최대 5MB)
                    </p>
                  </div>
                  <input
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleImageChange}
                    type="file"
                  />
                </label>
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
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateError("");
                }}
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

      {activeChatRoom && isChatListOpen ? (
        <div className="fixed bottom-28 right-[396px] z-40 hidden w-[300px] xl:flex xl:flex-col xl:items-end xl:gap-4">
          <div className="flex h-[496px] w-[300px] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
            <div className="flex h-[65px] items-center gap-2 border-b border-stone-200 px-4">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-stone-900"
                onClick={() => setActiveChatRoomId(null)}
                type="button"
              >
                ‹
              </button>
              <div className="truncate text-[15px] font-bold leading-[22.5px] text-stone-900">
                {activeChatRoom.title}
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto bg-[#FCFCFC] px-4 py-4">
              {activeChatRoom.messages.map((message) =>
                message.isMine ? (
                  <div className="flex flex-col items-end gap-1" key={message.id}>
                    <div className="flex items-end gap-2">
                      <span className="text-[11px] leading-[16.5px] tracking-[0.06px] text-stone-400">
                        {message.time}
                      </span>
                      <div className="max-w-[199.5px] rounded-bl-2xl rounded-br-2xl rounded-tl-2xl rounded-tr bg-stone-900 px-[14px] py-[10px] text-sm leading-[19.25px] text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                        {message.text}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1" key={message.id}>
                    <p className="pl-1 text-xs leading-[18px] text-stone-400">
                      {message.author}
                    </p>
                    <div className="flex items-end gap-2">
                      <div className="max-w-[199.5px] rounded-bl-2xl rounded-br-2xl rounded-tl rounded-tr-2xl border border-stone-200 bg-white px-[15px] py-[11px] text-sm leading-[19.25px] text-stone-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                        {message.text}
                      </div>
                      <span className="text-[11px] leading-[16.5px] tracking-[0.06px] text-stone-400">
                        {message.time}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-stone-200 bg-white px-3 py-3">
              <input
                className="h-[43px] flex-1 rounded-full bg-stone-100 px-4 text-sm text-stone-900 outline-none placeholder:text-stone-500"
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="메시지 입력..."
                type="text"
                value={messageDraft}
              />
              <button
                className="flex h-[37px] w-[37px] items-center justify-center rounded-full bg-stone-900 text-sm text-white"
                onClick={handleChatSend}
                type="button"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isChatListOpen ? (
        <div className="fixed bottom-28 right-8 z-40 hidden w-[300px] xl:flex xl:flex-col xl:items-end xl:gap-4">
          <div className="flex h-[496px] w-[300px] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
            <div className="flex h-[65px] items-center border-b border-stone-100 px-6">
              <h3 className="text-base font-bold leading-6 text-stone-900">채팅</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chatRooms.map((chatRoom) => (
                <button
                  className="flex h-20 w-full items-center justify-between px-6 text-left transition hover:bg-stone-50"
                  key={chatRoom.id}
                  onClick={() => handleChatRoomOpen(chatRoom.id)}
                  type="button"
                >
                  <div className="space-y-1">
                    <p className="text-[15px] font-medium leading-[22.5px] text-stone-900">
                      {chatRoom.title}
                    </p>
                    <p className="text-[13px] leading-[19.5px] text-stone-400">
                      {chatRoom.previewParticipants}
                    </p>
                  </div>
                  <span className="text-sm font-medium leading-[21px] text-stone-900">
                    {chatRoom.unreadCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-4">
        <button
          className={
            isChatListOpen
              ? "flex h-[60px] w-[60px] items-center justify-center rounded-full bg-stone-900 text-2xl text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
              : "flex h-[60px] w-[60px] items-center justify-center rounded-full border border-stone-200 bg-white text-2xl text-stone-900 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          }
          onClick={() => {
            setIsChatListOpen((current) => !current);
            if (isChatListOpen) {
              setActiveChatRoomId(null);
            }
          }}
          type="button"
        >
          <span className="text-sm font-semibold uppercase">
            {isChatListOpen ? "x" : "chat"}
          </span>
        </button>
      </div>
    </div>
  );
}
