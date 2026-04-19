import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TripRoomHeader from "../components/layout/TripRoomHeader";

type VoteStatus = "in_progress" | "on_hold" | "completed";

type VoteSummary = {
  id: number;
  category: string;
  title: string;
  status: VoteStatus;
};

type VoteChoice = {
  label: string;
  agree: number;
  disagree: number;
  hold: number;
  selected: "agree" | "disagree" | "hold" | "";
};

const initialVoteSummaries: VoteSummary[] = [
  { id: 1, category: "여행지", title: "어디로 갈까요?", status: "in_progress" },
  { id: 2, category: "여행날짜", title: "언제 갈까요?", status: "on_hold" },
  { id: 3, category: "여행기간", title: "며칠 동안 갈까요?", status: "completed" },
];

const initialDestinationVotes: VoteChoice[] = [
  { label: "부산 해운대", agree: 2, disagree: 1, hold: 0, selected: "agree" },
  { label: "강원도 강릉", agree: 0, disagree: 2, hold: 1, selected: "hold" },
  { label: "제주도", agree: 1, disagree: 0, hold: 2, selected: "" },
];

const initialDateVotes: VoteChoice[] = [
  { label: "5월 첫째 주", agree: 2, disagree: 0, hold: 1, selected: "agree" },
  { label: "5월 둘째 주", agree: 1, disagree: 1, hold: 1, selected: "" },
  { label: "5월 셋째 주", agree: 0, disagree: 2, hold: 1, selected: "disagree" },
];

const initialDurationVotes: VoteChoice[] = [
  { label: "당일치기", agree: 0, disagree: 3, hold: 0, selected: "" },
  { label: "1박 2일", agree: 2, disagree: 0, hold: 1, selected: "agree" },
  { label: "2박 3일", agree: 1, disagree: 1, hold: 1, selected: "hold" },
];

function VoteOption({
  label,
  count,
  disabled,
  onClick,
  selected,
  tone,
}: {
  label: string;
  count: number;
  disabled?: boolean;
  onClick: () => void;
  selected: boolean;
  tone: "blue" | "gray";
}) {
  const selectedClass =
    tone === "blue"
      ? "border-[#8EC5FF] bg-[#EFF6FF] text-[#1447E6] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
      : "border-[#D1D5DC] bg-[#F3F4F6] text-[#364153] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]";

  return (
    <button
      className={`flex h-[63.5px] flex-1 flex-col items-center justify-center gap-1 rounded-lg border text-[13px] font-bold ${
        selected ? selectedClass : "border-stone-200 bg-white text-stone-600"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <span className="text-xs font-medium opacity-80">{count}표</span>
    </button>
  );
}

function statusLabel(status: VoteStatus) {
  if (status === "in_progress") return "투표중";
  if (status === "on_hold") return "보류";
  return "투표 마감";
}

function statusBadgeClass(status: VoteStatus) {
  if (status === "in_progress") {
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  }

  if (status === "on_hold") {
    return "bg-stone-100 text-stone-600 ring-1 ring-stone-200";
  }

  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
}

export default function TripSchedulePage() {
  const { tripRoomId = "3" } = useParams();
  const [isVoteMenuOpen, setIsVoteMenuOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [voteSummaries, setVoteSummaries] = useState(initialVoteSummaries);
  const [savedVoteSummaries, setSavedVoteSummaries] = useState(initialVoteSummaries);
  const [destinationVotes, setDestinationVotes] = useState(initialDestinationVotes);
  const [dateVotes, setDateVotes] = useState(initialDateVotes);
  const [durationVotes, setDurationVotes] = useState(initialDurationVotes);
  const [activeVoteId, setActiveVoteId] = useState(initialVoteSummaries[0].id);
  const [statusFilter, setStatusFilter] = useState<"all" | VoteStatus>("all");
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedChoiceLabel, setSelectedChoiceLabel] = useState<string | null>(null);
  const [newProposal, setNewProposal] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const activeVote =
    voteSummaries.find((voteSummary) => voteSummary.id === activeVoteId) ??
    voteSummaries[0];

  const activeVoteChoices =
    activeVote.category === "여행지"
      ? destinationVotes
      : activeVote.category === "여행날짜"
      ? dateVotes
      : durationVotes;

  const filteredVoteSummaries = voteSummaries.filter((voteSummary) =>
    statusFilter === "all" ? true : voteSummary.status === statusFilter
  );

  const hasUnsavedChanges =
    JSON.stringify(voteSummaries) !== JSON.stringify(savedVoteSummaries);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    setSelectedChoiceLabel(null);
    setDeleteConfirmOpen(false);
  }, [activeVoteId]);

  function handleStatusChange(status: VoteStatus) {
    setVoteSummaries((currentVoteSummaries) =>
      currentVoteSummaries.map((voteSummary) =>
        voteSummary.id === activeVoteId ? { ...voteSummary, status } : voteSummary
      )
    );
    setSaveMessage("");
  }

  function handleSaveVotes() {
    setSavedVoteSummaries(voteSummaries);
    setSaveMessage("투표 상태가 저장되었습니다.");
    setToast({ type: "success", message: "투표 상태가 저장되었습니다." });
  }

  function handleAddProposal() {
    if (!newProposal.trim()) {
      setToast({ type: "error", message: "제안할 여행지를 입력해 주세요." });
      return;
    }

    const nextChoice = {
      label: newProposal.trim(),
      agree: 0,
      disagree: 0,
      hold: 0,
      selected: "" as const,
    };

    if (activeVote.category === "여행지") {
      setDestinationVotes((currentVotes) => [...currentVotes, nextChoice]);
    } else if (activeVote.category === "여행날짜") {
      setDateVotes((currentVotes) => [...currentVotes, nextChoice]);
    } else {
      setDurationVotes((currentVotes) => [...currentVotes, nextChoice]);
    }

    setNewProposal("");
    setIsProposalModalOpen(false);
    setToast({ type: "success", message: "새로운 제안이 추가되었습니다." });
  }

  function updateVoteChoices(
    choices: VoteChoice[],
    choiceLabel: string,
    nextSelection: "agree" | "disagree" | "hold"
  ) {
    return choices.map((choice) => {
      if (choice.label !== choiceLabel) {
        return choice;
      }

      const updatedChoice = { ...choice };

      if (updatedChoice.selected === nextSelection) {
        return updatedChoice;
      }

      if (updatedChoice.selected === "agree") updatedChoice.agree -= 1;
      if (updatedChoice.selected === "disagree") updatedChoice.disagree -= 1;
      if (updatedChoice.selected === "hold") updatedChoice.hold -= 1;

      if (nextSelection === "agree") updatedChoice.agree += 1;
      if (nextSelection === "disagree") updatedChoice.disagree += 1;
      if (nextSelection === "hold") updatedChoice.hold += 1;

      updatedChoice.selected = nextSelection;
      return updatedChoice;
    });
  }

  function handleVoteChoiceSelect(
    choiceLabel: string,
    nextSelection: "agree" | "disagree" | "hold"
  ) {
    if (activeVote.status !== "in_progress") {
      setToast({
        type: "error",
        message:
          activeVote.status === "completed"
            ? "마감된 투표는 선택할 수 없습니다."
            : "보류된 투표는 진행중일 때만 선택할 수 있습니다.",
      });
      return;
    }

    if (activeVote.category === "여행지") {
      setDestinationVotes((currentChoices) =>
        updateVoteChoices(currentChoices, choiceLabel, nextSelection)
      );
    } else if (activeVote.category === "여행날짜") {
      setDateVotes((currentChoices) =>
        updateVoteChoices(currentChoices, choiceLabel, nextSelection)
      );
    } else {
      setDurationVotes((currentChoices) =>
        updateVoteChoices(currentChoices, choiceLabel, nextSelection)
      );
    }

    setToast({ type: "success", message: "투표가 반영되었습니다." });
  }

  function handleDeleteChoiceConfirm() {
    if (!selectedChoiceLabel) {
      setToast({ type: "error", message: "먼저 삭제할 항목을 선택해 주세요." });
      return;
    }

    setDeleteConfirmOpen(true);
  }

  function handleDeleteChoice() {
    if (!selectedChoiceLabel) {
      setDeleteConfirmOpen(false);
      return;
    }

    if (activeVote.category === "여행지") {
      setDestinationVotes((currentChoices) =>
        currentChoices.filter((choice) => choice.label !== selectedChoiceLabel)
      );
    } else if (activeVote.category === "여행날짜") {
      setDateVotes((currentChoices) =>
        currentChoices.filter((choice) => choice.label !== selectedChoiceLabel)
      );
    } else {
      setDurationVotes((currentChoices) =>
        currentChoices.filter((choice) => choice.label !== selectedChoiceLabel)
      );
    }

    setDeleteConfirmOpen(false);
    setSelectedChoiceLabel(null);
    setToast({ type: "success", message: "선택한 항목이 삭제되었습니다." });
  }

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <TripRoomHeader
        activeItem="plan"
        onMenuClick={() => setIsVoteMenuOpen((current) => !current)}
        tripRoomId={tripRoomId}
      />

      <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-8 pb-16 pt-10">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold leading-9 text-stone-900">랩실 MT</h1>
          <p className="text-xl leading-[30px] text-stone-500">
            김준호, 복성준, 김호영, 최병욱
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[344.6px_minmax(0,1fr)]">
          <section className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold leading-[27px] text-stone-900">
                  투표 목록
                </h2>
                <span className="text-sm text-stone-500">
                  총 {filteredVoteSummaries.length}개
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    statusFilter === "all"
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => setStatusFilter("all")}
                  type="button"
                >
                  전체
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    statusFilter === "in_progress"
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => setStatusFilter("in_progress")}
                  type="button"
                >
                  투표 진행중
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    statusFilter === "on_hold"
                      ? "bg-stone-100 text-stone-700 ring-1 ring-stone-300"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => setStatusFilter("on_hold")}
                  type="button"
                >
                  투표 보류
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    statusFilter === "completed"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => setStatusFilter("completed")}
                  type="button"
                >
                  투표 마감
                </button>
              </div>
            </div>

            {filteredVoteSummaries.map((vote) => (
              <button
                className={`w-full rounded-2xl border bg-white px-5 py-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.1)] ${
                  vote.id === activeVoteId
                    ? "border-stone-900 ring-1 ring-stone-900"
                    : "border-stone-200"
                }`}
                key={vote.id}
                onClick={() => setActiveVoteId(vote.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex rounded-md bg-stone-100 px-2 py-1 text-xs font-medium leading-[18px] text-stone-600">
                    {vote.category}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                      vote.status
                    )}`}
                  >
                    {statusLabel(vote.status)}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold leading-[24.75px] text-stone-900">
                  {vote.title}
                </p>
                <p className="mt-2 text-sm text-stone-400">
                  현재 상태: {statusLabel(vote.status)}
                </p>
              </button>
            ))}

            {filteredVoteSummaries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-5 py-8 text-center text-sm text-stone-500">
                해당 상태의 투표가 없습니다.
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white px-[25px] py-[25px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-md bg-stone-100 px-2 py-1 text-xs font-medium leading-[18px] text-stone-600">
                  {activeVote.category} 투표
                </span>
                <h2 className="mt-3 text-xl font-bold leading-[27.5px] text-stone-900">
                  {activeVote.title}
                </h2>
                <p className="mt-2 text-sm leading-[21px] text-stone-500">
                  각 항목에 대해 의견을 남겨주세요.
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusBadgeClass(
                  activeVote.status
                )}`}
              >
                {statusLabel(activeVote.status)}
              </span>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-stone-600">
                상태 변경은 좌측 상단 메뉴에서 관리할 수 있습니다.
              </p>
              {activeVote.status !== "in_progress" ? (
                <p className="mt-2 text-sm font-medium text-amber-700">
                  {activeVote.status === "completed"
                    ? "이 투표는 마감되어 더 이상 선택할 수 없습니다."
                    : "이 투표는 보류 상태라 선택할 수 없습니다."}
                </p>
              ) : null}
            </div>

            <div className="mt-8 space-y-4">
              {activeVoteChoices.map((vote) => (
                <article
                  className={`rounded-xl border bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)] ${
                    selectedChoiceLabel === vote.label
                      ? "border-stone-900 ring-1 ring-stone-900"
                      : "border-stone-200"
                  }`}
                  key={vote.label}
                  onClick={() => setSelectedChoiceLabel(vote.label)}
                >
                  <h3 className="text-base font-semibold leading-6 text-stone-900">
                    {vote.label}
                  </h3>

                  <div className="mt-3 flex gap-2">
                    <VoteOption
                      count={vote.agree}
                      disabled={activeVote.status !== "in_progress"}
                      label="찬성"
                      onClick={() => handleVoteChoiceSelect(vote.label, "agree")}
                      selected={vote.selected === "agree"}
                      tone="blue"
                    />
                    <VoteOption
                      count={vote.disagree}
                      disabled={activeVote.status !== "in_progress"}
                      label="반대"
                      onClick={() => handleVoteChoiceSelect(vote.label, "disagree")}
                      selected={vote.selected === "disagree"}
                      tone="gray"
                    />
                    <VoteOption
                      count={vote.hold}
                      disabled={activeVote.status !== "in_progress"}
                      label="보류"
                      onClick={() => handleVoteChoiceSelect(vote.label, "hold")}
                      selected={vote.selected === "hold"}
                      tone="gray"
                    />
                  </div>
                </article>
              ))}

              <button
                className="flex h-[51px] w-full items-center justify-center rounded-xl border border-stone-300 text-sm font-medium text-stone-500"
                onClick={() => setIsProposalModalOpen(true)}
                type="button"
              >
                새로운 제안 추가하기
              </button>
            </div>

            <div className="mt-7 border-t border-stone-200 pt-5">
              {saveMessage ? (
                <p className="mb-3 text-sm font-medium text-emerald-700">
                  {saveMessage}
                </p>
              ) : null}
              <button
                className="h-[52px] w-full rounded-lg bg-stone-900 text-base font-medium text-white"
                onClick={handleDeleteChoiceConfirm}
                type="button"
              >
                선택 항목 삭제하기
              </button>
            </div>
          </section>
        </section>
      </main>

      {isVoteMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-black/30">
          <div className="h-full w-full max-w-[380px] overflow-y-auto border-r border-stone-200 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900">투표 관리</h2>
                <p className="mt-1 text-sm text-stone-500">
                  투표 목록을 확인하고 상태를 관리하세요.
                </p>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-xl text-stone-600"
                onClick={() => setIsVoteMenuOpen(false)}
                type="button"
              >
                x
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold leading-[27px] text-stone-900">
                  투표 목록
                </h3>
                <span className="text-sm text-stone-500">
                  총 {filteredVoteSummaries.length}개
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    statusFilter === "all"
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => setStatusFilter("all")}
                  type="button"
                >
                  전체
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    statusFilter === "in_progress"
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => setStatusFilter("in_progress")}
                  type="button"
                >
                  투표중
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    statusFilter === "on_hold"
                      ? "bg-stone-100 text-stone-700 ring-1 ring-stone-300"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => setStatusFilter("on_hold")}
                  type="button"
                >
                  투표 보류
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    statusFilter === "completed"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => setStatusFilter("completed")}
                  type="button"
                >
                  투표 마감
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {filteredVoteSummaries.map((vote) => (
                <button
                  className={`w-full rounded-2xl border bg-white px-5 py-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.1)] ${
                    vote.id === activeVoteId
                      ? "border-stone-900 ring-1 ring-stone-900"
                      : "border-stone-200"
                  }`}
                  key={vote.id}
                  onClick={() => setActiveVoteId(vote.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-md bg-stone-100 px-2 py-1 text-xs font-medium leading-[18px] text-stone-600">
                      {vote.category}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                        vote.status
                      )}`}
                    >
                      {statusLabel(vote.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold leading-[24.75px] text-stone-900">
                    {vote.title}
                  </p>
                  <p className="mt-2 text-sm text-stone-400">
                    현재 상태: {statusLabel(vote.status)}
                  </p>
                </button>
              ))}

              {filteredVoteSummaries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-5 py-8 text-center text-sm text-stone-500">
                  해당 상태의 투표가 없습니다.
                </div>
              ) : null}
            </div>

            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-medium text-stone-600">선택한 투표 상태 설정</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    activeVote.status === "in_progress"
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => handleStatusChange("in_progress")}
                  type="button"
                >
                  투표 진행중
                </button>
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    activeVote.status === "on_hold"
                      ? "bg-stone-100 text-stone-700 ring-1 ring-stone-300"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => handleStatusChange("on_hold")}
                  type="button"
                >
                  투표 보류
                </button>
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    activeVote.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                  onClick={() => handleStatusChange("completed")}
                  type="button"
                >
                  투표 마감
                </button>
              </div>

              <div className="mt-4">
                {saveMessage ? (
                  <p className="mb-3 text-sm font-medium text-emerald-700">
                    {saveMessage}
                  </p>
                ) : null}
                <button
                  className="h-[52px] w-full rounded-lg bg-stone-900 text-base font-medium text-white"
                  onClick={handleSaveVotes}
                  type="button"
                >
                  투표 저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isProposalModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900">새로운 제안 추가</h3>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-lg text-stone-600"
                onClick={() => setIsProposalModalOpen(false)}
                type="button"
              >
                x
              </button>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-stone-700">
                {activeVote.category === "여행지"
                  ? "여행지 이름"
                  : activeVote.category === "여행날짜"
                  ? "여행 날짜 후보"
                  : "여행 기간 후보"}
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-300"
                onChange={(event) => setNewProposal(event.target.value)}
                placeholder={
                  activeVote.category === "여행지"
                    ? "예: 경주 황리단길"
                    : activeVote.category === "여행날짜"
                    ? "예: 6월 둘째 주"
                    : "예: 3박 4일"
                }
                type="text"
                value={newProposal}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600"
                onClick={() => setIsProposalModalOpen(false)}
                type="button"
              >
                취소
              </button>
              <button
                className="rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
                onClick={handleAddProposal}
                type="button"
              >
                제안 추가
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      {deleteConfirmOpen ? (
        <div className="fixed bottom-6 right-6 z-[70]">
          <div className="w-[320px] rounded-2xl bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.16)] ring-1 ring-stone-200">
            <p className="text-sm font-semibold text-stone-900">
              정말 삭제하겠습니까?
            </p>
            <p className="mt-2 text-sm text-stone-500">
              선택한 항목: {selectedChoiceLabel}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600"
                onClick={() => setDeleteConfirmOpen(false)}
                type="button"
              >
                아니오
              </button>
              <button
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={handleDeleteChoice}
                type="button"
              >
                예
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
