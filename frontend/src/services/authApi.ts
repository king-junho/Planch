import {
  ApiErrorResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function readApiErrorMessage(response: Response, fallbackMessage: string) {
  let message = fallbackMessage;

  try {
    const errorBody = (await response.json()) as Partial<ApiErrorResponse>;
    if (typeof errorBody.message === "string" && errorBody.message.trim()) {
      message = errorBody.message;
    }
  } catch {
    // Fall back to the default message when the server response is not JSON.
  }

  return message;
}

export async function signUp(request: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await readApiErrorMessage(
      response,
      "회원가입에 실패했습니다. 다시 시도해 주세요."
    );
    throw new Error(message);
  }

  return (await response.json()) as SignupResponse;
}

export async function logIn(request: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await readApiErrorMessage(
      response,
      "이메일 또는 비밀번호가 올바르지 않습니다."
    );
    throw new Error(message);
  }

  return (await response.json()) as LoginResponse;
}
