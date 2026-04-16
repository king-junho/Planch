import { useEffect, useState } from "react";

export default function InvitePage() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-4 py-10 text-stone-900">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1551px] items-center justify-center">
        <div className="w-full max-w-[420px] overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="relative h-[180px]">
            <img
              alt="동아리 MT 초대 배경"
              className="h-full w-full object-cover"
              src="https://placehold.co/420x180"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            <div className="absolute left-6 top-[124px] flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-sm text-white">□</span>
              </div>
              <p className="text-[15px] font-semibold tracking-[0.14px] text-white">
                여행 초대장이 도착했습니다
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-7 px-8 py-8">
            <div className="flex w-full flex-col items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <span className="text-2xl font-semibold text-stone-900">⌂</span>
              </div>

              <h1 className="text-center text-[28px] font-bold leading-[35px] text-stone-900">
                동아리 MT
              </h1>

              <div className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-[21px] py-[13px]">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-stone-900">인</span>
                  <p className="text-base font-semibold leading-6 text-stone-900">
                    현재 참여 인원 : 4명
                  </p>
                </div>
                <p className="mt-1 text-center text-[13px] leading-[19.5px] text-stone-500">
                  김준호, 복성준, 김호영, 최병욱
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-stone-100" />

            <p className="text-center text-lg font-medium leading-[27px] text-stone-900">
              이 여행에 함께 하시겠습니까?
            </p>

            <div className="flex w-full gap-3">
              <button
                className="flex h-[60px] flex-1 items-center justify-center gap-3 rounded-[14px] border-2 border-stone-200 bg-white text-base font-semibold text-stone-600"
                onClick={() => setToast("초대를 거절했습니다.")}
                type="button"
              >
                <span className="text-sm">x</span>
                <span>거절</span>
              </button>
              <button
                className="flex h-[60px] flex-1 items-center justify-center gap-3 rounded-[14px] bg-stone-900 text-base font-semibold text-white shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)]"
                onClick={() => setToast("초대를 수락했습니다.")}
                type="button"
              >
                <span className="text-sm">+</span>
                <span>수락</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
