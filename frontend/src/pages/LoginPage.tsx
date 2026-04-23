import { Link, useLocation, useNavigate } from "react-router-dom";
import LoginForm from "../features/auth/components/LoginForm";
import { logIn } from "../services/authApi";
import { setAuthSession } from "../services/authStorage";
import { LoginRequest } from "../types/auth";

type LoginPageLocationState = {
  signupEmail?: string;
  signupMessage?: string;
  loginMessage?: string;
  redirectTo?: string;
};

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state ?? null) as LoginPageLocationState | null;

  async function handleLogin(values: LoginRequest) {
    const response = await logIn(values);
    setAuthSession(response.accessToken, response.user);

    navigate(locationState?.redirectTo || "/trip-rooms", {
      replace: true,
      state: {
        loginMessage: `${response.user.name}님, 다시 오신 것을 환영합니다.`,
      },
    });
  }

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between px-8">
          <div className="flex items-center">
            <Link
              className="text-[28px] font-semibold leading-none text-stone-900"
              to="/trip-rooms"
            >
              Planch
            </Link>
          </div>

          <div className="h-10 w-[720px]" />

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              className="h-10 rounded-lg border border-[#767676] bg-[#E3E3E3] px-5 py-2 text-base font-normal text-stone-900"
              to="/login"
            >
              로그인
            </Link>
            <Link
              className="h-10 rounded-lg bg-[#2C2C2C] px-5 py-2 text-base font-normal text-stone-100"
              to="/register"
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-76px)] items-start justify-center px-6 pb-[179px] pt-24">
        <section className="w-full max-w-[400px] space-y-4">
          {locationState?.loginMessage ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <p>{locationState.loginMessage}</p>
            </div>
          ) : null}
          {locationState?.signupMessage ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <p>{locationState.signupMessage}</p>
              {locationState.signupEmail ? (
                <p className="mt-1 font-medium">{locationState.signupEmail}</p>
              ) : null}
            </div>
          ) : null}
          <LoginForm onSubmit={handleLogin} registerHref="/register" />
        </section>
      </main>
    </div>
  );
}
