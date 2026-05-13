export type TripRoomDecisionGuardInput = {
  status: string;
  decisionDeadline: Date | null;
};

export function assertTripRoomDecisionOpen({
  status,
  decisionDeadline,
}: TripRoomDecisionGuardInput) {
  if (status === "locked") {
    throw new Error("Trip room is locked");
  }

  if (decisionDeadline && decisionDeadline.getTime() <= Date.now()) {
    throw new Error("Decision deadline passed");
  }
}