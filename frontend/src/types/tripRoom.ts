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
