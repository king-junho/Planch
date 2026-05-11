import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, RefreshCw, Send, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import {
  getChatMessages,
  getChatRooms,
  sendChatMessage,
} from "../../api/chatApi";
import { getAccessToken, getAuthUser } from "../../services/authStorage";
import {
  ChatMessage,
  ChatMessagesResponse,
  ChatRoomListItem,
} from "../../types/chat";
import { resolveImageUrl } from "../../utils/image";

const hiddenPathnames = new Set(["/login", "/register"]);
const socketUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type ChatJoinAck = {
  ok: boolean;
  tripRoomId?: number;
  room?: string;
  message?: string;
};

type ChatSendAck = {
  ok: boolean;
  message?: ChatMessage | string;
};

class SocketAckTimeoutError extends Error {
  constructor() {
    super("Socket ack timeout");
  }
}

function formatChatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getMessageKey(message: ChatMessage) {
  return `${message.tripRoomId}-${message.messageId}-${message.createdAt}`;
}

function getSenderName(message: ChatMessage) {
  return message.sender?.name ?? "알 수 없음";
}

export default function FloatingChatRooms() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoomListItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [listErrorMessage, setListErrorMessage] = useState("");
  const [activeTripRoomId, setActiveTripRoomId] = useState<number | null>(null);
  const [activeChat, setActiveChat] = useState<ChatMessagesResponse | null>(null);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [messageErrorMessage, setMessageErrorMessage] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [sendErrorMessage, setSendErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [socketErrorMessage, setSocketErrorMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const joinedTripRoomIdRef = useRef<number | null>(null);
  const activeTripRoomIdRef = useRef<number | null>(null);
  const chatRoomsRef = useRef<ChatRoomListItem[]>([]);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const authUser = getAuthUser();

  const canShow = useMemo(
    () => Boolean(getAccessToken()) && !hiddenPathnames.has(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    if (!canShow) {
      setIsOpen(false);
      setActiveTripRoomId(null);
      setActiveChat(null);
      setMessageDraft("");
      setSendErrorMessage("");
      setSocketErrorMessage("");
    }
  }, [canShow]);

  useEffect(() => {
  const savedTripRoomId = localStorage.getItem("activeTripRoomId");
  if (!savedTripRoomId) return;

  const parsed = Number(savedTripRoomId);
  if (Number.isNaN(parsed)) return;

  setActiveTripRoomId(parsed);
}, []);

  useEffect(() => {
    activeTripRoomIdRef.current = activeTripRoomId;
  }, [activeTripRoomId]);

  useEffect(() => {
    chatRoomsRef.current = chatRooms;
  }, [chatRooms]);

  useEffect(() => {
    if (!activeTripRoomId || !activeChat) {
      return;
    }

    requestAnimationFrame(() => {
      messageListRef.current?.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [activeTripRoomId, activeChat?.chatMessages.length]);

  useEffect(() => {
    if (!canShow || !isOpen) {
      return;
    }

    let isMounted = true;

    async function loadChatRooms() {
      setIsListLoading(true);
      setListErrorMessage("");

      try {
        const response = await getChatRooms();

        if (isMounted) {
          setChatRooms(response);
        }
      } catch (caughtError) {
        if (!isMounted) return;

        setListErrorMessage(
          caughtError instanceof Error && caughtError.message.trim()
            ? caughtError.message
            : "채팅 목록을 불러오지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsListLoading(false);
        }
      }
    }

    loadChatRooms();

    return () => {
      isMounted = false;
    };
  }, [canShow, isOpen]);

  useEffect(() => {
  if (!canShow || !isOpen || !activeTripRoomId) {
    return;
  }

  void loadMessages(activeTripRoomId);
}, [canShow, isOpen, activeTripRoomId]);

  useEffect(() => {
    if (!canShow || !activeTripRoomId) {
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      setSocketErrorMessage("인증 토큰이 없습니다.");
      return;
    }

    const socket = io(socketUrl, {
      auth: {
        token: accessToken,
      },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketErrorMessage("");
      socket.emit(
        "chat:join",
        { tripRoomId: activeTripRoomId },
        (ack: ChatJoinAck) => {
          if (ack?.ok) {
            joinedTripRoomIdRef.current = activeTripRoomId;
            setSocketErrorMessage("");
            return;
          }

          setSocketErrorMessage(
            ack?.message || "채팅방 실시간 연결에 실패했습니다."
          );
        }
      );
    });

    socket.on("connect_error", (error) => {
      setSocketErrorMessage(error.message || "채팅 서버에 연결하지 못했습니다.");
    });

    socket.on("chat:message", (message: ChatMessage) => {
      appendMessage(message);
    });

    return () => {
      socket.emit("chat:leave", { tripRoomId: activeTripRoomId });
      socket.disconnect();
      socketRef.current = null;
      joinedTripRoomIdRef.current = null;
    };
  }, [canShow, activeTripRoomId]);

  if (!canShow) {
    return null;
  }

  async function loadMessages(tripRoomId: number) {
    setIsMessageLoading(true);
    setMessageErrorMessage("");

    try {
      const response = await getChatMessages(tripRoomId);
      setActiveChat({
        ...response,
        chatMessages: Array.isArray(response.chatMessages) ? response.chatMessages : [],
      });
    } catch (caughtError) {
      setMessageErrorMessage(
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "채팅 조회 중 서버 오류가 발생했습니다."
      );
    } finally {
      setIsMessageLoading(false);
    }
  }

  function handleChatRoomClick(tripRoomId: number) {
    localStorage.setItem("activeTripRoomId", String(tripRoomId));
    setActiveTripRoomId(tripRoomId);
    setActiveChat(null);
    setMessageDraft("");
    setSendErrorMessage("");
    setSocketErrorMessage("");
    void loadMessages(tripRoomId);
  }

  async function handleRefresh() {
    if (activeTripRoomId) {
      await loadMessages(activeTripRoomId);
      return;
    }

    setIsListLoading(true);
    setListErrorMessage("");

    try {
      const response = await getChatRooms();
      setChatRooms(response);
    } catch (caughtError) {
      setListErrorMessage(
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "채팅 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsListLoading(false);
    }
  }

  function renderMessage(message: ChatMessage) {
    const isMine = authUser?.id === message.sender?.id;
    const senderName = getSenderName(message);

    return (
      <div
        className={isMine ? "flex flex-col items-end gap-1" : "space-y-1"}
        key={getMessageKey(message)}
      >
        {!isMine ? (
          <p className="pl-1 text-xs leading-[18px] text-stone-400">
            {senderName}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          {isMine ? (
            <span className="shrink-0 text-[11px] leading-4 text-stone-400">
              {formatChatTime(message.createdAt)}
            </span>
          ) : null}
          <div
            className={
              isMine
                ? "max-w-[220px] rounded-bl-2xl rounded-br-2xl rounded-tl-2xl rounded-tr-md bg-stone-900 px-[14px] py-[10px] text-sm leading-5 text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                : "max-w-[220px] rounded-bl-2xl rounded-br-2xl rounded-tl-md rounded-tr-2xl border border-stone-200 bg-white px-[14px] py-[10px] text-sm leading-5 text-stone-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
            }
          >
            {message.content}
          </div>
          {!isMine ? (
            <span className="shrink-0 text-[11px] leading-4 text-stone-400">
              {formatChatTime(message.createdAt)}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  function appendMessage(message: ChatMessage) {
  setActiveChat((current) => {
    if (!current && activeTripRoomIdRef.current === message.tripRoomId) {
      return {
        tripRoomId: message.tripRoomId,
        tripRoomTitle:
          chatRoomsRef.current.find(
            (chatRoom) => chatRoom.tripRoomId === message.tripRoomId
          )?.tripRoomTitle ?? "채팅",
        chatMessages: [message],
      };
    }

    if (!current || current.tripRoomId !== message.tripRoomId) {
      return current;
    }

    if (
      current.chatMessages.some(
        (currentMessage) => currentMessage.messageId === message.messageId
      )
    ) {
      return current;
    }

    return {
      ...current,
      chatMessages: [...current.chatMessages, message],
    };
  });

  setChatRooms((current) =>
    current.map((chatRoom) =>
      chatRoom.tripRoomId === message.tripRoomId
        ? {
            ...chatRoom,
            lastMessage: {
              content: message.content,
              senderName: getSenderName(message),
              createdAt: message.createdAt,
            },
            updatedAt: message.createdAt,
          }
        : chatRoom
    )
  );
}

  async function handleSendMessage() {
    const content = messageDraft.trim();

    if (!activeTripRoomId || !content || isSending) {
      return;
    }

    setIsSending(true);
    setSendErrorMessage("");

    try {
      const socket = socketRef.current;

      if (socket?.connected && joinedTripRoomIdRef.current === activeTripRoomId) {
        const ack = await new Promise<ChatSendAck>((resolve, reject) => {
          const timeout = window.setTimeout(() => {
            reject(new SocketAckTimeoutError());
          }, 2500);

          socket.emit(
            "chat:send",
            { tripRoomId: activeTripRoomId, content },
            (response: ChatSendAck) => {
              window.clearTimeout(timeout);
              resolve(response);
            }
          );
        }).catch(async (caughtError) => {
          if (caughtError instanceof SocketAckTimeoutError) {
            const sentMessage = await sendChatMessage(activeTripRoomId, content);
            return {
              ok: true,
              message: sentMessage,
            } satisfies ChatSendAck;
          }

          throw caughtError;
        });

        if (!ack.ok) {
          throw new Error(
            typeof ack.message === "string"
              ? ack.message
              : "메시지 전송 중 서버 오류가 발생했습니다."
          );
        }

        if (ack.message && typeof ack.message === "object") {
          appendMessage(ack.message);
        }
      } else {
        const sentMessage = await sendChatMessage(activeTripRoomId, content);
        appendMessage(sentMessage);
      }

      setMessageDraft("");
    } catch (caughtError) {
      setSendErrorMessage(
        caughtError instanceof Error && caughtError.message.trim()
          ? caughtError.message
          : "메시지 전송 중 서버 오류가 발생했습니다."
      );
    } finally {
      setIsSending(false);
    }
  }

  const activeChatRoomInfo = useMemo(() => chatRooms.find((chatRoom) => chatRoom.tripRoomId === activeTripRoomId) ?? null, [chatRooms, activeTripRoomId]);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      {isOpen ? (
        <section
          aria-label="채팅방 목록"
          className="flex h-[min(496px,calc(100vh-120px))] w-[calc(100vw-32px)] max-w-[340px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_20px_60px_rgba(28,25,23,0.18)]"
        >
          <div className="flex h-16 items-center justify-between border-b border-stone-100 px-5">
            <div className="flex min-w-0 items-center gap-2">
              {activeTripRoomId ? (
                <button
                  aria-label="채팅 목록으로 돌아가기"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                  onClick={() => {
                    localStorage.removeItem("activeTripRoomId");
                    setActiveTripRoomId(null);
                    setActiveChat(null);
                    setMessageErrorMessage("");
                    setMessageDraft("");
                    setSendErrorMessage("");
                  }}
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : null}
              {activeTripRoomId ? (
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                  <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={resolveImageUrl(activeChatRoomInfo?.thumbnailUrl, "https://placehold.co/80x80")}
                  />
                </div>) : null}
                
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold leading-6 text-stone-900">
                    {activeChat?.tripRoomTitle ?? activeChatRoomInfo?.tripRoomTitle ??"채팅"}
                  </h2>
                  <p className="text-xs leading-5 text-stone-400">
                    {activeTripRoomId ? "메시지" : "참여 중인 여행방"}
                  </p>
                </div>
            </div>
            <button
              aria-label="채팅 새로고침"
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isListLoading || isMessageLoading}
              onClick={handleRefresh}
              type="button"
            >
              <RefreshCw
                className={
                  isListLoading || isMessageLoading
                    ? "h-4 w-4 animate-spin"
                    : "h-4 w-4"
                }
              />
            </button>
          </div>

          {activeTripRoomId ? (
            <div className="flex min-h-0 flex-1 flex-col bg-[#FCFCFC]">
              <div
                className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
                ref={messageListRef}
              >
                {isMessageLoading && !activeChat ? (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-stone-500">
                    메시지를 불러오는 중입니다.
                  </div>
                ) : messageErrorMessage ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                    {messageErrorMessage}
                  </div>
                ) : !activeChat || activeChat.chatMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-stone-500">
                    아직 메시지가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {activeChat?.chatMessages.map((message) => renderMessage(message))}
                  </div>
                )}
              </div>

              <div className="border-t border-stone-200 bg-white px-3 py-3">
                {sendErrorMessage ? (
                  <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">
                    {sendErrorMessage}
                  </p>
                ) : null}
                {socketErrorMessage ? (
                  <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                    {socketErrorMessage}
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <input
                    className="h-11 min-w-0 flex-1 rounded-full bg-stone-100 px-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-stone-200"
                    disabled={isSending || Boolean(messageErrorMessage)}
                    onChange={(event) => {
                      setMessageDraft(event.target.value);
                      setSendErrorMessage("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder="메시지 입력..."
                    type="text"
                    value={messageDraft}
                  />
                  <button
                    aria-label="메시지 전송"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                    disabled={
                      isSending ||
                      !messageDraft.trim() ||
                      Boolean(messageErrorMessage)
                    }
                    onClick={() => void handleSendMessage()}
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {isListLoading && chatRooms.length === 0 ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-stone-500">
                  채팅 목록을 불러오는 중입니다.
                </div>
              ) : listErrorMessage ? (
                <div className="m-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                  {listErrorMessage}
                </div>
              ) : chatRooms.length === 0 ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-stone-500">
                  참여 중인 여행방 채팅이 없습니다.
                </div>
              ) : (
                chatRooms.map((chatRoom) => (
                  <button
                    className="flex w-full items-center gap-3 border-b border-stone-100 px-5 py-4 text-left transition hover:bg-stone-50"
                    key={`${chatRoom.tripRoomId}-${chatRoom.chatRoomId ?? "empty"}`}
                    onClick={() => handleChatRoomClick(chatRoom.tripRoomId)}
                    type="button"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      <img
                      alt={`${chatRoom.tripRoomTitle} 썸네일`}
                      className="h-full w-full object-cover"
                      src={resolveImageUrl(chatRoom.thumbnailUrl, "https://placehold.co/96x96")}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[15px] font-semibold leading-6 text-stone-900">
                          {chatRoom.tripRoomTitle}
                        </p>
                        <span className="shrink-0 text-[11px] leading-4 text-stone-400">
                          {formatChatTime(
                            chatRoom.lastMessage?.createdAt ?? chatRoom.updatedAt
                          )}
                        </span>
                      </div>
                      <p className="truncate text-sm leading-5 text-stone-500">
                        {chatRoom.lastMessage
                          ? `${chatRoom.lastMessage.senderName}: ${chatRoom.lastMessage.content}`
                          : "아직 메시지가 없습니다."}
                      </p>
                    </div>

                    <MessageCircle className="h-4 w-4 shrink-0 text-stone-300" />
                  </button>
                ))
              )}
            </div>
          )}
        </section>
      ) : null}

      <button
        aria-label={isOpen ? "채팅 목록 닫기" : "채팅 목록 열기"}
        className={
          isOpen
            ? "flex h-[60px] w-[60px] items-center justify-center rounded-full bg-stone-900 text-white shadow-[0_10px_30px_rgba(28,25,23,0.25)] transition hover:bg-stone-800"
            : "flex h-[60px] w-[60px] items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900 shadow-[0_10px_30px_rgba(28,25,23,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(28,25,23,0.2)]"
        }
        onClick={() => {
          setIsOpen((current) => !current);
          if (isOpen) {
            localStorage.removeItem("activeTripRoomId");
            setActiveTripRoomId(null);
            setActiveChat(null);
            setMessageDraft("");
            setSendErrorMessage("");
            setSocketErrorMessage("");
          }
        }}
        type="button"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
