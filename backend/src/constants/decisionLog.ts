export const DECISION_LOG_ACTION = {
  ROOM_CREATED: "room_created",
  PLACE_PROPOSED: "place_proposed",
  AI_BRANCH_GENERATED: "ai_branch_generated",
  BRANCH_CREATE: "branch_create",
  BRANCH_UPDATE: "branch_update",
  BRANCH_DELETE: "branch_delete",
  PROPOSAL_DELETE: "proposal_delete",
  TRIP_ROOM_FINALIZE: "trip_room_finalize",
  TRIP_ROOM_UNLOCK: "trip_room_unlock",
  DECISION_DEADLINE_SET : "decision_deadline_set",
  DECISION_DEADLINE_UPDATED : "decision_deadline_updated",
  DECISION_DEADLINE_CLEARED: "decision_deadline_cleared",
} as const;

export const DECISION_LOG_TARGET = {
  TRIP_ROOM: "trip_room",
  PROPOSAL: "proposal",
  BRANCH: "branch",
} as const;