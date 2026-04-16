import { Link, useNavigate } from "react-router-dom";
import RegisterForm from "../features/auth/components/RegisterForm";
import { signUp } from "../services/authApi";

export default function RegisterPage() {
  const navigate = useNavigate();

  async function handleRegister(values: {
    name: string;
    email: string;
    password: string;
  }) {
    await signUp(values);
    navigate("/login", {
      replace: true,
      state: {
        signupEmail: values.email,
        signupMessage: "회원가입이 완료되었습니다. 로그인해 주세요.",
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
        <section className="w-full max-w-[400px]">
          <RegisterForm onSubmit={handleRegister} />
        </section>
      </main>
    </div>
  );
}
