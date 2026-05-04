export type ChatRoomLastMessage = {
  content: string;
  senderName: string;
  createdAt: string;
};

export type ChatRoomListItem = {
  chatRoomId: number | null;
  tripRoomId: number;
  tripRoomTitle: string;
  thumbnailUrl: string | null;
  lastMessage: ChatRoomLastMessage | null;
  updatedAt: string;
};

export type ChatMessageSender = {
  id: number;
  name: string;
};

export type ChatMessage = {
  messageId: number;
  tripRoomId: number;
  sender: ChatMessageSender;
  content: string;
  createdAt: string;
};

export type ChatMessagesResponse = {
  tripRoomId: number;
  tripRoomTitle: string;
  chatMessages: ChatMessage[];
};
