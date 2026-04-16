import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { SignupRequest } from "../../../types/auth";

type RegisterFormProps = {
  onSubmit?: (values: SignupRequest) => Promise<void> | void;
};

export default function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("이름, 이메일, 비밀번호를 모두 입력해 주세요.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await onSubmit?.({ name, email, password });
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.message.trim()) {
        setError(caughtError.message);
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] rounded-3xl border border-stone-100 bg-white px-10 pb-10 pt-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <h1 className="text-[28px] font-bold leading-[42px] text-stone-900">
          회원가입
        </h1>
        <p className="text-[15px] leading-[22.5px] text-stone-500">
          새로운 여행을 함께 시작해봐요
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold leading-[21px] text-stone-900">
            이름
          </span>
          <input
            autoComplete="name"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-300"
            onChange={(event) => setName(event.target.value)}
            placeholder="홍길동"
            type="text"
            value={name}
          />
        </label>

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
            autoComplete="new-password"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-300"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력하세요 (6자 이상)"
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
          {isLoading ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm leading-[21px] text-stone-500">
        이미 계정이 있으신가요?{" "}
        <Link className="font-semibold text-stone-900" to="/login">
          로그인
        </Link>
      </p>
    </div>
  );
}
