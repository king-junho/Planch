import { Link, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getAccessToken,
  getAuthUser,
} from "../../services/authStorage";

type AppHeaderProps = {
  logoHref?: string;
};

export default function AppHeader({ logoHref = "/trip-rooms" }: AppHeaderProps) {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getAccessToken());
  const authUser = getAuthUser();

  function handleLogout() {
    clearAuthSession();
    navigate("/", { replace: true });
  }

  return (
    <header className="border-b border-stone-300 bg-white">
      <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center">
          <Link
            className="truncate text-[28px] font-semibold leading-none text-stone-900"
            to={logoHref}
          >
            Planch
          </Link>
        </div>

        <div className="min-w-0 flex-1" />

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {isLoggedIn ? (
            <>
              {authUser ? (
                <div className="min-w-0 max-w-[220px] text-right">
                  <p className="truncate text-sm font-semibold leading-5 text-stone-900">
                    {authUser.name}
                  </p>
                  <p className="truncate text-xs leading-4 text-stone-500">
                    {authUser.email}
                  </p>
                </div>
              ) : null}
              <button
                className="h-10 shrink-0 rounded-lg border border-[#767676] bg-[#E3E3E3] px-5 py-2 text-base font-normal text-stone-900"
                onClick={handleLogout}
                type="button"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
