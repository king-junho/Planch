import {
  CalendarDays,
  CheckCircle2,
  MapPinned,
  MessageSquareText,
  Route,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import { getAccessToken } from "../services/authStorage";

const featureItems = [
  {
    icon: UsersRound,
    title: "여행방으로 함께 시작",
    description: "친구들을 초대하고 여행 기간, 대표 사진, 결정 마감까지 한 곳에서 맞춥니다.",
  },
  {
    icon: MapPinned,
    title: "장소 제안 모으기",
    description: "가고 싶은 장소를 올리고 지도 위에서 후보를 확인하며 의견을 빠르게 정리합니다.",
  },
  {
    icon: Route,
    title: "일정 브랜치 비교",
    description: "여러 동선을 브랜치로 만들고, 하루별 경로와 장소 순서를 비교해 최종안을 고릅니다.",
  },
  {
    icon: MessageSquareText,
    title: "대화 흐름 유지",
    description: "여행방 안에서 필요한 이야기를 바로 이어가며 결정 과정이 흩어지지 않게 합니다.",
  },
];

const processItems = [
  "여행방 생성",
  "멤버 초대",
  "취향과 장소 제안",
  "일정 브랜치 선택",
];

export default function HomePage() {
  const isLoggedIn = Boolean(getAccessToken());
  const primaryHref = isLoggedIn ? "/trip-rooms" : "/login";
  const primaryLabel = isLoggedIn ? "내 여행 목록 보기" : "로그인하고 시작하기";

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <AppHeader />

      <main>
        <section className="mx-auto grid min-h-[650px] max-w-[1200px] grid-cols-[1.02fr_0.98fr] items-center gap-14 px-8 py-16">
          <div className="max-w-[580px]">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
              Trip planning with friends
            </p>
            <h1 className="text-[54px] font-bold leading-[1.1] text-stone-950 [word-break:keep-all]">
              같이 고르고, 비교하고, 결정하는 여행 플래너
            </h1>
            <p className="mt-7 max-w-[520px] text-xl leading-8 text-stone-600 [word-break:keep-all]">
              Planch는 여행 멤버들의 취향과 장소 제안을 모아 여러 일정안을 만들고, 가장 좋은 동선을 함께 고를 수 있게 도와줍니다.
            </p>
            <div className="mt-10 flex items-center gap-3">
              <Link
                className="inline-flex h-14 items-center rounded-xl bg-stone-900 px-7 text-base font-semibold text-white shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)]"
                to={primaryHref}
              >
                {primaryLabel}
              </Link>
            </div>
          </div>

          <div className="relative h-[540px] overflow-hidden rounded-[28px] bg-stone-100 shadow-[0_24px_70px_rgba(28,25,23,0.18)]">
            <img
              alt="여행 계획을 세우는 해변 풍경"
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1100&q=80"
            />
            <div className="absolute inset-x-0 bottom-0 bg-white/92 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-sm font-semibold text-stone-500">이번 주 결정할 것</p>
                  <p className="mt-1 text-2xl font-bold text-stone-950">제주 3박 4일 일정안</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 size={26} aria-hidden="true" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-stone-100 px-4 py-3">
                  <p className="text-xs font-semibold text-stone-500">멤버</p>
                  <p className="mt-1 text-lg font-bold text-stone-900">6명</p>
                </div>
                <div className="rounded-lg bg-teal-50 px-4 py-3">
                  <p className="text-xs font-semibold text-teal-700">장소</p>
                  <p className="mt-1 text-lg font-bold text-stone-900">18곳</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700">브랜치</p>
                  <p className="mt-1 text-lg font-bold text-stone-900">4개</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-stone-200 bg-stone-50">
          <div className="mx-auto max-w-[1200px] px-8 py-16">
            <div className="grid grid-cols-4 gap-0 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {processItems.map((item, index) => (
                <div
                  className="border-r border-stone-200 px-7 py-8 last:border-r-0"
                  key={item}
                >
                  <p className="text-sm font-bold text-emerald-700">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-lg font-bold text-stone-950">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-8 py-20">
          <div className="mb-12 flex items-end justify-between gap-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                Why Planch
              </p>
              <h2 className="mt-4 text-[36px] font-bold leading-tight text-stone-950 [word-break:keep-all]">
                흩어진 의견을 실제 일정으로 바꿉니다
              </h2>
            </div>
            <p className="max-w-[410px] text-base leading-7 text-stone-600">
              단순한 메모장이 아니라, 여행방의 제안과 취향, 지도와 브랜치를 이어서 결정까지 갈 수 있는 작업 공간입니다.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {featureItems.map(({ icon: Icon, title, description }) => (
              <article
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.05)]"
                key={title}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon size={23} aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-stone-950">{title}</h3>
                <p className="mt-3 text-[15px] leading-6 text-stone-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-stone-950">
          <div className="mx-auto grid max-w-[1200px] grid-cols-[0.9fr_1.1fr] items-center gap-12 px-8 py-20 text-white">
            <div>
              <CalendarDays size={42} aria-hidden="true" />
              <h2 className="mt-6 text-[34px] font-bold leading-tight [word-break:keep-all]">
                일정이 확정되는 순간까지 모두가 같은 화면을 봅니다
              </h2>
              <p className="mt-5 text-lg leading-8 text-stone-300">
                결정 마감, 선호도, 장소 후보, 브랜치별 경로를 한 흐름에 두어 회의가 길어지는 순간을 줄입니다.
              </p>
            </div>
            <img
              alt="도시 여행 일정 보드"
              className="h-[360px] w-full rounded-2xl object-cover"
              src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1100&q=80"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
