export type CreateTripRoomRequest = {
  title: string;
  startDate?: string;
  endDate?: string;
  thumbnailUrl: string | null;
};

export type TripRoomListItem = {
  tripRoomId: number;
  title: string;
  status: string;
  thumbnailUrl: string | null;
  memberCount: number;
  memberNamesPreview: string[];
  remainingMemberCount: number;
  hostUser: {
    id: number;
    name: string;
  };
  lastActivityAt: string;
  selectedBranchId: number | null;
};

export type TripRoomMember = {
  id: number;
  name: string;
  role: string;
  hasSubmittedPreference: boolean;
};

export type TripRoomSummary = {
  tripRoomId: number;
  title: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  thumbnailUrl: string | null;
  hostUser: {
    id: number;
    name: string;
  };
  memberCount: number;
  selectedBranchId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TripRoomDetailResponse = {
  tripRoomId: number;
  title: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  thumbnailUrl: string | null;
  hostUser: {
    id: number;
    name: string;
    email: string;
  };
  members: TripRoomMember[];
  summary: {
    memberCount: number;
    submittedPreferenceCount: number;
    proposalCount: number;
    branchCount: number;
    selectedBranchId: number | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type JoinInviteLinkResponse = {
  tripRoomId: number;
  joined: boolean;
  role: string;
};

export type CreateInviteLinkResponse = {
  inviteUrl: string;
  token: string;
  expiresAt: string;
};

export type UnlockTripRoomResponse = {
  tripRoomId: number;
  status: string;
  selectedBranchId: number | null;
  unlocked: boolean;
};

export type DecisionLogActionType =
  | "room_created"
  | "place_proposed"
  | "ai_branch_generated"
  | "branch_create"
  | "branch_update"
  | "branch_delete"
  | "proposal_delete"
  | "trip_room_finalize"
  | "trip_room_unlock";

export type DecisionLogTargetType = "trip_room" | "proposal" | "branch";

export type DecisionLogData = Record<string, unknown> | null;

export type DecisionLogItem = {
  logId: number;
  tripRoomId: number;
  actionType: DecisionLogActionType;
  targetType: DecisionLogTargetType;
  targetId: number;
  actor: {
    id: number;
    name: string;
  };
  beforeData: DecisionLogData;
  afterData: DecisionLogData;
  createdAt: string;
};