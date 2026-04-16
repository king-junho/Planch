import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TripRoomHeader from "../components/layout/TripRoomHeader";

const budgetMarks = [5, 50, 100];
const travelStyleOptions = [
  "맛집",
  "카페",
  "관광",
  "휴식",
  "사진스팟",
  "쇼핑",
  "액티비티",
];
const timeOptions = ["오전", "오후", "저녁"];

function budgetLabel(value: number) {
  if (value >= 100) {
    return "100만원+";
  }

  return `${value}만원 이하`;
}

function tagInputClass(tone: "blue" | "red") {
  return tone === "blue"
    ? "border-blue-100 bg-blue-50 text-blue-700"
    : "border-red-100 bg-red-50 text-red-700";
}

export default function TripPreferencePage() {
  const { tripRoomId = "3" } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(30);
  const [selectedStyles, setSelectedStyles] = useState(["맛집", "사진스팟"]);
  const [preferredInput, setPreferredInput] = useState("");
  const [preferredTags, setPreferredTags] = useState(["아르떼뮤지엄"]);
  const [avoidedInput, setAvoidedInput] = useState("");
  const [avoidedTags, setAvoidedTags] = useState(["웨이팅 긴 곳"]);
  const [selectedTimes, setSelectedTimes] = useState(["오후"]);
  const [notes, setNotes] = useState(
    "뚜벅이 여행이라 이동 동선이 짧았으면 좋겠어요. 숙소는 꼭 바다가 보이는 곳으로!"
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const budgetPercent = useMemo(() => {
    const min = budgetMarks[0];
    const max = budgetMarks[budgetMarks.length - 1];
    return ((budget - min) / (max - min)) * 100;
  }, [budget]);

  function toggleStyle(style: string) {
    setSelectedStyles((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    );
  }

  function toggleTime(label: string) {
    setSelectedTimes((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    );
  }

  function addTag(
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) {
    const trimmed = value.trim();
    if (!trimmed) return;

    setter((current) => (current.includes(trimmed) ? current : [...current, trimmed]));
    clearInput();
  }

  function removeTag(
    target: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setter((current) => current.filter((item) => item !== target));
  }

  function handleSavePreference() {
    setToast("선호도가 저장되고 AI 추천 준비가 완료되었습니다.");
  }

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <TripRoomHeader activeItem="preference" tripRoomId={tripRoomId} />

      <main className="mx-auto max-w-[1200px] px-8 pb-20 pt-8">
        <div className="mx-auto max-w-[1084px] overflow-hidden px-24">
          <div className="pl-12 pt-12">
            <section className="relative min-h-[978px] rounded-md border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
              <div className="px-[41px] pb-10 pt-[41px]">
                <header className="flex flex-col items-center gap-2">
                  <h1 className="text-center text-2xl font-bold leading-9 text-gray-900">
                    어떤 여행을 원하시나요?
                  </h1>
                  <p className="text-center text-sm leading-5 text-gray-500">
                    입력해주신 정보는 AI가 일정을 추천할 때 소중하게 쓰입니다.
                  </p>
                </header>

                <section className="mt-14">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold leading-6 text-gray-900">
                      예산 범위 (1인 기준)
                    </h2>
                    <span className="text-base font-bold leading-6 text-blue-600">
                      {budgetLabel(budget)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="relative h-2 rounded-[10px] bg-gray-200">
                      <div
                        className="absolute left-0 top-0 h-2 rounded-[10px] bg-blue-500"
                        style={{ width: `${budgetPercent}%` }}
                      />
                    </div>
                    <input
                      className="mt-4 h-2 w-full cursor-pointer accent-blue-600"
                      max={100}
                      min={5}
                      onChange={(event) => setBudget(Number(event.target.value))}
                      step={5}
                      type="range"
                      value={budget}
                    />
                    <div className="mt-3 flex items-start justify-between text-xs font-medium leading-4 text-gray-400">
                      <span>5만원</span>
                      <span>50만원</span>
                      <span>100만원+</span>
                    </div>
                  </div>
                </section>

                <section className="mt-14">
                  <h2 className="text-base font-bold leading-6 text-gray-900">
                    여행 스타일 (다중 선택)
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {travelStyleOptions.map((style) => {
                      const selected = selectedStyles.includes(style);
                      return (
                        <button
                          className={`rounded-full px-5 py-2.5 text-sm font-medium leading-5 ${
                            selected
                              ? "bg-gray-900 text-white"
                              : "border border-gray-200 bg-white text-gray-600"
                          }`}
                          key={style}
                          onClick={() => toggleStyle(style)}
                          type="button"
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="mt-10 grid grid-cols-2 gap-[61px]">
                  <div>
                    <h2 className="text-base font-bold leading-6 text-gray-900">
                      꼭 가고 싶은 장소/요소
                    </h2>
                    <input
                      className="mt-4 h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none placeholder:text-neutral-950/50 focus:border-gray-300"
                      onChange={(event) => setPreferredInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag(preferredInput, setPreferredTags, () => setPreferredInput(""));
                        }
                      }}
                      placeholder="입력 후 Enter를 눌러주세요"
                      type="text"
                      value={preferredInput}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {preferredTags.map((tag) => (
                        <span
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium leading-5 ${tagInputClass(
                            "blue"
                          )}`}
                          key={tag}
                        >
                          {tag}
                          <button
                            className="text-blue-700"
                            onClick={() => removeTag(tag, setPreferredTags)}
                            type="button"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-bold leading-6 text-gray-900">
                      피하고 싶은 장소/요소
                    </h2>
                    <input
                      className="mt-4 h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none placeholder:text-neutral-950/50 focus:border-gray-300"
                      onChange={(event) => setAvoidedInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag(avoidedInput, setAvoidedTags, () => setAvoidedInput(""));
                        }
                      }}
                      placeholder="입력 후 Enter를 눌러주세요"
                      type="text"
                      value={avoidedInput}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {avoidedTags.map((tag) => (
                        <span
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium leading-5 ${tagInputClass(
                            "red"
                          )}`}
                          key={tag}
                        >
                          {tag}
                          <button
                            className="text-red-700"
                            onClick={() => removeTag(tag, setAvoidedTags)}
                            type="button"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="mt-10">
                  <h2 className="text-base font-bold leading-6 text-gray-900">
                    주요 활동 시간대
                  </h2>
                  <div className="mt-4 flex gap-6">
                    {timeOptions.map((label) => {
                      const checked = selectedTimes.includes(label);
                      return (
                        <label className="flex items-center gap-2" key={label}>
                          <button
                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                              checked
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 bg-white text-transparent"
                            }`}
                            onClick={() => toggleTime(label)}
                            type="button"
                          >
                            ✓
                          </button>
                          <span className="text-base font-medium leading-6 text-gray-700">
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>

                <section className="mt-10">
                  <h2 className="text-base font-bold leading-6 text-gray-900">
                    추가로 자유롭게 적기
                  </h2>
                  <textarea
                    className="mt-4 h-28 w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-4 py-4 text-sm leading-5 text-gray-900 outline-none placeholder:text-gray-900/50 focus:border-gray-300"
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="예: 뚜벅이 여행이라 이동 동선이 짧았으면 좋겠어요. 숙소는 꼭 바다가 보이는 곳으로!"
                    value={notes}
                  />
                </section>

                <div className="mt-11 flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    className="h-12 w-80 rounded-md bg-gray-50 text-base font-bold leading-6 text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                    onClick={() => navigate(`/trip-rooms/${tripRoomId}/branch/create`)}
                    type="button"
                  >
                    브랜치 생성하기
                  </button>
                  <button
                    className="flex h-12 w-80 items-center justify-center rounded-md bg-gray-900 px-6 text-base font-bold leading-6 text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                    onClick={handleSavePreference}
                    type="button"
                  >
                    선호도 저장하고 AI에게 전달하기
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
