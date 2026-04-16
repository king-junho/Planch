import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { LoginRequest } from "../../../types/auth";

type LoginFormProps = {
  onSubmit?: (values: LoginRequest) => Promise<void> | void;
  registerHref?: string;
};

export default function LoginForm({
  onSubmit,
  registerHref = "/register",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await onSubmit?.({ email, password });
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.message.trim()) {
        setError(caughtError.message);
      } else {
        setError("로그인에 실패했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] rounded-3xl border border-stone-100 bg-white px-10 pb-10 pt-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <h1 className="text-[28px] font-bold leading-[42px] text-stone-900">
          로그인
        </h1>
        <p className="text-[15px] leading-[22.5px] text-stone-500">
          다시 오신 것을 환영합니다!
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold leading-[21px] text-stone-900">
            이메일
          </span>
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-300"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="example@email.com"
            type="email"
            value={email}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold leading-[21px] text-stone-900">
            비밀번호
          </span>
          <input
            autoComplete="current-password"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-300"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력하세요"
            type="password"
            value={password}
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <button
          className="flex w-full items-center justify-center rounded-xl bg-stone-900 px-4 py-4 text-base font-semibold leading-6 text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm leading-[21px] text-stone-500">
        아직 계정이 없으신가요?{" "}
        <Link className="font-semibold text-stone-900" to={registerHref}>
          회원가입
        </Link>
      </p>
    </div>
  );
}
